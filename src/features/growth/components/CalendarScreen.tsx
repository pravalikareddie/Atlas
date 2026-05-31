import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useState, useMemo } from 'react'
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
  X,
} from '@phosphor-icons/react'
import { STRINGS } from '../../tasks/constants/strings'
import { TaskDetailSheet } from '../../tasks/components/TaskDetailSheet'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { CALENDAR_DAY_HEADERS, GROWTH_STRINGS } from '../constants'
import { UNSTYLED_INPUT_STYLES } from '../../../shared/constants/styles'

const LEARNING_TASK_TYPES: TaskType[] = [
  TASK_TYPE.SPRINT,
  TASK_TYPE.PERSONAL,
  TASK_TYPE.FINANCE,
  TASK_TYPE.HEALTH,
  TASK_TYPE.MISC,
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MonthNav({
  month,
  onPrev,
  onNext,
  onToday,
}: {
  month: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <Paper p="md" radius="xl" withBorder>
      <Group justify="space-between" align="center">
        <ActionIcon variant="light" color="teal" radius="xl" onClick={onPrev}>
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
              onClick={onToday}
            >
              {STRINGS.TODAY}
            </Button>
          )}
        </Group>
        <ActionIcon variant="light" color="teal" radius="xl" onClick={onNext}>
          <CaretRight size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  )
}

function DayCell({
  day,
  tasks,
  isSelected,
  onClick,
}: {
  day: Date
  tasks: Task[]
  isSelected: boolean
  onClick: () => void
}) {
  const isToday = isSameDay(day, new Date())
  const hasTasks = tasks.length > 0

  return (
    <Grid.Col span={1}>
      <UnstyledButton onClick={onClick} w="100%">
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
            c={isSelected || isToday ? 'teal' : 'var(--mantine-color-text)'}
          >
            {format(day, 'd')}
          </Text>
          {hasTasks && (
            <Group gap={2} justify="center" mt={2}>
              {tasks.slice(0, 3).map((t) => (
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
              {tasks.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{tasks.length - 3}
                </Text>
              )}
            </Group>
          )}
        </Box>
      </UnstyledButton>
    </Grid.Col>
  )
}

function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isDone = task.status === TASK_STATUS.DONE

  return (
    <Group
      gap="sm"
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        background: 'var(--mantine-color-dark-6)',
        opacity: isDone ? 0.6 : 1,
      }}
    >
      <UnstyledButton
        onClick={onToggle}
        w={20}
        h={20}
        style={{
          borderRadius: '50%',
          flexShrink: 0,
          border: isDone ? 'none' : '2px solid var(--mantine-color-teal-4)',
          backgroundColor: isDone
            ? 'var(--mantine-color-green-5)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDone && <Check size={10} color="white" />}
      </UnstyledButton>

      <Box style={{ flex: 1 }}>
        <Text size="sm" fw={600} td={isDone ? 'line-through' : undefined}>
          {task.title}
        </Text>
        {task.notes && (
          <Text size="xs" c="dimmed">
            {task.notes}
          </Text>
        )}
        <Group gap="xs" mt={2}>
          <Badge variant="light" color="teal" size="xs">
            {TYPE_LABEL[task.type] ?? task.type}
          </Badge>
          {task.due_date && (
            <Text size="xs" c="dimmed">
              {format(parseISO(task.due_date), DATE_FORMAT.SHORT)}
            </Text>
          )}
        </Group>
      </Box>

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" size="xs" color="gray">
            <DotsThree size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<PencilSimple size={14} />} onClick={onEdit}>
            {STRINGS.EDIT}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<Trash size={14} />}
            color="red"
            onClick={onDelete}
          >
            {STRINGS.DELETE}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}

// ─── Add Learning Item Modal ──────────────────────────────────────────────────

interface AddLearningModalProps {
  defaultDate?: string | null
  onSave: (d: { title: string; type: TaskType; notes: string; due_date: string | null }) => void
  onClose: () => void
}

