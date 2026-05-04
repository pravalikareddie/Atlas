import { Stack, Group, Text, Box, ActionIcon } from '@mantine/core'
import { Plus } from '@phosphor-icons/react'
import { Task } from '../../tasks/types/task.types'
import { TaskRow } from '../../tasks/components/TaskRow'
import { SortableList } from '../../../shared/components/SortableList'
import { COLUMN_HEADER_BG } from '../constants'
import { COLORS, RADIUS_PILL } from '../../../shared/constants/styles'
import { CardShell } from '../../../shared/components/CardShell'

interface TaskColumnProps {
  label: string
  color: string
  tasks: Task[]
  subtasksMap: Map<string, Task[]>
  onDone: (t: Task) => void
  onUndo: (t: Task) => void
  onTap: (t: Task) => void
  onAdd: () => void
  onReorder?: (tasks: Task[]) => void
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
  onReorder,
  empty,
  children,
}: TaskColumnProps) {
  return (
    <CardShell
      label={label}
      gradient={COLUMN_HEADER_BG[color] ?? `var(--mantine-color-${color}-9)`}
      right={
        <ActionIcon
          variant="transparent"
          size="sm"
          onClick={onAdd}
          aria-label={`Add ${label} task`}
          style={{
            border: `1.5px solid ${COLORS.WHITE_20}`,
            color: COLORS.WHITE_50,
          }}
        >
          <Plus size={12} />
        </ActionIcon>
      }
    >
      <Stack gap="sm">
        {onReorder && tasks.length > 0 ? (
          <SortableList
            items={tasks}
            onReorder={onReorder}
            renderItem={(t) => (
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
            )}
          />
        ) : (
          tasks.map((t) => (
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
          ))
        )}
        {tasks.length === 0 && !children && (
          <Text size="sm" c="white" py="sm">
            {empty}
          </Text>
        )}
        {children}
      </Stack>
    </CardShell>
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
            borderRadius: RADIUS_PILL,
            backgroundColor: `var(--mantine-color-${color}-5)`,
          }}
        />
        <Text size="xs" fw={700} tt="uppercase" c="black">
          {label}
        </Text>
      </Group>
      {children}
    </Stack>
  )
}
