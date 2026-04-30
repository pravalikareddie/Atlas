import { STRINGS } from '../constants/strings'
import { useState, useMemo } from 'react'
import {
  format,
  parseISO,
  isToday,
  isBefore,
  startOfDay,
  endOfWeek,
} from 'date-fns'
import {
  Stack,
  Group,
  Text,
  TextInput,
  SegmentedControl,
  Select,
  Paper,
  Box,
  Collapse,
  ActionIcon,
  CheckIcon,
  UnstyledButton,
  List,
} from '@mantine/core'
import { useTaskData } from '../hooks/useTaskData'
import { useTaskActions } from '../hooks/useTaskActions'
import { useTaskStore } from '../store/taskStore'
import { Task, TaskType } from '../types/task.types'
import {
  TYPE_LABEL,
  FILTER_TYPES,
  TASK_STATUS,
  PRIORITY_LABEL,
  DATE_FORMAT,
  TASK_TYPE,
  PRIORITY,
} from '../constants/taskConstants'
import { sortTasks } from '../utils/taskUtils'
import { Button } from '@mantine/core'
import { TaskListRow } from './TaskListRow'
import { CalendarView } from './CalendarView'
import { QuickAddModal } from './QuickAddModal'
import { TaskDetailSheet } from './TaskDetailSheet'
import {
  CalendarPlusIcon,
  CaretDownIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  Plus,
  TrashIcon,
  X,
} from '@phosphor-icons/react'
import { Badge } from '@mantine/core'
type GroupBy = 'due_date' | 'type' | 'priority'

