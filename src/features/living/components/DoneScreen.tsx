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
  Modal,
  Button,
  ActionIcon,
  Paper,
} from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import { STRINGS as S } from '../constants/strings'
import { STYLES, imageOrGrad } from '../constants/styles'
import { GRADIENTS as SHARED_GRADIENTS } from '../../../shared/constants/styles'

const VIEW_KEY = 'living-done-view'

export function DoneScreen() {
  const { places, placeExps, experiences, updatePlace, updateExperience, updatePlaceExp, removePlaceExp, loading } =
    useLivingStore()

  const [view, setView] = useState<'grid' | 'list'>(
    () => (localStorage.getItem(VIEW_KEY) as 'grid' | 'list') || 'grid',
  )
  const [detail, setDetail] = useState<string | null>(null)
  const [expDetail, setExpDetail] = useState<string | null>(null)
  const [editMemory, setEditMemory] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', date: '', image: '' })
  const [editPEId, setEditPEId] = useState<string | null>(null)
  const [editPEText, setEditPEText] = useState('')

  const visited = places
    .filter((p) => p.status === 'visited')
    .sort((a, b) => (b.visited_date ?? '').localeCompare(a.visited_date ?? ''))
  const done = experiences
    .filter((e) => e.status === 'done')
    .sort((a, b) => (b.done_date ?? '').localeCompare(a.done_date ?? ''))

  function setViewPref(v: 'grid' | 'list') {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  function openPlaceDetail(id: string) {
    const p = places.find((x) => x.id === id)
    if (!p) return
    setDetail(id)
    setEditMemory(p.memory ?? '')
    setEditing(false)
    setEditForm({ name: p.name, date: p.visited_date ?? '', image: p.done_image_url ?? '' })
  }

  function openExpDetail(id: string) {
    const e = experiences.find((x) => x.id === id)
    if (!e) return
    setExpDetail(id)
    setEditMemory(e.memory ?? '')
    setEditing(false)
    setEditForm({ name: e.name, date: e.done_date ?? '', image: e.done_image_url ?? '' })
  }

  async function savePlaceEdits(id: string) {
    const u = {
      name: editForm.name,
      visited_date: editForm.date || null,
      done_image_url: editForm.image || null,
      memory: editMemory || null,
    }
    updatePlace(id, u)
    try { await svc.updatePlace(id, u) } catch {}
    setEditing(false)
  }

  async function saveExpEdits(id: string) {
    const u = {
      name: editForm.name,
      done_date: editForm.date || null,
      done_image_url: editForm.image || null,
      memory: editMemory || null,
    }
    updateExperience(id, u)
    try { await svc.updateExperience(id, u) } catch {}
    setEditing(false)
  }

  async function saveMemory(type: 'place' | 'exp', id: string) {
    if (type === 'place') {
      updatePlace(id, { memory: editMemory })
      try { await svc.updatePlace(id, { memory: editMemory }) } catch {}
    } else {
      updateExperience(id, { memory: editMemory })
      try { await svc.updateExperience(id, { memory: editMemory }) } catch {}
    }
  }

  async function savePEEdit(id: string) {
    if (!editPEText.trim()) return
    updatePlaceExp(id, { name: editPEText })
    try { await svc.updatePlaceExperience(id, { name: editPEText }) } catch {}
    setEditPEId(null)
    setEditPEText('')
  }

  async function deletePE(id: string) {
    removePlaceExp(id)
    try { await svc.deletePlaceExperience(id) } catch {}
  }

  if (loading) return <SkeletonRow count={6} />
  if (!visited.length && !done.length)
    return <EmptyState icon="📸" message={S.EMPTY_DONE} sub={S.EMPTY_DONE_SUB} />

  const dp = detail ? places.find((p) => p.id === detail) : null
  const de = expDetail ? experiences.find((e) => e.id === expDetail) : null
  const dpPEs = detail
    ? placeExps.filter((pe) => pe.place_id === detail && pe.status === 'done')
    : []

  function DoneCard({
    name,
    date,
    img,
    grad,
    onClick,
  }: {
    name: string
    date: string | null
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
          style={{ background: SHARED_GRADIENTS.IMAGE_OVERLAY }}
        />
        <Stack pos="absolute" bottom={0} left={0} p="md" gap={4}>
          <Text fw={700} c="white" size="md">{name}</Text>
          {date && <Text size="xs" c="dimmed">{date}</Text>}
        </Stack>
      </UnstyledButton>
    )
  }

  return (
    <Stack>
      {/* Toolbar */}
      <Group justify="flex-end" gap="xs">
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

      {/* Places Visited */}
      {visited.length > 0 && (
        <Stack gap="sm">
          <SectionLabel>{S.PLACES_VISITED}</SectionLabel>
          {view === 'grid' ? (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
              {visited.map((p) => (
                <DoneCard
                  key={p.id}
                  name={p.name}
                  date={p.visited_date}
                  img={p.done_image_url ?? p.image_url}
                  grad={STYLES.GRAD_DONE_PLACE}
                  onClick={() => openPlaceDetail(p.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Stack gap="xs">
              {visited.map((p) => (
                <Paper
                  key={p.id}
                  p="sm"
                  radius="md"
                  withBorder
                  onClick={() => openPlaceDetail(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Group justify="space-between">
                    <Box>
                      <Text fw={600}>{p.name}</Text>
                      {p.memory && <Text size="xs" c="dimmed" lineClamp={1}>{p.memory}</Text>}
                    </Box>
                    <Text size="xs" c="dimmed">{p.visited_date}</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Experiences Had */}
      {done.length > 0 && (
        <Stack gap="sm">
          <SectionLabel>{S.EXPERIENCES_HAD}</SectionLabel>
          {view === 'grid' ? (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
              {done.map((e) => (
                <DoneCard
                  key={e.id}
                  name={e.name}
                  date={e.done_date}
                  img={e.done_image_url ?? e.image_url}
                  grad={STYLES.GRAD_DONE_EXP}
                  onClick={() => openExpDetail(e.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Stack gap="xs">
              {done.map((e) => (
                <Paper
                  key={e.id}
                  p="sm"
                  radius="md"
                  withBorder
                  onClick={() => openExpDetail(e.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Group justify="space-between">
                    <Box>
                      <Group gap="xs">
                        <Text c="dimmed">✓</Text>
                        <Text fw={600}>{e.name}</Text>
                      </Group>
                      {e.memory && <Text size="xs" c="dimmed" lineClamp={1}>{e.memory}</Text>}
                    </Box>
                    <Text size="xs" c="dimmed">{e.done_date}</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Place Detail */}
      <Modal opened={!!dp} onClose={() => setDetail(null)} title={dp?.name} size="lg">
        {dp && (
          <Stack>
            <Box
              h={STYLES.DETAIL_IMAGE_HEIGHT}
              style={{
                background: imageOrGrad(dp.done_image_url ?? dp.image_url, STYLES.GRAD_DONE_PLACE),
                borderRadius: 'var(--mantine-radius-lg)',
              }}
            />
            {editing ? (
              <Stack gap="sm">
                <TextInput
                  label={S.FIELD_NAME}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
                />
                <TextInput
                  label={S.FIELD_WHEN}
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.currentTarget.value })}
                  placeholder={S.PH_WHEN}
                />
                <TextInput
                  label={S.FIELD_PHOTO_URL}
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.currentTarget.value })}
                  placeholder={S.PH_IMAGE_URL}
                />
                <Textarea
                  label={S.FIELD_MEMORY}
                  value={editMemory}
                  onChange={(e) => setEditMemory(e.currentTarget.value)}
                  placeholder={S.PH_MEMORY}
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setEditing(false)}>{S.CANCEL}</Button>
                  <Button onClick={() => savePlaceEdits(dp.id)}>{S.SAVE}</Button>
                </Group>
              </Stack>
            ) : (
              <Stack>
                <Text size="sm" c="dimmed">{S.VISITED_PREFIX}: {dp.visited_date}</Text>
                {dp.memory && <Text size="sm">{dp.memory}</Text>}
                <Textarea
                  value={editMemory}
                  onChange={(e) => setEditMemory(e.currentTarget.value)}
                  placeholder={S.PH_MEMORY}
                />
                <Group justify="space-between">
                  <Button variant="light" size="xs" onClick={() => saveMemory('place', dp.id)}>
                    {S.SAVE_MEMORY}
                  </Button>
                  <Button variant="subtle" size="xs" onClick={() => setEditing(true)}>
                    {S.EDIT}
                  </Button>
                </Group>
                {dpPEs.length > 0 && (
                  <>
                    <Divider />
                    <SectionLabel>{S.THINGS_YOU_DID}</SectionLabel>
                    <Stack gap="xs">
                      {dpPEs.map((pe) => (
                        <Group key={pe.id} gap="sm">
                          <Text c="dimmed">✓</Text>
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
                                <ActionIcon size="xs" variant="subtle" onClick={() => savePEEdit(pe.id)}>
                                  ✓
                                </ActionIcon>
                              }
                            />
                          ) : (
                            <Text
                              size="sm"
                              flex={1}
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setEditPEId(pe.id); setEditPEText(pe.name) }}
                            >
                              {pe.name}
                            </Text>
                          )}
                          {editPEId !== pe.id && (
                            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deletePE(pe.id)}>
                              ✕
                            </ActionIcon>
                          )}
                        </Group>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </Modal>

      {/* Experience Detail */}
      <Modal opened={!!de} onClose={() => setExpDetail(null)} title={de?.name} size="lg">
        {de && (
          <Stack>
            <Box
              h={STYLES.DETAIL_IMAGE_HEIGHT}
              style={{
                background: imageOrGrad(de.done_image_url ?? de.image_url, STYLES.GRAD_DONE_EXP),
                borderRadius: 'var(--mantine-radius-lg)',
              }}
            />
            {editing ? (
              <Stack gap="sm">
                <TextInput
                  label={S.FIELD_NAME}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
                />
                <TextInput
                  label={S.FIELD_WHEN}
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.currentTarget.value })}
                  placeholder={S.PH_WHEN}
                />
                <TextInput
                  label={S.FIELD_PHOTO_URL}
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.currentTarget.value })}
                  placeholder={S.PH_IMAGE_URL}
                />
                <Textarea
                  label={S.FIELD_MEMORY}
                  value={editMemory}
                  onChange={(e) => setEditMemory(e.currentTarget.value)}
                  placeholder={S.PH_MEMORY}
                />
                <Group justify="flex-end">
                  <Button variant="default" onClick={() => setEditing(false)}>{S.CANCEL}</Button>
                  <Button onClick={() => saveExpEdits(de.id)}>{S.SAVE}</Button>
                </Group>
              </Stack>
            ) : (
              <Stack>
                <Text size="sm" c="dimmed">{S.DONE_PREFIX}: {de.done_date}</Text>
                {de.memory ? (
                  <Text size="sm">{de.memory}</Text>
                ) : (
                  <Text size="sm" c="dimmed" fs="italic">{S.ADD_MEMORY_PROMPT}</Text>
                )}
                <Textarea
                  value={editMemory}
                  onChange={(e) => setEditMemory(e.currentTarget.value)}
                  placeholder={S.PH_MEMORY}
                />
                <Group justify="space-between">
                  <Button variant="light" size="xs" onClick={() => saveMemory('exp', de.id)}>
                    {S.SAVE_MEMORY}
                  </Button>
                  <Button variant="subtle" size="xs" onClick={() => setEditing(true)}>
                    {S.EDIT}
                  </Button>
                </Group>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
