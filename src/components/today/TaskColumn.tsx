import { Stack, Group, Text, Box, ActionIcon } from '@mantine/core'
import { Plus } from '@phosphor-icons/react'
import { Task } from '../../features/tasks/types/task.types'
import { TaskRow } from '../../features/tasks/components/TaskRow'

interface TaskColumnProps {
  label: string
  color: string
  tasks: Task[]
  subtasksMap: Map<string, Task[]>
  onDone: (t: Task) => void
  onUndo: (t: Task) => void
  onTap: (t: Task) => void
  onAdd: () => void
  empty: string
  children?: React.ReactNode
}

export function TaskColumn({
  label,
  color,
  tasks,
  subtasksMap,
  onDone,
  onUndo,
  onTap,
  onAdd,
  empty,
  children,
}: TaskColumnProps) {
  return (
    <Stack gap={0}>
      <Box
        px="lg"
        py="md"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${color}-5), var(--mantine-color-${color}-4))`,
          borderRadius: 'var(--mantine-radius-xl) var(--mantine-radius-xl) 0 0',
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.7)',
              }}
            />
            <Text size="xs" fw={700} tt="uppercase" c="white">
              {label}
            </Text>
          </Group>
          <ActionIcon
            variant="white"
            color={color}
            size="sm"
            onClick={onAdd}
            aria-label={`Add ${label} task`}
          >
            <Plus size={12} />
          </ActionIcon>
        </Group>
      </Box>
      <Box
        p="md"
        style={{
          background: 'var(--mantine-color-body)',
          borderRadius: '0 0 var(--mantine-radius-xl) var(--mantine-radius-xl)',
          border: '1px solid var(--mantine-color-default-border)',
          borderTop: 'none',
        }}
      >
        <Stack gap="sm">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              subtasks={subtasksMap.get(t.id)}
              onSubtaskDone={onDone}
              onSubtaskUndo={onUndo}
              onDone={() => onDone(t)}
              onUndo={() => onUndo(t)}
              onTap={() => onTap(t)}
            />
          ))}
          {tasks.length === 0 && !children && (
            <Text size="sm" c="dimmed" py="sm">
              {empty}
            </Text>
          )}
          {children}
        </Stack>
      </Box>
    </Stack>
  )
}

export function SectionBlock({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={4} mt="xs">
      <Group gap="xs">
        <Box
          style={{
            width: 3,
            height: 12,
            borderRadius: 9999,
            backgroundColor: `var(--mantine-color-${color}-5)`,
          }}
        />
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {label}
        </Text>
      </Group>
      {children}
    </Stack>
  )
}
