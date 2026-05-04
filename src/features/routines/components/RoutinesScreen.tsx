import { useNavigate } from 'react-router-dom'
import { useRoutineData } from '../hooks/useRoutineData'
import { useRoutineStore } from '../hooks/useRoutineStore'
import { useMemo, useState } from 'react'
import { Routine, RoutineCadence } from '../types/routine.types'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import * as svc from '../services/routineService'

import { STRINGS } from '../../tasks/constants/strings'
import {
  CADENCE_LABEL,
  ROUTINE_CADENCE,
  ROUTINE_GRADIENTS,
  ROUTINE_TYPE,
  ROUTINE_TYPE_EMOJI,
  ROUTINE_TYPE_LABEL,
} from '../constants'
import {
  DotsThree,
  MagnifyingGlass,
  PencilSimple,
  Play,
  Plus,
  Sun,
  Trash,
} from '@phosphor-icons/react'
import { DATE_FORMAT, USER_ID } from '../../tasks/constants/taskConstants'
import { format, parseISO } from 'date-fns'
import { ROUTES } from '../../../app/routes'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'

// ─── RoutinesScreen.tsx ───────────────────────────────────────────────────────
export type RoutineType =
  | 'habit'
  | 'learning'
  | 'finance'
  | 'nutrition'
  | 'home'
  | 'health'
  | 'maintenance'
  | 'travel'
  | 'other'
type FilterType = RoutineType | 'all'
type FilterCadence = RoutineCadence | 'all'

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: STRINGS.ALL },
  ...Object.entries(ROUTINE_TYPE_LABEL).map(([k, v]) => ({
    value: k as RoutineType,
    label: v as string,
  })),
]

