import { Badge, Box } from '@mantine/core'
import { TaskType } from '../types/task.types'
import { TYPE_COLOR, TYPE_LABEL } from '../constants/taskConstants'

export function TypeBadge({ type }: { type: TaskType }) {
  return (
    <Badge color={TYPE_COLOR[type]} variant="light">
      {TYPE_LABEL[type]}
    </Badge>
  )
}

export function AccentBar({ color }: { color: string }) {
  return (
    <Box
      w={3}
      h={28}
      style={{
        borderRadius: 9999,
        backgroundColor: `var(--mantine-color-${color}-5)`,
        flexShrink: 0,
      }}
    />
  )
}
