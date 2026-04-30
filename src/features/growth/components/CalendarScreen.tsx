import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Menu,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useState, useMemo } from 'react'
import { useGrowthStore } from '../store/growthStore'
import {
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  parseISO,
  isSameDay,
} from 'date-fns'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { Task, TaskType } from '../../tasks/types/task.types'
import {
  DATE_FORMAT,
  TASK_STATUS,
  TASK_TYPE,
  TYPE_LABEL,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import {
  CaretLeft,
  CaretRight,
  Check,
  DotsThree,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { STRINGS } from '../../tasks/constants/strings'
import { TaskDetailSheet } from '../../tasks/components/TaskDetailSheet'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
const LEARNING_TASK_TYPES: TaskType[] = [
  TASK_TYPE.SPRINT,
  TASK_TYPE.PERSONAL,
  TASK_TYPE.FINANCE,
  TASK_TYPE.HEALTH,
  TASK_TYPE.MISC,
]

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { create, update, remove } = useTaskActions()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const learningTasks = useMemo(
    () => tasks.filter((t) => t.is_learning && t.due_date),
    [tasks],
  )

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    learningTasks.forEach((t) => {
      const d = t.due_date!
      ;(map[d] ??= []).push(t)
    })
    return map
  }, [learningTasks])

  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const startPad = getDay(start) === 0 ? 6 : getDay(start) - 1

  const selectedTasks = selectedDay ? (byDate[selectedDay] ?? []) : []

  async function handleCreate(d: {
    title: string
    type: TaskType
    notes: string
  }) {
    if (!selectedDay) return
    await create({
      user_id: USER_ID,
      title: d.title,
      notes: d.notes || null,
      type: d.type,
      priority: null,
      is_must: false,
      status: TASK_STATUS.TODO,
      due_date: selectedDay,
      do_today: selectedDay === format(new Date(), DATE_FORMAT.API),
      completed_at: null,
      goal_id: null,
      milestone_id: null,
      project_id: null,
      roadmap_item_id: null,
      calendar_event_id: null,
      parent_task_id: null,
      ticket_id: null,
      order_index: 0,
      event_time: null,
      event_duration: null,
      cadence: null,
      cadence_days: null,
      cadence_date: null,
      cadence_interval: null,
      push_count: 0,
      is_learning: true,
    })
    setShowAdd(false)
  }

  async function handleToggle(t: Task) {
    const completing = t.status === TASK_STATUS.TODO
    update(t.id, {
      status: completing ? TASK_STATUS.DONE : TASK_STATUS.TODO,
      completed_at: completing ? new Date().toISOString() : null,
    })
  }

  async function handleDelete(id: string) {
    remove(id)
  }

  return (
    <Stack gap="lg">
      {/* Month nav */}
      <Paper p="md" radius="xl" withBorder>
        <Group justify="space-between" align="center">
          <ActionIcon
            variant="light"
            color="teal"
            radius="xl"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <CaretLeft size={16} />
          </ActionIcon>
          <Group gap="sm">
            <Text fw={700} size="md">
              {format(month, 'MMMM yyyy')}
            </Text>
            {!isSameMonth(month, new Date()) && (
              <Button
                variant="subtle"
                color="teal"
                size="xs"
                radius="xl"
                onClick={() => setMonth(new Date())}
              >
                {STRINGS.TODAY}
              </Button>
            )}
          </Group>
          <ActionIcon
            variant="light"
            color="teal"
            radius="xl"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <CaretRight size={16} />
          </ActionIcon>
        </Group>
      </Paper>

      {/* Calendar grid */}
      <Paper p="md" radius="xl" withBorder>
        {/* Day headers */}
        <Grid columns={7} mb="xs">
          {DAY_HEADERS.map((d) => (
            <Grid.Col key={d} span={1}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" ta="center">
                {d}
              </Text>
            </Grid.Col>
          ))}
        </Grid>

        {/* Days */}
        <Grid columns={7} gutter={4}>
          {Array.from({ length: startPad }).map((_, i) => (
            <Grid.Col key={`pad-${i}`} span={1} />
          ))}
          {days.map((day) => {
            const key = format(day, DATE_FORMAT.API)
            const dayTasks = byDate[key] ?? []
            const isSelected = selectedDay === key
            const isToday = isSameDay(day, new Date())
            const hasTasks = dayTasks.length > 0
            const doneTasks = dayTasks.filter(
              (t) => t.status === TASK_STATUS.DONE,
            ).length

            return (
              <Grid.Col key={key} span={1}>
                <UnstyledButton
                  onClick={() => {
                    setSelectedDay(isSelected ? null : key)
                    setShowAdd(false)
                  }}
                  style={{ width: '100%' }}
                >
                  <Box
                    p={6}
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: isSelected
                        ? 'var(--mantine-color-teal-light)'
                        : isToday
                          ? 'var(--mantine-color-teal-1)'
                          : 'transparent',
                      border: isToday
                        ? '2px solid var(--mantine-color-teal-4)'
                        : '2px solid transparent',
                      textAlign: 'center',
                      minHeight: 52,
                    }}
                  >
                    <Text
                      size="sm"
                      fw={isToday ? 800 : 500}
                      c={
                        isSelected
                          ? 'teal'
                          : isToday
                            ? 'teal'
                            : 'var(--mantine-color-text)'
                      }
                    >
                      {format(day, 'd')}
                    </Text>
                    {hasTasks && (
                      <Group gap={2} justify="center" mt={2}>
                        {dayTasks.slice(0, 3).map((t) => (
                          <Box
                            key={t.id}
                            w={6}
                            h={6}
                            style={{
                              borderRadius: '50%',
                              background:
                                t.status === TASK_STATUS.DONE
                                  ? 'var(--mantine-color-green-5)'
                                  : 'var(--mantine-color-teal-5)',
                            }}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{dayTasks.length - 3}
                          </Text>
                        )}
                      </Group>
                    )}
                  </Box>
                </UnstyledButton>
              </Grid.Col>
            )
          })}
        </Grid>
      </Paper>

      {/* Selected day panel */}
      {selectedDay && (
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={700} size="sm">
              {format(parseISO(selectedDay), 'EEE, MMM d')}
            </Text>
            <Button
              variant="light"
              color="teal"
              radius="xl"
              size="xs"
              leftSection={<Plus size={12} />}
              onClick={() => setShowAdd(true)}
            >
              {STRINGS.ADD_LEARNING_ITEM}
            </Button>
          </Group>

          {selectedTasks.length === 0 && !showAdd && (
            <Text size="sm" c="dimmed">
              {STRINGS.NO_LEARNING_ITEMS}
            </Text>
          )}

          <Stack gap="xs">
            {selectedTasks.map((t) => (
              <Group
                key={t.id}
                gap="sm"
                p="sm"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-gray-0)',
                  opacity: t.status === TASK_STATUS.DONE ? 0.6 : 1,
                }}
              >
                <UnstyledButton
                  onClick={() => handleToggle(t)}
                  w={20}
                  h={20}
                  style={{
                    borderRadius: '50%',
                    flexShrink: 0,
                    border:
                      t.status === TASK_STATUS.DONE
                        ? 'none'
                        : '2px solid var(--mantine-color-teal-4)',
                    backgroundColor:
                      t.status === TASK_STATUS.DONE
                        ? 'var(--mantine-color-green-5)'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.status === TASK_STATUS.DONE && (
                    <Check size={10} color="white" />
                  )}
                </UnstyledButton>

                <Box style={{ flex: 1 }}>
                  <Text
                    size="sm"
                    fw={600}
                    td={
                      t.status === TASK_STATUS.DONE ? 'line-through' : undefined
                    }
                  >
                    {t.title}
                  </Text>
                  {t.notes && (
                    <Text size="xs" c="dimmed">
                      {t.notes}
                    </Text>
                  )}
                  <Badge variant="light" color="teal" size="xs" mt={2}>
                    {TYPE_LABEL[t.type] ?? t.type}
                  </Badge>
                </Box>

                <Menu position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="xs" color="gray">
                      <DotsThree size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<PencilSimple size={14} />}
                      onClick={() => setEditTask(t)}
                    >
                      {STRINGS.EDIT}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<Trash size={14} />}
                      color="red"
                      onClick={() => handleDelete(t.id)}
                    >
                      {STRINGS.DELETE}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            ))}
          </Stack>

          {/* Add form */}
          {showAdd && (
            <LearningItemForm
              onSave={handleCreate}
              onClose={() => setShowAdd(false)}
            />
          )}
        </Paper>
      )}

      {/* Edit modal */}
      {editTask && (
        <TaskDetailSheet task={editTask} onClose={() => setEditTask(null)} />
      )}
    </Stack>
  )
}