const GROUP_BY_OPTIONS = [
  { value: 'due_date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'priority', label: 'Priority' },
] as const

const PRIORITY_FILTER_OPTIONS = [
  { value: 'must', label: PRIORITY_LABEL.must ?? 'Must' },
  { value: 'high', label: PRIORITY_LABEL.high },
  { value: 'medium', label: PRIORITY_LABEL.medium },
  { value: 'low', label: PRIORITY_LABEL.low },
]

const GROUP_COLORS: Record<string, string> = {
  OVERDUE: 'red',
  TODAY: 'teal',
  'THIS WEEK': 'blue',
  LATER: 'gray',
  'NO DATE': 'gray',
  MUST: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'gray',
  'NO PRIORITY': 'gray',
}

export function TasksScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { markDone, remove, bulkDone, bulkRemove, update } = useTaskActions()

  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [groupBy, setGroupBy] = useState<GroupBy>('due_date')
  const [typeFilter, setTypeFilter] = useState<TaskType | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean
    defaultDate?: string
  }>({ open: false })
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDone, setShowDone] = useState(false)

  const topLevel = useMemo(
    () => tasks.filter((t) => !t.parent_task_id),
    [tasks],
  )

  const filtered = useMemo(() => {
    let list = topLevel
    if (typeFilter) list = list.filter((t) => t.type === typeFilter)
    if (priorityFilter === 'must') list = list.filter((t) => t.is_must)
    else if (priorityFilter)
      list = list.filter((t) => t.priority === priorityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.title.toLowerCase().includes(q))
    }
    return list
  }, [topLevel, typeFilter, priorityFilter, search])

  const todoTasks = useMemo(
    () => filtered.filter((t) => t.status === TASK_STATUS.TODO),
    [filtered],
  )
  const doneTasks = useMemo(
    () => filtered.filter((t) => t.status === TASK_STATUS.DONE),
    [filtered],
  )

  const overdueCount = useMemo(
    () =>
      todoTasks.filter(
        (t) =>
          t.due_date && isBefore(parseISO(t.due_date), startOfDay(new Date())),
      ).length,
    [todoTasks],
  )

  const todayCount = useMemo(
    () =>
      todoTasks.filter((t) => t.due_date && isToday(parseISO(t.due_date)))
        .length,
    [todoTasks],
  )

  const groups = useMemo(
    () => groupTasks(todoTasks, groupBy),
    [todoTasks, groupBy],
  )

  const hasFilters = !!(typeFilter || priorityFilter || search)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function clearFilters() {
    setTypeFilter(null)
    setPriorityFilter(null)
    setSearch('')
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text
              size="xs"
              fw={600}
              c="white"
              tt="uppercase"
              opacity={0.8}
              mb={4}
            >
              {STRINGS.TASKS}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 24 }}>
              {STRINGS.ALL_TASKS}
            </Text>
          </Box>

          <Group gap="xs">
            <ActionIcon
              variant={showSearch ? 'filled' : 'white'}
              color="teal"
              radius="xl"
              onClick={() => {
                setShowSearch((o) => !o)
                if (showSearch) setSearch('')
              }}
            >
              <MagnifyingGlassIcon size={16} />
            </ActionIcon>
            <ActionIcon
              variant={view === 'calendar' ? 'filled' : 'white'}
              color="teal"
              radius="xl"
              onClick={() =>
                setView((v) => (v === 'list' ? 'calendar' : 'list'))
              }
            >
              <CalendarPlusIcon size={16} />
            </ActionIcon>
            <Button
              variant="white"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() => setQuickAdd({ open: true })}
            >
              {STRINGS.ADD_TASK}
            </Button>
          </Group>
        </Group>

        {/* Stats row */}
        <Group gap="lg" mt="md">
          <StatChip
            label={STRINGS.TOTAL}
            value={topLevel.length}
            color="white"
          />
          {overdueCount > 0 && (
            <StatChip
              label={STRINGS.OVERDUE}
              value={overdueCount}
              color="red"
            />
          )}
          {todayCount > 0 && (
            <StatChip
              label={STRINGS.DUE_TODAY}
              value={todayCount}
              color="yellow"
            />
          )}
          <StatChip
            label={STRINGS.DONE}
            value={doneTasks.length}
            color="white"
          />
        </Group>

        {/* Search */}
        <Collapse in={showSearch}>
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={STRINGS.SEARCH_TASKS}
            mt="md"
            radius="xl"
            leftSection={<MagnifyingGlassIcon size={14} />}
            autoFocus={showSearch}
          />
        </Collapse>
      </Box>

      {/* Filters + Group by */}
      <Paper p="md" radius="xl" withBorder bg="var(--mantine-color-body)">
        {' '}
        <Group gap="sm" wrap="wrap">
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TaskType | null)}
            clearable
            placeholder={STRINGS.ALL_TYPES}
            data={FILTER_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
            radius="lg"
            size="sm"
            w={150}
          />
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            clearable
            placeholder={STRINGS.ALL_PRIORITIES}
            data={PRIORITY_FILTER_OPTIONS}
            radius="lg"
            size="sm"
            w={140}
          />
          {view === 'list' && (
            <Select
              value={groupBy}
              onChange={(v) => setGroupBy((v ?? 'due_date') as GroupBy)}
              data={GROUP_BY_OPTIONS}
              radius="lg"
              size="sm"
              w={140}
              leftSection={<List size={'lg'} />}
            />
          )}
          {hasFilters && (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              radius="xl"
              onClick={clearFilters}
            >
              {STRINGS.CLEAR_FILTERS}
            </Button>
          )}
        </Group>
      </Paper>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <Paper
          p="md"
          radius="xl"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-teal-1), var(--mantine-color-blue-1))',
            border: '1px solid var(--mantine-color-teal-3)',
          }}
        >
          <Group gap="sm">
            <Text size="sm" fw={600}>
              {selectedIds.size} {STRINGS.SELECTED}
            </Text>
            <Button
              variant="light"
              color="teal"
              size="xs"
              radius="xl"
              leftSection={<CheckIcon size={12} />}
              onClick={() => {
                bulkDone(Array.from(selectedIds))
                setSelectedIds(new Set())
              }}
            >
              {STRINGS.MARK_DONE}
            </Button>
            <Button
              variant="light"
              color="red"
              size="xs"
              radius="xl"
              leftSection={<TrashIcon size={12} />}
              onClick={() => {
                bulkRemove(Array.from(selectedIds))
                setSelectedIds(new Set())
              }}
            >
              {STRINGS.DELETE}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              ml="auto"
              onClick={() => setSelectedIds(new Set())}
            >
              {STRINGS.CANCEL}
            </Button>
          </Group>
        </Paper>
      )}

      {/* List view */}
      {view === 'list' ? (
        <Stack gap="lg">
          {groups.length === 0 && (
            <Paper
              p="xl"
              radius="xl"
              bg="var(--mantine-color-body)"
              withBorder
              ta="center"
            >
              <Text c="dimmed" size="sm">
                {STRINGS.NO_TASKS_FOUND}
              </Text>
            </Paper>
          )}

          {groups.map((g) => (
            <Stack key={g.label} gap="sm">
              <Group gap="xs" px={4}>
                <Box
                  w={8}
                  h={8}
                  style={{
                    borderRadius: '50%',
                    backgroundColor: `var(--mantine-color-${GROUP_COLORS[g.label] ?? 'gray'}-5)`,
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {g.label}
                </Text>
                <Badge variant="neutral">{g.tasks.length}</Badge>
              </Group>

              {g.tasks.map((t) => (
                <TaskListRow
                  key={t.id}
                  task={t}
                  selected={selectedIds.has(t.id)}
                  onToggleSelect={() => toggleSelect(t.id)}
                  onDone={() => markDone(t)}
                  onTap={() => setDetailTask(t)}
                  onDelete={() => remove(t.id)}
                />
              ))}
            </Stack>
          ))}

          {/* Done section */}
          {doneTasks.length > 0 && (
            <Stack gap="sm">
              <UnstyledButton onClick={() => setShowDone((o) => !o)}>
                <Group gap="xs" px={4}>
                  <Box
                    w={8}
                    h={8}
                    style={{
                      borderRadius: '50%',
                      backgroundColor: 'var(--mantine-color-green-5)',
                    }}
                  />
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {STRINGS.DONE}
                  </Text>
                  <Badge variant="done">{doneTasks.length}</Badge>
                  {showDone ? (
                    <CaretDownIcon
                      size={12}
                      color="var(--mantine-color-dimmed)"
                    />
                  ) : (
                    <CaretRightIcon
                      size={12}
                      color="var(--mantine-color-dimmed)"
                    />
                  )}
                </Group>
              </UnstyledButton>
              {doneTasks.map((t) => (
                <Group
                  key={t.id}
                  gap="sm"
                  py={10}
                  px={12}
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    background: 'white',
                    border: '1px solid var(--mantine-color-gray-2)',
                    opacity: 0.6,
                  }}
                >
                  <UnstyledButton
                    onClick={() =>
                      update(t.id, {
                        status: TASK_STATUS.TODO,
                        completed_at: null,
                      })
                    }
                    w={18}
                    h={18}
                    title={STRINGS.MARK_TODO}
                    style={{
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: 'var(--mantine-color-green-5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={10} color="white" />
                  </UnstyledButton>

                  <Text
                    size="sm"
                    td="line-through"
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => setDetailTask(t)}
                  >
                    {t.title}
                  </Text>

                  {t.completed_at && (
                    <Text size="xs" c="dimmed">
                      {format(parseISO(t.completed_at), DATE_FORMAT.SHORT)}
                    </Text>
                  )}

                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={() => setDetailTask(t)}
                    aria-label={STRINGS.EDIT}
                  >
                    <PencilIcon size={12} />
                  </ActionIcon>

                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => remove(t.id)}
                    aria-label={STRINGS.DELETE}
                  >
                    <PencilIcon size={12} />
                  </ActionIcon>
                </Group>
              ))}

              <Collapse in={showDone}>
                <Stack gap="xs">
                  {doneTasks.map((t) => (
                    <Group
                      key={t.id}
                      gap="sm"
                      py={10}
                      px={12}
                      opacity={0.5}
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        background: 'white',
                        border: '1px solid var(--mantine-color-gray-2)',
                      }}
                    >
                      <Box
                        w={18}
                        h={18}
                        style={{
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-green-5)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckIcon size={10} color="white" />
                      </Box>
                      <Text size="sm" td="line-through" style={{ flex: 1 }}>
                        {t.title}
                      </Text>
                      {t.completed_at && (
                        <Text size="xs" c="dimmed">
                          {format(parseISO(t.completed_at), DATE_FORMAT.SHORT)}
                        </Text>
                      )}
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => remove(t.id)}
                        aria-label={STRINGS.DELETE}
                      >
                        <X size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Collapse>
            </Stack>
          )}
        </Stack>
      ) : (
        <CalendarView
          tasks={topLevel}
          onDone={markDone}
          onTap={setDetailTask}
          onAddForDay={(date) => setQuickAdd({ open: true, defaultDate: date })}
        />
      )}

      <QuickAddModal
        open={quickAdd.open}
        defaultType={TASK_TYPE.PERSONAL}
        defaultDate={quickAdd.defaultDate}
        onClose={() => setQuickAdd({ open: false })}
      />
      {detailTask && (
        <TaskDetailSheet
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </Stack>
  )
}

// Small stat chip for header
function StatChip({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <Box
      px="sm"
      py={4}
      style={{
        borderRadius: 'var(--mantine-radius-xl)',
        background: 'rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
      }}
    >
      <Text size="xs" c="white" fw={600}>
        {value}{' '}
        <Text span opacity={0.75}>
          {label}
        </Text>
      </Text>
    </Box>
  )
}

function groupTasks(
  tasks: Task[],
  groupBy: GroupBy,
): { label: string; tasks: Task[] }[] {
  if (groupBy === 'due_date') {
    const now = startOfDay(new Date())
    const weekEnd = endOfWeek(new Date())
    const buckets: Record<string, Task[]> = {
      OVERDUE: [],
      TODAY: [],
      'THIS WEEK': [],
      LATER: [],
      'NO DATE': [],
    }
    tasks.forEach((t) => {
      if (!t.due_date && !t.do_today) {
        buckets['NO DATE'].push(t)
        return
      }
      if (t.do_today || (t.due_date && isToday(parseISO(t.due_date)))) {
        buckets.TODAY.push(t)
        return
      }
      if (t.due_date && isBefore(parseISO(t.due_date), now)) {
        buckets.OVERDUE.push(t)
        return
      }
      if (t.due_date && isBefore(parseISO(t.due_date), weekEnd)) {
        buckets['THIS WEEK'].push(t)
        return
      }
      buckets.LATER.push(t)
    })
    return Object.entries(buckets)
      .filter(([, l]) => l.length > 0)
      .map(([label, list]) => ({ label, tasks: sortTasks(list) }))
  }

  if (groupBy === 'type') {
    const byType = new Map<string, Task[]>()
    tasks.forEach((t) => {
      const arr = byType.get(t.type) ?? []
      arr.push(t)
      byType.set(t.type, arr)
    })
    return Array.from(byType.entries()).map(([type, list]) => ({
      label: (TYPE_LABEL[type as TaskType] ?? type).toUpperCase(),
      tasks: sortTasks(list),
    }))
  }

  const buckets: Record<string, Task[]> = {
    MUST: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
    'NO PRIORITY': [],
  }
  tasks.forEach((t) => {
    if (t.is_must) buckets.MUST.push(t)
    else if (t.priority === PRIORITY.HIGH) buckets.HIGH.push(t)
    else if (t.priority === PRIORITY.MEDIUM) buckets.MEDIUM.push(t)
    else if (t.priority === PRIORITY.LOW) buckets.LOW.push(t)
    else buckets['NO PRIORITY'].push(t)
  })
  return Object.entries(buckets)
    .filter(([, l]) => l.length > 0)
    .map(([label, list]) => ({ label, tasks: sortTasks(list) }))
}
