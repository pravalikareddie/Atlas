import { useState, useEffect, useMemo } from 'react'
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  isWithinInterval,
} from 'date-fns'
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
  SimpleGrid,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import { Plus, GearSix } from '@phosphor-icons/react'

import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { Task, TaskType } from '../../tasks/types/task.types'
import { useHealthStore } from '../../health/store/healthStore'
import {
  PERSONAL_TYPES,
  WORK_ADD_TYPES,
  PERSONAL_ADD_TYPES,
  TASK_TYPE,
  TASK_STATUS,
  WORK_TYPES,
  DATE_FORMAT,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import { sortTasks } from '../../tasks/utils/taskUtils'
import { TaskRow } from '../../tasks/components/TaskRow'
import { SortableList } from '../../../shared/components/SortableList'
import { SprintTaskRow } from '../../tasks/components/SprintTaskRow'
import { SprintManager } from '../../tasks/components/SprintManager'
import { OverdueStrip } from '../../tasks/components/OverdueStrip'
import { CalendarTimeline } from '../../tasks/components/CalendarTimeline'
import { QuickAddModal } from '../../tasks/components/QuickAddModal'
import { TaskDetailSheet } from '../../tasks/components/TaskDetailSheet'
import { TodayRoutines } from '../../routines/components/TodayRoutines'
import { fetchUserSettings } from '../../plan/services/planService'
import { ROUTES } from '../../../app/routes'

import {
  ResetMode,
  TaskColumn,
  SectionBlock,
  GRADIENTS,
  TABS,
  TodayTab,
  COLUMN_HEADER_BG,
} from '..'
import { GrowthTab } from './GrowthTab'
import { getGreeting, getWeekInfo } from '../helpers'
import { useMeetingData } from '../../meetings/hooks/useMeetingData'
import { useMeetingStore } from '../../meetings/store/meetingStore'
import { updateMeeting } from '../../meetings/services/meetingService'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '../../../shared/constants/styles'
import { CardShell } from '../../../shared/components/CardShell'

// ─── TodayScreen ──────────────────────────────────────────────────────────────

export function TodayScreen() {
  useTaskData()
  useMeetingData()
  const tasks = useTaskStore((s) => s.tasks)
  const meetings = useMeetingStore((s) => s.meetings)
  const navigate = useNavigate()
  const { markDone, undoDone, undoTarget, update } = useTaskActions()

  const [activeTab, setActiveTab] = useState<TodayTab>('today')
  const [showReset, setShowReset] = useState(false)
  const [weeklyFocus, setWeeklyFocus] = useState<string | null>(null)

  const [quickAdd, setQuickAdd] = useState<{
    open: boolean
    defaultType: TaskType
    allowedTypes?: TaskType[]
  }>({ open: false, defaultType: TASK_TYPE.PERSONAL })
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [showSprintManager, setShowSprintManager] = useState(false)

  // Re-evaluate date-dependent memos at midnight
  const [todayStr, setTodayStr] = useState(() =>
    format(new Date(), DATE_FORMAT.API),
  )
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    )
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    const timer = setTimeout(
      () => setTodayStr(format(new Date(), DATE_FORMAT.API)),
      msUntilMidnight,
    )
    return () => clearTimeout(timer)
  }, [todayStr])

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
            isBefore(parseISO(t.due_date), startOfDay(parseISO(todayStr))),
        ),
      ),
    [topLevel, todayStr],
  )

  const VISIBLE_TYPES = useMemo(
    () => new Set([...WORK_TYPES, ...PERSONAL_TYPES]),
    [],
  )

  const overdueIds = useMemo(() => new Set(overdue.map((t) => t.id)), [overdue])

  // Subtasks due today — compute before todayTasks so parents can be included
  const todaySubtasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.parent_task_id &&
          ((t.due_date && isToday(parseISO(t.due_date))) || t.do_today) &&
          (t.status === TASK_STATUS.TODO ||
            (t.status === TASK_STATUS.DONE &&
              !!t.completed_at &&
              isToday(parseISO(t.completed_at)))),
      ),
    [tasks],
  )

  const parentIdsViaSub = useMemo(
    () => new Set(todaySubtasks.map((t) => t.parent_task_id!)),
    [todaySubtasks],
  )

  const todayTasks = useMemo(
    () =>
      topLevel.filter(
        (t) =>
          (VISIBLE_TYPES.has(t.type) || t.is_learning) &&
          !overdueIds.has(t.id) &&
          ((t.status === TASK_STATUS.TODO &&
            ((t.due_date && isToday(parseISO(t.due_date))) ||
              t.do_today ||
              parentIdsViaSub.has(t.id))) ||
            (t.status === TASK_STATUS.DONE &&
              !!t.completed_at &&
              isToday(parseISO(t.completed_at)))),
      ),
    [topLevel, VISIBLE_TYPES, overdueIds, parentIdsViaSub],
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

  const sprints = useTaskStore((s) => s.sprints)
  const sprintMap = useMemo(
    () => new Map(sprints.map((s) => [s.id, s])),
    [sprints],
  )

  const workTasks = useMemo(
    () =>
      topLevel
        .filter(
          (t) =>
            !t.is_learning &&
            WORK_TYPES.includes(t.type) &&
            t.status === TASK_STATUS.TODO &&
            (t.do_today ||
              (t.due_date && isToday(parseISO(t.due_date))) ||
              parentIdsViaSub.has(t.id)),
        )
        .sort((a, b) => a.order_index - b.order_index),
    [topLevel, parentIdsViaSub],
  )
  const meetingPrepTasks = useMemo(
    () =>
      sortTasks(
        todayTasks.filter(
          (t) => !t.is_learning && t.type === TASK_TYPE.MEETING_PREP,
        ),
      ),
    [todayTasks],
  )
  const personalTasks = useMemo(
    () =>
      sortTasks(
        todayTasks.filter(
          (t) => !t.is_learning && PERSONAL_TYPES.includes(t.type),
        ),
      ),
    [todayTasks],
  )

  // ─── Health data for today ──────────────────────────────────────────────────
  const { appointments: healthAppts } = useHealthStore()
  const todayHealthAppts = useMemo(() => {
    return healthAppts.filter(
      (a) => a.status === 'active' && a.next_appointment === todayStr,
    )
  }, [healthAppts, todayStr])

  const learningTasks = useMemo(
    () => sortTasks(todayTasks.filter((t) => t.is_learning)),
    [todayTasks],
  )
  const todayMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.next_date === todayStr)
        .sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? '')),
    [meetings, todayStr],
  )

  const completedToday = useMemo(() => {
    const topLevelDone = todayTasks.filter(
      (t) =>
        t.status === TASK_STATUS.DONE &&
        (!parentIdsViaSub.has(t.id) ||
          (t.due_date && isToday(parseISO(t.due_date))) ||
          (t.do_today && (!t.due_date || isToday(parseISO(t.due_date))))),
    ).length
    return (
      topLevelDone +
      todaySubtasks.filter((t) => t.status === TASK_STATUS.DONE).length
    )
  }, [todayTasks, todaySubtasks, parentIdsViaSub])

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
    const topLevelCount = todayTasks.filter(
      (t) =>
        !parentIdsViaSub.has(t.id) ||
        (t.due_date && isToday(parseISO(t.due_date))) ||
        (t.do_today && (!t.due_date || isToday(parseISO(t.due_date)))),
    ).length
    return topLevelCount + todaySubtasks.length
  }, [todayTasks, todaySubtasks, parentIdsViaSub])

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

      <Stack gap={0} w="100%">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <Box
          px="xl"
          pt="xl"
          pb="lg"
          style={{
            background: GRADIENTS.HERO,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: GRADIENTS.HERO_GLOW,
              pointerEvents: 'none',
            }}
          />
          <Group
            justify="space-between"
            align="flex-start"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Box>
              <Text
                size="xs"
                fw={500}
                c="white"
                tt="uppercase"
                lts="0.12em"
                mb={6}
              >
                {getWeekInfo()}
              </Text>
              <Text
                fw={300}
                c="white"
                style={{ fontSize: 36, lineHeight: 1.2 }}
              >
                {greeting.emoji} {greeting.text}
              </Text>
            </Box>
            {totalToday > 0 && (
              <Box ta="center">
                <RingProgress
                  size={64}
                  thickness={4}
                  roundCaps
                  label={
                    <Text
                      ta="center"
                      size="xs"
                      fw={600}
                      c="white"
                      ff="var(--mantine-font-family-monospace)"
                    >
                      {Math.round((completedToday / totalToday) * 100)}%
                    </Text>
                  }
                  sections={[
                    {
                      value: (completedToday / totalToday) * 100,
                      color: 'var(--mantine-color-blue-4)',
                    },
                  ]}
                  rootColor={COLORS.WHITE_12}
                />
                <Text
                  size="xs"
                  c="white"
                  mt={4}
                  ff="var(--mantine-font-family-monospace)"
                >
                  {completedToday}/{totalToday}
                </Text>
              </Box>
            )}
          </Group>

          {/* Sprint in hero */}
          {(() => {
            const now = new Date()
            const activeSprint = sprints.find((s) => {
              try {
                return isWithinInterval(now, {
                  start: parseISO(s.start_date),
                  end: parseISO(s.end_date),
                })
              } catch {
                return false
              }
            })
            if (!activeSprint) return null
            const sprintTasks = tasks.filter(
              (t) => t.sprint_id === activeSprint.id && !t.parent_task_id,
            )
            const sDone = sprintTasks.filter(
              (t) => t.status === TASK_STATUS.DONE,
            ).length
            const sTotal = sprintTasks.length
            const sPct = sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (parseISO(activeSprint.end_date).getTime() - now.getTime()) /
                  86400000,
              ),
            )
            const totalDays = Math.max(
              1,
              Math.ceil(
                (parseISO(activeSprint.end_date).getTime() -
                  parseISO(activeSprint.start_date).getTime()) /
                  86400000,
              ),
            )
            const daysPct = Math.round(
              ((totalDays - daysLeft) / totalDays) * 100,
            )
            return (
              <Group gap="lg" mt="md" style={{ opacity: 0.9 }}>
                <Text size="xs" fw={700} c="white" tt="uppercase" lts="0.1em">
                  {activeSprint.name}
                </Text>
                <Group gap="md">
                  <Group gap={4}>
                    <RingProgress
                      size={32}
                      thickness={3}
                      roundCaps
                      sections={[{ value: sPct, color: 'teal' }]}
                      rootColor={COLORS.WHITE_12}
                    />
                    <Text
                      size="xs"
                      c="white"
                      ff="var(--mantine-font-family-monospace)"
                    >
                      {sDone}/{sTotal}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <RingProgress
                      size={32}
                      thickness={3}
                      roundCaps
                      sections={[{ value: daysPct, color: 'blue' }]}
                      rootColor={COLORS.WHITE_12}
                    />
                    <Text
                      size="xs"
                      c="white"
                      ff="var(--mantine-font-family-monospace)"
                    >
                      {daysLeft}d left
                    </Text>
                  </Group>
                </Group>
              </Group>
            )
          })()}

          <Group gap="xs" mt="lg" style={{ position: 'relative', zIndex: 1 }}>
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
                      activeTab === tab.value ? COLORS.WHITE_18 : 'transparent',
                    border:
                      activeTab === tab.value
                        ? `1px solid ${COLORS.WHITE_25}`
                        : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Text
                    size="sm"
                    fw={500}
                    c="white"
                    lts="0.02em"
                    style={{ opacity: activeTab === tab.value ? 1 : 0.45 }}
                  >
                    {tab.label}
                  </Text>
                </Box>
              </UnstyledButton>
            ))}
          </Group>
        </Box>



        {/* ── Today Tab ─────────────────────────────────────────────── */}
        {activeTab === 'today' && (
          <Box p="md">
            <Stack gap="md">
              {/* Stale todos nudge */}
              {(() => {
                const stale = tasks.filter(
                  (t) =>
                    t.status === TASK_STATUS.TODO &&
                    !t.parent_task_id &&
                    t.created_at &&
                    Date.now() - new Date(t.created_at).getTime() >
                      7 * 86400000,
                )
                if (stale.length === 0) return null
                return (
                  <Paper
                    p="md"
                    radius="lg"
                    withBorder
                    style={{
                      borderLeft: '3px solid var(--mantine-color-orange-5)',
                    }}
                  >
                    <Text size="sm">
                      ⏰ {stale.length} task
                      {stale.length > 1 ? 's have' : ' has'} been sitting for 7+
                      days. Do them, schedule them, or let them go.
                    </Text>
                  </Paper>
                )
              })()}

              <OverdueStrip
                tasks={overdue}
                onDone={markDone}
                onTap={setDetailTask}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {/* Work — Sprint view */}
                <CardShell
                  label={STRINGS.WORK}
                  gradient={
                    COLUMN_HEADER_BG.violet ?? 'var(--mantine-color-violet-9)'
                  }
                  right={
                    <Group gap={4}>
                      <Tooltip label={STRINGS.MANAGE_SPRINTS} withArrow>
                        <ActionIcon
                          variant="transparent"
                          size="sm"
                          onClick={() => setShowSprintManager(true)}
                          style={{
                            border: `1.5px solid ${COLORS.WHITE_20}`,
                            color: COLORS.WHITE_50,
                          }}
                        >
                          <GearSix size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <ActionIcon
                        variant="transparent"
                        size="sm"
                        onClick={() =>
                          openQuickAdd(TASK_TYPE.SPRINT, WORK_ADD_TYPES)
                        }
                        style={{
                          border: `1.5px solid ${COLORS.WHITE_20}`,
                          color: COLORS.WHITE_50,
                        }}
                      >
                        <Plus size={12} />
                      </ActionIcon>
                    </Group>
                  }
                >
                  <Stack gap="sm">
                    {workTasks.length === 0 &&
                      meetingPrepTasks.length === 0 && (
                        <Text size="sm" c="dimmed" py="sm">
                          {STRINGS.NO_WORK_TODAY}
                        </Text>
                      )}
                    {workTasks.length > 0 && (
                      <SortableList
                        items={workTasks}
                        onReorder={(reordered) => {
                          reordered.forEach((t, i) =>
                            update(t.id, { order_index: i }),
                          )
                        }}
                        renderItem={(t) => (
                          <SprintTaskRow
                            key={t.id}
                            task={t}
                            sprint={
                              t.sprint_id
                                ? sprintMap.get(t.sprint_id)
                                : undefined
                            }
                            subtasks={subtasksMap.get(t.id)}
                            onDone={() => toggleTask(t)}
                            onUndo={() => toggleTask(t)}
                            onTap={() => setDetailTask(t)}
                            onFocus={() =>
                              navigate(`${ROUTES.FOCUS}?task=${t.id}`)
                            }
                            onReset={() => setShowReset(true)}
                            onChat={() => {
                              import('../../chat/ChatWidget').then((m) =>
                                m.chatAboutItem('task', t.title),
                              )
                            }}
                            onToggleBlock={() => {
                              const blocked = !t.blocked
                              update(t.id, {
                                blocked,
                                blocked_note: blocked ? t.blocked_note : null,
                              })
                            }}
                            onSubtaskDone={toggleSubtask}
                            onSubtaskUndo={toggleSubtask}
                          />
                        )}
                      />
                    )}
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
                  </Stack>
                </CardShell>

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
                  onReorder={(reordered) =>
                    reordered.forEach((t, i) =>
                      update(t.id, { order_index: i }),
                    )
                  }
                  empty={STRINGS.NO_PERSONAL_TODAY}
                />

                <CalendarTimeline
                  meetings={todayMeetings}
                  onTap={(m) => navigate(ROUTES.MEETING_DETAIL(m.id))}
                  onAdd={() => navigate(ROUTES.MEETINGS)}
                  onDone={(m) => {
                    const done = m.last_done === todayStr ? null : todayStr
                    useMeetingStore
                      .getState()
                      .updateMeeting(m.id, { last_done: done })
                    updateMeeting(m.id, { last_done: done }).catch(() => {})
                  }}
                />

                <TodayRoutines />
              </SimpleGrid>

              {learningTasks.length > 0 && (
                <TaskColumn
                  label={STRINGS.LEARNING_TODAY}
                  color="green"
                  tasks={learningTasks}
                  subtasksMap={subtasksMap}
                  onDone={toggleTask}
                  onUndo={toggleTask}
                  onTap={setDetailTask}
                  onAdd={() =>
                    openQuickAdd(TASK_TYPE.GROWTH, PERSONAL_ADD_TYPES)
                  }
                  empty=""
                />
              )}

              {todayHealthAppts.length > 0 && (
                <Paper p="md" radius="lg" withBorder>
                  <Text size="xs" fw={700} tt="uppercase" mb="sm">
                    🩺 Appointments
                  </Text>
                  <Stack gap="xs">
                    {todayHealthAppts.map((a) => (
                      <Paper key={a.id} p="xs" radius="md" withBorder>
                        <Text size="sm" fw={600}>
                          {a.name}
                        </Text>
                        {a.notes && (
                          <Text size="xs" c="dimmed">
                            {a.notes}
                          </Text>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              )}

              <Button
                variant="filled"
                color="dark"
                radius="md"
                size="sm"
                w="fit-content"
                leftSection={<Plus size={14} />}
                onClick={() => openQuickAdd(TASK_TYPE.SPRINT, WORK_ADD_TYPES)}
              >
                {STRINGS.ADD_TASK}
              </Button>
            </Stack>
          </Box>
        )}

        {/* ── Growth Tab ────────────────────────────────────────────── */}
        {activeTab === 'growth' && (
          <Box p="md">
            <GrowthTab />
          </Box>
        )}

        {/* ── Undo toast ────────────────────────────────────────────── */}
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
        <SprintManager
          opened={showSprintManager}
          onClose={() => setShowSprintManager(false)}
        />
      </Stack>
    </>
  )
}
