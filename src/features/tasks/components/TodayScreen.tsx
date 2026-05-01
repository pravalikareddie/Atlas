import { useState, useEffect, useMemo, useRef } from 'react'
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import {
  Stack,
  Group,
  Text,
  Paper,
  Affix,
  Transition,
  Box,
  ActionIcon,
  RingProgress,
  Button,
  UnstyledButton,
  Textarea,
  Progress,
  SimpleGrid,
  Badge,
  Skeleton,
} from '@mantine/core'
import {
  Plus,
  CalendarPlus,
  ArrowCounterClockwise,
  CheckCircle,
  Warning,
  Sparkle,
} from '@phosphor-icons/react'

import { useTaskStore } from '../store/taskStore'
import { useTaskData } from '../hooks/useTaskData'
import { useTaskActions } from '../hooks/useTaskActions'
import { Task, TaskType } from '../types/task.types'
import {
  PERSONAL_TYPES,
  WORK_ADD_TYPES,
  PERSONAL_ADD_TYPES,
  TASK_TYPE,
  TASK_STATUS,
  WORK_TYPES,
  DATE_FORMAT,
  GOAL_STATUS,
  USER_ID,
} from '../constants/taskConstants'
import { STRINGS } from '../constants/strings'
import { sortTasks } from '../utils/taskUtils'
import { callClaude } from '../../../lib/anthropic'
import { TaskRow } from './TaskRow'
import { OverdueStrip } from './OverdueStrip'
import { CalendarTimeline } from './CalendarTimeline'
import { QuickAddModal } from './QuickAddModal'
import { TaskDetailSheet } from './TaskDetailSheet'
import { TodayRoutines } from './TodaysRoutine'

import { useBudgetSummary } from '../../finance/hooks/useBudgetSummary'
import { usePlanStore } from '../../plan/store/planStore'
import { useHealthStore } from '../../health/store/healthStore'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import { formatMoneyWhole } from '../../finance/utils/moneyUtils'
import { daysLeftInMonth } from '../../finance/utils/dateUtils'
import {
  upsertUserSettings,
  fetchUserSettings,
} from '../../plan/services/planService'
import { useLifeScore } from '../hooks/useLifeScore'

// ─── Design constants (no hardcoding) ────────────────────────────────────────

const GRADIENTS = {
  PRIMARY:
    'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
  DARK_CARD: 'linear-gradient(135deg, #0e1624, #1a2535)',
  RESET_BG: 'linear-gradient(180deg, #0a1020 0%, #0e1624 100%)',
} as const

const GLASS = {
  SUBTLE: {
    background: 'var(--mantine-color-default-hover)',
    border: '1px solid var(--mantine-color-default-border)',
  },
  TEAL: {
    background: 'var(--mantine-color-teal-light)',
    border: '1px solid var(--mantine-color-teal-3)',
  },
  DANGER: {
    background: 'var(--mantine-color-red-light)',
    border: '1px solid var(--mantine-color-red-3)',
  },
} as const

const RESET_BREATHE_CYCLES_BEFORE_SKIP = 2
const RESET_BREATHE_PHASE_MS = 4000
const RESET_AI_MAX_TOKENS = 200
const RESET_AI_FALLBACK = [
  'Clear all overdue tasks this week',
  'Focus on your top goal only',
  'Get monthly finances back on track',
]

const AUDIT_MAX_GOALS = 4
const AUDIT_MAX_WINS = 5

const AI_CACHE_KEY = 'atlas_ai_today_summary'
const AI_CACHE_TS_KEY = 'atlas_ai_today_summary_ts'
const AI_CACHE_TTL_MS = 30 * 60 * 1000

type TodayTab = 'today' | 'audit'
type ResetStage = 'breathe' | 'dump' | 'reality' | 'one' | 'recommit'
type BreathePhase = 'in' | 'hold' | 'out'

const TABS: { value: TodayTab; label: string }[] = [
  { value: 'today', label: '☀️ Today' },
  { value: 'audit', label: '📊 Audit' },
]

const BREATHE_PHASES: BreathePhase[] = ['in', 'hold', 'out']

const BREATHE_LABELS: Record<BreathePhase, string> = {
  in: STRINGS.BREATHE_IN,
  hold: STRINGS.BREATHE_HOLD,
  out: STRINGS.BREATHE_OUT,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: STRINGS.MORNING, emoji: STRINGS.EMOJI_MORNING }
  if (h < 17) return { text: STRINGS.AFTERNOON, emoji: STRINGS.EMOJI_AFTERNOON }
  return { text: STRINGS.EVENING, emoji: STRINGS.EMOJI_EVENING }
}

