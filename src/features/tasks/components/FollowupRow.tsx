import { Group, Text } from '@mantine/core'
import { Task } from '../types/task.types'
import { formatAge, ageHours } from '../utils/taskUtils'
import { AccentBar } from './AccentBar'
import { TaskCheckbox } from '../../../shared/components/TaskCheckbox'

interface Props {
  task: Task
  onDone: () => void
  onTap: () => void
}

export function FollowupRow({ task, onDone, onTap }: Props) {
  const age = formatAge(task.created_at)
  const hours = ageHours(task.created_at)
  const ageColor = hours < 24 ? 'dimmed' : hours < 48 ? 'amber' : 'red'

  return (
    <Group gap="sm" py={10} px={8} style={{ borderRadius: 10 }}>
      <AccentBar color="amber" />
      <TaskCheckbox done={false} onToggle={onDone} color="gray" />
      <Text style={{ flex: 1, cursor: 'pointer' }} onClick={onTap}>
        {task.title}
      </Text>
      <Text c={ageColor}>
        {age}
        {hours >= 48 ? ' ⚠' : ''}
      </Text>
    </Group>
  )
}
