import {
  Group,
  Text,
  Box,
  Badge,
  ActionIcon,
  Stack,
  Collapse,
  Tooltip,
} from '@mantine/core'
import { Task, Sprint } from '../types/task.types'
import { TASK_STATUS, TYPE_COLOR } from '../constants/taskConstants'
import { STRINGS } from '../constants/strings'
import {
  Lock,
  LockOpen,
  Timer,
  ArrowCounterClockwise,
  CaretDown,
  CaretRight,
  ChatCircle,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { COLORS, RADIUS_PILL } from '../../../shared/constants/styles'
import { TaskCheckbox } from '../../../shared/components/TaskCheckbox'

interface Props {
  task: Task
  sprint?: Sprint
  subtasks?: Task[]
  onDone: () => void
  onUndo: () => void
  onTap: () => void
  onFocus: () => void
  onReset: () => void
  onChat?: () => void
  onToggleBlock: () => void
  onSubtaskDone?: (st: Task) => void
  onSubtaskUndo?: (st: Task) => void
}

export function SprintTaskRow({
  task,
  sprint,
  subtasks = [],
  onDone,
  onUndo,
  onTap,
  onFocus,
  onReset,
  onChat,
  onToggleBlock,
  onSubtaskDone,
  onSubtaskUndo,
}: Props) {
  const [open, setOpen] = useState(false)
  const isDone = task.status === TASK_STATUS.DONE
  const hasSubs = subtasks.length > 0
  const doneCount = subtasks.filter((s) => s.status === TASK_STATUS.DONE).length

  return (
    <Stack gap={0}>
      <Box
        p="md"
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          background: 'var(--mantine-color-dark-6)',
          border: task.blocked
            ? `1px solid ${COLORS.WARNING_30}`
            : `1px solid ${COLORS.WHITE_07}`,
          opacity: isDone ? 0.5 : task.blocked ? 0.6 : 1,
          boxShadow: 'var(--mantine-shadow-sm)',
          transition: 'all 0.2s ease',
        }}
      >
        <Group gap="m" wrap="nowrap">
          {/* Color bar */}
          <Box
            w={4}
            style={{
              alignSelf: 'stretch',
              borderRadius: RADIUS_PILL,
              backgroundColor: isDone
                ? 'var(--mantine-color-green-5)'
                : task.blocked
                  ? 'var(--mantine-color-yellow-5)'
                  : `var(--mantine-color-${TYPE_COLOR[task.type] ?? 'teal'}-5)`,
              flexShrink: 0,
              minHeight: 24,
            }}
          />

          {/* Checkbox */}
          <TaskCheckbox
            done={isDone}
            onToggle={() => (isDone ? onUndo() : onDone())}
            size={22}
            color={TYPE_COLOR[task.type] ?? 'teal'}
          />

          {/* Title + badges */}
          <Box
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={onTap}
          >
            <Group gap="xs" wrap="nowrap">
              <Text
                size="sm"
                fw={600}
                truncate
                td={isDone ? 'line-through' : undefined}
              >
                {task.title}
              </Text>
            </Group>
            <Group gap={6} mt={4}>
              {sprint && (
                <Badge size="xs" variant="light" color="blue">
                  {sprint.name}
                </Badge>
              )}
              {task.priority && (
                <Badge
                  size="xs"
                  variant="light"
                  color={
                    task.priority === 'high'
                      ? 'red'
                      : task.priority === 'medium'
                        ? 'orange'
                        : 'gray'
                  }
                >
                  {task.priority}
                </Badge>
              )}
              {task.is_must && (
                <Badge size="xs" variant="light" color="red">
                  MUST
                </Badge>
              )}
              {task.blocked && (
                <Badge size="xs" variant="light" color="yellow">
                  ⏳ {task.blocked_note || 'Blocked'}
                </Badge>
              )}
              {hasSubs && (
                <Text
                  size="xs"
                  c="dimmed"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpen((o) => !o)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {doneCount}/{subtasks.length}{' '}
                  {open ? (
                    <CaretDown size={10} style={{ verticalAlign: 'middle' }} />
                  ) : (
                    <CaretRight size={10} style={{ verticalAlign: 'middle' }} />
                  )}
                </Text>
              )}
            </Group>
          </Box>

          {/* Action buttons */}
          {!isDone && (
            <Group gap={4} wrap="nowrap">
              <Tooltip
                label={task.blocked ? 'Unblock' : 'Mark as blocked'}
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBlock()
                  }}
                >
                  {task.blocked ? <LockOpen size={14} /> : <Lock size={14} />}
                </ActionIcon>
              </Tooltip>
              <Tooltip label={STRINGS.FOCUS_MODE} withArrow>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  color="teal"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFocus()
                  }}
                >
                  <Timer size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={STRINGS.RESET_MODE_LABEL} withArrow>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  color="violet"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReset()
                  }}
                >
                  <ArrowCounterClockwise size={14} />
                </ActionIcon>
              </Tooltip>
              {onChat && (
                <Tooltip label={STRINGS.CHAT_ABOUT} withArrow>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="blue"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChat()
                    }}
                  >
                    <ChatCircle size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Group>
      </Box>

      {/* Subtasks */}
      <Collapse in={open}>
        <Stack gap={0} pl={20} pt={4}>
          {subtasks.map((st) => {
            const stDone = st.status === TASK_STATUS.DONE
            return (
              <Group
                key={st.id}
                gap="sm"
                wrap="nowrap"
                py={7}
                px={8}
                style={{
                  borderLeft: `2px solid ${COLORS.WHITE_10}`,
                  marginLeft: 8,
                  opacity: stDone ? 0.45 : 1,
                }}
              >
                <TaskCheckbox
                  done={stDone}
                  onToggle={() =>
                    stDone ? onSubtaskUndo?.(st) : onSubtaskDone?.(st)
                  }
                  size={14}
                  color="gray"
                />
                <Text
                  size="xs"
                  td={stDone ? 'line-through' : undefined}
                  style={{ flex: 1 }}
                >
                  {st.title}
                </Text>
              </Group>
            )
          })}
        </Stack>
      </Collapse>
    </Stack>
  )
}
