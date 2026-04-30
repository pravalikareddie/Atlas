import { STRINGS } from '../constants/strings'
import { useState, useEffect, useMemo, useRef } from 'react'
import { format, isToday, isBefore, startOfDay, parseISO } from 'date-fns'
import {
  Stack,
  Group,
  Text,
  Paper,
  Affix,
  Transition,
  Box,
  Badge,
  ActionIcon,
  Progress,
  RingProgress,
  Button,
} from '@mantine/core'
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
} from '../constants/taskConstants'
import { sortTasks } from '../utils/taskUtils'
import { callClaude } from '../../../lib/anthropic'
import { TaskRow } from './TaskRow'
import { OverdueStrip } from './OverdueStrip'
import { CalendarTimeline } from './CalendarTimeline'
import { QuickAddModal } from './QuickAddModal'
import { TaskDetailSheet } from './TaskDetailSheet' // constants (move to shared constants file)
import { CalendarPlus, CalendarPlusIcon, Plus } from '@phosphor-icons/react'
import { TodayRoutines } from './TodaysRoutine'
const AI_CACHE_KEY = 'atlas_ai_summary'
const AI_CACHE_TS_KEY = 'atlas_ai_summary_at'
const AI_CACHE_TTL_MS = 30 * 60 * 1000

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: STRINGS.MORNING, emoji: STRINGS.EMOJI_MORNING }
  if (h < 17) return { text: STRINGS.AFTERNOON, emoji: STRINGS.EMOJI_AFTERNOON }
  return { text: STRINGS.EVENING, emoji: STRINGS.EMOJI_EVENING }
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getWeekInfo(): string {
  const d = new Date()
  return `${format(d, 'EEE, MMM d')} · Wk ${getWeekNumber(d)}`
}

function getCachedAiSummary(): string | null {
  const cached = sessionStorage.getItem(AI_CACHE_KEY)
  const cachedAt = sessionStorage.getItem(AI_CACHE_TS_KEY)
  if (cached && cachedAt && Date.now() - parseInt(cachedAt) < AI_CACHE_TTL_MS)
    return cached
  return null
}

function setCachedAiSummary(summary: string) {
  sessionStorage.setItem(AI_CACHE_KEY, summary)
  sessionStorage.setItem(AI_CACHE_TS_KEY, Date.now().toString())
}

export function TodayScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { markDone, undoDone, undoTarget, update } = useTaskActions()
  const [aiSummary, setAiSummary] = useState(() => getCachedAiSummary() ?? '')
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean
    defaultType: TaskType
    allowedTypes?: TaskType[]
  }>({ open: false, defaultType: 'personal' })
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const todayStr = format(new Date(), DATE_FORMAT.API)
  const topLevel = useMemo(
    () => tasks.filter((t) => !t.parent_task_id),
    [tasks],
  )

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

    const subtasksDone = subtasksDueToday.filter(
      (t) => t.status === TASK_STATUS.DONE,
    ).length

    return topLevelDone + subtasksDone
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

  const aiKey = `${todayTasks.length}:${overdue.length}:${eventTasks.length}:${completedToday}`
  const aiKeyRef = useRef<string>('')
  useEffect(() => {
    if (aiKeyRef.current === aiKey) return
    aiKeyRef.current = aiKey
    const cached = getCachedAiSummary()
    if (cached) {
      setAiSummary(cached)
      return
    }
    const prompt = `You are Atlas. Give ONE warm, encouraging sentence summarizing Pravi's day. ${todayTasks.length} tasks due, ${overdue.length} overdue, ${eventTasks.length} events, ${completedToday} done. Be brief.`
    callClaude(prompt, 60).then((r) => {
      if (r) {
        setAiSummary(r)
        setCachedAiSummary(r)
      }
    })
  }, [aiKey])

  const greeting = getGreeting()

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

  const openQuickAdd = (defaultType: TaskType, allowedTypes?: TaskType[]) =>
    setQuickAdd({ open: true, defaultType, allowedTypes })
  const closeQuickAdd = () =>
    setQuickAdd({ open: false, defaultType: 'personal' })

  return (
    <Stack gap="xl" w="100%">
      {/* Header */}
      <Box
        p="xl"
        mb="sm"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6) 0%, var(--mantine-color-blue-5) 100%)',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Text
              size="xs"
              fw={600}
              c="white"
              tt="uppercase"
              mb={4}
              opacity={0.8}
            >
              {getWeekInfo()}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 28, lineHeight: 1.2 }}>
              {greeting.emoji} {greeting.text}, Pravi
            </Text>
            {aiSummary && (
              <Text
                size="sm"
                c="white"
                mt={6}
                maw={500}
                lh={1.7}
                opacity={0.85}
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
                  <Text ta="center" size="xs" fw={700} c="white">
                    {Math.round((completedToday / totalToday) * 100)}%
                  </Text>
                }
                sections={[
                  {
                    value: (completedToday / totalToday) * 100,
                    color: 'white',
                  },
                ]}
                rootColor="rgba(255,255,255,0.25)"
              />
              <Text size="xs" c="white" mt={2} opacity={0.8}>
                {completedToday}/{totalToday} {STRINGS.DONE}
              </Text>
            </Box>
          )}
        </Group>
      </Box>

      <OverdueStrip tasks={overdue} onDone={markDone} onTap={setDetailTask} />

      {/* Work + Personal columns */}
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
          onAdd={() => openQuickAdd(TASK_TYPE.PERSONAL, PERSONAL_ADD_TYPES)}
          empty={STRINGS.NO_PERSONAL_TODAY}
        />
      </Group>

      {/* Calendar + Routines row */}
      <Group align="flex-start" gap="lg" grow>
        <CalendarTimeline events={eventTasks} onTap={setDetailTask} />
        <TodayRoutines />
      </Group>

      {/* Quick add buttons */}
      <Group gap="sm" mt="xs">
        <Button
          variant="gradient"
          gradient={{ from: 'teal', to: 'blue' }}
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => openQuickAdd(TASK_TYPE.SPRINT, WORK_ADD_TYPES)}
        >
          {STRINGS.ADD_TASK}
        </Button>
        <Button
          variant="gradient"
          gradient={{ from: 'blue', to: 'teal' }}
          radius="xl"
          size="sm"
          leftSection={<CalendarPlusIcon size={14} />}
          onClick={() => openQuickAdd(TASK_TYPE.EVENT, PERSONAL_ADD_TYPES)}
        >
          {STRINGS.ADD_EVENT}
        </Button>
      </Group>

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
              bg="var(--mantine-color-body)"
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
            radius="xl"
            size="sm"
            onClick={onAdd}
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
          border: '1px solid var(--mantine-color-gray-2)',
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
        <Text size="xs" fw={600} tt="uppercase" c="dimmed">
          {label}
        </Text>
      </Group>
      {children}
    </Stack>
  )
}
