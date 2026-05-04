import {
  Stack, Group, Text, TextInput, Button, Checkbox, ActionIcon, Modal, Badge,
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useHealthStore } from '../store/healthStore'
import * as svc from '../services/shoppingService'
import * as favSvc from '../services/shoppingFavService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { STRINGS as S } from '../constants/strings'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { ShoppingFavorite } from '../types/health.types'
import { Plus, Trash, GearSix } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

export function ShoppingScreen() {
  const { shoppingItems, addShoppingItem, updateShoppingItem, removeShoppingItem, loading } = useHealthStore()
  const [newItem, setNewItem] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [favorites, setFavorites] = useState<ShoppingFavorite[]>([])
  const [newFav, setNewFav] = useState('')
  const [showManage, setShowManage] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const todo = shoppingItems.filter((i) => i.status === 'todo')
  const done = shoppingItems.filter((i) => i.status === 'done')

  useEffect(() => {
    favSvc.fetchFavorites().then(setFavorites).catch(() => {})
  }, [])

  async function addItem(name?: string) {
    const text = name ?? newItem
    if (!text.trim()) return
    const row = { user_id: USER_ID, name: text.trim(), status: 'todo' as const }
    try { addShoppingItem(await svc.insertShoppingItem(row)) } catch {
      addShoppingItem({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    }
    if (!name) setNewItem('')
  }

  async function toggleItem(id: string, current: 'todo' | 'done') {
    const next = current === 'todo' ? 'done' : 'todo'
    updateShoppingItem(id, { status: next })
    try { await svc.updateShoppingItem(id, { status: next }) } catch {}
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    updateShoppingItem(id, { name: editText.trim() })
    try { await svc.updateShoppingItem(id, { name: editText.trim() }) } catch {}
    setEditId(null)
  }

  async function deleteItem(id: string) {
    removeShoppingItem(id)
    try { await svc.deleteShoppingItem(id) } catch {}
  }

  async function addFavorite() {
    if (!newFav.trim()) return
    try {
      const fav = await favSvc.insertFavorite(newFav.trim())
      setFavorites((f) => [...f, fav])
    } catch {}
    setNewFav('')
  }

  async function removeFavorite(id: string) {
    setFavorites((f) => f.filter((x) => x.id !== id))
    try { await favSvc.deleteFavorite(id) } catch {}
  }

  const navigate = useNavigate()

  if (loading) return <SkeletonRow count={5} />

  return (
    <Stack gap="md">
      {/* Quick add */}
      <Group gap="xs">
        <TextInput flex={1} size="sm" value={newItem}
          onChange={(e) => setNewItem(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={S.PH_SHOPPING} radius="lg" />
        <Button size="sm" radius="xl" onClick={() => addItem()}>Add</Button>
        <Button size="xs" radius="xl" variant="subtle" color="teal"
          onClick={() => navigate('/health/thali?tab=options')}>
          🍽️ Meal Options
        </Button>
      </Group>

      {/* Usual items — compact chips */}
      {favorites.length > 0 && (
        <Group gap={6} wrap="wrap">
          {favorites.map((f) => {
            const added = todo.some((t) => t.name.toLowerCase() === f.name.toLowerCase())
            return (
              <Badge key={f.id} size="lg" radius="xl" variant={added ? 'filled' : 'outline'}
                color={added ? 'green' : 'gray'}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (added) {
                    const item = todo.find((t) => t.name.toLowerCase() === f.name.toLowerCase())
                    if (item) deleteItem(item.id)
                  } else {
                    addItem(f.name)
                  }
                }}>
                {added ? '✓' : '+'} {f.name}
              </Badge>
            )
          })}
          <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => setShowManage(true)}>
            <GearSix size={14} />
          </ActionIcon>
        </Group>
      )}

      {favorites.length === 0 && (
        <Button variant="subtle" size="xs" color="teal" radius="xl" leftSection={<Plus size={12} />}
          onClick={() => setShowManage(true)}>
          Add usual items
        </Button>
      )}

      {/* Shopping list */}
      {!todo.length && !done.length ? (
        <EmptyState icon="🛒" message={S.EMPTY_SHOPPING} />
      ) : (
        <Stack gap={4}>
          <SortableList items={todo} onReorder={(r) => persistOrder(r, (id, d) => updateShoppingItem(id, d), (id, d) => svc.updateShoppingItem(id, d))} renderItem={(item) => (
            <Group gap="sm" py={6} px={4}>
              <Checkbox size="xs" radius="xl" checked={false} onChange={() => toggleItem(item.id, 'todo')} />
              {editId === item.id ? (
                <TextInput size="xs" value={editText}
                  onChange={(e) => setEditText(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditId(null) }}
                  style={{ flex: 1 }} autoFocus />
              ) : (
                <Text size="sm" style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => { setEditId(item.id); setEditText(item.name) }}>
                  {item.name}
                </Text>
              )}
              <ActionIcon variant="subtle" size="xs" color="red" onClick={() => deleteItem(item.id)}>
                <Trash size={12} />
              </ActionIcon>
            </Group>
          )} />
        </Stack>
      )}

      {/* Done */}
      {done.length > 0 && (
        <Button variant="subtle" size="xs" color="gray" onClick={() => setShowDone(!showDone)}>
          {showDone ? 'Hide' : 'Show'} {done.length} done
        </Button>
      )}
      {showDone && done.map((item) => (
        <Group key={item.id} gap="sm" py={4} px={4} opacity={0.4}>
          <Checkbox size="xs" radius="xl" checked onChange={() => toggleItem(item.id, 'done')} />
          <Text size="sm" td="line-through" style={{ flex: 1 }}>{item.name}</Text>
        </Group>
      ))}

      {/* Manage usual items modal */}
      <Modal opened={showManage} onClose={() => setShowManage(false)} title="⭐ Usual Items" radius="xl" size="sm">
        <Stack gap="sm">
          <Text size="xs" c="dimmed">Drag to reorder. Tap to quick-add to your list.</Text>
          <SortableList items={favorites} onReorder={(r) => { setFavorites(r); persistOrder(r, () => {}, (id, d) => favSvc.updateFavorite(id, d)) }} renderItem={(f) => (
            <Group justify="space-between" py={4}>
              <Text size="sm">{f.name}</Text>
              <ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeFavorite(f.id)}>
                <Trash size={12} />
              </ActionIcon>
            </Group>
          )} />
          <Group gap="xs">
            <TextInput value={newFav} onChange={(e) => setNewFav(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFavorite()}
              placeholder="Eggs, Milk, Bread..." radius="lg" size="sm" style={{ flex: 1 }} />
            <Button size="sm" radius="xl" color="teal" onClick={addFavorite}>Add</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
