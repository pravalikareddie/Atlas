import {
  Box,
  Text,
  UnstyledButton,
  Divider,
  Group,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Modal,
  Button,
  ActionIcon,
  Checkbox,
  Paper,
  SegmentedControl,
} from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import { STRINGS as S } from '../constants/strings'
import { STYLES, imageOrGrad } from '../constants/styles'
import { format, parseISO } from 'date-fns'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { TASK_TYPE, TASK_STATUS } from '../../tasks/constants/taskConstants'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { GRADIENTS as SHARED_GRADIENTS } from '../../../shared/constants/styles'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'

const VIEW_KEY = 'living-view'

// ─── Reusable sub-components ──────────────────────────────────────────────────

function ImageCard({
  name,
  sub,
  img,
  grad,
  onClick,
}: {
  name: string
  sub?: string
  img: string | null
  grad: string
  onClick: () => void
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      w="100%"
      h={STYLES.CARD_HEIGHT}
      style={{
        background: imageOrGrad(img, grad),
        borderRadius: 'var(--mantine-radius-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: SHARED_GRADIENTS.IMAGE_OVERLAY,
        }}
      />
      <Stack pos="absolute" bottom={0} left={0} p="md" gap={4}>
        <Text fw={700} c="white" size="md">
          {name}
        </Text>
        {sub && (
          <Text size="xs" c="dimmed">
            {sub}
          </Text>
        )}
      </Stack>
    </UnstyledButton>
  )
}

function DetailHero({ url, grad }: { url: string | null; grad: string }) {
  return (
    <Box
      h={STYLES.DETAIL_IMAGE_HEIGHT}
      style={{
        background: imageOrGrad(url, grad),
        borderRadius: 'var(--mantine-radius-lg)',
        marginBottom: 'var(--mantine-spacing-md)',
      }}
    />
  )
}

