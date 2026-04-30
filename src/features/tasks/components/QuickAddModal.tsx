import { STRINGS } from '../constants/strings'
import { useState, useMemo, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  Select,
  Switch,
  Divider,
  Box,
  Badge,
  Paper,
  ActionIcon,
  UnstyledButton,
  Collapse,
  Modal,
} from '@mantine/core'
import { Button } from '@mantine/core'
import { Task, TaskType, CadenceType, TaskPriority } from '../types/task.types'
import {
  ADD_MODAL_TYPES,
  TYPE_LABEL,
  CADENCE_OPTIONS,
  PRIORITY_OPTIONS,
  USER_ID,
  PRIORITY,
  CADENCE,
  DATE_FORMAT,
  GOAL_STATUS,
  PROJECT_STATUS,
  TASK_STATUS,
  TASK_TYPE,
  LINK_KIND_LABEL,
  CADENCE_LABEL,
  PRIORITY_LABEL,
  TYPE_COLOR,
} from '../constants/taskConstants'
import { useTaskActions } from '../hooks/useTaskActions'
import { usePlanStore } from '../../plan/store/planStore'
import {
  CaretDownIcon,
  MagnifyingGlass,
  CaretUpIcon,
  X,
} from '@phosphor-icons/react'

const DEFAULT_PRIORITY = PRIORITY.HIGH
const DEFAULT_CADENCE = CADENCE.NONE
const DEFAULT_DATE = () => format(new Date(), DATE_FORMAT.API)

function getInitialState(defaultType: TaskType, defaultDate?: string) {
  return {
    title: '',
    type: defaultType,
    dueDate: defaultDate ?? DEFAULT_DATE(),
    priority: PRIORITY.HIGH as TaskPriority | null,
    eventTime: '',
    eventDuration: '',
    cadence: CADENCE.NONE as CadenceType,
    cadenceDays: [] as number[],
    isMust: false,
    notes: '',
    linkQuery: '',
    goalId: null as string | null,
    projectId: null as string | null,
    milestoneId: null as string | null,
  }
}

interface LinkResult {
  id: string
  label: string
  kind: 'goal' | 'project' | 'milestone'
}

interface QuickAddProps {
  open: boolean
  defaultType: TaskType
  defaultDate?: string
  allowedTypes?: TaskType[]
  onClose: () => void
}

