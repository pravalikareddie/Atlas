import { Paper, Stack, Group, Text , Badge } from '@mantine/core'
import { Task } from '../types/task.types'
import { formatAge } from '../utils/taskUtils'
import { AccentBar } from './AccentBar'
import { TypeBadge } from './TypeBadge'
import { TaskCheckbox } from '../../../shared/components/TaskCheckbox'

interface Props {
  tasks: Task[]
  onDone: (t: Task) => void
  onTap: (t: Task) => void
}

export function OverdueStrip({ tasks, onDone, onTap }: Props) {
  if (tasks.length === 0) return null

  return (
    <Paper
      p="md"
      mb="md"
      radius="lg"
      withBorder
      style={{
        background:
          'linear-gradient(145deg, rgba(240,80,80,0.06), rgba(240,80,80,0.02))',
        borderColor: 'rgba(240,80,80,0.12)',
      }}
    >
      <Text tt="uppercase" c="red" mb="sm">
        Overdue · {tasks.length}
      </Text>
      <Stack gap={4}>
        {tasks.map((task) => (
          <Group
            key={task.id}
            gap="sm"
            py={8}
            px={8}
            style={{ borderRadius: 10 }}
          >
            <AccentBar color="red" />
            <TaskCheckbox done={false} onToggle={() => onDone(task)} color="gray" />
            <Text
             
              fw={600}
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => onTap(task)}
            >
              {task.title}
            </Text>
            <TypeBadge type={task.type} />
            <Text c="red">{formatAge(task.due_date!)} ⚠</Text>
            {task.push_count >= 3 && <Badge variant="warning">avoiding</Badge>}
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}
