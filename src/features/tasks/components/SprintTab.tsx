import { useState } from 'react'
import { Stack, Group, Text, Paper, Box, Badge, Button, TextInput, ActionIcon, SimpleGrid, UnstyledButton, Tooltip, Progress } from '@mantine/core'
import { Plus, Trash, Check } from '@phosphor-icons/react'
import { useTaskStore } from '../store/taskStore'
import { insertSprint, deleteSprint as deleteSprintSvc, updateTask, insertTask, deleteTask as deleteTaskSvc } from '../services/taskService'
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns'
import { TASK_STATUS, USER_ID } from '../constants/taskConstants'
import { STRINGS } from '../constants/strings'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import { updateTask as updateTaskSvc } from '../services/taskService'
import { Task } from '../types/task.types'

export function SprintTab() {
  const sprints = useTaskStore((s) => s.sprints)
  const tasks = useTaskStore((s) => s.tasks)
  const { addSprint, removeSprint, updateTask: updateTaskStore } = useTaskStore()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const today = new Date()

  async function create() {
    if (!name.trim() || !startDate || !endDate) return
    try {
      const s = await insertSprint({ user_id: USER_ID, name: name.trim(), start_date: startDate, end_date: endDate })
      addSprint(s)
    } catch {
      addSprint({ id: crypto.randomUUID(), user_id: USER_ID, name: name.trim(), start_date: startDate, end_date: endDate, created_at: new Date().toISOString() })
    }
    setName('')
    setStartDate('')
    setEndDate('')
  }

  async function remove(id: string) {
    removeSprint(id)
    try { await deleteSprintSvc(id) } catch {}
  }

  async function addTaskToSprint() {
    if (!newTaskTitle.trim() || !selectedSprint) return
    const row = { user_id: USER_ID, title: newTaskTitle.trim(), type: 'sprint' as const, priority: null, is_must: false, status: 'todo' as const, due_date: null, do_today: false, completed_at: null, goal_id: null, milestone_id: null, project_id: null, roadmap_item_id: null, calendar_event_id: null, parent_task_id: null, ticket_id: null, order_index: sprintTasks.length, cadence: null, cadence_days: null, cadence_date: null, cadence_interval: null, push_count: 0, sprint_id: selectedSprint, blocked: false, blocked_note: null, is_learning: false, notes: null }
    try {
      const t = await insertTask(row)
      useTaskStore.getState().addTask(t)
    } catch {
      useTaskStore.getState().addTask({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString(), event_time: null, event_duration: null } as any)
    }
    setNewTaskTitle('')
  }

  async function removeTask(id: string) {
    useTaskStore.getState().removeTask(id)
    try { await deleteTaskSvc(id) } catch {}
  }

  async function toggleDoToday(t: Task) {
    const val = !t.do_today
    updateTaskStore(t.id, { do_today: val })
    await updateTask(t.id, { do_today: val }).catch(() => {})
  }

  async function toggleDone(t: Task) {
    const done = t.status === TASK_STATUS.DONE
    const updates = done
      ? { status: 'todo' as const, completed_at: null }
      : { status: 'done' as const, completed_at: new Date().toISOString() }
    updateTaskStore(t.id, updates)
    await updateTask(t.id, updates).catch(() => {})
  }

  const selected = sprints.find((s) => s.id === selectedSprint)
  const sprintTasks = selected ? tasks.filter((t) => t.sprint_id === selected.id && !t.parent_task_id).sort((a, b) => a.order_index - b.order_index) : []
  const doneTasks = sprintTasks.filter((t) => t.status === TASK_STATUS.DONE)
  const todoTasks = sprintTasks.filter((t) => t.status === TASK_STATUS.TODO)
  const progress = sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0

  return (
    <Stack gap="lg">
      {/* Create sprint */}
      <Paper p="md" radius="md" withBorder>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">New Sprint</Text>
        <Group grow>
          <TextInput placeholder={STRINGS.SPRINT_NAME} value={name} onChange={(e) => setName(e.currentTarget.value)} radius="lg" />
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} radius="lg" />
          <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} radius="lg" />
          <Button onClick={create} disabled={!name.trim() || !startDate || !endDate} leftSection={<Plus size={14} />} variant="gradient" gradient={{ from: 'teal', to: 'cyan' }} radius="xl">Create</Button>
        </Group>
      </Paper>

      {/* Sprint list */}
      <SimpleGrid cols={3} spacing="sm">
        {sprints.map((s) => {
          const sTaskCount = tasks.filter((t) => t.sprint_id === s.id).length
          const sDoneCount = tasks.filter((t) => t.sprint_id === s.id && t.status === TASK_STATUS.DONE).length
          const isCurrent = (() => { try { return isWithinInterval(today, { start: parseISO(s.start_date), end: parseISO(s.end_date) }) } catch { return false } })()
          const daysLeft = Math.max(0, differenceInDays(parseISO(s.end_date), today))
          const isSelected = selectedSprint === s.id

          return (
            <Paper key={s.id} p="md" radius="md" withBorder onClick={() => setSelectedSprint(isSelected ? null : s.id)}
              style={{ cursor: 'pointer', border: isSelected ? '2px solid var(--mantine-color-teal-5)' : undefined }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <Text fw={600} size="sm">{s.name}</Text>
                  {isCurrent && <Badge size="xs" color="teal">Active</Badge>}
                </Group>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={(e) => { e.stopPropagation(); remove(s.id) }}>
                  <Trash size={12} />
                </ActionIcon>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>{format(parseISO(s.start_date), 'MMM d')} — {format(parseISO(s.end_date), 'MMM d')}</Text>
              {sTaskCount > 0 && <Text size="xs" c="dimmed">{sDoneCount}/{sTaskCount} tasks · {isCurrent ? `${daysLeft}d left` : ''}</Text>}
            </Paper>
          )
        })}
      </SimpleGrid>

      {/* Selected sprint detail */}
      {selected && (
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <Text fw={700} size="lg">{selected.name}</Text>
              <Badge color="teal">{progress}%</Badge>
            </Group>
            <Text size="sm" c="dimmed">{format(parseISO(selected.start_date), 'MMM d')} — {format(parseISO(selected.end_date), 'MMM d')}</Text>
          </Group>
          <Progress value={progress} color="teal" radius="xl" size="sm" styles={{ root: { backgroundColor: 'rgba(255,255,255,0.1)' } }} />

          {/* Inline add task */}
          <Group gap="xs">
            <TextInput placeholder={STRINGS.ADD_A_TASK} value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && addTaskToSprint()} radius="lg" style={{ flex: 1 }} />
            <Button onClick={addTaskToSprint} disabled={!newTaskTitle.trim()} leftSection={<Plus size={14} />} variant="light" color="teal" radius="xl">Add</Button>
          </Group>

          {/* Todo tasks — pick for today */}
          {todoTasks.length > 0 && (
            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">To Do ({todoTasks.length})</Text>
              <Stack gap="xs">
              <SortableList items={todoTasks} onReorder={(r) => persistOrder(r, (id, d) => updateTaskStore(id, d), (id, d) => updateTaskSvc(id, d))} renderItem={(t) => (
                  <Paper p="md" radius="md" withBorder style={{ opacity: t.blocked ? 0.5 : 1 }}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" style={{ flex: 1 }}>
                        <UnstyledButton onClick={() => toggleDone(t)} w={20} h={20}
                          style={{ borderRadius: '50%', flexShrink: 0, border: '2px solid var(--mantine-color-teal-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        <Box>
                          <Text size="sm" fw={500}>{t.title}</Text>
                          <Group gap={4} mt={2}>
                            {t.priority && <Badge size="xs" variant="light" color={t.priority === 'high' ? 'red' : 'gray'}>{t.priority}</Badge>}
                            {t.blocked && <Badge size="xs" variant="light" color="yellow">⏳ {t.blocked_note || 'Blocked'}</Badge>}
                            {t.due_date && <Text size="xs" c="dimmed">{t.due_date}</Text>}
                          </Group>
                        </Box>
                      </Group>
                      <Tooltip label={t.do_today ? 'Remove from today' : 'Add to today'} withArrow>
                        <Button size="xs" radius="xl" variant={t.do_today ? 'filled' : 'light'} color="teal" onClick={() => toggleDoToday(t)}>
                          {t.do_today ? '📌 Today' : '+ Today'}
                        </Button>
                      </Tooltip>
                      <ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeTask(t.id)}>
                        <Trash size={12} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                )} />
              </Stack>
            </Box>
          )}

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Completed ({doneTasks.length})</Text>
              <Stack gap="xs">
                {doneTasks.map((t) => (
                  <Paper key={t.id} p="md" radius="md" withBorder style={{ opacity: 0.5 }}>
                    <Group gap="sm">
                      <UnstyledButton onClick={() => toggleDone(t)} w={20} h={20}
                        style={{ borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--mantine-color-green-5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} color="white" weight="bold" />
                      </UnstyledButton>
                      <Text size="sm" td="line-through">{t.title}</Text>
                      {t.completed_at && <Text size="xs" c="dimmed">{format(new Date(t.completed_at), 'MMM d')}</Text>}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  )
}
