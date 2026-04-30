import { Paper, Stack, Group, Text, UnstyledButton } from '@mantine/core'
import { Task } from '../types/task.types'
import { formatAge } from '../utils/taskUtils'
import { AccentBar, TypeBadge } from './TaskParts'
import { Badge } from '@mantine/core'

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
            <UnstyledButton
              onClick={() => onDone(task)}
              w={20}
              h={20}
              style={{
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            />
            <Text
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