function MarkDoneModal({
  opened,
  title,
  form,
  setForm,
  onSave,
  onClose,
}: {
  opened: boolean
  title: string
  form: { date: string; memory: string; image: string }
  setForm: (f: { date: string; memory: string; image: string }) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <Stack>
        <TextInput
          label={S.FIELD_WHEN}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.currentTarget.value })}
          placeholder={S.PH_WHEN}
        />
        <Textarea
          label={S.FIELD_MEMORY}
          value={form.memory}
          onChange={(e) => setForm({ ...form, memory: e.currentTarget.value })}
          placeholder={S.PH_MEMORY}
        />
        <TextInput
          label={S.FIELD_PHOTO_URL}
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.currentTarget.value })}
          placeholder={S.PH_IMAGE_URL}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {S.CANCEL}
          </Button>
          <Button onClick={onSave}>{S.SAVE}</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function PreviousExperiences({
  visitedPlaces,
  doneExps,
}: {
  visitedPlaces: {
    id: string
    name: string
    visited_date: string | null
    image_url: string | null
    done_image_url: string | null
  }[]
  doneExps: {
    id: string
    name: string
    done_date: string | null
    image_url: string | null
    done_image_url: string | null
  }[]
}) {
  const items = [
    ...visitedPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      date: p.visited_date,
      img: p.done_image_url ?? p.image_url,
      label: S.PREVIOUSLY_VISITED,
      grad: STYLES.GRAD_PLACE,
    })),
    ...doneExps.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.done_date,
      img: e.done_image_url ?? e.image_url,
      label: S.PREVIOUSLY_DONE,
      grad: STYLES.GRAD_EXP,
    })),
  ]
  if (!items.length) return null
  return (
    <Stack gap="xs">
      <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
        {items[0].label}
      </Text>
      <Group gap="sm">
        {items.slice(0, 4).map((it) => (
          <Paper
            key={it.id}
            w={100}
            h={100}
            radius="md"
            style={{
              background: imageOrGrad(it.img, it.grad),
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Box
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              style={{
                background: SHARED_GRADIENTS.IMAGE_OVERLAY_30,
              }}
            />
            <Stack pos="absolute" bottom={0} left={0} p="xs" gap={2}>
              <Text size="xs" fw={600} c="white" lineClamp={2}>
                {it.name}
              </Text>
              {it.date && <Text c="dimmed">{it.date}</Text>}
            </Stack>
          </Paper>
        ))}
      </Group>
    </Stack>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ExploreScreen() {
  const {
    places,
    placeExps,
    experiences,
    todos,
    addPlace,
    addExperience,
    addPlaceExp,
    updatePlaceExp,
    removePlaceExp,
    updatePlace,
    removePlace,
    updateExperience,
    removeExperience,
    addTodo,
    updateTodo,
    removeTodo,
    loading,
  } = useLivingStore()

  const [view, setView] = useState<'grid' | 'list'>(
    () => (localStorage.getItem(VIEW_KEY) as 'grid' | 'list') || 'grid',
  )
  const [tab, setTab] = useState<'places' | 'experiences'>('places')
  const [addType, setAddType] = useState<null | 'place' | 'experience'>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    note: '',
    image_url: '',
    place_id: '',
    target_date: '',
  })
  const [detail, setDetail] = useState<string | null>(null)
  const [expDetail, setExpDetail] = useState<string | null>(null)
  const [newPE, setNewPE] = useState('')
  const [markVisited, setMarkVisited] = useState<string | null>(null)
  const [markDone, setMarkDone] = useState<string | null>(null)
  const [visitForm, setVisitForm] = useState({
    date: '',
    memory: '',
    image: '',
  })
  const [doneForm, setDoneForm] = useState({ date: '', memory: '', image: '' })
  const [newTodo, setNewTodo] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)
  const [editTodoId, setEditTodoId] = useState<string | null>(null)
  const [editTodoText, setEditTodoText] = useState('')
  const [editPEId, setEditPEId] = useState<string | null>(null)
  const [editPEText, setEditPEText] = useState('')
  const { create: createTask } = useTaskActions()

  const wantPlaces = places.filter((p) => p.status === 'want')
  const wantExps = experiences.filter((e) => e.status === 'want')
  const visitedPlaces = places.filter((p) => p.status === 'visited')
  const doneExps = experiences.filter((e) => e.status === 'done')
  const openTodos = todos.filter((t) => t.status === 'todo')
  const doneCount = visitedPlaces.length + doneExps.length

  const detailPlace = detail ? places.find((p) => p.id === detail) : null
  const detailExp = expDetail
    ? experiences.find((e) => e.id === expDetail)
    : null
  const detailPEs = detail
    ? placeExps.filter((pe) => pe.place_id === detail)
    : []

  function setViewPref(v: 'grid' | 'list') {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  function resetForm() {
    setForm({
      name: '',
      note: '',
      image_url: '',
      place_id: '',
      target_date: '',
    })
    setAddType(null)
    setEditId(null)
  }

  function openEditPlace(id: string) {
    const p = places.find((x) => x.id === id)
    if (!p) return
    setEditId(id)
    setForm({
      name: p.name,
      note: p.note ?? '',
      image_url: p.image_url ?? '',
      place_id: '',
      target_date: p.target_date ?? '',
    })
    setAddType('place')
    setDetail(null)
  }

  function openEditExp(id: string) {
    const e = experiences.find((x) => x.id === id)
    if (!e) return
    setEditId(id)
    setForm({
      name: e.name,
      note: '',
      image_url: e.image_url ?? '',
      place_id: e.place_id ?? '',
      target_date: e.target_date ?? '',
    })
    setAddType('experience')
    setExpDetail(null)
  }

  function placeSubtext(placeId: string) {
    const n = placeExps.filter(
      (pe) => pe.place_id === placeId && pe.status === 'want',
    ).length
    return n > 0 ? S.THINGS_TO_DO(n) : S.NO_PLANS
  }

  function placeSubtextList(placeId: string) {
    const n = placeExps.filter(
      (pe) => pe.place_id === placeId && pe.status === 'want',
    ).length
    return n > 0 ? S.THINGS_TO_DO_THERE_COUNT(n) : S.NO_SPECIFIC_PLANS
  }

  // ─── CRUD helpers ─────────────────────────────────────────────────────────

  async function savePlace() {
    if (!form.name.trim()) return
    if (editId) {
      const u = {
        name: form.name,
        note: form.note || null,
        image_url: form.image_url || null,
        target_date: form.target_date || null,
      }
      updatePlace(editId, u)
      try {
        await svc.updatePlace(editId, u)
      } catch {}
    } else {
      const row = {
        user_id: USER_ID,
        name: form.name,
        note: form.note || null,
        image_url: form.image_url || null,
        target_date: form.target_date || null,
        status: 'want' as const,
        visited_date: null,
        memory: null,
        done_image_url: null,
      }
      try {
        addPlace(await svc.insertPlace(row))
      } catch {
        addPlace({
          ...row,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
    }
    resetForm()
  }

  async function saveExp() {
    if (!form.name.trim()) return
    if (editId) {
      const u = {
        name: form.name,
        image_url: form.image_url || null,
        place_id: form.place_id || null,
        target_date: form.target_date || null,
      }
      updateExperience(editId, u)
      try {
        await svc.updateExperience(editId, u)
      } catch {}
    } else {
      const row = {
        user_id: USER_ID,
        name: form.name,
        image_url: form.image_url || null,
        place_id: form.place_id || null,
        target_date: form.target_date || null,
        status: 'want' as const,
        done_date: null,
        memory: null,
        done_image_url: null,
      }
      try {
        addExperience(await svc.insertExperience(row))
      } catch {
        addExperience({
          ...row,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
    }
    resetForm()
  }

  async function addPE(placeId: string) {
    if (!newPE.trim()) return
    const row = {
      user_id: USER_ID,
      place_id: placeId,
      name: newPE,
      status: 'want' as const,
      done_date: null,
    }
    try {
      addPlaceExp(await svc.insertPlaceExperience(row))
    } catch {
      addPlaceExp({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewPE('')
  }

  async function markPEDone(id: string) {
    const u = {
      status: 'done' as const,
      done_date: new Date().toISOString().slice(0, 7),
    }
    updatePlaceExp(id, u)
    try {
      await svc.updatePlaceExperience(id, u)
    } catch {}
  }

  async function savePEEdit(id: string) {
    if (!editPEText.trim()) return
    updatePlaceExp(id, { name: editPEText })
    try {
      await svc.updatePlaceExperience(id, { name: editPEText })
    } catch {}
    setEditPEId(null)
    setEditPEText('')
  }

  async function deletePE(id: string) {
    removePlaceExp(id)
    try {
      await svc.deletePlaceExperience(id)
    } catch {}
  }

  async function handleMarkVisited() {
    if (!markVisited) return
    const u = {
      status: 'visited' as const,
      visited_date: visitForm.date || null,
      memory: visitForm.memory || null,
      done_image_url: visitForm.image || null,
    }
    updatePlace(markVisited, u)
    try {
      await svc.updatePlace(markVisited, u)
    } catch {}
    setMarkVisited(null)
    setDetail(null)
    setVisitForm({ date: '', memory: '', image: '' })
  }

  async function handleMarkExpDone() {
    if (!markDone) return
    const u = {
      status: 'done' as const,
      done_date: doneForm.date || null,
      memory: doneForm.memory || null,
      done_image_url: doneForm.image || null,
    }
    updateExperience(markDone, u)
    try {
      await svc.updateExperience(markDone, u)
    } catch {}
    setMarkDone(null)
    setExpDetail(null)
    setDoneForm({ date: '', memory: '', image: '' })
  }

  async function handleDeletePlace(id: string) {
    if (!confirm(S.CONFIRM_DELETE_PLACE)) return
    removePlace(id)
    setDetail(null)
    try {
      await svc.deletePlace(id)
    } catch {}
  }

  async function handleDeleteExp(id: string) {
    if (!confirm(S.CONFIRM_DELETE_EXP)) return
    removeExperience(id)
    setExpDetail(null)
    try {
      await svc.deleteExperience(id)
    } catch {}
  }

  async function submitTodo() {
    if (!newTodo.trim()) return
    const row = {
      user_id: USER_ID,
      description: newTodo,
      status: 'todo' as const,
      completed_at: null,
    }
    try {
      addTodo(await svc.insertLivingTodo(row))
    } catch {
      addTodo({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewTodo('')
    setAddingTodo(false)
  }

  async function completeTodo(id: string) {
    const u = {
      status: 'done' as const,
      completed_at: new Date().toISOString(),
    }
    updateTodo(id, u)
    try {
      await svc.updateLivingTodo(id, u)
    } catch {}
  }

  async function saveTodoEdit(id: string) {
    if (!editTodoText.trim()) return
    updateTodo(id, { description: editTodoText })
    try {
      await svc.updateLivingTodo(id, { description: editTodoText })
    } catch {}
    setEditTodoId(null)
    setEditTodoText('')
  }

  async function deleteTodo(id: string) {
    if (!confirm(S.CONFIRM_DELETE_TODO)) return
    removeTodo(id)
    try {
      await svc.deleteLivingTodo(id)
    } catch {}
  }

  // ─── Loading / Empty ──────────────────────────────────────────────────────

  if (loading) return <SkeletonRow count={6} />

  if (!wantPlaces.length && !wantExps.length) {
    return (
      <Stack>
        <EmptyState
          icon="🌍"
          message={S.EMPTY_EXPLORE}
          sub={S.EMPTY_EXPLORE_SUB}
        >
          <Group gap="xs" mt="sm">
            <Button
              variant="light"
              size="sm"
              onClick={() => setAddType('place')}
            >
              {S.PLACE_BTN}
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={() => setAddType('experience')}
            >
              {S.EXPERIENCE_BTN}
            </Button>
          </Group>
        </EmptyState>
        {/* Show previous experiences as motivation */}
        <PreviousExperiences
          visitedPlaces={visitedPlaces}
          doneExps={doneExps}
        />
        <AddModals />
      </Stack>
    )
  }

  // ─── Add Modals ───────────────────────────────────────────────────────────

  function AddModals() {
    return (
      <>
        {/* Add/Edit Place */}
        <Modal
          opened={addType === 'place'}
          onClose={resetForm}
          title={editId ? S.EDIT_PLACE : S.ADD_PLACE}
        >
          <Stack>
            <TextInput
              label={S.FIELD_NAME}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.currentTarget.value })
              }
              placeholder={S.PH_PLACE_NAME}
              data-autofocus
            />
            <TextInput
              label={S.FIELD_NOTE}
              value={form.note}
              onChange={(e) =>
                setForm({ ...form, note: e.currentTarget.value })
              }
              placeholder={S.PH_PLACE_NOTE}
            />
            <TextInput
              label={S.FIELD_IMAGE_URL}
              value={form.image_url}
              onChange={(e) =>
                setForm({ ...form, image_url: e.currentTarget.value })
              }
              placeholder={S.PH_IMAGE_URL}
            />
            <TextInput
              label="Target Date"
              type="date"
              value={form.target_date}
              onChange={(e) =>
                setForm({ ...form, target_date: e.currentTarget.value })
              }
            />
            {form.target_date && (
              <Button variant="subtle" size="xs" color="red" onClick={() => setForm({ ...form, target_date: '' })}>
                Clear date
              </Button>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={resetForm}>
                {S.CANCEL}
              </Button>
              <Button onClick={savePlace} disabled={!form.name.trim()}>
                {S.SAVE}
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Add/Edit Experience */}
        <Modal
          opened={addType === 'experience'}
          onClose={resetForm}
          title={editId ? S.EDIT_EXPERIENCE : S.ADD_EXPERIENCE}
        >
          <Stack>
            <TextInput
              label={S.FIELD_NAME}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.currentTarget.value })
              }
              placeholder={S.PH_EXP_NAME}
              data-autofocus
            />
            <Select
              label={S.FIELD_LINKED_PLACE}
              value={form.place_id || null}
              onChange={(v) => setForm({ ...form, place_id: v ?? '' })}
              data={[
                { value: '', label: S.NONE },
                ...places.map((p) => ({ value: p.id, label: p.name })),
              ]}
              clearable
            />
            <TextInput
              label={S.FIELD_IMAGE_URL}
              value={form.image_url}
              onChange={(e) =>
                setForm({ ...form, image_url: e.currentTarget.value })
              }
              placeholder={S.PH_IMAGE_URL}
            />
            <TextInput
              label="Target Date"
              type="date"
              value={form.target_date}
              onChange={(e) =>
                setForm({ ...form, target_date: e.currentTarget.value })
              }
            />
            {form.target_date && (
              <Button variant="subtle" size="xs" color="red" onClick={() => setForm({ ...form, target_date: '' })}>
                Clear date
              </Button>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={resetForm}>
                {S.CANCEL}
              </Button>
              <Button onClick={saveExp} disabled={!form.name.trim()}>
                {S.SAVE}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Stack>
      {/* Win banner */}
      {doneCount > 0 && (
        <Paper
          p="sm"
          radius="lg"
          style={{
            background: 'var(--mantine-color-coral-9)',
            border: '1px solid var(--mantine-color-coral-7)',
          }}
        >
          <Group gap="sm">
            <Text size="lg">🌟</Text>
            <Text size="sm" c="white">
              {doneCount} {doneCount !== 1 ? 'experiences' : 'experience'}{' '}
              {S.WIN_SUFFIX}
            </Text>
          </Group>
        </Paper>
      )}

      {/* Toolbar */}
      <Group justify="space-between">
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as 'places' | 'experiences')}
          data={[
            { value: 'places', label: S.TAB_PLACES },
            { value: 'experiences', label: S.TAB_EXPERIENCES },
          ]}
          size="sm"
        />
        <Group gap="xs">
          <ActionIcon
            variant={view === 'grid' ? 'filled' : 'subtle'}
            onClick={() => setViewPref('grid')}
            aria-label="Grid view"
          >
            🔲
          </ActionIcon>
          <ActionIcon
            variant={view === 'list' ? 'filled' : 'subtle'}
            onClick={() => setViewPref('list')}
            aria-label="List view"
          >
            ☰
          </ActionIcon>
        </Group>
      </Group>

      {/* Places tab */}
      {tab === 'places' && (
        <Stack gap="sm">
          <Group justify="space-between">
            <SectionLabel>{S.PLACES_TO_GO}</SectionLabel>
            <Button
              variant="light"
              size="xs"
              onClick={() => setAddType('place')}
            >
              {S.PLACE_BTN}
            </Button>
          </Group>
          {wantPlaces.length > 0 ? (
            view === 'grid' ? (
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
                {wantPlaces.map((p) => (
                  <ImageCard
                    key={p.id}
                    name={p.name}
                    sub={`${placeSubtext(p.id)}${p.target_date ? ` · ${format(parseISO(p.target_date), 'MMM d')}` : ''}`}
                    img={p.image_url}
                    grad={STYLES.GRAD_PLACE}
                    onClick={() => setDetail(p.id)}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Stack gap="xs">
                <SortableList items={wantPlaces} onReorder={(r) => persistOrder(r, (id, d) => svc.updatePlace(id, d).catch(() => {}), (id, d) => svc.updatePlace(id, d))} renderItem={(p) => (
                  <Paper
                    p="sm"
                    radius="md"
                    withBorder
                    onClick={() => setDetail(p.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Group justify="space-between">
                      <Box>
                        <Text fw={600}>{p.name}</Text>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {placeSubtextList(p.id)}
                          </Text>
                          {p.target_date && (
                            <Text size="xs" c="teal">
                              · {format(parseISO(p.target_date), 'MMM d')}
                            </Text>
                          )}
                        </Group>
                      </Box>
                      <Text c="dimmed">→</Text>
                    </Group>
                  </Paper>
                )} />
              </Stack>
            )
          ) : (
            <Stack gap="md">
              <EmptyState
                icon="📍"
                message={S.EMPTY_PLACES}
                sub={S.EMPTY_PLACES_SUB}
              />
              <PreviousExperiences
                visitedPlaces={visitedPlaces}
                doneExps={[]}
              />
            </Stack>
          )}
        </Stack>
      )}

      {/* Experiences tab */}
      {tab === 'experiences' && (
        <Stack gap="sm">
          <Group justify="space-between">
            <SectionLabel>{S.THINGS_TO_EXPERIENCE}</SectionLabel>
            <Button
              variant="light"
              size="xs"
              onClick={() => setAddType('experience')}
            >
              {S.EXPERIENCE_BTN}
            </Button>
          </Group>
          {wantExps.length > 0 ? (
            view === 'grid' ? (
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
                {wantExps.map((e) => (
                  <ImageCard
                    key={e.id}
                    name={e.name}
                    sub={
                      e.target_date
                        ? format(parseISO(e.target_date), 'MMM d')
                        : undefined
                    }
                    img={e.image_url}
                    grad={STYLES.GRAD_EXP}
                    onClick={() => setExpDetail(e.id)}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Stack gap="xs">
                <SortableList items={wantExps} onReorder={(r) => persistOrder(r, (id, d) => svc.updateExperience(id, d).catch(() => {}), (id, d) => svc.updateExperience(id, d))} renderItem={(e) => {
                  const place = e.place_id
                    ? places.find((p) => p.id === e.place_id)
                    : null
                  return (
                    <Paper
                      p="sm"
                      radius="md"
                      withBorder
                      onClick={() => setExpDetail(e.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group gap="xs">
                        <Text c="dimmed">○</Text>
                        <Text fw={500}>{e.name}</Text>
                        {place && (
                          <Text size="xs" c="dimmed">
                            · {place.name}
                          </Text>
                        )}
                        {e.target_date && (
                          <Text size="xs" c="teal">
                            · {format(parseISO(e.target_date), 'MMM d')}
                          </Text>
                        )}
                      </Group>
                    </Paper>
                  )
                }} />
              </Stack>
            )
          ) : (
            <Stack gap="md">
              <EmptyState
                icon="✨"
                message={S.EMPTY_EXPS}
                sub={S.EMPTY_EXPS_SUB}
              />
              <PreviousExperiences visitedPlaces={[]} doneExps={doneExps} />
            </Stack>
          )}
        </Stack>
      )}

      {/* Todos */}
      <Divider />
      <Group justify="space-between">
        <SectionLabel>{S.THINGS_TO_RESEARCH}</SectionLabel>
        <Button variant="subtle" size="xs" onClick={() => setAddingTodo(true)}>
          {S.ADD}
        </Button>
      </Group>
      {!openTodos.length ? (
        <EmptyState
          icon="🔍"
          message={S.EMPTY_RESEARCH}
          sub={S.EMPTY_RESEARCH_SUB}
        />
      ) : (
        <Stack gap="xs">
          <SortableList items={openTodos} onReorder={(r) => persistOrder(r, (id, d) => svc.updateLivingTodo(id, d).catch(() => {}), (id, d) => svc.updateLivingTodo(id, d))} renderItem={(t) => (
            <Group gap="sm">
              <Checkbox
                size="xs"
                radius="xl"
                onChange={() => completeTodo(t.id)}
                aria-label={`Complete: ${t.description}`}
              />
              {editTodoId === t.id ? (
                <TextInput
                  flex={1}
                  size="xs"
                  value={editTodoText}
                  onChange={(e) => setEditTodoText(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTodoEdit(t.id)
                    if (e.key === 'Escape') setEditTodoId(null)
                  }}
                  data-autofocus
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => saveTodoEdit(t.id)}
                    >
                      ✓
                    </ActionIcon>
                  }
                />
              ) : (
                <Text
                  size="sm"
                  flex={1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setEditTodoId(t.id)
                    setEditTodoText(t.description)
                  }}
                >
                  {t.description}
                </Text>
              )}
              {editTodoId !== t.id && (
                <>
                  <ActionIcon size="xs" variant="subtle" color="teal" title="Make task"
                    onClick={async () => {
                      await createTask({
                        user_id: USER_ID, title: t.description, notes: null,
                        type: TASK_TYPE.PERSONAL, priority: null, is_must: false,
                        status: TASK_STATUS.TODO, due_date: null, do_today: false,
                        completed_at: null, goal_id: null, milestone_id: null,
                        project_id: null, roadmap_item_id: null, calendar_event_id: null,
                        parent_task_id: null, ticket_id: null, order_index: 0,
                        cadence: null, cadence_days: null, cadence_date: null,
                        cadence_interval: null, push_count: 0, sprint_id: null,
                        blocked: false, blocked_note: null, is_learning: false,
                      })
                      completeTodo(t.id)
                    }}>
                    ✅
                  </ActionIcon>
                  <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteTodo(t.id)}>
                    ✕
                  </ActionIcon>
                </>
              )}
            </Group>
          )} />
        </Stack>
      )}
      {addingTodo && (
        <Group gap="xs">
          <TextInput
            flex={1}
            size="sm"
            value={newTodo}
            onChange={(e) => setNewTodo(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTodo()
              if (e.key === 'Escape') setAddingTodo(false)
            }}
            placeholder={S.PH_RESEARCH}
            data-autofocus
          />
          <Button size="sm" onClick={submitTodo}>
            {S.ADD}
          </Button>
        </Group>
      )}

      <AddModals />

      {/* Place Detail */}
      <Modal
        opened={!!detailPlace}
        onClose={() => setDetail(null)}
        title={detailPlace?.name}
        size="lg"
      >
        {detailPlace && (
          <Stack>
            <DetailHero url={detailPlace.image_url} grad={STYLES.GRAD_PLACE} />
            {detailPlace.target_date && (
              <Group gap="xs">
                <Text size="sm" fw={600} c="teal">
                  📅 {format(parseISO(detailPlace.target_date), 'MMM d, yyyy')}
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  color="red"
                  onClick={async () => {
                    updatePlace(detailPlace.id, { target_date: null })
                    try { await svc.updatePlace(detailPlace.id, { target_date: null }) } catch {}
                  }}
                >
                  Clear date
                </Button>
              </Group>
            )}
            {detailPlace.note && (
              <Text size="sm" c="dimmed">
                {detailPlace.note}
              </Text>
            )}
            <Divider />
            <SectionLabel>{S.THINGS_TO_DO_THERE}</SectionLabel>
            <Stack gap="xs">
              {detailPEs.map((pe) => (
                <Group key={pe.id} gap="sm">
                  <Checkbox
                    size="xs"
                    radius="xl"
                    checked={pe.status === 'done'}
                    onChange={() => pe.status === 'want' && markPEDone(pe.id)}
                    aria-label={pe.name}
                  />
                  {editPEId === pe.id ? (
                    <TextInput
                      flex={1}
                      size="xs"
                      value={editPEText}
                      onChange={(e) => setEditPEText(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePEEdit(pe.id)
                        if (e.key === 'Escape') setEditPEId(null)
                      }}
                      data-autofocus
                      rightSection={
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          onClick={() => savePEEdit(pe.id)}
                        >
                          ✓
                        </ActionIcon>
                      }
                    />
                  ) : (
                    <>
                      <Text
                        size="sm"
                        flex={1}
                        td={pe.status === 'done' ? 'line-through' : undefined}
                        c={pe.status === 'done' ? 'dimmed' : undefined}
                      >
                        {pe.name}
                      </Text>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => {
                          setEditPEId(pe.id)
                          setEditPEText(pe.name)
                        }}
                      >
                        ✎
                      </ActionIcon>
                    </>
                  )}
                  {editPEId !== pe.id && (
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => deletePE(pe.id)}
                    >
                      ✕
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>
            <Group gap="xs">
              <TextInput
                flex={1}
                size="sm"
                value={newPE}
                onChange={(e) => setNewPE(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPE(detailPlace.id)}
                placeholder={S.PH_ADD_THING}
              />
              <ActionIcon variant="light" onClick={() => addPE(detailPlace.id)}>
                +
              </ActionIcon>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Group gap="xs">
                <Button onClick={() => setMarkVisited(detailPlace.id)}>
                  {S.MARK_VISITED}
                </Button>
                <Button
                  variant="light"
                  onClick={() => openEditPlace(detailPlace.id)}
                >
                  {S.EDIT}
                </Button>
              </Group>
              <Button
                variant="subtle"
                color="red"
                onClick={() => handleDeletePlace(detailPlace.id)}
              >
                {S.DELETE}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Experience Detail */}
      <Modal
        opened={!!detailExp}
        onClose={() => setExpDetail(null)}
        title={detailExp?.name}
        size="lg"
      >
        {detailExp && (
          <Stack>
            <DetailHero url={detailExp.image_url} grad={STYLES.GRAD_EXP} />
            {detailExp.place_id && (
              <Text size="sm" c="dimmed">
                · {places.find((p) => p.id === detailExp.place_id)?.name}
              </Text>
            )}
            <Divider />
            <Group justify="space-between">
              <Group gap="xs">
                <Button onClick={() => setMarkDone(detailExp.id)}>
                  {S.MARK_DONE}
                </Button>
                <Button
                  variant="light"
                  onClick={() => openEditExp(detailExp.id)}
                >
                  {S.EDIT}
                </Button>
              </Group>
              <Button
                variant="subtle"
                color="red"
                onClick={() => handleDeleteExp(detailExp.id)}
              >
                {S.DELETE}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Mark Visited / Mark Done — shared component */}
      <MarkDoneModal
        opened={!!markVisited}
        title={S.YOU_WENT}
        form={visitForm}
        setForm={setVisitForm}
        onSave={handleMarkVisited}
        onClose={() => setMarkVisited(null)}
      />
      <MarkDoneModal
        opened={!!markDone}
        title={S.YOU_DID_IT}
        form={doneForm}
        setForm={setDoneForm}
        onSave={handleMarkExpDone}
        onClose={() => setMarkDone(null)}
      />
    </Stack>
  )
}