const CADENCE_FILTER_OPTIONS = [
  { value: 'all', label: STRINGS.ALL },
  ...Object.entries(CADENCE_LABEL).map(([k, v]) => ({
    value: k as RoutineCadence,
    label: v as string,
  })),
]
export function RoutinesScreen() {
  useRoutineData()
  const store = useRoutineStore()
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [cadenceFilter, setCadenceFilter] = useState<FilterCadence>('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const { routines } = store

  const filtered = useMemo(() => {
    let list = routines.filter((r) => r.is_active)
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter)
    if (cadenceFilter !== 'all')
      list = list.filter((r) => r.cadence === cadenceFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => r.title.toLowerCase().includes(q))
    }
    return list
  }, [routines, typeFilter, cadenceFilter, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Routine[]>()
    filtered.forEach((r) => {
      const key = r.type ?? ROUTINE_TYPE.OTHER
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    })
    return Array.from(map.entries()).map(([type, items]) => ({
      type: type as RoutineType,
      label: ROUTINE_TYPE_LABEL[type] ?? type,
      items: items.sort((a, b) => a.order_index - b.order_index),
    }))
  }, [filtered])

  const doneToday = useMemo(() => {
    const today = format(new Date(), DATE_FORMAT.API)
    return routines.filter((r) => r.last_done === today).length
  }, [routines])

  const hasFilters = typeFilter !== 'all' || cadenceFilter !== 'all' || !!search

  function clearFilters() {
    setTypeFilter('all')
    setCadenceFilter('all')
    setSearch('')
  }

  return (
    <Stack gap="lg" p="md">
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
              {STRINGS.NAV_DAILY}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 24 }}>
              {STRINGS.ROUTINES}
            </Text>
            <Text size="sm" c="white" opacity={0.8} mt={4}>
              {routines.filter((r) => r.is_active).length} {STRINGS.TOTAL} ·{' '}
              {doneToday} {STRINGS.DONE_TODAY}
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
              <MagnifyingGlass size={16} />
            </ActionIcon>
            <Button
              variant="white"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() => setShowAdd(true)}
            >
              {STRINGS.NEW_ROUTINE}
            </Button>
          </Group>
        </Group>

        <Collapse in={showSearch}>
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={STRINGS.SEARCH_ROUTINES}
            mt="md"
            radius="xl"
            leftSection={<MagnifyingGlass size={14} />}
            autoFocus={showSearch}
          />
        </Collapse>
      </Box>

      {/* Filters */}
      <Paper p="md" radius="xl" withBorder shadow="sm">
        <Group gap="sm" wrap="wrap" align="center">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mr="xs">
            {STRINGS.FILTER}
          </Text>
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter((v ?? 'all') as FilterType)}
            data={TYPE_FILTER_OPTIONS}
            radius="lg"
            size="sm"
            w={150}
            placeholder={STRINGS.ALL_TYPES}
          />
          <Select
            value={cadenceFilter}
            onChange={(v) => setCadenceFilter((v ?? 'all') as FilterCadence)}
            data={CADENCE_FILTER_OPTIONS}
            radius="lg"
            size="sm"
            w={150}
            placeholder={STRINGS.ALL_CADENCES}
          />
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">
            🔄
          </Text>
          <Text fw={600} mb="xs">
            {hasFilters ? STRINGS.NO_ROUTINES_FOUND : STRINGS.ROUTINE_EMPTY}
          </Text>
          {!hasFilters && (
            <Button
              variant="light"
              color="teal"
              radius="xl"
              onClick={() => setShowAdd(true)}
            >
              {STRINGS.NEW_ROUTINE}
            </Button>
          )}
        </Paper>
      )}

      {/* Grouped routines */}
      {grouped.map((group) => (
        <Stack key={group.type} gap="md">
          <Group gap="xs" px={4}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {group.label}
            </Text>
            <Badge variant="light" color="teal" size="xs">
              {group.items.length}
            </Badge>
          </Group>

          <SortableList items={group.items} onReorder={(r) => persistOrder(r, (id, d) => store.updateRoutine(id, d), (id, d) => svc.updateRoutine(id, d))} renderItem={(r) => (
            <RoutineRow
              routine={r}
              stepCount={
                store.steps.filter((s) => s.routine_id === r.id).length
              }
              onRun={() => navigate(ROUTES.ROUTINE_RUN(r.id))}
              onEdit={() => navigate(ROUTES.ROUTINE_EDIT(r.id))}
              onDelete={async () => {
                store.removeRoutine(r.id)
                try {
                  await svc.deleteRoutine(r.id)
                } catch {}
              }}
            />
          )} />
        </Stack>
      ))}

      {/* Add modal */}
      {showAdd && (
        <RoutineFormModal
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false)
            navigate(ROUTES.ROUTINE_EDIT(id))
          }}
        />
      )}
    </Stack>
  )
}

// ─── RoutineRow ───────────────────────────────────────────────────────────────

interface RoutineRowProps {
  routine: Routine
  stepCount: number
  onRun: () => void
  onEdit: () => void
  onDelete: () => void
}