function AddLearningModal({ defaultDate, onSave, onClose }: AddLearningModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>(TASK_TYPE.PERSONAL)
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate ?? '')
  const [err, setErr] = useState(false)


  function submit() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    onSave({ title: title.trim(), type, notes, due_date: dueDate || null })
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={null}
      radius="xl"
      size="md"
      padding={0}
      styles={{
        content: {
          overflow: 'hidden',
          borderRadius: 'var(--mantine-radius-xl)',
        },
        header: { display: 'none' },
      }}
    >
      {/* Gradient header */}
      <Box
        p="xl"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-green-5))`,
        }}
      >
        <Group justify="space-between" mb="md">
          <Text fw={700} c="white" size="lg">
            {GROWTH_STRINGS.ADD_LEARNING_ITEM_TITLE}
          </Text>
          <ActionIcon
            variant="white"
            color="teal"
            radius="xl"
            size="sm"
            onClick={onClose}
          >
            <X size={14} />
          </ActionIcon>
        </Group>

        <TextInput
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErr(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit()
            if (e.key === 'Escape') onClose()
          }}
          placeholder={GROWTH_STRINGS.WHAT_WILL_YOU_LEARN}
          error={err ? STRINGS.REQUIRED : undefined}
          autoFocus
          variant="unstyled"
          styles={UNSTYLED_INPUT_STYLES}
        />

        {/* Quick info badges */}
        <Group gap="xs" mt="sm">
          <Badge
            variant="outline"
            color="white"
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
          >
            📅{' '}
            {dueDate
              ? format(parseISO(dueDate), DATE_FORMAT.SHORT)
              : STRINGS.NO_DATE}
          </Badge>
          <Badge
            variant="outline"
            color="white"
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
          >
            {TYPE_LABEL[type]}
          </Badge>
        </Group>
      </Box>

      {/* Body */}
      <Stack gap="md" p="xl">
        <Group grow>
          <Select
            label={STRINGS.TYPE}
            value={type}
            onChange={(v) => v && setType(v as TaskType)}
            data={LEARNING_TASK_TYPES.map((t) => ({
              value: t,
              label: TYPE_LABEL[t] ?? t,
            }))}
            radius="lg"
          />
          <TextInput
            label={GROWTH_STRINGS.DATE_OPTIONAL}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            radius="lg"
          />
        </Group>

        <Textarea
          label={STRINGS.NOTES}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={STRINGS.NOTES_PLACEHOLDER}
          radius="lg"
          rows={2}
        />

        <Group>
          <Button
            onClick={submit}
            disabled={!title.trim()}
            radius="xl"
            style={{ flex: 1 }}
            variant="gradient"
            gradient={{ from: 'teal', to: 'green' }}
          >
            {STRINGS.ADD}
          </Button>
          <Button variant="default" onClick={onClose} radius="xl">
            {STRINGS.CANCEL}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalendarScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { create, update, remove } = useTaskActions()
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [addModalDate, setAddModalDate] = useState<string | null | undefined>(undefined)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const showAddModal = addModalDate !== undefined

  const learningTasks = useMemo(
    () => tasks.filter((t) => t.is_learning),
    [tasks],
  )

  const scheduledTasks = useMemo(
    () => learningTasks.filter((t) => t.due_date),
    [learningTasks],
  )

  const unscheduledTasks = useMemo(
    () => learningTasks.filter((t) => !t.due_date && t.status === TASK_STATUS.TODO),
    [learningTasks],
  )

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    scheduledTasks.forEach((t) => {
      const d = t.due_date!
      ;(map[d] ??= []).push(t)
    })
    return map
  }, [scheduledTasks])

  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const startPad = getDay(start) === 0 ? 6 : getDay(start) - 1
  const selectedTasks = selectedDay ? (byDate[selectedDay] ?? []) : []

  function openAddModal(defaultDate?: string | null) {
    setAddModalDate(defaultDate ?? null)
  }

  function closeAddModal() {
    setAddModalDate(undefined)
  }

  async function handleCreate(d: {
    title: string
    type: TaskType
    notes: string
    due_date: string | null
  }) {
    await create({
      user_id: USER_ID,
      title: d.title,
      notes: d.notes || null,
      type: d.type,
      priority: null,
      is_must: false,
      status: TASK_STATUS.TODO,
      due_date: d.due_date,
      do_today: d.due_date === format(new Date(), DATE_FORMAT.API),
      completed_at: null,
      goal_id: null,
      milestone_id: null,
      project_id: null,
      roadmap_item_id: null,
      calendar_event_id: null,
      parent_task_id: null,
      ticket_id: null,
      order_index: 0,
      cadence: null,
      cadence_days: null,
      cadence_date: null,
      cadence_interval: null,
      push_count: 0, sprint_id: null, blocked: false, blocked_note: null, sprint_status: null,
      is_learning: true,
    })
    closeAddModal()
  }

  function handleToggle(t: Task) {
    const completing = t.status === TASK_STATUS.TODO
    update(t.id, {
      status: completing ? TASK_STATUS.DONE : TASK_STATUS.TODO,
      completed_at: completing ? new Date().toISOString() : null,
    })
  }

  return (
    <Stack gap="lg">
      {/* Top bar */}
      <Group justify="space-between" align="center">
        <Box style={{ flex: 1 }}>
          <MonthNav
            month={month}
            onPrev={() => setMonth((m) => subMonths(m, 1))}
            onNext={() => setMonth((m) => addMonths(m, 1))}
            onToday={() => setMonth(new Date())}
          />
        </Box>
        <Button
          variant="light"
          color="teal"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => openAddModal()}
        >
          {GROWTH_STRINGS.ADD_LEARNING_ITEM_TITLE}
        </Button>
      </Group>

      {/* Calendar grid */}
      <Paper p="md" radius="xl" withBorder>
        <Grid columns={7} mb="xs">
          {CALENDAR_DAY_HEADERS.map((d) => (
            <Grid.Col key={d} span={1}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" ta="center">
                {d}
              </Text>
            </Grid.Col>
          ))}
        </Grid>

        <Grid columns={7} gutter={4}>
          {Array.from({ length: startPad }).map((_, i) => (
            <Grid.Col key={`pad-${i}`} span={1} />
          ))}
          {days.map((day) => {
            const key = format(day, DATE_FORMAT.API)
            return (
              <DayCell
                key={key}
                day={day}
                tasks={byDate[key] ?? []}
                isSelected={selectedDay === key}
                onClick={() => {
                  setSelectedDay(selectedDay === key ? null : key)
                }}
              />
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
              onClick={() => openAddModal(selectedDay)}
            >
              {STRINGS.ADD_LEARNING_ITEM}
            </Button>
          </Group>

          {selectedTasks.length === 0 && (
            <Text size="sm" c="dimmed">
              {STRINGS.NO_LEARNING_ITEMS}
            </Text>
          )}

          <Stack gap="xs">
            {selectedTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={() => handleToggle(t)}
                onEdit={() => setEditTask(t)}
                onDelete={() => remove(t.id)}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Unscheduled learning items */}
      {unscheduledTasks.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                {GROWTH_STRINGS.UNSCHEDULED}
              </Text>
              <Badge variant="light" color="gray" size="xs">
                {unscheduledTasks.length}
              </Badge>
            </Group>
          </Group>
          <Stack gap="xs">
            {unscheduledTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={() => handleToggle(t)}
                onEdit={() => setEditTask(t)}
                onDelete={() => remove(t.id)}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddLearningModal
          defaultDate={addModalDate}
          onSave={handleCreate}
          onClose={closeAddModal}
        />
      )}

      {/* Edit detail sheet */}
      {editTask && (
        <TaskDetailSheet task={editTask} onClose={() => setEditTask(null)} />
      )}
    </Stack>
  )
}
