import { STRINGS } from '../constants/strings'
import { useState, useEffect } from 'react'
import { format, isBefore, isToday, parseISO, startOfDay } from 'date-fns'
import {
  Drawer,
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  Select,
  Switch,
  UnstyledButton,
  ActionIcon,
  Box,
  Progress,
  ScrollArea,
  Paper,
  Badge,
  Button,
} from '@mantine/core'
import { Task, TaskType, CadenceType, TaskPriority } from '../types/task.types'
import {
  ADD_MODAL_TYPES,
  TYPE_LABEL,
  CADENCE_OPTIONS,
  PRIORITY_OPTIONS,
  USER_ID,
  PRIORITY,
  CADENCE,
  TASK_STATUS,
  PRIORITY_LABEL,
  CADENCE_LABEL,
  DATE_FORMAT,
  TYPE_COLOR,
  SPRINT_TASK_STATUS_OPTIONS,
} from '../constants/taskConstants'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTaskStore } from '../store/taskStore'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import {
  X,
  Check,
  CheckCircleIcon,
  Plus,
  Calendar,
  TrashIcon,
} from '@phosphor-icons/react'
function getSubtaskInitial(task: Task) {
  return {
    title: '',
    due: task.due_date ?? '',
    priority: PRIORITY.HIGH as TaskPriority | null,
    isMust: false,
  }
}

interface DetailProps {
  task: Task
  onClose: () => void
}