interface LearningItemFormProps {
  onSave: (d: { title: string; type: TaskType; notes: string }) => void
  onClose: () => void
}

function LearningItemForm({ onSave, onClose }: LearningItemFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>(TASK_TYPE.PERSONAL)
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState(false)

  function submit() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    onSave({ title: title.trim(), type, notes })
  }

  return (
    <Paper
      p="md"
      radius="lg"
      withBorder
      mt="md"
      style={{
        borderColor: 'var(--mantine-color-teal-3)',
        borderStyle: 'dashed',
      }}
    >
      <Stack gap="sm">
        <TextInput
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErr(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onClose()
          }}
          placeholder={STRINGS.LEARNING_ITEM_PLACEHOLDER}
          error={err ? STRINGS.REQUIRED : undefined}
          size="sm"
          radius="lg"
          autoFocus
        />
        <Group grow>
          <Select
            value={type}
            onChange={(v) => v && setType(v as TaskType)}
            data={LEARNING_TASK_TYPES.map((t) => ({
              value: t,
              label: TYPE_LABEL[t] ?? t,
            }))}
            size="sm"
            radius="lg"
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={STRINGS.NOTES_PLACEHOLDER}
            size="sm"
            radius="lg"
            rows={1}
          />
        </Group>
        <Group gap="xs">
          <Button size="xs" radius="xl" color="teal" onClick={submit}>
            {STRINGS.ADD}
          </Button>
          <Button size="xs" radius="xl" variant="default" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
