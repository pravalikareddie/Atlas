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
  RingProgress,
  Button,
  UnstyledButton,
} from '@mantine/core'
import { Plus, CalendarPlus } from '@phosphor-icons/react'

import { useTaskStore } from '../../features/tasks/store/taskStore'
import { useTaskData } from '../../features/tasks/hooks/useTaskData'
import { useTaskActions } from '../../features/tasks/hooks/useTaskActions'
import { Task, TaskType } from '../../features/tasks/types/task.types'
import {
  PERSONAL_TYPES,
  WORK_ADD_TYPES,
  PERSONAL_ADD_TYPES,
  TASK_TYPE,
  TASK_STATUS,
  WORK_TYPES,
  DATE_FORMAT,
  USER_ID,
} from '../../features/tasks/constants/taskConstants'
import { STRINGS } from '../../features/tasks/constants/strings'
import { sortTasks } from '../../features/tasks/utils/taskUtils'
import { callClaude } from '../../lib/anthropic'
import { TaskRow } from '../../features/tasks/components/TaskRow'
import { OverdueStrip } from '../../features/tasks/components/OverdueStrip'
import { CalendarTimeline } from '../../features/tasks/components/CalendarTimeline'
import { QuickAddModal } from '../../features/tasks/components/QuickAddModal'
import { TaskDetailSheet } from '../../features/tasks/components/TaskDetailSheet'
import { TodayRoutines } from '../../features/tasks/components/TodaysRoutine'
import { fetchUserSettings } from '../../features/plan/services/planService'

import {
  AuditTab,
  ResetMode,
  TaskColumn,
  SectionBlock,
  GRADIENTS,
  TABS,
  TodayTab,
} from '.'
import {
  getGreeting,
  getWeekInfo,
  getCachedSummary,
  setCachedSummary,
} from './helpers'

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
    t.status === TASK_STATUS.DONE
      ? update(t.id, { status: TASK_STATUS.TODO, completed_at: null })
      : markDone(t)
  }
  function toggleSubtask(st: Task) {
    st.status === TASK_STATUS.DONE
      ? update(st.id, { status: TASK_STATUS.TODO, completed_at: null })
      : markDone(st)
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