export function TaskDetailSheet({ task: taskProp, onClose }: DetailProps) {
  const { update, remove, markDone, create } = useTaskActions()
  const tasks = useTaskStore((s) => s.tasks)
  const sprints = useTaskStore((s) => s.sprints)
  const task = tasks.find((t) => t.id === taskProp.id) ?? taskProp
  const subtasks = tasks.filter((t) => t.parent_task_id === task.id)

  const [title, setTitle] = useState(task.title)
  const [type, setType] = useState<TaskType>(task.type)
  const [dueDate, setDueDate] = useState(task.due_date ?? '')

  const [cadence, setCadence] = useState<CadenceType>(
    task.cadence ?? CADENCE.NONE,
  )
  const [priority, setPriority] = useState<TaskPriority | null>(
    task.priority ?? null,
  )
  const [isMust, setIsMust] = useState(task.is_must)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [newSub, setNewSub] = useState(() => getSubtaskInitial(task))
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editingSubTitle, setEditingSubTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setType(task.type)
    setDueDate(task.due_date ?? '')
    setCadence(task.cadence ?? CADENCE.NONE)
    setPriority(task.priority ?? null)
    setIsMust(task.is_must)
    setNotes(task.notes ?? '')
    setNewSub(getSubtaskInitial(task))
    setConfirmDelete(false)
  }, [task])

  function saveField(field: string, value: unknown) {
    update(task.id, { [field]: value })
  }

  async function addSubtask() {
    if (!newSub.title.trim()) return
    await create({
      user_id: USER_ID,
      title: newSub.title.trim(),
      notes: null,
      type: task.type,
      priority: newSub.priority,
      is_must: newSub.isMust,
      status: TASK_STATUS.TODO,
      is_learning: false,
      due_date: newSub.due || task.due_date,
      do_today: false,
      completed_at: null,
      goal_id: null,
      milestone_id: null,
      project_id: null,
      roadmap_item_id: null,
      calendar_event_id: null,
      parent_task_id: task.id,
      ticket_id: null,
      order_index: subtasks.length,
      cadence: null,
      cadence_days: null,
      cadence_date: null,
      cadence_interval: null,
      push_count: 0, sprint_id: null, blocked: false, blocked_note: null, sprint_status: null,
    })
    setNewSub(getSubtaskInitial(task))
  }

  function toggleSubtask(st: Task) {
    const completing = st.status === TASK_STATUS.TODO
    update(st.id, {
      status: completing ? TASK_STATUS.DONE : TASK_STATUS.TODO,
      completed_at: completing ? new Date().toISOString() : null,
    })
  }

  function saveSubtaskTitle(st: Task) {
    if (editingSubTitle.trim() && editingSubTitle !== st.title)
      update(st.id, { title: editingSubTitle.trim() })
    setEditingSubId(null)
  }

  const accentColor = TYPE_COLOR[task.type] ?? 'teal'
  const completedCount = subtasks.filter(
    (s) => s.status === TASK_STATUS.DONE,
  ).length
  const progress =
    subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0
  const isOverdue =
    task.due_date &&
    isBefore(parseISO(task.due_date), startOfDay(new Date())) &&
    task.status === TASK_STATUS.TODO

  return (
    <Drawer
      opened
      onClose={onClose}
      position="right"
      title={null}
      size="lg"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.3, blur: 3 }}
      styles={{
        content: {
          background: 'var(--mantine-color-body)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Gradient header */}
      <Box
        p="xl"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${accentColor}-6), var(--mantine-color-${accentColor}-4))`,
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <Badge variant="white" color={accentColor} size="sm">
              {TYPE_LABEL[task.type]}
            </Badge>
            {task.is_must && <Badge variant="urgent">{STRINGS.MUST}</Badge>}
            {isOverdue && (
              <Badge color="red" variant="filled" size="sm">
                {STRINGS.OVERDUE}
              </Badge>
            )}
          </Group>
          <ActionIcon
            variant="white"
            color={accentColor}
            radius="xl"
            size="sm"
            onClick={onClose}
          >
            <X size={14} />
          </ActionIcon>
        </Group>

        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() =>
            title.trim() &&
            title !== task.title &&
            saveField('title', title.trim())
          }
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            title.trim() &&
            title !== task.title &&
            saveField('title', title.trim())
          }
          variant="unstyled"
          fw={700}
          styles={{
            input: {
              fontSize: 22,
              color: 'white',
              '::placeholder': { color: 'rgba(255,255,255,0.5)' },
            },
          }}
        />

        {task.push_count > 0 && (
          <Text size="xs" c="white" opacity={0.75} mt={2}>
            {STRINGS.PUSHED_TIMES(task.push_count)}
          </Text>
        )}

        {subtasks.length > 0 && (
          <Box mt="md">
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="white" opacity={0.8}>
                {completedCount}/{subtasks.length} {STRINGS.SUBTASKS_DONE}
              </Text>
              <Text size="xs" c="white" fw={700}>
                {Math.round(progress)}%
              </Text>
            </Group>
            <Progress
              value={progress}
              color="white"
              bg="rgba(255,255,255,0.25)"
              radius="xl"
              size="sm"
            />
          </Box>
        )}
      </Box>

      <ScrollArea style={{ flex: 1 }} p="xl">
        <Stack gap="md" pb="xl">
          {/* Core fields */}
          <Paper
            p="lg"
            radius="xl"
            bg="var(--mantine-color-body)"
            withBorder
            style={{ borderColor: 'var(--mantine-color-gray-2)' }}
          >
            <Stack gap="sm">
              <Group grow>
                <Select
                  label={STRINGS.TYPE}
                  value={type}
                  onChange={(v) => {
                    if (v) {
                      setType(v as TaskType)
                      saveField('type', v)
                    }
                  }}
                  data={ADD_MODAL_TYPES.map((t) => ({
                    value: t,
                    label: TYPE_LABEL[t],
                  }))}
                  radius="lg"
                />
                <Select
                  label={STRINGS.PRIORITY}
                  value={priority}
                  onChange={(v) => {
                    setPriority(v as TaskPriority | null)
                    saveField('priority', v || null)
                  }}
                  clearable
                  data={PRIORITY_OPTIONS.map((p) => ({
                    value: p,
                    label: PRIORITY_LABEL[p],
                  }))}
                  radius="lg"
                />
                <Select
                  label={STRINGS.SPRINT}
                  value={task.sprint_id || null}
                  onChange={(v) => saveField('sprint_id', v || null)}
                  clearable
                  placeholder={STRINGS.NO_SPRINT}
                  data={sprints.map((s) => ({ value: s.id, label: s.name }))}
                  radius="lg"
                />
              </Group>

              {task.sprint_id && (
                <Select
                  label="Sprint Status"
                  value={task.sprint_status}
                  onChange={(v) => saveField('sprint_status', v)}
                  data={SPRINT_TASK_STATUS_OPTIONS}
                  radius="lg"
                />
              )}

              <Group grow>
                <TextInput
                  label={STRINGS.DUE_DATE}
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const val = e.target.value
                    setDueDate(val)
                    saveField('due_date', val || null)
                    saveField(
                      'do_today',
                      val === format(new Date(), DATE_FORMAT.API),
                    )
                  }}
                  radius="lg"
                  styles={
                    isOverdue
                      ? {
                          input: {
                            borderColor: 'var(--mantine-color-red-5)',
                            color: 'var(--mantine-color-red-6)',
                          },
                        }
                      : {}
                  }
                />
                <TextInput
                  label="Reminder"
                  type="time"
                  value={task.reminder_time ?? ''}
                  onChange={(e) => saveField('reminder_time', e.target.value || null)}
                  radius="lg"
                  placeholder="HH:MM"
                />
                <Select
                  label={STRINGS.CADENCE}
                  value={cadence}
                  onChange={(v) => {
                    const val = (v ?? CADENCE.NONE) as CadenceType
                    setCadence(val)
                    saveField('cadence', val === CADENCE.NONE ? null : val)
                  }}
                  data={CADENCE_OPTIONS.map((c) => ({
                    value: c,
                    label: CADENCE_LABEL[c],
                  }))}
                  radius="lg"
                />
              </Group>

              <Switch
                label={STRINGS.MUST_TODAY}
                checked={isMust}
                color={accentColor}
                onChange={(e) => {
                  setIsMust(e.currentTarget.checked)
                  saveField('is_must', e.currentTarget.checked)
                }}
              />
            </Stack>
          </Paper>

          {/* Notes */}
          <Paper
            p="lg"
            radius="xl"
            bg="var(--mantine-color-body)"
            withBorder
            style={{ borderColor: 'var(--mantine-color-gray-2)' }}
          >
            <Textarea
              label={STRINGS.NOTES}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() =>
                notes !== (task.notes ?? '') &&
                saveField('notes', notes || null)
              }
              rows={3}
              variant="unstyled"
              placeholder={STRINGS.NOTES_PLACEHOLDER}
            />
          </Paper>

          {/* Subtasks */}
          <Paper
            p="lg"
            radius="xl"
            bg="var(--mantine-color-body)"
            withBorder
            style={{ borderColor: 'var(--mantine-color-gray-2)' }}
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {STRINGS.SUBTASKS}
                </Text>
                {subtasks.length > 0 && (
                  <Text size="xs" c={accentColor} fw={600}>
                    {completedCount}/{subtasks.length}
                  </Text>
                )}
              </Group>

              <SortableList items={subtasks} onReorder={(reordered) => persistOrder(reordered, (id, d) => update(id, d), (id, d) => update(id, d))} renderItem={(st) => {
                const isDone = st.status === TASK_STATUS.DONE
                const isCurrent =
                  !isDone && !!st.due_date && isToday(parseISO(st.due_date))
                const isEditing = editingSubId === st.id

                return (
                  <Stack key={st.id} gap={4}>
                    <Group
                      gap="sm"
                      p="xs"
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        background: isDone
                          ? 'var(--mantine-color-dark-6)'
                          : 'white',
                        border: '1px solid var(--mantine-color-gray-2)',
                        opacity: isDone ? 0.6 : 1,
                      }}
                    >
                      <UnstyledButton
                        onClick={() => toggleSubtask(st)}
                        w={18}
                        h={18}
                        style={{
                          borderRadius: '50%',
                          flexShrink: 0,
                          border: isDone
                            ? 'none'
                            : `2px solid var(--mantine-color-${accentColor}-4)`,
                          backgroundColor: isDone
                            ? 'var(--mantine-color-green-5)'
                            : 'transparent',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDone && <CheckCircleIcon size={10} color="white" />}
                      </UnstyledButton>

                      {isEditing ? (
                        <TextInput
                          value={editingSubTitle}
                          onChange={(e) => setEditingSubTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSubtaskTitle(st)
                            if (e.key === 'Escape') setEditingSubId(null)
                          }}
                          onBlur={() => saveSubtaskTitle(st)}
                          style={{ flex: 1 }}
                          size="xs"
                          autoFocus
                        />
                      ) : (
                        <Text
                          size="sm"
                          td={isDone ? 'line-through' : undefined}
                          c={
                            isCurrent ? accentColor : isDone ? 'dimmed' : 'dark'
                          }
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => {
                            setEditingSubId(st.id)
                            setEditingSubTitle(st.title)
                          }}
                        >
                          {st.title}
                        </Text>
                      )}

                      {st.due_date && !isToday(parseISO(st.due_date)) && (
                        <Text size="xs" c="dimmed">
                          {format(parseISO(st.due_date), DATE_FORMAT.SHORT)}
                        </Text>
                      )}

                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => remove(st.id)}
                        aria-label={STRINGS.DELETE}
                      >
                        <X size={12} />
                      </ActionIcon>
                    </Group>

                    {!isDone && (
                      <Group gap="xs" pl={28}>
                        <Select
                          value={st.priority}
                          onChange={(v) =>
                            update(st.id, {
                              priority: v as TaskPriority | null,
                            })
                          }
                          clearable
                          placeholder={STRINGS.PRIORITY}
                          data={PRIORITY_OPTIONS.map((p) => ({
                            value: p,
                            label: PRIORITY_LABEL[p],
                          }))}
                          w={110}
                          size="xs"
                          radius="lg"
                        />
                        <TextInput
                          type="date"
                          value={st.due_date ?? ''}
                          onChange={(e) =>
                            update(st.id, { due_date: e.target.value || null })
                          }
                          w={140}
                          size="xs"
                          radius="lg"
                        />
                        <Switch
                          label={STRINGS.MUST}
                          checked={st.is_must}
                          onChange={(e) =>
                            update(st.id, { is_must: e.currentTarget.checked })
                          }
                          size="xs"
                          color={accentColor}
                        />
                      </Group>
                    )}
                  </Stack>
                )
              }} />

              {/* Add subtask input */}
              <Box
                p="sm"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  border: `1.5px dashed var(--mantine-color-${accentColor}-3)`,
                  background: 'var(--mantine-color-dark-6)',
                }}
              >
                <TextInput
                  value={newSub.title}
                  variant="unstyled"
                  placeholder={STRINGS.ADD_SUBTASK}
                  onChange={(e) =>
                    setNewSub((s) => ({ ...s, title: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  leftSection={
                    <Plus
                      size={14}
                      color={`var(--mantine-color-${accentColor}-5)`}
                    />
                  }
                />
                {newSub.title.trim() && (
                  <Group gap="xs" mt="xs">
                    <TextInput
                      type="date"
                      value={newSub.due}
                      onChange={(e) =>
                        setNewSub((s) => ({ ...s, due: e.target.value }))
                      }
                      w={140}
                      size="xs"
                      radius="lg"
                    />
                    <Select
                      value={newSub.priority}
                      onChange={(v) =>
                        setNewSub((s) => ({
                          ...s,
                          priority: v as TaskPriority | null,
                        }))
                      }
                      placeholder={STRINGS.PRIORITY}
                      data={PRIORITY_OPTIONS.map((p) => ({
                        value: p,
                        label: PRIORITY_LABEL[p],
                      }))}
                      w={110}
                      size="xs"
                      radius="lg"
                    />
                    <Switch
                      label={STRINGS.MUST}
                      checked={newSub.isMust}
                      onChange={(e) =>
                        setNewSub((s) => ({
                          ...s,
                          isMust: e.currentTarget.checked,
                        }))
                      }
                      size="xs"
                      color={accentColor}
                    />
                    <Button
                      size="xs"
                      radius="xl"
                      color={accentColor}
                      onClick={addSubtask}
                    >
                      {STRINGS.ADD}
                    </Button>
                  </Group>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Actions */}
          <Group gap="sm">
            <Button
              variant="gradient"
              gradient={{ from: accentColor, to: 'blue' }}
              radius="xl"
              size="sm"
              leftSection={<Calendar size={14} />}
              onClick={() =>
                update(task.id, {
                  do_today: true,
                  due_date: format(new Date(), DATE_FORMAT.API),
                })
              }
            >
              {STRINGS.MOVE_TO_TODAY}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              radius="xl"
              size="sm"
              leftSection={<Check size={14} />}
              onClick={() => {
                markDone(task)
                onClose()
              }}
            >
              {STRINGS.MARK_DONE}
            </Button>
            <Button
              variant="subtle"
              color="red"
              radius="xl"
              size="sm"
              ml="auto"
              leftSection={<TrashIcon size={14} />}
              onClick={() => {
                if (confirmDelete) {
                  remove(task.id)
                  onClose()
                } else setConfirmDelete(true)
              }}
            >
              {confirmDelete ? STRINGS.CONFIRM_DELETE : STRINGS.DELETE}
            </Button>
          </Group>

          {confirmDelete && (
            <Text size="xs" c="red" ta="right">
              {STRINGS.DELETE_WARNING}
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
