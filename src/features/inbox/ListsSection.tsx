import { useState, useEffect } from 'react'
import {
  Stack, Group, Text, Paper, Button, TextInput, ActionIcon, Badge,
  UnstyledButton, Modal, Checkbox, Menu,
} from '@mantine/core'
import { Plus, Trash, CaretLeft } from '@phosphor-icons/react'
import { USER_ID } from '../tasks/constants/taskConstants'
import { CustomList, CustomListItem } from './types'
import * as svc from './listService'
import { SortableList } from '../../shared/components/SortableList'
import { persistOrder } from '../../shared/utils/persistOrder'
import { useTaskActions } from '../tasks/hooks/useTaskActions'
import { TASK_TYPE, TASK_STATUS } from '../tasks/constants/taskConstants'

export function ListsSection({ onListsChanged }: { onListsChanged?: (lists: CustomList[]) => void }) {
  const [lists, setLists] = useState<CustomList[]>([])
  const [activeList, setActiveList] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('📋')

  function updateLists(newLists: CustomList[]) {
    setLists(newLists)
    onListsChanged?.(newLists)
  }

  useEffect(() => {
    svc.fetchLists().then((l) => { setLists(l); onListsChanged?.(l) }).catch(() => {})
  }, [])

  async function createList() {
    if (!newTitle.trim()) return
    try {
      const list = await svc.insertList({ user_id: USER_ID, title: newTitle.trim(), emoji: newEmoji || '📋' })
      updateLists([...lists, list])
    } catch {}
    setNewTitle('')
    setNewEmoji('📋')
    setShowCreate(false)
  }

  async function deleteList(id: string) {
    updateLists(lists.filter((x) => x.id !== id))
    try { await svc.deleteList(id) } catch {}
    if (activeList === id) setActiveList(null)
  }

  if (activeList) {
    const list = lists.find((l) => l.id === activeList)
    if (!list) return null
    return <ListDetail list={list} allLists={lists} onBack={() => setActiveList(null)} />
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>📋 Lists</Text>
        <Button variant="subtle" color="teal" size="xs" radius="xl" leftSection={<Plus size={12} />}
          onClick={() => setShowCreate(true)}>
          New
        </Button>
      </Group>

      {lists.length === 0 && (
        <Text size="sm" c="dimmed">Create lists for wedding planning, trips, research — anything.</Text>
      )}

      <SortableList
        items={lists}
        onReorder={(r) => { updateLists(r); persistOrder(r, () => {}, (id, d) => svc.updateList(id, d)) }}
        renderItem={(list) => (
          <Paper p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => setActiveList(list.id)}>
            <Group justify="space-between">
              <Group gap="xs">
                <Text>{list.emoji}</Text>
                <Text size="sm" fw={600}>{list.title}</Text>
              </Group>
              <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => deleteList(list.id)}>
                  <Trash size={12} />
                </ActionIcon>
                <Text size="xs" c="dimmed">→</Text>
              </Group>
            </Group>
          </Paper>
        )}
      />

      <Modal opened={showCreate} onClose={() => setShowCreate(false)} title="New List" radius="xl" size="sm">
        <Stack gap="md">
          <Group gap="sm">
            <TextInput value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} w={60} placeholder="📋" radius="lg" />
            <TextInput value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              placeholder="Wedding, Trip to Japan..." radius="lg" style={{ flex: 1 }} autoFocus />
          </Group>
          <Button radius="xl" color="teal" onClick={createList} disabled={!newTitle.trim()}>Create</Button>
        </Stack>
      </Modal>
    </Stack>
  )
}

function ListDetail({ list, allLists, onBack }: { list: CustomList; allLists: CustomList[]; onBack: () => void }) {
  const [items, setItems] = useState<CustomListItem[]>([])
  const [newText, setNewText] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showDone, setShowDone] = useState(false)
  const { create: createTask } = useTaskActions()

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

  async function triageToTask(item: CustomListItem) {
    await createTask({
      user_id: USER_ID, title: item.content, notes: null,
      type: TASK_TYPE.PERSONAL, priority: null, is_must: false,
      status: TASK_STATUS.TODO, due_date: null, do_today: false,
      completed_at: null, goal_id: null, milestone_id: null,
      project_id: null, roadmap_item_id: null, calendar_event_id: null,
      parent_task_id: null, ticket_id: null, order_index: 0,
      cadence: null, cadence_days: null, cadence_date: null,
      cadence_interval: null, push_count: 0, sprint_id: null,
      blocked: false, blocked_note: null, is_learning: false, sprint_status: null,
    })
    deleteItem(item.id)
  }

  async function moveToList(item: CustomListItem, targetListId: string) {
    try {
      await svc.insertListItem({ user_id: USER_ID, list_id: targetListId, content: item.content, status: 'todo' })
    } catch {}
    deleteItem(item.id)
  }

  const otherLists = allLists.filter((l) => l.id !== list.id)

  return (
    <Paper p="lg" radius="xl" withBorder>
      <Stack gap="sm">
        <Group gap="sm">
          <UnstyledButton onClick={onBack}><CaretLeft size={14} /></UnstyledButton>
          <Text>{list.emoji}</Text>
          <Text size="sm" fw={700}>{list.title}</Text>
          <Badge variant="light" color="teal" size="xs">{todo.length}</Badge>
        </Group>

        <SortableList
          items={todo}
          onReorder={(r) => { setItems([...r, ...done]); persistOrder(r, () => {}, (id, d) => svc.updateListItem(id, d)) }}
          renderItem={(item) => (
            <Group gap="sm" py={4}>
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
              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="xs"><Text size="xs">⋯</Text></ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => triageToTask(item)}>✅ Make task</Menu.Item>
                  {otherLists.length > 0 && (
                    <>
                      <Menu.Divider />
                      <Menu.Label>Move to</Menu.Label>
                      {otherLists.map((l) => (
                        <Menu.Item key={l.id} onClick={() => moveToList(item, l.id)}>
                          {l.emoji} {l.title}
                        </Menu.Item>
                      ))}
                    </>
                  )}
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={() => deleteItem(item.id)}>🗑 Delete</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        />

        <Group gap="xs">
          <TextInput value={newText} onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item..." radius="lg" size="xs" style={{ flex: 1 }} />
          <Button size="xs" radius="xl" color="teal" onClick={addItem}>Add</Button>
        </Group>

        {done.length > 0 && (
          <>
            <Button variant="subtle" size="xs" color="gray" onClick={() => setShowDone(!showDone)}>
              {showDone ? 'Hide' : 'Show'} {done.length} done
            </Button>
            {showDone && done.map((item) => (
              <Group key={item.id} gap="sm" py={2} opacity={0.5}>
                <Checkbox size="xs" radius="xl" checked onChange={() => toggleItem(item.id)} />
                <Text size="sm" td="line-through" style={{ flex: 1 }}>{item.content}</Text>
              </Group>
            ))}
          </>
        )}
      </Stack>
    </Paper>
  )
}
