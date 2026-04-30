import { Group, Text, UnstyledButton } from '@mantine/core'
import { Task } from '../types/task.types'
import { formatAge, ageHours } from '../utils/taskUtils'
import { AccentBar } from './TaskParts'

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
      <UnstyledButton
        onClick={onDone}
        w={20}
        h={20}
        style={{
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
      />
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
