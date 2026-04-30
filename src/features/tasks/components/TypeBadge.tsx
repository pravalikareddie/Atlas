import { Badge } from '@mantine/core'
import { TYPE_COLOR, TYPE_LABEL } from '../constants/taskConstants'
import { TaskType } from '../types/task.types'

export function TypeBadge({ type }: { type: TaskType }) {
  return (
    <Badge color={TYPE_COLOR[type] ?? 'gray'} size="xs">
      {TYPE_LABEL[type] ?? type}
    </Badge>
  )
}