export function QuickAddModal({
  open,
  defaultType,
  defaultDate,
  allowedTypes,
  onClose,
}: QuickAddProps) {
  const { create } = useTaskActions()
  const goals = usePlanStore((s) => s.goals)
  const projects = usePlanStore((s) => s.projects)
  const milestones = usePlanStore((s) => s.milestones)

  const [state, setState] = useState(() =>
    getInitialState(defaultType, defaultDate),
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = <K extends keyof typeof state>(
    key: K,
    value: (typeof state)[K],
  ) => setState((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    if (open) {
      setState(getInitialState(defaultType, defaultDate))
      setShowAdvanced(false)
    }
  }, [open, defaultType, defaultDate])

  const linkResults = useMemo<LinkResult[]>(() => {
    if (!state.linkQuery.trim()) return []
    const q = state.linkQuery.toLowerCase()
    const results: LinkResult[] = []
    goals
      .filter(
        (g) =>
          g.status === GOAL_STATUS.ACTIVE && g.title.toLowerCase().includes(q),
      )
      .forEach((g) => results.push({ id: g.id, label: g.title, kind: 'goal' }))
    projects
      .filter(
        (p) =>
          p.status === PROJECT_STATUS.ACTIVE &&
          p.title.toLowerCase().includes(q),
      )
      .forEach((p) =>
        results.push({ id: p.id, label: p.title, kind: 'project' }),
      )
    milestones
      .filter(
        (m) =>
          m.status === TASK_STATUS.TODO && m.title.toLowerCase().includes(q),
      )
      .forEach((m) =>
        results.push({ id: m.id, label: m.title, kind: 'milestone' }),
      )
    return results.slice(0, 8)
  }, [state.linkQuery, goals, projects, milestones])

  const hasLink = !!(state.goalId || state.projectId || state.milestoneId)
  const isEvent = state.type === TASK_TYPE.EVENT
  const accentColor = TYPE_COLOR[state.type] ?? 'teal'

  function reset() {
    setState(getInitialState(defaultType, defaultDate))
  }
  function handleClose() {
    reset()
    onClose()
  }

  async function submit() {
    if (!state.title.trim()) return
    await create({
      user_id: USER_ID,
      title: state.title.trim(),
      notes: state.notes || null,
      type: state.type,
      priority: state.priority,
      is_must: state.isMust,
      status: TASK_STATUS.TODO,
      due_date: state.dueDate || null,
      do_today: state.dueDate === DEFAULT_DATE(),
      completed_at: null,
      goal_id: state.goalId,
      milestone_id: state.milestoneId,
      project_id: state.projectId,
      roadmap_item_id: null,
      calendar_event_id: null,
      parent_task_id: null,
      ticket_id: null,
      order_index: 0,
      event_time: isEvent && state.eventTime ? state.eventTime : null,
      event_duration:
        isEvent && state.eventDuration ? parseInt(state.eventDuration) : null,
      cadence: state.cadence !== CADENCE.NONE ? state.cadence : null,
      cadence_days: state.cadence === CADENCE.WEEKLY ? state.cadenceDays : null,
      cadence_date: null,
      cadence_interval: null,
      push_count: 0,
      is_learning: false,
    })
    reset()
    onClose()
  }

  function selectLink(item: LinkResult) {
    if (item.kind === 'goal') set('goalId', item.id)
    else if (item.kind === 'project') set('projectId', item.id)
    else set('milestoneId', item.id)
    set('linkQuery', item.label)
  }

  function clearLink() {
    setState((prev) => ({
      ...prev,
      goalId: null,
      projectId: null,
      milestoneId: null,
      linkQuery: '',
    }))
  }

  return (
    <Modal
      opened={open}
      onClose={handleClose}
      title={null}
      radius="xl"
      size="md"
      padding={0}
      styles={{
        content: {
          background: 'white',
          overflow: 'hidden',
          borderRadius: 'var(--mantine-radius-xl)',
        },
        header: { display: 'none' },
      }}
    >
      {/* Gradient header */}
      <Box
        p="xl"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${accentColor}-6), var(--mantine-color-${accentColor}-4))`,
        }}
      >
        <Group justify="space-between" mb="md">
          <Text fw={700} c="white" size="lg">
            {STRINGS.ADD_TASK}
          </Text>
          <ActionIcon
            variant="white"
            color={accentColor}
            radius="xl"
            size="sm"
            onClick={handleClose}
          >
            <X size={14} />
          </ActionIcon>
        </Group>

        <TextInput
          value={state.title}
          onChange={(e) => set('title', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit()
            if (e.key === 'Escape') handleClose()
          }}
          placeholder={STRINGS.WHAT_NEEDS_DONE}
          autoFocus
          variant="unstyled"
          styles={{
            input: {
              color: 'white',
              fontWeight: 600,
              fontSize: 16,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--mantine-radius-lg)',
              padding: '10px 14px',
              '::placeholder': { color: 'rgba(255,255,255,0.6)' },
            },
          }}
        />

        {/* Quick toggles */}
        <Group gap="xs" mt="sm">
          <Badge
            variant={state.isMust ? 'filled' : 'outline'}
            color="white"
            style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={() => set('isMust', !state.isMust)}
          >
            {state.isMust ? '⚡ Must' : '+ Must'}
          </Badge>
          <Badge
            variant={state.dueDate === DEFAULT_DATE() ? 'filled' : 'outline'}
            style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            📅{' '}
            {state.dueDate
              ? format(parseISO(state.dueDate), DATE_FORMAT.SHORT)
              : STRINGS.NO_DATE}
          </Badge>
          {state.priority && (
            <Badge
              variant="outline"
              color="white"
              style={{ borderColor: 'rgba(255,255,255,0.5)' }}
            >
              {PRIORITY_LABEL[state.priority]}
            </Badge>
          )}
        </Group>
      </Box>

      {/* Body */}
      <Stack gap="md" p="xl">
        <Group grow>
          <Select
            label={STRINGS.TYPE}
            value={state.type}
            onChange={(v) => v && set('type', v as TaskType)}
            data={(allowedTypes ?? ADD_MODAL_TYPES).map((t) => ({
              value: t,
              label: TYPE_LABEL[t],
            }))}
            radius="lg"
          />
          <Select
            label={STRINGS.PRIORITY}
            value={state.priority}
            onChange={(v) => set('priority', v as TaskPriority | null)}
            clearable
            data={PRIORITY_OPTIONS.map((p) => ({
              value: p,
              label: PRIORITY_LABEL[p],
            }))}
            radius="lg"
          />
        </Group>

        <Group grow>
          <TextInput
            label={STRINGS.DUE_DATE}
            type="date"
            value={state.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
            radius="lg"
          />
          <Select
            label={STRINGS.CADENCE}
            value={state.cadence}
            onChange={(v) => set('cadence', (v ?? CADENCE.NONE) as CadenceType)}
            data={CADENCE_OPTIONS.map((c) => ({
              value: c,
              label: CADENCE_LABEL[c],
            }))}
            radius="lg"
          />
        </Group>

        {isEvent && (
          <Group grow>
            <TextInput
              label={STRINGS.EVENT_TIME}
              type="time"
              value={state.eventTime}
              onChange={(e) => set('eventTime', e.target.value)}
              radius="lg"
            />
            <TextInput
              label={STRINGS.EVENT_DURATION}
              type="number"
              value={state.eventDuration}
              onChange={(e) => set('eventDuration', e.target.value)}
              placeholder="60"
              radius="lg"
            />
          </Group>
        )}

        <Switch
          label={STRINGS.MUST_TODAY}
          checked={state.isMust}
          onChange={(e) => set('isMust', e.currentTarget.checked)}
          color={accentColor}
        />

        {/* Advanced toggle */}
        <UnstyledButton onClick={() => setShowAdvanced((o) => !o)}>
          <Group gap="xs">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              {showAdvanced ? STRINGS.LESS_OPTIONS : STRINGS.MORE_OPTIONS}
            </Text>
            {showAdvanced ? (
              <CaretUpIcon size={12} />
            ) : (
              <CaretDownIcon size={12} />
            )}
          </Group>
        </UnstyledButton>

        <Collapse in={showAdvanced}>
          <Stack gap="md">
            <Textarea
              label={STRINGS.NOTES}
              value={state.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              radius="lg"
              placeholder={STRINGS.NOTES_PLACEHOLDER}
            />

            {/* Link to goal/project/milestone */}
            <Box>
              <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
                {STRINGS.LINK_TO}
              </Text>
              {hasLink ? (
                <Group gap="xs">
                  <Badge variant="light" color={accentColor}>
                    {state.linkQuery}
                  </Badge>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={clearLink}
                    aria-label={STRINGS.CLEAR}
                  >
                    <X size={12} />
                  </ActionIcon>
                </Group>
              ) : (
                <Box style={{ position: 'relative' }}>
                  <TextInput
                    value={state.linkQuery}
                    onChange={(e) => set('linkQuery', e.target.value)}
                    placeholder={STRINGS.SEARCH_LINK}
                    radius="lg"
                    leftSection={<MagnifyingGlass size={14} />}
                  />
                  {linkResults.length > 0 && (
                    <Paper
                      withBorder
                      radius="lg"
                      shadow="md"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        zIndex: 200,
                        marginTop: 4,
                      }}
                    >
                      <Stack gap={0}>
                        {linkResults.map((r) => (
                          <Group
                            key={r.id}
                            gap="xs"
                            px="sm"
                            py="xs"
                            style={{
                              cursor: 'pointer',
                              borderRadius: 'var(--mantine-radius-lg)',
                            }}
                            onClick={() => selectLink(r)}
                          >
                            <Badge
                              variant="light"
                              size="xs"
                              color={
                                r.kind === 'goal'
                                  ? 'teal'
                                  : r.kind === 'project'
                                    ? 'blue'
                                    : 'amber'
                              }
                            >
                              {LINK_KIND_LABEL[r.kind]}
                            </Badge>
                            <Text size="sm">{r.label}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </Collapse>

        <Divider />

        <Group>
          <Button
            onClick={submit}
            disabled={!state.title.trim()}
            radius="xl"
            style={{ flex: 1 }}
            variant="gradient"
            gradient={{ from: accentColor, to: 'blue' }}
          >
            {STRINGS.ADD_TASK}
          </Button>
          <Button variant="default" onClick={handleClose} radius="xl">
            {STRINGS.CANCEL}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
