import { useState } from 'react'
import { format, parseISO, isToday } from 'date-fns'
import {
  Group,
  Text,
  UnstyledButton,
  Stack,
  Collapse,
  ActionIcon,
  Box,
} from '@mantine/core'
import { Task } from '../types/task.types'
import {
  CADENCE,
  DATE_FORMAT,
  TASK_STATUS,
  TYPE_COLOR,
} from '../constants/taskConstants'
import { Badge } from '@mantine/core'
import { STRINGS } from '../constants/strings'
import { CaretDownIcon, CaretRightIcon, Check } from '@phosphor-icons/react'
import { TypeBadge } from './TypeBadge'
interface Props {
  task: Task
  subtasks?: Task[]
  onDone: () => void
  onUndo?: () => void
  onTap: () => void
  onSubtaskDone?: (st: Task) => void
  onSubtaskUndo?: (st: Task) => void
}

export function TaskRow({
  task,
  subtasks = [],
  onDone,
  onUndo,
  onTap,
  onSubtaskDone,
  onSubtaskUndo,
}: Props) {
  const [open, setOpen] = useState(false)
  const hasSubs = subtasks.length > 0
  const doneCount = subtasks.filter((s) => s.status === TASK_STATUS.DONE).length
  const isDone = task.status === TASK_STATUS.DONE

  return (
    <Stack gap={0}>
      <Group
        gap="sm"
        py={11}
        px={12}
        wrap="nowrap"
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          background: 'var(--mantine-color-gray-0)',
          border: '1px solid var(--mantine-color-gray-1)',
          opacity: isDone ? 0.55 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        <Box
          w={4}
          style={{
            alignSelf: 'stretch',
            borderRadius: 9999,
            backgroundColor: isDone
              ? 'var(--mantine-color-green-5)'
              : `var(--mantine-color-${TYPE_COLOR[task.type]}-5)`,
            flexShrink: 0,
            minHeight: 24,
            transition: 'background-color 0.2s ease',
          }}
        />

        <UnstyledButton
          onClick={(e) => {
            e.stopPropagation()
            isDone ? onUndo?.() : onDone()
          }}
          w={20}
          h={20}
          style={{
            borderRadius: '50%',
            flexShrink: 0,
            border: isDone
              ? 'none'
              : `2px solid var(--mantine-color-${TYPE_COLOR[task.type]}-4)`,
            backgroundColor: isDone
              ? 'var(--mantine-color-green-5)'
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isDone && <Check size={10} color="white" weight="bold" />}
        </UnstyledButton>

        <Text
          size="sm"
          fw={500}
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          td={isDone ? 'line-through' : undefined}
          c={isDone ? 'dimmed' : 'var(--mantine-color-text)'}
          truncate
          onClick={onTap}
        >
          {task.title}
        </Text>

        {!isDone && <TypeBadge type={task.type} />}

        {!isDone && task.cadence && task.cadence !== CADENCE.NONE && (
          <Text size="xs" title={STRINGS.RECURRING}>
            🔄
          </Text>
        )}

        {!isDone && task.due_date && !isToday(parseISO(task.due_date)) && (
          <Text size="xs" c="dimmed">
            {format(parseISO(task.due_date), DATE_FORMAT.SHORT)}
          </Text>
        )}

        {!isDone && task.is_must && (
          <Badge variant="urgent">{STRINGS.MUST}</Badge>
        )}

        {hasSubs && (
          <Group gap={4}>
            <Text size="xs" c="dimmed">
              {doneCount}/{subtasks.length}
            </Text>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? (
                <CaretDownIcon size={12} />
              ) : (
                <CaretRightIcon size={12} />
              )}
            </ActionIcon>
          </Group>
        )}
      </Group>

      <Collapse in={open}>
        <Stack gap={0} pl={20} pt={4}>
          {subtasks.map((st) => (
            <SubtaskRow
              key={st.id}
              subtask={st}
              onDone={() => onSubtaskDone?.(st)}
              onUndo={() => onSubtaskUndo?.(st)}
            />
          ))}
        </Stack>
      </Collapse>
    </Stack>
  )
}

function SubtaskRow({
  subtask,
  onDone,
  onUndo,
}: {
  subtask: Task
  onDone: () => void
  onUndo: () => void
}) {
  const isDone = subtask.status === TASK_STATUS.DONE
  const isCurrent =
    !isDone && !!subtask.due_date && isToday(parseISO(subtask.due_date))

  return (
    <Group
      gap="sm"
      wrap="nowrap"
      py={7}
      px={8}
      style={{
        borderLeft: '2px solid var(--mantine-color-gray-2)',
        marginLeft: 8,
        opacity: isDone ? 0.45 : isCurrent ? 1 : 0.75,
        transition: 'opacity 0.2s ease',
      }}
    >
      <UnstyledButton
        onClick={isDone ? onUndo : onDone}
        w={14}
        h={14}
        style={{
          borderRadius: '50%',
          flexShrink: 0,
          border: isDone ? 'none' : `1.5px solid var(--mantine-color-gray-4)`,
          backgroundColor: isDone
            ? 'var(--mantine-color-green-5)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDone && <Check size={8} color="white" weight="bold" />}
      </UnstyledButton>

      <Text
        size="xs"
        td={isDone ? 'line-through' : undefined}
        c={isDone ? 'dimmed' : isCurrent ? 'teal' : 'var(--mantine-color-text)'}
        style={{ flex: 1 }}
      >
        {subtask.title}
      </Text>

      {!isDone && subtask.due_date && !isToday(parseISO(subtask.due_date)) && (
        <Text size="xs" c="dimmed">
          {format(parseISO(subtask.due_date), DATE_FORMAT.SHORT)}
        </Text>
      )}
      {!isDone && subtask.is_must && (
        <Badge variant="urgent">{STRINGS.MUST}</Badge>
      )}
    </Group>
  )
}
