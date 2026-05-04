import {
  Stack, Group, Text, TextInput, Modal, Button, Paper, Badge, ActionIcon,
} from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/wishlistService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import { STRINGS as S } from '../constants/strings'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'

const EMPTY_FORM = { name: '', url: '', price: '', notes: '' }

export function WishlistScreen() {
  const { wishlist, addWishlistItem, updateWishlistItem, removeWishlistItem, loading } = useLivingStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showBought, setShowBought] = useState(false)

  const want = wishlist.filter((w) => w.status === 'want')
  const bought = wishlist.filter((w) => w.status === 'bought')

  function openAdd() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(id: string) {
    const w = wishlist.find((x) => x.id === id)
    if (!w) return
    setEditId(id)
    setForm({ name: w.name, url: w.url ?? '', price: w.price ?? '', notes: w.notes ?? '' })
    setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }

  async function handleSave() {
    if (!form.name.trim()) return
    const data = { name: form.name, url: form.url || null, price: form.price || null, notes: form.notes || null }
    if (editId) {
      updateWishlistItem(editId, data)
      try { await svc.updateWishlistItem(editId, data) } catch {}
    } else {
      const row = { user_id: USER_ID, ...data, status: 'want' as const }
      try { addWishlistItem(await svc.insertWishlistItem(row)) } catch {
        addWishlistItem({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      }
    }
    closeForm()
  }

  async function markBought(id: string) {
    updateWishlistItem(id, { status: 'bought' })
    try { await svc.updateWishlistItem(id, { status: 'bought' }) } catch {}
  }

  async function handleDelete(id: string) {
    removeWishlistItem(id)
    try { await svc.deleteWishlistItem(id) } catch {}
  }

  if (loading) return <SkeletonRow count={6} />

  function WishCard({ id, name, url, price, notes, showActions }: {
    id: string; name: string; url: string | null; price: string | null; notes: string | null; showActions: boolean
  }) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <Stack gap={2} style={{ flex: 1 }}>
            <Text fw={600}>{name}</Text>
            <Group gap="md">
              {price && <Badge size="xs" variant="light" color="green">{price}</Badge>}
              {url && <Text size="xs" c="blue" component="a" href={url} target="_blank" onClick={(e: React.MouseEvent) => e.stopPropagation()}>link ↗</Text>}
            </Group>
            {notes && <Text size="xs" c="dimmed">{notes}</Text>}
          </Stack>
          {showActions && (
            <Group gap={4}>
              <ActionIcon variant="subtle" size="xs" color="green" onClick={() => markBought(id)}>✓</ActionIcon>
              <ActionIcon variant="subtle" size="xs" onClick={() => openEdit(id)}>✎</ActionIcon>
              <ActionIcon variant="subtle" size="xs" color="red" onClick={() => handleDelete(id)}>✕</ActionIcon>
            </Group>
          )}
        </Group>
      </Paper>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <SectionLabel>{S.WISHLIST}</SectionLabel>
        <Button variant="subtle" size="xs" onClick={openAdd}>{S.ADD_WISH}</Button>
      </Group>

      {!want.length && !bought.length ? (
        <EmptyState icon="🎁" message={S.EMPTY_WISHLIST} sub={S.EMPTY_WISHLIST_SUB} />
      ) : (
        <Stack gap="md">
          <SortableList items={want} onReorder={(r) => persistOrder(r, (id, d) => updateWishlistItem(id, d), (id, d) => svc.updateWishlistItem(id, d))} renderItem={(w) => (
            <WishCard id={w.id} name={w.name} url={w.url} price={w.price} notes={w.notes} showActions />
          )} />
        </Stack>
      )}

      {bought.length > 0 && (
        <>
          <Button variant="subtle" size="xs" color="gray" onClick={() => setShowBought(!showBought)}>
            {showBought ? 'Hide' : 'Show'} {bought.length} {S.BOUGHT.toLowerCase()}
          </Button>
          {showBought && (
            <Stack gap="md" opacity={0.5}>
              {bought.map((w) => (
                <WishCard key={w.id} id={w.id} name={w.name} url={w.url} price={w.price} notes={w.notes} showActions={false} />
              ))}
            </Stack>
          )}
        </>
      )}

      <Modal opened={showForm} onClose={closeForm} title={editId ? form.name : S.ADD_WISH}>
        <Stack>
          <TextInput label={S.FIELD_NAME} value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} placeholder={S.PH_WISH_NAME} data-autofocus />
          <TextInput label={S.FIELD_URL} value={form.url} onChange={(e) => setForm({ ...form, url: e.currentTarget.value })} placeholder={S.PH_URL} />
          <TextInput label={S.FIELD_PRICE} value={form.price} onChange={(e) => setForm({ ...form, price: e.currentTarget.value })} placeholder="$49.99" />
          <TextInput label={S.FIELD_NOTES_OPT} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeForm}>{S.CANCEL}</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{S.SAVE}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