function RoutineRow({
  routine,
  stepCount,
  onRun,
  onEdit,
  onDelete,
}: RoutineRowProps) {
  const gradient = ROUTINE_GRADIENTS[routine.gradient ?? 0]
  const today = format(new Date(), DATE_FORMAT.API)
  const doneToday = routine.last_done === today
  const store = useRoutineStore()

  return (
    <Paper p="md" radius="xl" withBorder style={{ cursor: 'pointer' }} onClick={onRun}>
      <Group gap="md" wrap="nowrap">
        {/* Gradient circle */}
        <Box
          w={44}
          h={44}
          style={{
            borderRadius: 'var(--mantine-radius-lg)',
            background: gradient,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {ROUTINE_TYPE_EMOJI[routine.type] ?? '🔄'}
          </Text>
        </Box>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={4}>
            <Text fw={700} size="sm" truncate c="var(--mantine-color-text)">
              {routine.title}
            </Text>
            {doneToday && (
              <Badge variant="light" color="green" size="xs">
                {STRINGS.DONE_TODAY}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Badge variant="light" color="teal" size="xs">
              {ROUTINE_TYPE_LABEL[routine.type] ?? routine.type}
            </Badge>
            <Badge variant="light" color="gray" size="xs">
              {CADENCE_LABEL[routine.cadence] ?? routine.cadence}
            </Badge>
            <Text size="xs" c="dimmed">
              {stepCount} {STRINGS.ROUTINE_STEPS}
            </Text>
            {routine.last_done && !doneToday && (
              <Text size="xs" c="dimmed">
                · {STRINGS.ROUTINE_LAST_DONE}{' '}
                {format(parseISO(routine.last_done), DATE_FORMAT.SHORT)}
              </Text>
            )}
          </Group>
        </Box>

        <Group gap="xs" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            size="xs"
            leftSection={<Play size={12} />}
            onClick={onRun}
          >
            {STRINGS.ROUTINE_RUN}
          </Button>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <DotsThree size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<PencilSimple size={14} />}
                onClick={onEdit}
              >
                {STRINGS.EDIT}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<Trash size={14} />}
                color="red"
                onClick={onDelete}
              >
                {STRINGS.DELETE}
              </Menu.Item>
              <Menu.Item
                leftSection={<Sun size={14} />}
                onClick={async () => {
                  store.updateRoutine(routine.id, {
                    show_today: !routine.show_today,
                  })
                  try {
                    await svc.updateRoutine(routine.id, {
                      show_today: !routine.show_today,
                    })
                  } catch {}
                }}
              >
                {routine.show_today
                  ? STRINGS.REMOVE_FROM_TODAY
                  : STRINGS.ADD_TO_TODAY}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  )
}

// ─── RoutineFormModal — quick create before going to edit ─────────────────────

interface RoutineFormModalProps {
  onClose: () => void
  onCreated: (id: string) => void
}

function RoutineFormModal({ onClose, onCreated }: RoutineFormModalProps) {
  const store = useRoutineStore()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<RoutineType>(ROUTINE_TYPE.HABIT)
  const [cadence, setCadence] = useState<RoutineCadence>(ROUTINE_CADENCE.DAILY)
  const [err, setErr] = useState(false)

  async function create() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    const row: Omit<Routine, 'id' | 'created_at'> = {
      user_id: USER_ID,
      title: title.trim(),
      outcome: null,
      type,
      cadence,
      schedule: null,
      gradient: 0,
      is_active: true,
      last_done: null,
      show_today: false,
      order_index: store.routines.length,
    }
    try {
      const r = await svc.insertRoutine(row)
      store.addRoutine(r)
      onCreated(r.id)
    } catch {
      const id = crypto.randomUUID()
      store.addRoutine({ ...row, id, created_at: new Date().toISOString() })
      onCreated(id)
    }
  }

  return (
    <Modal opened onClose={onClose} title={STRINGS.NEW_ROUTINE} size="sm">
      <Stack gap="md">
        <TextInput
          label={STRINGS.TITLE}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErr(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder={STRINGS.ROUTINE_NAME_PLACEHOLDER}
          error={err ? STRINGS.REQUIRED : undefined}
          autoFocus
          radius="lg"
        />
        <Select
          label={STRINGS.TYPE}
          value={type}
          onChange={(v) => v && setType(v as RoutineType)}
          data={Object.entries(ROUTINE_TYPE_LABEL).map(([k, v]) => ({
            value: k,
            label: v,
          }))}
          radius="lg"
        />
        <Select
          label={STRINGS.CADENCE}
          value={cadence}
          onChange={(v) => v && setCadence(v as RoutineCadence)}
          data={Object.entries(CADENCE_LABEL).map(([k, v]) => ({
            value: k,
            label: v,
          }))}
          radius="lg"
        />
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            onClick={create}
          >
            {STRINGS.CREATE_AND_EDIT}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
