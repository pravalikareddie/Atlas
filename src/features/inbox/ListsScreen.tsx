import { useState, useEffect } from 'react'
import {
  Stack, Group, Text, Paper, Button, TextInput, ActionIcon, Badge,
  UnstyledButton, Modal, Checkbox,
} from '@mantine/core'
import { Plus, Trash, CaretLeft } from '@phosphor-icons/react'
import { USER_ID } from '../tasks/constants/taskConstants'
import { CustomList, CustomListItem } from './types'
import * as svc from './listService'
import { SortableList } from '../../shared/components/SortableList'
import { persistOrder } from '../../shared/utils/persistOrder'

export function ListsScreen() {
  const [lists, setLists] = useState<CustomList[]>([])
  const [activeList, setActiveList] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('📋')

  useEffect(() => {
    svc.fetchLists().then(setLists).catch(() => {})
  }, [])

  async function createList() {
    if (!newTitle.trim()) return
    try {
      const list = await svc.insertList({ user_id: USER_ID, title: newTitle.trim(), emoji: newEmoji || '📋' })
      setLists((l) => [...l, list])
    } catch {}
    setNewTitle('')
    setNewEmoji('📋')
    setShowCreate(false)
  }

  async function deleteList(id: string) {
    setLists((l) => l.filter((x) => x.id !== id))
    try { await svc.deleteList(id) } catch {}
    if (activeList === id) setActiveList(null)
  }

  if (activeList) {
    const list = lists.find((l) => l.id === activeList)
    if (!list) return null
    return <ListDetail list={list} onBack={() => setActiveList(null)} />
  }

  return (
    <Stack gap="md">
      {lists.length === 0 && !showCreate && (
        <Paper p="xl" radius="lg" withBorder ta="center">
          <Text size="xl" mb="xs">📋</Text>
          <Text fw={600} mb={4}>No lists yet</Text>
          <Text size="sm" c="dimmed" mb="md">Create lists for wedding planning, trip research, or anything.</Text>
          <Button radius="xl" color="teal" onClick={() => setShowCreate(true)} leftSection={<Plus size={14} />}>
            New List
          </Button>
        </Paper>
      )}

      <SortableList
        items={lists}
        onReorder={(r) => persistOrder(r, () => {}, (id, d) => svc.updateList(id, d))}
        renderItem={(list) => (
          <Paper p="md" radius="lg" withBorder style={{ cursor: 'pointer' }} onClick={() => setActiveList(list.id)}>
            <Group justify="space-between">
              <Group gap="sm">
                <Text style={{ fontSize: 20 }}>{list.emoji}</Text>
                <Text fw={600}>{list.title}</Text>
              </Group>
              <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteList(list.id)}>
                  <Trash size={14} />
                </ActionIcon>
                <Text c="dimmed">→</Text>
              </Group>
            </Group>
          </Paper>
        )}
      />

      {lists.length > 0 && !showCreate && (
        <Button variant="light" color="teal" radius="xl" size="sm" leftSection={<Plus size={14} />}
          onClick={() => setShowCreate(true)} w="fit-content">
          New List
        </Button>
      )}

      <Modal opened={showCreate} onClose={() => setShowCreate(false)} title="New List" radius="xl" size="sm">
        <Stack gap="md">
          <Group gap="sm">
            <TextInput value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} w={60} placeholder="📋" radius="lg" />
            <TextInput value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              placeholder="Wedding, Trip to Japan, Research..." radius="lg" style={{ flex: 1 }} autoFocus />
          </Group>
          <Button radius="xl" color="teal" onClick={createList} disabled={!newTitle.trim()}>Create</Button>
        </Stack>
      </Modal>
    </Stack>
  )
}

function ListDetail({ list, onBack }: { list: CustomList; onBack: () => void }) {
  const [items, setItems] = useState<CustomListItem[]>([])
  const [newText, setNewText] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    svc.fetchListItems(list.id).then(setItems).catch(() => {})
  }, [list.id])

  const todo = items.filter((i) => i.status === 'todo')
  const done = items.filter((i) => i.status === 'done')

  async function addItem() {
    if (!newText.trim()) return
    const row = { user_id: USER_ID, list_id: list.id, content: newText.trim(), status: 'todo' as const }
    try {
      const item = await svc.insertListItem(row)
      setItems((prev) => [...prev, item])
    } catch {
      setItems((prev) => [...prev, { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }])
    }
    setNewText('')
  }

  async function toggleItem(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const status = item.status === 'todo' ? 'done' : 'todo'
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
    try { await svc.updateListItem(id, { status }) } catch {}
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try { await svc.deleteListItem(id) } catch {}
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, content: editText.trim() } : i))
    try { await svc.updateListItem(id, { content: editText.trim() }) } catch {}
    setEditId(null)
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <UnstyledButton onClick={onBack}>
          <CaretLeft size={16} />
        </UnstyledButton>
        <Text style={{ fontSize: 20 }}>{list.emoji}</Text>
        <Text size="lg" fw={800}>{list.title}</Text>
        <Badge variant="light" color="teal">{todo.length} open</Badge>
      </Group>

      <SortableList
        items={todo}
        onReorder={(r) => persistOrder(r, () => {}, (id, d) => svc.updateListItem(id, d))}
        renderItem={(item) => (
          <Group gap="sm" py={6}>
            <Checkbox size="xs" radius="xl" checked={false} onChange={() => toggleItem(item.id)} />
            {editId === item.id ? (
              <TextInput value={editText} onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditId(null) }}
                size="xs" style={{ flex: 1 }} autoFocus />
            ) : (
              <Text size="sm" style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => { setEditId(item.id); setEditText(item.content) }}>
                {item.content}
              </Text>
            )}
            <ActionIcon variant="subtle" color="red" size="xs" onClick={() => deleteItem(item.id)}>
              <Trash size={12} />
            </ActionIcon>
          </Group>
        )}
      />

      <Group gap="xs">
        <TextInput value={newText} onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..." radius="lg" size="sm" style={{ flex: 1 }} />
        <Button size="sm" radius="xl" color="teal" onClick={addItem} leftSection={<Plus size={12} />}>Add</Button>
      </Group>

      {done.length > 0 && (
        <>
          <Button variant="subtle" size="xs" color="gray" onClick={() => setShowDone(!showDone)}>
            {showDone ? 'Hide' : 'Show'} {done.length} completed
          </Button>
          {showDone && done.map((item) => (
            <Group key={item.id} gap="sm" py={4} opacity={0.5}>
              <Checkbox size="xs" radius="xl" checked onChange={() => toggleItem(item.id)} />
              <Text size="sm" td="line-through" style={{ flex: 1 }}>{item.content}</Text>
              <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => deleteItem(item.id)}>
                <Trash size={12} />
              </ActionIcon>
            </Group>
          ))}
        </>
      )}
    </Stack>
  )
}
