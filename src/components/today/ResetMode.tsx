import { useState, useEffect } from 'react'
import { isBefore, parseISO, startOfDay } from 'date-fns'
import {
  Stack,
  Group,
  Text,
  Paper,
  Box,
  Button,
  UnstyledButton,
  Textarea,
  Skeleton,
} from '@mantine/core'
import { Warning } from '@phosphor-icons/react'
import { useTaskStore } from '../../features/tasks/store/taskStore'
import { useBudgetSummary } from '../../features/finance/hooks/useBudgetSummary'
import { useHealthStore } from '../../features/health/store/healthStore'
import { usePlanStore } from '../../features/plan/store/planStore'
import {
  TASK_STATUS,
  GOAL_STATUS,
  USER_ID,
} from '../../features/tasks/constants/taskConstants'
import { STRINGS } from '../../features/tasks/constants/strings'
import { callClaude } from '../../lib/anthropic'
import { upsertUserSettings } from '../../features/plan/services/planService'
import {
  GRADIENTS,
  RESET_BREATHE_CYCLES_BEFORE_SKIP,
  RESET_BREATHE_PHASE_MS,
  RESET_AI_MAX_TOKENS,
  RESET_AI_FALLBACK,
  BREATHE_PHASES,
  BREATHE_LABELS,
  BreathePhase,
  ResetStage,
} from './constants'

interface ResetModeProps {
  weeklyFocus: string | null
  onFocusSaved: (focus: string) => void
  onClose: () => void
}

export function ResetMode({
  weeklyFocus,
  onFocusSaved,
  onClose,
}: ResetModeProps) {
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
