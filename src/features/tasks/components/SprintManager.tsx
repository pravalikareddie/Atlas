import { useState } from 'react'
import { Modal, Stack, Group, Text, TextInput, Button, Paper, ActionIcon, Badge } from '@mantine/core'
import { Trash, Plus } from '@phosphor-icons/react'
import { useTaskStore } from '../store/taskStore'
import { insertSprint, deleteSprint as deleteSprintSvc } from '../services/taskService'
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns'

import { USER_ID } from '../constants/taskConstants'
import { STRINGS } from '../constants/strings'

export function SprintManager({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const sprints = useTaskStore((s) => s.sprints)
  const tasks = useTaskStore((s) => s.tasks)
  const { addSprint, removeSprint } = useTaskStore()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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

  const today = new Date()

  return (
    <Modal opened={opened} onClose={onClose} title={STRINGS.MANAGE_SPRINTS} size="md" radius="xl">
      <Stack gap="md">
        {/* Create */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <TextInput label={STRINGS.SPRINT_NAME} placeholder={STRINGS.SPRINT_NAME_PH} value={name} onChange={(e) => setName(e.currentTarget.value)} radius="lg" />
            <Group grow>
              <TextInput label={STRINGS.START} type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} radius="lg" />
              <TextInput label={STRINGS.END} type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} radius="lg" />
            </Group>
            <Button onClick={create} disabled={!name.trim() || !startDate || !endDate} leftSection={<Plus size={14} />} variant="gradient" gradient={{ from: 'teal', to: 'cyan' }} radius="xl">
              Create Sprint
            </Button>
          </Stack>
        </Paper>

        {/* List */}
        <Stack gap="xs">
          {sprints.map((s) => {
            const taskCount = tasks.filter((t) => t.sprint_id === s.id && t.status === 'todo').length
            const doneCount = tasks.filter((t) => t.sprint_id === s.id && t.status === 'done').length
            const total = taskCount + doneCount
            const isCurrent = isWithinInterval(today, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
            const daysLeft = Math.max(0, differenceInDays(parseISO(s.end_date), today))

            return (
              <Paper key={s.id} p="md" radius="md" withBorder>
                <Group justify="space-between">
                  <Group gap="xs">
                    <Text fw={600} size="sm">{s.name}</Text>
                    {isCurrent && <Badge size="xs" color="teal">Active</Badge>}
                  </Group>
                  <ActionIcon variant="subtle" color="red" size="xs" onClick={() => remove(s.id)}>
                    <Trash size={12} />
                  </ActionIcon>
                </Group>
                <Group gap="md" mt={4}>
                  <Text size="xs" c="dimmed">{format(parseISO(s.start_date), 'MMM d')} — {format(parseISO(s.end_date), 'MMM d')}</Text>
                  {total > 0 && <Text size="xs" c="dimmed">{doneCount}/{total} tasks</Text>}
                  {isCurrent && <Text size="xs" c="teal">{daysLeft} days left</Text>}
                </Group>
              </Paper>
            )
          })}
          {sprints.length === 0 && <Text size="sm" c="dimmed" ta="center" py="md">No sprints yet</Text>}
        </Stack>
      </Stack>
    </Modal>
  )
}
