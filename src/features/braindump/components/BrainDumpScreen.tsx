import { useState, useEffect, useRef } from 'react'
import {
  Stack,
  Group,
  Text,
  Paper,
  Box,
  ActionIcon,
  Textarea,
  Button,
  Badge,
  Collapse,
  Menu,
} from '@mantine/core'
import { useBrainDumpStore } from '../store/brainDumpStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import {
  deleteBrainDumpItem,
  fetchBrainDump,
  insertBrainDumpItem,
  triageItem,
  updateBrainDumpItem,
} from '../services/brainDumpService'
import { BrainDumpItem, TriageTarget } from '../types/brainDump.types'
import {
  TASK_STATUS,
  TASK_TYPE,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import { updateBrainDumpFields } from '../services/brainDumpService'
import { ArrowRight, CheckCircle, Sparkle, Trash } from '@phosphor-icons/react'
import { ListsSection } from '../../inbox/ListsSection'
import { CustomList } from '../../inbox/types'
import * as listSvc from '../../inbox/listService'

export function BrainDumpScreen() {
  const {
    items,
    loading,
    setItems,
    addItem,
    triageItem: triageStore,
    updateItem,
    removeItem,
    setLoading,
  } = useBrainDumpStore()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({})
  const [customLists, setCustomLists] = useState<CustomList[]>([])

  useEffect(() => {
    listSvc.fetchLists().then(setCustomLists).catch(() => {})
  }, [])
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { create: createTask } = useTaskActions()

  useEffect(() => {
    setLoading(true)
    fetchBrainDump()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const untriaged = items.filter((i) => !i.triaged_to)
  const done = items.filter((i) => i.triaged_to)

  async function handleCapture() {
    if (!input.trim() || saving) return
    setSaving(true)
    const row: Omit<BrainDumpItem, 'id' | 'created_at'> = {
      user_id: USER_ID,
      content: input.trim(),
      triaged_to: null,
      triaged_at: null,
      snoozed_until: null,
    }
    try {
      const created = await insertBrainDumpItem(row)
      addItem(created)
    } catch {
      addItem({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setInput('')
    setSaving(false)
    textareaRef.current?.focus()
  }

  async function handleTriage(item: BrainDumpItem, target: TriageTarget) {
    triageStore(item.id, target)
    try {
      await triageItem(item.id, target)
    } catch {}

    // If triaged to task, create it in the task store
    if (target === 'task') {
      await createTask({
        user_id: USER_ID,
        title: item.content,
        notes: null,
        type: TASK_TYPE.PERSONAL,
        priority: null,
        is_must: false,
        status: TASK_STATUS.TODO,
        due_date: null,
        do_today: false,
        completed_at: null,
        goal_id: null,
        milestone_id: null,
        project_id: null,
        roadmap_item_id: null,
        calendar_event_id: null,
        parent_task_id: null,
        ticket_id: null,
        order_index: 0,
        cadence: null,
        cadence_days: null,
        cadence_date: null,
        cadence_interval: null,
        push_count: 0, sprint_id: null, blocked: false, blocked_note: null,
        is_learning: false,
      })
    }
  }

  async function handleTriageToList(item: BrainDumpItem, listId: string) {
    triageStore(item.id, 'list')
    try {
      await triageItem(item.id, 'list')
      await listSvc.insertListItem({ user_id: USER_ID, list_id: listId, content: item.content, status: 'todo' })
    } catch {}
  }

  async function handleDelete(id: string) {
    removeItem(id)
    try {
      await deleteBrainDumpItem(id)
    } catch {}
  }

  async function handleEdit(id: string, content: string) {
    updateItem(id, content)
    try {
      await updateBrainDumpItem(id, content)
    } catch {}
  }

  async function getAiSuggestion(item: BrainDumpItem) {
    setLoadingAi(item.id)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Given this brain dump item: "${item.content}"
Reply with ONLY one of these words: task, done
- task: if it's something actionable to do
- done: if it can just be acknowledged and cleared
Reply with just the single word, nothing else.`,
            },
          ],
        }),
      })
      const data = await response.json()
      const suggestion = data.content?.[0]?.text?.trim().toLowerCase()
      if (['task', 'done'].includes(suggestion)) {
        setAiSuggestions((prev) => ({ ...prev, [item.id]: suggestion }))
      }
    } catch {
    } finally {
      setLoadingAi(null)
    }
  }

  if (loading) return <SkeletonRow count={6} />

  return (
    <Stack gap="lg">
      {/* Capture box */}
      <Paper p="lg" radius="xl" withBorder>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleCapture()
            }
          }}
          placeholder={STRINGS.BRAINDUMP_PH}
          autosize
          minRows={2}
          radius="lg"
          styles={{ input: { fontSize: 15 } }}
          autoFocus
        />
        <Group justify="flex-end" mt="sm">
          <Text size="xs" c="dimmed">
            Enter to save · Shift+Enter for newline
          </Text>
          <Button
            size="xs"
            radius="xl"
            variant="gradient"
            gradient={{ from: 'violet', to: 'indigo' }}
            onClick={handleCapture}
            disabled={!input.trim()}
            loading={saving}
          >
            Capture
          </Button>
        </Group>
      </Paper>

      {/* Untriaged */}
      {untriaged.length === 0 && done.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">
            🧠
          </Text>
          <Text fw={500} mb={4}>
            Empty mind
          </Text>
          <Text size="sm" c="dimmed">
            Dump anything here — tasks, ideas, things bugging you. Triage later.
          </Text>
        </Paper>
      )}

      {untriaged.length === 0 && done.length > 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">
            ✨
          </Text>
          <Text fw={500}>Inbox zero</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Everything's triaged.
          </Text>
        </Paper>
      )}

      {untriaged.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              To triage · {untriaged.length}
            </Text>
          </Group>
          <Stack gap="md">
            <SortableList items={untriaged} onReorder={(r) => persistOrder(r, () => {}, (id, d) => updateBrainDumpFields(id, d))} renderItem={(item) => (
              <DumpItem
                key={item.id}
                item={item}
                suggestion={aiSuggestions[item.id] as TriageTarget | undefined}
                loadingAi={loadingAi === item.id}
                onTriage={(target) => handleTriage(item, target)}
                onTriageToList={(listId) => handleTriageToList(item, listId)}
                lists={customLists}
                onEdit={(content) => handleEdit(item.id, content)}
                onDelete={() => handleDelete(item.id)}
                onAiSuggest={() => getAiSuggestion(item)}
              />
            )} />
          </Stack>
        </Paper>
      )}

      {/* Done */}
      {done.length > 0 && (
        <Box>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="xl"
            onClick={() => setShowDone((o) => !o)}
            mb="xs"
          >
            {showDone ? 'Hide' : 'Show'} triaged ({done.length})
          </Button>
          <Collapse in={showDone}>
            <Paper p="lg" radius="xl" withBorder>
              <Stack gap="md">
                {done.map((item) => (
                  <Group
                    key={item.id}
                    gap="md"
                    p="md"
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: 'var(--mantine-color-dark-6)',
                      opacity: 0.6,
                    }}
                  >
                    <Badge
                      size="xs"
                      variant="light"
                      color={item.triaged_to === 'task' ? 'blue' : 'green'}
                    >
                      {item.triaged_to}
                    </Badge>
                    <Text size="sm" style={{ flex: 1 }} td="line-through">
                      {item.content}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash size={12} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Collapse>
        </Box>
      )}

      {/* Custom Lists */}
      <ListsSection onListsChanged={setCustomLists} />
    </Stack>
  )
}

// ─── DumpItem ─────────────────────────────────────────────────────────────────

function DumpItem({
  item,
  suggestion,
  loadingAi,
  onTriage,
  onTriageToList,
  lists,
  onEdit,
  onDelete,
  onAiSuggest,
}: {
  item: BrainDumpItem
  suggestion?: TriageTarget
  loadingAi: boolean
  onTriage: (target: TriageTarget) => void
  onTriageToList: (listId: string) => void
  lists: CustomList[]
  onEdit: (content: string) => void
  onDelete: () => void
  onAiSuggest: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.content)

  function save() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.content) onEdit(trimmed)
    setEditing(false)
  }

  return (
    <Box
      p="md"
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        background: 'var(--mantine-color-dark-6)',
        border: '0.5px solid var(--mantine-color-gray-2)',
      }}
    >
      <Group justify="space-between" mb="xs" align="flex-start">
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') {
                setDraft(item.content)
                setEditing(false)
              }
            }}
            autosize
            minRows={1}
            radius="lg"
            size="sm"
            style={{ flex: 1 }}
            autoFocus
          />
        ) : (
          <Text
            size="sm"
            style={{ flex: 1, lineHeight: 1.5, cursor: 'pointer' }}
            onClick={() => {
              setDraft(item.content)
              setEditing(true)
            }}
          >
            {item.content}
          </Text>
        )}
        <ActionIcon variant="subtle" color="red" size="xs" onClick={onDelete}>
          <Trash size={12} />
        </ActionIcon>
      </Group>

      <Group gap="md" align="center">
        <Button
          size="xs"
          variant={suggestion === 'task' ? 'filled' : 'light'}
          color="blue"
          radius="xl"
          leftSection={<ArrowRight size={11} />}
          onClick={() => onTriage('task')}
        >
          Task
        </Button>
        <Button
          size="xs"
          variant={suggestion === 'done' ? 'filled' : 'light'}
          color="green"
          radius="xl"
          leftSection={<CheckCircle size={11} />}
          onClick={() => onTriage('done')}
        >
          Done
        </Button>

        {lists.length > 0 && (
          <Menu position="bottom-start" withArrow>
            <Menu.Target>
              <Button size="xs" variant="light" color="violet" radius="xl">📋 List</Button>
            </Menu.Target>
            <Menu.Dropdown>
              {lists.map((l) => (
                <Menu.Item key={l.id} onClick={() => onTriageToList(l.id)}>
                  {l.emoji} {l.title}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}

        {!suggestion && (
          <ActionIcon
            variant="subtle"
            color="violet"
            size="sm"
            radius="xl"
            onClick={onAiSuggest}
            loading={loadingAi}
            title={STRINGS.AI_SUGGEST}
          >
            <Sparkle size={13} />
          </ActionIcon>
        )}

        {suggestion && (
          <Text size="xs" c="violet">
            AI → {suggestion}
          </Text>
        )}
      </Group>
    </Box>
  )
}
