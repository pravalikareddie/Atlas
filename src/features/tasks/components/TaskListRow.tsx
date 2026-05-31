import { STRINGS } from '../constants/strings'
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns'
import {
  Group,
  Text,
  UnstyledButton,
  Menu,
  ActionIcon,
  CheckIcon,
  Box,
  Paper,
  Badge,
} from '@mantine/core'
import { Task } from '../types/task.types'
import { TypeBadge } from './TypeBadge'
import {
  DotsThree,
  ListChecks,
  PencilIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import {
  CADENCE,
  DATE_FORMAT,
  PRIORITY,
  PRIORITY_LABEL,
  TYPE_COLOR,
  SPRINT_TASK_STATUS,
  SPRINT_TASK_STATUS_LABEL,
  SPRINT_TASK_STATUS_COLOR,
} from '../constants/taskConstants'
import { RADIUS_PILL } from '../../../shared/constants/styles'

interface Props {
  task: Task
  selected: boolean
  onToggleSelect: () => void
  onDone: () => void
  onTap: () => void
  onDelete: () => void
  onToggleToday?: () => void
}
export function TaskListRow({
  task,
  selected,
  onToggleSelect,
  onDone,
  onTap,
  onDelete,
  onToggleToday,
}: Props) {
  const isOverdue =
    task.due_date != null &&
    isBefore(parseISO(task.due_date), startOfDay(new Date()))
  const accentColor = TYPE_COLOR[task.type] ?? 'teal'

  return (
    <Paper
      p="md"
      radius="xl"
      withBorder
      bg={selected ? `${accentColor}.9` : undefined}
      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
      onClick={onTap}
    >
      <Group gap="sm" wrap="nowrap">
        <Box
          w={4}
          style={{
            alignSelf: 'stretch',
            borderRadius: RADIUS_PILL,
            backgroundColor: `var(--mantine-color-${accentColor}-5)`,
            flexShrink: 0,
            minHeight: 20,
          }}
        />

        <UnstyledButton
          onClick={(e) => {
            e.stopPropagation()
            onDone()
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            onToggleSelect()
          }}
          w={22}
          h={22}
          style={{
            borderRadius: '50%',
            flexShrink: 0,
            border: selected
              ? 'none'
              : `2px solid var(--mantine-color-${accentColor}-4)`,
            backgroundColor: selected
              ? `var(--mantine-color-${accentColor}-5)`
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {selected && <CheckIcon size={12} color="white" />}
        </UnstyledButton>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate c="var(--mantine-color-text)">
            {task.title}
          </Text>
          {task.notes && (
            <Text size="xs" c="dimmed" truncate>
              {task.notes}
            </Text>
          )}
        </Box>

        <Group gap="xs" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
          <TypeBadge type={task.type} />

          {task.sprint_id && task.sprint_status !== SPRINT_TASK_STATUS.NOT_STARTED && task.sprint_status !== SPRINT_TASK_STATUS.DONE && (
            <Badge size="xs" variant="light" color={SPRINT_TASK_STATUS_COLOR[task.sprint_status ?? ''] ?? 'gray'}>
              {SPRINT_TASK_STATUS_LABEL[task.sprint_status ?? ''] ?? task.sprint_status}
            </Badge>
          )}

          {task.cadence && task.cadence !== CADENCE.NONE && (
            <Text size="xs" title={STRINGS.RECURRING}>
              🔄
            </Text>
          )}

          {task.due_date && (
            <Badge
              variant={isOverdue ? 'filled' : 'light'}
              color={
                isOverdue
                  ? 'red'
                  : isToday(parseISO(task.due_date))
                    ? 'teal'
                    : 'gray'
              }
              size="xs"
            >
              {isToday(parseISO(task.due_date))
                ? STRINGS.TODAY
                : isOverdue
                  ? STRINGS.OVERDUE
                  : format(parseISO(task.due_date), DATE_FORMAT.SHORT)}
            </Badge>
          )}

          {task.is_must && <Badge variant="urgent">{STRINGS.MUST}</Badge>}

          {task.priority && !task.is_must && (
            <Badge
              variant="dot"
              color={
                task.priority === PRIORITY.HIGH
                  ? 'red'
                  : task.priority === PRIORITY.MEDIUM
                    ? 'orange'
                    : 'gray'
              }
              size="xs"
            >
              {PRIORITY_LABEL[task.priority]}
            </Badge>
          )}

          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsThree size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<PencilIcon size={14} />} onClick={onTap}>
                {STRINGS.EDIT}
              </Menu.Item>
              <Menu.Item leftSection={<CheckIcon size={14} />} onClick={onDone}>
                {STRINGS.MARK_DONE}
              </Menu.Item>
              {onToggleToday && (
                <Menu.Item onClick={onToggleToday}>
                  {task.do_today ? `☀️ ${STRINGS.REMOVE_FROM_TODAY}` : `☀️ ${STRINGS.ADD_TO_TODAY}`}
                </Menu.Item>
              )}
              <Menu.Item
                leftSection={<ListChecks size={14} />}
                onClick={onToggleSelect}
              >
                {STRINGS.SELECT}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<TrashIcon size={14} />}
                color="red"
                onClick={onDelete}
              >
                {STRINGS.DELETE}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  )
}