function getWeekNumber(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getWeekInfo(): string {
  const d = new Date()
  return `${format(d, 'EEE, MMM d')} · Wk ${getWeekNumber(d)}`
}

function getCachedSummary(): string | null {
  try {
    const text = sessionStorage.getItem(AI_CACHE_KEY)
    const ts = sessionStorage.getItem(AI_CACHE_TS_KEY)
    if (text && ts && Date.now() - parseInt(ts) < AI_CACHE_TTL_MS) return text
  } catch {}
  return null
}

function setCachedSummary(text: string) {
  try {
    sessionStorage.setItem(AI_CACHE_KEY, text)
    sessionStorage.setItem(AI_CACHE_TS_KEY, String(Date.now()))
  } catch {}
}

// ─── ResetMode ────────────────────────────────────────────────────────────────

interface ResetModeProps {
  weeklyFocus: string | null
  onFocusSaved: (focus: string) => void
  onClose: () => void
}

function ResetMode({ weeklyFocus, onFocusSaved, onClose }: ResetModeProps) {
  const [stage, setStage] = useState<ResetStage>('breathe')
  const [breatheCount, setBreatheCount] = useState(0)
  const [breathePhase, setBreathePhase] = useState<BreathePhase>('in')
  const [dumpText, setDumpText] = useState('')
  const [oneThing, setOneThing] = useState(weeklyFocus ?? '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingAi, setLoadingAi] = useState(false)
  const [saving, setSaving] = useState(false)

  const tasks = useTaskStore((s) => s.tasks)
  const { totalSpent, totalBudget } = useBudgetSummary()
  const { dailyLogs } = useHealthStore()
  const { goals } = usePlanStore()

  const overdueCount = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.TODO &&
      t.due_date &&
      isBefore(parseISO(t.due_date), startOfDay(new Date())),
  ).length

  const financePercent =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const lastSleep = dailyLogs[0]?.sleep_hours ?? null
  const activeGoals = goals.filter(
    (g) => g.status === GOAL_STATUS.ACTIVE,
  ).length

  // Breathe phase cycling
  useEffect(() => {
    if (stage !== 'breathe') return
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % BREATHE_PHASES.length
      setBreathePhase(BREATHE_PHASES[idx])
      if (BREATHE_PHASES[idx] === 'in') setBreatheCount((c) => c + 1)
    }, RESET_BREATHE_PHASE_MS)
    return () => clearInterval(interval)
  }, [stage])

  async function handleAnalyze() {
    setStage('one')
    setLoadingAi(true)
    const prompt = `User wrote: "${dumpText}". Stats: ${overdueCount} overdue tasks, ${financePercent}% budget used, ${activeGoals} active goals. Suggest 3 specific "one thing to focus on this week" options. Each under 10 words. Return only a JSON array of strings.`
    try {
      const res = await callClaude(prompt, RESET_AI_MAX_TOKENS)
      const parsed = JSON.parse(res)
      setSuggestions(Array.isArray(parsed) ? parsed : RESET_AI_FALLBACK)
    } catch {
      setSuggestions([...RESET_AI_FALLBACK])
    } finally {
      setLoadingAi(false)
    }
  }

  async function handleRecommit() {
    if (!oneThing.trim()) return
    setSaving(true)
    try {
      await upsertUserSettings({
        user_id: USER_ID,
        weekly_focus: oneThing.trim(),
        weekly_focus_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        daily_mantra: null,
      })
      onFocusSaved(oneThing.trim())
    } catch {}
    setSaving(false)
    setStage('recommit')
  }

  const breatheExpanded = breathePhase !== 'out'

  const realityData = [
    {
      label: STRINGS.RESET_OVERDUE,
      value: String(overdueCount),
      unit: STRINGS.TASKS,
      bad: overdueCount > 3,
    },
    {
      label: STRINGS.RESET_BUDGET_USED,
      value: `${financePercent}%`,
      unit: STRINGS.RESET_OF_BUDGET,
      bad: financePercent > 90,
    },
    {
      label: STRINGS.RESET_LAST_SLEEP,
      value: lastSleep ? `${lastSleep}h` : STRINGS.NOT_LOGGED,
      unit: '',
      bad: !lastSleep || lastSleep < 6,
    },
    {
      label: STRINGS.RESET_ACTIVE_GOALS,
      value: String(activeGoals),
      unit: STRINGS.RESET_IN_PROGRESS,
      bad: false,
    },
  ]

  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: GRADIENTS.RESET_BG,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--mantine-spacing-xl)',
        overflowY: 'auto',
      }}
    >
      <Text
        size="xs"
        c="rgba(255,255,255,0.4)"
        tt="uppercase"
        lts={2}
        mb="xl"
        fw={700}
      >
        {STRINGS.RESET_MODE}
      </Text>

      {/* Breathe */}
      {stage === 'breathe' && (
        <Stack align="center" gap="xl" maw={400} w="100%">
          <Box
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(56,190,201,0.15)',
              border: '2px solid rgba(56,190,201,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: breatheExpanded ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 3.8s ease-in-out',
            }}
          >
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(56,190,201,0.4)',
              }}
            />
          </Box>
          <Text fw={300} c="white" style={{ fontSize: 24, letterSpacing: 1 }}>
            {BREATHE_LABELS[breathePhase]}
          </Text>
          <Text size="md" c="rgba(255,255,255,0.5)">
            {breatheCount < RESET_BREATHE_CYCLES_BEFORE_SKIP
              ? `${RESET_BREATHE_CYCLES_BEFORE_SKIP - breatheCount} ${STRINGS.BREATHE_MORE_CYCLES}`
              : STRINGS.BREATHE_READY}
          </Text>
          {breatheCount >= RESET_BREATHE_CYCLES_BEFORE_SKIP && (
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              onClick={() => setStage('dump')}
            >
              {STRINGS.RESET_READY} →
            </Button>
          )}
          <Button
            variant="subtle"
            c="rgba(255,255,255,0.4)"
            size="sm"
            onClick={onClose}
          >
            {STRINGS.SKIP}
          </Button>
        </Stack>
      )}

      {/* Brain Dump */}
      {stage === 'dump' && (
        <Stack align="center" gap="xl" w="100%" maw={500}>
          <Text fw={700} c="white" style={{ fontSize: 22 }} ta="center">
            {STRINGS.RESET_DUMP_TITLE}
          </Text>
          <Text size="md" c="rgba(255,255,255,0.5)" ta="center">
            {STRINGS.RESET_DUMP_SUBTITLE}
          </Text>
          <Textarea
            value={dumpText}
            onChange={(e) => setDumpText(e.target.value)}
            placeholder={STRINGS.RESET_DUMP_PLACEHOLDER}
            rows={6}
            w="100%"
            autoFocus
          />
          <Group>
            <Button
              variant="subtle"
              c="rgba(255,255,255,0.4)"
              onClick={() => setStage('breathe')}
            >
              ← {STRINGS.BACK}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              onClick={() => setStage('reality')}
            >
              {STRINGS.RESET_SEE_REALITY} →
            </Button>
          </Group>
        </Stack>
      )}

      {/* Reality Check */}
      {stage === 'reality' && (
        <Stack align="center" gap="xl" w="100%" maw={500}>
          <Text fw={700} c="white" style={{ fontSize: 22 }} ta="center">
            {STRINGS.RESET_REALITY_TITLE}
          </Text>
          <Stack gap="sm" w="100%">
            {realityData.map((item) => (
              <Paper
                key={item.label}
                p="md"
                radius="xl"
                style={{
                  background: item.bad
                    ? 'rgba(240,80,80,0.15)'
                    : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${item.bad ? 'rgba(240,80,80,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Group justify="space-between">
                  <Text size="sm" c="rgba(255,255,255,0.55)">
                    {item.label}
                  </Text>
                  <Group gap="xs">
                    <Text
                      fw={700}
                      c={item.bad ? 'var(--mantine-color-red-4)' : 'white'}
                    >
                      {item.value}
                    </Text>
                    {item.unit ? (
                      <Text size="xs" c="rgba(255,255,255,0.4)">
                        {item.unit}
                      </Text>
                    ) : null}
                    {item.bad && (
                      <Warning size={14} color="var(--mantine-color-red-5)" />
                    )}
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
          <Group>
            <Button
              variant="subtle"
              c="rgba(255,255,255,0.4)"
              onClick={() => setStage('dump')}
            >
              ← {STRINGS.BACK}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              onClick={handleAnalyze}
            >
              {STRINGS.RESET_PICK_ONE} →
            </Button>
          </Group>
        </Stack>
      )}

      {/* One Thing */}
      {stage === 'one' && (
        <Stack align="center" gap="xl" w="100%" maw={500}>
          <Text fw={700} c="white" style={{ fontSize: 22 }} ta="center">
            {STRINGS.RESET_ONE_TITLE}
          </Text>
          {loadingAi ? (
            <Stack gap="sm" w="100%">
              <Skeleton height={52} radius="xl" />
              <Skeleton height={52} radius="xl" />
              <Skeleton height={52} radius="xl" />
            </Stack>
          ) : (
            <Stack gap="sm" w="100%">
              {suggestions.map((s, i) => (
                <UnstyledButton key={i} onClick={() => setOneThing(s)}>
                  <Paper
                    p="md"
                    radius="xl"
                    style={{
                      background:
                        oneThing === s
                          ? 'rgba(56,190,201,0.2)'
                          : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${oneThing === s ? 'rgba(56,190,201,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <Text
                      size="sm"
                      c={
                        oneThing === s
                          ? 'var(--mantine-color-teal-3)'
                          : 'rgba(255,255,255,0.85)'
                      }
                      fw={oneThing === s ? 700 : 500}
                    >
                      {s}
                    </Text>
                  </Paper>
                </UnstyledButton>
              ))}
              <Textarea
                value={oneThing}
                onChange={(e) => setOneThing(e.target.value)}
                placeholder={STRINGS.RESET_ONE_PLACEHOLDER}
                rows={2}
              />
            </Stack>
          )}
          <Group>
            <Button
              variant="subtle"
              c="rgba(255,255,255,0.4)"
              onClick={() => setStage('reality')}
            >
              ← {STRINGS.BACK}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              disabled={!oneThing.trim() || saving}
              loading={saving}
              onClick={handleRecommit}
            >
              {STRINGS.RESET_RECOMMIT} →
            </Button>
          </Group>
        </Stack>
      )}

      {/* Recommit */}
      {stage === 'recommit' && (
        <Stack align="center" gap="xl" maw={400} w="100%">
          <Text style={{ fontSize: 56 }}>✨</Text>
          <Text fw={800} c="white" style={{ fontSize: 26 }} ta="center">
            {STRINGS.RESET_DONE_TITLE}
          </Text>
          <Paper
            p="lg"
            radius="xl"
            style={{
              background: 'rgba(56,190,201,0.15)',
              border: '1px solid rgba(56,190,201,0.4)',
            }}
            w="100%"
          >
            <Text
              size="xs"
              c="var(--mantine-color-teal-3)"
              tt="uppercase"
              mb="xs"
              lts={1}
              fw={700}
            >
              {STRINGS.RESET_WEEKS_FOCUS}
            </Text>
            <Text fw={700} c="white" size="md">
              {oneThing}
            </Text>
          </Paper>
          <Text size="md" c="rgba(255,255,255,0.45)" ta="center">
            {STRINGS.RESET_DONE_SUBTITLE}
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            size="lg"
            onClick={onClose}
          >
            {STRINGS.RESET_BACK_TO_TODAY}
          </Button>
        </Stack>
      )}
    </Box>
  )
}

// ─── AuditTab ─────────────────────────────────────────────────────────────────

interface AuditTabProps {
  onReset: () => void
  weeklyFocus: string | null
}

function AuditTab({ onReset, weeklyFocus }: AuditTabProps) {
  const lifeScore = useLifeScore()
  const tasks = useTaskStore((s) => s.tasks)
  const { goals, milestones } = usePlanStore()
  const { totalSpent, totalBudget, totalSaved } = useBudgetSummary()
  const routineStore = useRoutineStore()

  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  })

  const yesterday = format(subDays(new Date(), 1), DATE_FORMAT.API)
  const yesterdayDone = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.DONE && t.completed_at?.startsWith(yesterday),
  )

  const activeGoals = goals
    .filter((g) => g.status === GOAL_STATUS.ACTIVE)
    .slice(0, AUDIT_MAX_GOALS)

  const last7Done = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.DONE &&
      t.completed_at &&
      new Date(t.completed_at) > subDays(new Date(), 7),
  ).length

  const financeLeft = totalBudget - totalSpent
  const daysLeft = daysLeftInMonth()
  const onTrack = financeLeft >= 0

  const insightText =
    last7Done === 0
      ? STRINGS.INSIGHT_ZERO
      : last7Done < 5
        ? STRINGS.INSIGHT_LOW(last7Done)
        : STRINGS.INSIGHT_GOOD(last7Done)

  const spendPct =
    totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  return (
    <Stack gap="xl">
      {/* ── LIFE SCORE HERO ─────────────────────────────────────────── */}
      <Box
        p="xl"
        style={{
          background: 'linear-gradient(135deg, #0e1624 0%, #1a2535 100%)',
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle glow behind score */}
        <Box
          style={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${lifeScore.color === 'teal' ? 'rgba(56,190,201,0.15)' : lifeScore.color === 'yellow' ? 'rgba(250,176,5,0.15)' : 'rgba(240,80,80,0.15)'} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* header row */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Box>
            <Text
              size="xs"
              c="rgba(255,255,255,0.35)"
              tt="uppercase"
              lts={3}
              fw={700}
              mb={4}
            >
              {STRINGS.AUDIT_LIFE_SCORE}
            </Text>
            <Group gap="xs" align="baseline">
              <Text
                fw={900}
                c="white"
                ff="var(--mantine-font-family-monospace)"
                style={{ fontSize: 64, lineHeight: 1 }}
              >
                {lifeScore.overall}
              </Text>
              <Text fw={400} c="rgba(255,255,255,0.3)" style={{ fontSize: 28 }}>
                /100
              </Text>
            </Group>
            <Box
              mt={8}
              px={10}
              py={4}
              style={{
                display: 'inline-flex',
                borderRadius: 999,
                background:
                  lifeScore.color === 'teal'
                    ? 'rgba(56,190,201,0.2)'
                    : lifeScore.color === 'yellow'
                      ? 'rgba(250,176,5,0.2)'
                      : 'rgba(240,80,80,0.2)',
                border: `1px solid ${
                  lifeScore.color === 'teal'
                    ? 'rgba(56,190,201,0.4)'
                    : lifeScore.color === 'yellow'
                      ? 'rgba(250,176,5,0.4)'
                      : 'rgba(240,80,80,0.4)'
                }`,
              }}
            >
              <Text
                size="sm"
                fw={700}
                c={
                  lifeScore.color === 'teal'
                    ? '#38bec9'
                    : lifeScore.color === 'yellow'
                      ? '#fab005'
                      : '#f05050'
                }
              >
                {lifeScore.label}
              </Text>
            </Box>
          </Box>
          {/* big ring top right */}
          <RingProgress
            size={96}
            thickness={8}
            roundCaps
            sections={[
              { value: lifeScore.overall || 1, color: lifeScore.color },
            ]}
            rootColor="rgba(255,255,255,0.08)"
            label={
              <Text ta="center" size="xs" c="rgba(255,255,255,0.4)" fw={600}>
                this week
              </Text>
            }
          />
        </Group>

        {/* area rings row */}
        <SimpleGrid cols={6} spacing={0}>
          {lifeScore.areas.map((area) => (
            <Stack key={area.key} align="center" gap={4}>
              <RingProgress
                size={68}
                thickness={5}
                roundCaps
                sections={[{ value: area.score || 1, color: area.color }]}
                rootColor="rgba(255,255,255,0.08)"
                label={
                  <Text ta="center" style={{ fontSize: 20, lineHeight: 1 }}>
                    {area.emoji}
                  </Text>
                }
              />
              <Text
                size="xs"
                c="rgba(255,255,255,0.45)"
                ta="center"
                fw={600}
                lh={1}
              >
                {area.label}
              </Text>
              <Text
                size="xs"
                c="white"
                fw={800}
                ta="center"
                ff="var(--mantine-font-family-monospace)"
              >
                {area.score}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>

        <Text size="xs" c="rgba(255,255,255,0.2)" mt="md" ta="center">
          {STRINGS.AUDIT_SCORE_SUBTITLE}
        </Text>
      </Box>

      {/* ── WEEKLY FOCUS banner ─────────────────────────────────────── */}
      {weeklyFocus && (
        <Box
          p="md"
          style={{
            background:
              'linear-gradient(90deg, rgba(56,190,201,0.12) 0%, rgba(56,190,201,0.04) 100%)',
            borderRadius: 16,
            borderLeft: '3px solid rgba(56,190,201,0.6)',
          }}
        >
          <Text size="xs" c="teal" fw={700} tt="uppercase" lts={2} mb={4}>
            {STRINGS.AUDIT_WEEKS_FOCUS}
          </Text>
          <Text size="md" fw={600} c="var(--mantine-color-text)">
            {weeklyFocus}
          </Text>
        </Box>
      )}

      {/* ── THIS WEEK grid ──────────────────────────────────────────── */}
      <Box>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={2} mb="sm">
          {STRINGS.AUDIT_THIS_WEEK}
        </Text>
        <Group gap={6} grow>
          {weekDays.map((day) => {
            const dayStr = format(day, DATE_FORMAT.API)
            const dayDone = tasks.filter(
              (t) =>
                t.status === TASK_STATUS.DONE &&
                t.completed_at?.startsWith(dayStr),
            ).length
            const routineDone = routineStore.routines.filter(
              (r) => r.last_done === dayStr,
            ).length
            const isCurrentDay = isSameDay(day, new Date())
            const isPast =
              isBefore(day, startOfDay(new Date())) && !isCurrentDay
            const hasActivity = dayDone > 0 || routineDone > 0

            return (
              <Box key={dayStr} ta="center">
                <Text size="xs" c="dimmed" mb={6} fw={600}>
                  {format(day, 'EEE')}
                </Text>
                <Box
                  p="xs"
                  style={{
                    borderRadius: 14,
                    background: isCurrentDay
                      ? 'rgba(56,190,201,0.12)'
                      : hasActivity
                        ? 'var(--mantine-color-green-light)'
                        : 'var(--mantine-color-default-hover)',
                    border: isCurrentDay
                      ? '1.5px solid rgba(56,190,201,0.5)'
                      : '1.5px solid transparent',
                    opacity: isPast && !hasActivity ? 0.35 : 1,
                    minHeight: 72,
                    transition: 'all 0.2s',
                  }}
                >
                  <Text
                    size="sm"
                    fw={isCurrentDay ? 900 : 600}
                    c={isCurrentDay ? 'teal' : 'var(--mantine-color-text)'}
                  >
                    {format(day, 'd')}
                  </Text>
                  {dayDone > 0 && (
                    <Text size="xs" c="green" fw={700} mt={4}>
                      {dayDone}✓
                    </Text>
                  )}
                  {routineDone > 0 && (
                    <Text size="xs" c="teal" mt={2} style={{ fontSize: 11 }}>
                      🔄{routineDone}
                    </Text>
                  )}
                </Box>
              </Box>
            )
          })}
        </Group>
      </Box>

      {/* ── FINANCE + GOALS side by side (if both exist) ───────────── */}
      <SimpleGrid cols={activeGoals.length > 0 ? 2 : 1} spacing="md">
        {/* Financial Pulse */}
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
              {STRINGS.AUDIT_FINANCE_PULSE}
            </Text>
            <Box
              px={8}
              py={2}
              style={{
                borderRadius: 999,
                background: onTrack
                  ? 'rgba(56,190,201,0.12)'
                  : 'rgba(240,80,80,0.12)',
                border: `1px solid ${onTrack ? 'rgba(56,190,201,0.35)' : 'rgba(240,80,80,0.35)'}`,
              }}
            >
              <Text size="xs" fw={700} c={onTrack ? 'teal' : 'red'}>
                {onTrack ? STRINGS.ON_TRACK : STRINGS.OVER_BUDGET}
              </Text>
            </Box>
          </Group>
          <Text
            fw={900}
            style={{ fontSize: 28 }}
            c={onTrack ? 'var(--mantine-color-text)' : 'red'}
            ff="var(--mantine-font-family-monospace)"
            mb={4}
          >
            {formatMoneyWhole(financeLeft > 0 ? financeLeft : 0)}
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            {STRINGS.LEFT} · {daysLeft} {STRINGS.DAYS_LEFT}
          </Text>
          <Progress
            value={spendPct}
            color={onTrack ? 'teal' : 'red'}
            radius="xl"
            size="sm"
            mb="xs"
          />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {STRINGS.SPENT}: {formatMoneyWhole(totalSpent)}
            </Text>
            <Text size="xs" c="dimmed">
              {STRINGS.BUDGET}: {formatMoneyWhole(totalBudget)}
            </Text>
          </Group>
        </Paper>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <Paper p="lg" radius="xl" withBorder>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1} mb="md">
              {STRINGS.AUDIT_ACTIVE_GOALS}
            </Text>
            <Stack gap="md">
              {activeGoals.map((goal) => {
                const gMs = milestones.filter((m) => m.goal_id === goal.id)
                const gDone = gMs.filter((m) => m.status === 'done').length
                const progress = gMs.length > 0 ? (gDone / gMs.length) * 100 : 0
                return (
                  <Box key={goal.id}>
                    <Group justify="space-between" mb={4}>
                      <Text
                        size="sm"
                        fw={600}
                        style={{ flex: 1 }}
                        lineClamp={1}
                      >
                        {goal.title}
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        ff="var(--mantine-font-family-monospace)"
                      >
                        {gDone}/{gMs.length}
                      </Text>
                    </Group>
                    <Progress
                      value={progress}
                      color="teal"
                      radius="xl"
                      size="sm"
                    />
                  </Box>
                )
              })}
            </Stack>
          </Paper>
        )}
      </SimpleGrid>

      {/* ── YESTERDAY'S WINS ─────────────────────────────────────────── */}
      {yesterdayDone.length > 0 && (
        <Box
          p="lg"
          style={{
            background:
              'linear-gradient(135deg, rgba(55,178,77,0.08) 0%, rgba(55,178,77,0.03) 100%)',
            borderRadius: 18,
            border: '1px solid rgba(55,178,77,0.2)',
          }}
        >
          <Text size="xs" fw={700} tt="uppercase" c="green" lts={2} mb="sm">
            {STRINGS.AUDIT_YESTERDAY_WINS}
          </Text>
          <Stack gap={6}>
            {yesterdayDone.slice(0, AUDIT_MAX_WINS).map((t) => (
              <Group key={t.id} gap="sm">
                <CheckCircle
                  size={15}
                  color="var(--mantine-color-green-6)"
                  weight="fill"
                />
                <Text
                  size="sm"
                  c="dimmed"
                  td="line-through"
                  style={{ flex: 1 }}
                >
                  {t.title}
                </Text>
              </Group>
            ))}
            {yesterdayDone.length > AUDIT_MAX_WINS && (
              <Text size="xs" c="dimmed" ml={23}>
                +{yesterdayDone.length - AUDIT_MAX_WINS}{' '}
                {STRINGS.MORE_COMPLETED}
              </Text>
            )}
          </Stack>
        </Box>
      )}

      {/* ── ATLAS INSIGHT ────────────────────────────────────────────── */}
      <Box
        p="lg"
        style={{
          background:
            'linear-gradient(135deg, rgba(56,190,201,0.1) 0%, rgba(56,190,201,0.04) 100%)',
          borderRadius: 18,
          border: '1px solid rgba(56,190,201,0.2)',
        }}
      >
        <Group gap={8} mb={8}>
          <Sparkle
            size={15}
            color="var(--mantine-color-teal-5)"
            weight="fill"
          />
          <Text size="xs" fw={700} tt="uppercase" c="teal" lts={2}>
            {STRINGS.AUDIT_INSIGHT}
          </Text>
        </Group>
        <Text size="md" fw={500} c="var(--mantine-color-text)" lh={1.6}>
          {insightText}
        </Text>
      </Box>

      {/* ── RESET MODE CTA ───────────────────────────────────────────── */}
      <Box
        p="xl"
        onClick={onReset}
        style={{
          background: 'linear-gradient(135deg, #0e1624 0%, #162030 100%)',
          borderRadius: 20,
          cursor: 'pointer',
          border: '1px solid rgba(56,190,201,0.15)',
          transition: 'border-color 0.2s',
        }}
      >
        <Group gap="lg">
          <Box
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              flexShrink: 0,
              background: 'rgba(56,190,201,0.18)',
              border: '1px solid rgba(56,190,201,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowCounterClockwise
              size={24}
              weight="bold"
              color="rgba(56,190,201,0.9)"
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text fw={800} c="white" size="lg" lh={1.2}>
              {STRINGS.RESET_MODE}
            </Text>
            <Text size="sm" c="rgba(255,255,255,0.4)" mt={4}>
              {STRINGS.RESET_CTA_SUBTITLE}
            </Text>
          </Box>
          <Text c="rgba(56,190,201,0.6)" style={{ fontSize: 20 }}>
            →
          </Text>
        </Group>
      </Box>
    </Stack>
  )
}

// ─── TodayScreen ──────────────────────────────────────────────────────────────

export function TodayScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { markDone, undoDone, undoTarget, update } = useTaskActions()

  const [activeTab, setActiveTab] = useState<TodayTab>('today')
  const [showReset, setShowReset] = useState(false)
  const [weeklyFocus, setWeeklyFocus] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string>(
    () => getCachedSummary() ?? '',
  )
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean
    defaultType: TaskType
    allowedTypes?: TaskType[]
  }>({ open: false, defaultType: TASK_TYPE.PERSONAL })
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const todayStr = format(new Date(), DATE_FORMAT.API)

  const topLevel = useMemo(
    () => tasks.filter((t) => !t.parent_task_id),
    [tasks],
  )

  // Load weekly focus
  useEffect(() => {
    fetchUserSettings(USER_ID)
      .then((s) => {
        if (s?.weekly_focus) setWeeklyFocus(s.weekly_focus)
      })
      .catch(() => {})
  }, [])

  const overdue = useMemo(
    () =>
      sortTasks(
        topLevel.filter(
          (t) =>
            t.status === TASK_STATUS.TODO &&
            t.due_date &&
            isBefore(parseISO(t.due_date), startOfDay(new Date())),
        ),
      ),
    [topLevel],
  )

  const parentIdsWithTodaySubtasks = useMemo(() => {
    const ids = new Set<string>()
    tasks
      .filter(
        (t) =>
          t.parent_task_id &&
          t.due_date &&
          isToday(parseISO(t.due_date)) &&
          (t.status === TASK_STATUS.TODO ||
            (t.status === TASK_STATUS.DONE &&
              !!t.completed_at &&
              isToday(parseISO(t.completed_at)))),
      )
      .forEach((t) => ids.add(t.parent_task_id!))
    return ids
  }, [tasks])

  const todayTasks = useMemo(
    () =>
      topLevel.filter(
        (t) =>
          !t.is_learning &&
          ((t.status === TASK_STATUS.TODO &&
            ((t.due_date && isToday(parseISO(t.due_date))) ||
              (t.do_today && (!t.due_date || isToday(parseISO(t.due_date)))) ||
              parentIdsWithTodaySubtasks.has(t.id))) ||
            (t.status === TASK_STATUS.DONE &&
              !!t.completed_at &&
              isToday(parseISO(t.completed_at)))),
      ),
    [topLevel, parentIdsWithTodaySubtasks],
  )

  function toggleTask(t: Task) {
    if (t.status === TASK_STATUS.DONE) {
      update(t.id, { status: TASK_STATUS.TODO, completed_at: null })
    } else {
      markDone(t)
    }
  }

  function toggleSubtask(st: Task) {
    if (st.status === TASK_STATUS.DONE) {
      update(st.id, { status: TASK_STATUS.TODO, completed_at: null })
    } else {
      markDone(st)
    }
  }

  const workTasks = useMemo(
    () => sortTasks(todayTasks.filter((t) => WORK_TYPES.includes(t.type))),
    [todayTasks],
  )
  const meetingPrepTasks = useMemo(
    () =>
      sortTasks(todayTasks.filter((t) => t.type === TASK_TYPE.MEETING_PREP)),
    [todayTasks],
  )
  const personalTasks = useMemo(
    () => sortTasks(todayTasks.filter((t) => PERSONAL_TYPES.includes(t.type))),
    [todayTasks],
  )
  const eventTasks = useMemo(
    () =>
      topLevel
        .filter(
          (t) =>
            t.type === TASK_TYPE.EVENT &&
            t.due_date === todayStr &&
            t.status === TASK_STATUS.TODO,
        )
        .sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? '')),
    [topLevel, todayStr],
  )

  const completedToday = useMemo(() => {
    const subtasksDueToday = tasks.filter(
      (t) =>
        t.parent_task_id &&
        t.due_date &&
        isToday(parseISO(t.due_date)) &&
        t.type !== TASK_TYPE.EVENT,
    )
    const parentIdsViaSub = new Set(
      subtasksDueToday.map((t) => t.parent_task_id!),
    )
    const topLevelDone = todayTasks.filter(
      (t) =>
        t.status === TASK_STATUS.DONE &&
        t.type !== TASK_TYPE.EVENT &&
        (!parentIdsViaSub.has(t.id) ||
          (t.due_date && isToday(parseISO(t.due_date))) ||
          (t.do_today && (!t.due_date || isToday(parseISO(t.due_date))))),
    ).length
    return (
      topLevelDone +
      subtasksDueToday.filter((t) => t.status === TASK_STATUS.DONE).length
    )
  }, [todayTasks, tasks])

  const subtasksMap = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks
      .filter((t) => t.parent_task_id)
      .forEach((t) => {
        const arr = map.get(t.parent_task_id!) ?? []
        arr.push(t)
        map.set(t.parent_task_id!, arr)
      })
    return map
  }, [tasks])

  const totalToday = useMemo(() => {
    const subtasksDueToday = tasks.filter(
      (t) =>
        t.parent_task_id &&
        t.due_date &&
        isToday(parseISO(t.due_date)) &&
        t.type !== TASK_TYPE.EVENT,
    )
    const parentIdsViaSub = new Set(
      subtasksDueToday.map((t) => t.parent_task_id!),
    )
    const topLevelCount = todayTasks.filter(
      (t) =>
        t.type !== TASK_TYPE.EVENT &&
        (!parentIdsViaSub.has(t.id) ||
          (t.due_date && isToday(parseISO(t.due_date))) ||
          (t.do_today && (!t.due_date || isToday(parseISO(t.due_date))))),
    ).length
    return topLevelCount + subtasksDueToday.length
  }, [todayTasks, tasks])

  // AI summary
  const aiKey = `${todayTasks.length}:${overdue.length}:${eventTasks.length}:${completedToday}`
  const aiKeyRef = useRef<string>('')
  useEffect(() => {
    if (aiKeyRef.current === aiKey) return
    aiKeyRef.current = aiKey
    const cached = getCachedSummary()
    if (cached) {
      setAiSummary(cached)
      return
    }
    const prompt = `You are Atlas, a personal life OS. Give ONE warm, specific, data-driven insight. ${todayTasks.length} tasks due (${overdue.length} overdue), ${eventTasks.length} events, ${completedToday} done. Be specific, warm, encouraging. Max 2 sentences. No filler.`
    callClaude(prompt, 80).then((r) => {
      if (r) {
        setAiSummary(r)
        setCachedSummary(r)
      }
    })
  }, [aiKey])

  const greeting = getGreeting()

  const openQuickAdd = (defaultType: TaskType, allowedTypes?: TaskType[]) =>
    setQuickAdd({ open: true, defaultType, allowedTypes })
  const closeQuickAdd = () =>
    setQuickAdd({ open: false, defaultType: TASK_TYPE.PERSONAL })

  return (
    <>
      {showReset && (
        <ResetMode
          weeklyFocus={weeklyFocus}
          onFocusSaved={setWeeklyFocus}
          onClose={() => setShowReset(false)}
        />
      )}

      <Stack gap="xl" w="100%">
        {/* Header */}
        <Box
          p="xl"
          style={{
            background: GRADIENTS.PRIMARY,
            borderRadius: 'var(--mantine-radius-xl)',
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Text
                size="xs"
                fw={700}
                c="white"
                tt="uppercase"
                mb={4}
                style={{ opacity: 0.7 }}
              >
                {getWeekInfo()}
              </Text>
              <Text
                fw={900}
                c="white"
                style={{ fontSize: 28, lineHeight: 1.2 }}
              >
                {greeting.emoji} {greeting.text}
              </Text>
              {aiSummary && (
                <Text
                  size="sm"
                  c="white"
                  mt={6}
                  maw={480}
                  lh={1.7}
                  style={{ opacity: 0.85 }}
                >
                  {aiSummary}
                </Text>
              )}
            </Box>
            {totalToday > 0 && (
              <Box ta="center">
                <RingProgress
                  size={80}
                  thickness={7}
                  roundCaps
                  label={
                    <Text
                      ta="center"
                      size="xs"
                      fw={700}
                      c="white"
                      ff="var(--mantine-font-family-monospace)"
                    >
                      {Math.round((completedToday / totalToday) * 100)}%
                    </Text>
                  }
                  sections={[
                    {
                      value: (completedToday / totalToday) * 100,
                      color: 'white',
                    },
                  ]}
                  rootColor="rgba(255,255,255,0.2)"
                />
                <Text
                  size="xs"
                  c="white"
                  mt={2}
                  style={{ opacity: 0.75 }}
                  ff="var(--mantine-font-family-monospace)"
                >
                  {completedToday}/{totalToday}
                </Text>
              </Box>
            )}
          </Group>

          {/* Tabs */}
          <Group gap="xs" mt="lg">
            {TABS.map((tab) => (
              <UnstyledButton
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
              >
                <Box
                  px="md"
                  py={6}
                  style={{
                    borderRadius: 'var(--mantine-radius-xl)',
                    background:
                      activeTab === tab.value
                        ? 'rgba(255,255,255,0.2)'
                        : 'transparent',
                    border:
                      activeTab === tab.value
                        ? '1px solid rgba(255,255,255,0.3)'
                        : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Text
                    size="sm"
                    fw={activeTab === tab.value ? 700 : 500}
                    c="white"
                    style={{ opacity: activeTab === tab.value ? 1 : 0.6 }}
                  >
                    {tab.label}
                  </Text>
                </Box>
              </UnstyledButton>
            ))}
          </Group>
        </Box>

        {/* Today Tab */}
        {activeTab === 'today' && (
          <Stack gap="xl">
            <OverdueStrip
              tasks={overdue}
              onDone={markDone}
              onTap={setDetailTask}
            />

            <Group grow align="flex-start" gap="lg">
              <TaskColumn
                label={STRINGS.WORK}
                color="violet"
                tasks={workTasks}
                subtasksMap={subtasksMap}
                onDone={toggleTask}
                onUndo={toggleTask}
                onTap={setDetailTask}
                onAdd={() => openQuickAdd(TASK_TYPE.SPRINT, WORK_ADD_TYPES)}
                empty={STRINGS.NO_WORK_TODAY}
              >
                {meetingPrepTasks.length > 0 && (
                  <SectionBlock label={STRINGS.MEETING_PREP} color="pink">
                    {meetingPrepTasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        subtasks={subtasksMap.get(t.id)}
                        onSubtaskDone={toggleSubtask}
                        onSubtaskUndo={toggleSubtask}
                        onDone={() => toggleTask(t)}
                        onUndo={() => toggleTask(t)}
                        onTap={() => setDetailTask(t)}
                      />
                    ))}
                  </SectionBlock>
                )}
              </TaskColumn>

              <TaskColumn
                label={STRINGS.PERSONAL}
                color="teal"
                tasks={personalTasks}
                subtasksMap={subtasksMap}
                onDone={toggleTask}
                onUndo={toggleTask}
                onTap={setDetailTask}
                onAdd={() =>
                  openQuickAdd(TASK_TYPE.PERSONAL, PERSONAL_ADD_TYPES)
                }
                empty={STRINGS.NO_PERSONAL_TODAY}
              />
            </Group>

            <Group align="flex-start" gap="lg" grow>
              <CalendarTimeline events={eventTasks} onTap={setDetailTask} />
              <TodayRoutines />
            </Group>

            <Group gap="sm">
              <Button
                variant="gradient"
                gradient={{ from: 'teal', to: 'blue' }}
                size="sm"
                leftSection={<Plus size={14} />}
                onClick={() => openQuickAdd(TASK_TYPE.SPRINT, WORK_ADD_TYPES)}
              >
                {STRINGS.ADD_TASK}
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'blue', to: 'teal' }}
                size="sm"
                leftSection={<CalendarPlus size={14} />}
                onClick={() =>
                  openQuickAdd(TASK_TYPE.EVENT, PERSONAL_ADD_TYPES)
                }
              >
                {STRINGS.ADD_EVENT}
              </Button>
            </Group>
          </Stack>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <AuditTab
            onReset={() => setShowReset(true)}
            weeklyFocus={weeklyFocus}
          />
        )}

        {/* Undo toast */}
        <Affix
          position={{ bottom: 24, left: '50%' }}
          style={{ transform: 'translateX(-50%)' }}
        >
          <Transition mounted={!!undoTarget} transition="slide-up">
            {(styles) => (
              <Paper
                style={styles}
                p="sm"
                px="lg"
                radius="xl"
                withBorder
                shadow="md"
              >
                <Group gap="sm">
                  <Text size="sm">{STRINGS.MARKED_DONE}</Text>
                  <Button variant="subtle" size="xs" onClick={undoDone}>
                    {STRINGS.UNDO}
                  </Button>
                </Group>
              </Paper>
            )}
          </Transition>
        </Affix>

        <QuickAddModal
          open={quickAdd.open}
          defaultType={quickAdd.defaultType}
          allowedTypes={quickAdd.allowedTypes}
          onClose={closeQuickAdd}
        />
        {detailTask && (
          <TaskDetailSheet
            task={detailTask}
            onClose={() => setDetailTask(null)}
          />
        )}
      </Stack>
    </>
  )
}

