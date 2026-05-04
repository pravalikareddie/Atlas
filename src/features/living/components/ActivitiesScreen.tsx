import { format, parseISO } from 'date-fns'
import {
  Box,
  Text,
  UnstyledButton,
  Stack,
  SimpleGrid,
  Group,
  TextInput,
  Modal,
  Button,
} from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { STRINGS as S } from '../constants/strings'
import { STYLES, imageOrGrad } from '../constants/styles'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import * as livingSvc from '../services/livingService'

const EMPTY_FORM = { name: '', image_url: '', target_date: '' }

export function ActivitiesScreen() {
  const { activities, addActivity, updateActivity, removeActivity, loading } =
    useLivingStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detail, setDetail] = useState<string | null>(null)

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(id: string) {
    const a = activities.find((x) => x.id === id)
    if (!a) return
    setEditId(id)
    setForm({ name: a.name, image_url: a.image_url ?? '', target_date: a.target_date ?? '' })
    setDetail(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (editId) {
      const u = { name: form.name, image_url: form.image_url || null, target_date: form.target_date || null }
      updateActivity(editId, u)
      try { await svc.updateActivity(editId, u) } catch {}
    } else {
      const row = { user_id: USER_ID, name: form.name, image_url: form.image_url || null, target_date: form.target_date || null }
      try {
        addActivity(await svc.insertActivity(row))
      } catch {
        addActivity({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      }
    }
    closeForm()
  }

  async function handleDelete(id: string) {
    if (!confirm(S.CONFIRM_DELETE_ACTIVITY)) return
    removeActivity(id)
    setDetail(null)
    try { await svc.deleteActivity(id) } catch {}
  }

  if (loading) return <SkeletonRow count={6} />

  const act = detail ? activities.find((a) => a.id === detail) : null

  return (
    <Stack>
      {!activities.length ? (
        <>
          <EmptyState message={S.EMPTY_ACTIVITIES} sub={S.EMPTY_ACTIVITIES_SUB} />
          <Group justify="center">
            <Button onClick={openAdd}>{S.ADD}</Button>
          </Group>
        </>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
          <SortableList items={activities} onReorder={(r) => persistOrder(r, (id, d) => updateActivity(id, d), (id, d) => livingSvc.updateActivity(id, d))} renderItem={(a) => (
            <UnstyledButton
              onClick={() => setDetail(a.id)}
              w="100%"
              h={STYLES.CARD_HEIGHT}
              style={{
                background: imageOrGrad(a.image_url, STYLES.GRAD_ACTIVITY),
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
                style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))' }}
              />
              <Stack pos="absolute" bottom={0} left={0} p="md" gap={4}>
                <Text fw={700} c="white" size="md">{a.name}</Text>
                {a.target_date && <Text size="xs" c="white" opacity={0.7}>{format(parseISO(a.target_date), 'MMM d, yyyy')}</Text>}
              </Stack>
            </UnstyledButton>
          )} />
          <UnstyledButton
            onClick={openAdd}
            w="100%"
            h={STYLES.CARD_HEIGHT}
            style={{
              borderRadius: 'var(--mantine-radius-lg)',
              border: 'var(--mantine-spacing-xs) dashed var(--mantine-color-default-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text c="dimmed" fw={500}>{S.ADD}</Text>
          </UnstyledButton>
        </SimpleGrid>
      )}

      {/* Add / Edit Modal */}
      <Modal
        opened={showForm}
        onClose={closeForm}
        title={editId ? S.EDIT_ACTIVITY : S.ADD_ACTIVITY}
      >
        <Stack>
          <TextInput
            label={S.FIELD_NAME}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
            placeholder={S.PH_ACTIVITY_NAME}
            data-autofocus
          />
          <TextInput
            label={S.FIELD_IMAGE_URL}
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.currentTarget.value })}
            placeholder={S.PH_IMAGE_URL}
          />
          <TextInput
            label="Target Date"
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeForm}>{S.CANCEL}</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{S.SAVE}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Detail Modal */}
      <Modal opened={!!act} onClose={() => setDetail(null)} title={act?.name} size="lg">
        {act && (
          <Stack>
            <Box
              h={STYLES.DETAIL_IMAGE_HEIGHT}
              style={{
                background: imageOrGrad(act.image_url, STYLES.GRAD_ACTIVITY),
                borderRadius: 'var(--mantine-radius-lg)',
              }}
            />
            <Group justify="space-between">
              <Button variant="light" onClick={() => openEdit(act.id)}>
                Edit
              </Button>
              <Button variant="subtle" color="red" onClick={() => handleDelete(act.id)}>
                {S.DELETE}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