// ─── TaskColumn ───────────────────────────────────────────────────────────────

interface TaskColumnProps {
  label: string
  color: string
  tasks: Task[]
  subtasksMap: Map<string, Task[]>
  onDone: (t: Task) => void
  onUndo: (t: Task) => void
  onTap: (t: Task) => void
  onAdd: () => void
  empty: string
  children?: React.ReactNode
}

function TaskColumn({
  label,
  color,
  tasks,
  subtasksMap,
  onDone,
  onUndo,
  onTap,
  onAdd,
  empty,
  children,
}: TaskColumnProps) {
  return (
    <Stack gap={0}>
      <Box
        px="lg"
        py="md"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${color}-5), var(--mantine-color-${color}-4))`,
          borderRadius: 'var(--mantine-radius-xl) var(--mantine-radius-xl) 0 0',
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.7)',
              }}
            />
            <Text size="xs" fw={700} tt="uppercase" c="white">
              {label}
            </Text>
          </Group>
          <ActionIcon
            variant="white"
            color={color}
            size="sm"
            onClick={onAdd}
            aria-label={`Add ${label} task`}
          >
            <Plus size={12} />
          </ActionIcon>
        </Group>
      </Box>
      <Box
        p="md"
        style={{
          background: 'var(--mantine-color-body)',
          borderRadius: '0 0 var(--mantine-radius-xl) var(--mantine-radius-xl)',
          border: '1px solid var(--mantine-color-default-border)',
          borderTop: 'none',
        }}
      >
        <Stack gap="sm">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              subtasks={subtasksMap.get(t.id)}
              onSubtaskDone={onDone}
              onSubtaskUndo={onUndo}
              onDone={() => onDone(t)}
              onUndo={() => onUndo(t)}
              onTap={() => onTap(t)}
            />
          ))}
          {tasks.length === 0 && !children && (
            <Text size="sm" c="dimmed" py="sm">
              {empty}
            </Text>
          )}
          {children}
        </Stack>
      </Box>
    </Stack>
  )
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────

function SectionBlock({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={4} mt="xs">
      <Group gap="xs">
        <Box
          style={{
            width: 3,
            height: 12,
            borderRadius: 9999,
            backgroundColor: `var(--mantine-color-${color}-5)`,
          }}
        />
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {label}
        </Text>
      </Group>
      {children}
    </Stack>
  )
}
