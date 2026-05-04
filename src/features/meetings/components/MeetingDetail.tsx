import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  Paper,
  Box,
  ActionIcon,
  TextInput,
  Textarea,
  Button,
  Select,
  UnstyledButton,
  Badge,
} from '@mantine/core'
import {
  ArrowLeft,
  Trash,
  Check,
  Plus,
  Sparkle,
  PencilSimple,
} from '@phosphor-icons/react'
import {
  Meeting,
  MEETING_CADENCE_LABEL,
  MEETING_CADENCE_OPTIONS,
  MeetingActionItem,
  MeetingCadence,
} from '../types/meeting.types'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import {
  deleteActionItem,
  fetchActionItems,
  insertActionItem,
  updateActionItem,
  updateMeeting,
} from '../services/meetingService'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { useMeetingData } from '../hooks/useMeetingData'
import { useMeetingStore } from '../store/meetingStore'

export function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useMeetingData()

  const {
    meetings,
    updateMeeting: updateStore,
    actionItems,
    setActionItems,
    addActionItem,
    updateActionItem: updateItemStore,
    removeActionItem,
  } = useMeetingStore()
  const meeting = meetings.find((m) => m.id === id)

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [cadence, setCadence] = useState<MeetingCadence>('none')
  const [nextDate, setNextDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventDuration, setEventDuration] = useState('')
  const [agenda, setAgenda] = useState('')
  const [notes, setNotes] = useState('')
  const [agendaDirty, setAgendaDirty] = useState(false)
  const [notesDirty, setNotesDirty] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [generatingAgenda, setGeneratingAgenda] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)

  const items = actionItems[id ?? ''] ?? []

  // Sync from store when meeting loads
  useEffect(() => {
    if (!meeting) return
    setTitle(meeting.title)
    setCadence(meeting.cadence)
    setNextDate(meeting.next_date ?? '')
    setEventTime(meeting.event_time ?? '')
    setEventDuration(meeting.event_duration?.toString() ?? '')
    setAgenda(meeting.agenda ?? '')
    setNotes(meeting.notes ?? '')
  }, [meeting?.id])

  // Load action items
  useEffect(() => {
    if (!id || actionItems[id]) return
    setLoadingItems(true)
    fetchActionItems(id)
      .then((items) => setActionItems(id, items))
      .catch(() => setActionItems(id, []))
      .finally(() => setLoadingItems(false))
  }, [id])

  if (!meeting) return <SkeletonRow count={8} />

  // ─── Save handlers ────────────────────────────────────────────────────────

  async function saveField(
    field: Partial<Omit<Meeting, 'id' | 'user_id' | 'created_at'>>,
  ) {
    updateStore(meeting!.id, field)
    try {
      await updateMeeting(meeting!.id, field)
    } catch {}
  }

  async function saveAgenda() {
    setAgendaDirty(false)
    await saveField({ agenda })
  }

  async function saveNotes() {
    setNotesDirty(false)
    await saveField({ notes })
  }

  async function saveTitle() {
    if (!title.trim()) return
    setEditingTitle(false)
    await saveField({ title: title.trim() })
  }

  async function handleAddItem() {
    if (!newItem.trim()) return
    const row: Omit<MeetingActionItem, 'id' | 'created_at'> = {
      user_id: USER_ID,
      meeting_id: meeting!.id,
      title: newItem.trim(),
      done: false,
      due_date: null,
    }
    setNewItem('')
    try {
      const created = await insertActionItem(row)
      addActionItem(created)
    } catch {
      addActionItem({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
  }

  async function toggleItem(item: MeetingActionItem) {
    updateItemStore(item.id, { done: !item.done })
    try {
      await updateActionItem(item.id, { done: !item.done })
    } catch {}
  }

  async function handleDeleteItem(id: string) {
    removeActionItem(id)
    try {
      await deleteActionItem(id)
    } catch {}
  }

  // ─── AI Agenda Generation ─────────────────────────────────────────────────

  async function generateAgenda() {
    setGeneratingAgenda(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Generate a concise, practical agenda for a "${meeting!.title}" meeting (${MEETING_CADENCE_LABEL[meeting!.cadence]}).
Format as a numbered list of 4-6 talking points. Be specific and actionable. No preamble, just the list.
${meeting!.notes ? `Context from past notes: ${meeting!.notes.slice(0, 300)}` : ''}`,
            },
          ],
        }),
      })
      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      if (text) {
        setAgenda(text)
        setAgendaDirty(true)
      }
    } catch {
    } finally {
      setGeneratingAgenda(false)
    }
  }

  const openItems = items.filter((i) => !i.done)
  const doneItems = items.filter((i) => i.done)

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-violet-6), var(--mantine-color-indigo-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group mb="md">
          <ActionIcon
            variant="white"
            color="violet"
            radius="xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </ActionIcon>
        </Group>

        {editingTitle ? (
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            styles={{
              input: {
                fontSize: 22,
                fontWeight: 800,
                background: 'transparent',
                color: 'white',
                border: 'none',
                borderBottom: '2px solid rgba(255,255,255,0.5)',
              },
            }}
            autoFocus
          />
        ) : (
          <Group gap="xs" align="center">
            <Text fw={800} c="white" style={{ fontSize: 22, flex: 1 }}>
              {meeting.title}
            </Text>
            <ActionIcon
              variant="transparent"
              onClick={() => setEditingTitle(true)}
            >
              <PencilSimple size={16} color="rgba(255,255,255,0.7)" />
            </ActionIcon>
          </Group>
        )}

        <Group gap="sm" mt="sm">
          <Badge variant="white" color="violet">
            {MEETING_CADENCE_LABEL[meeting.cadence]}
          </Badge>
          {meeting.next_date && (
            <Text size="xs" c="white" opacity={0.8}>
              Next: {meeting.next_date}
            </Text>
          )}
        </Group>
      </Box>

      {/* Cadence + Next date */}
      <Paper p="lg" radius="xl" withBorder>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
          Details
        </Text>
        <Group grow>
          <Select
            label="Cadence"
            value={cadence}
            onChange={(v) => {
              if (!v) return
              setCadence(v as MeetingCadence)
              saveField({ cadence: v as MeetingCadence })
            }}
            data={MEETING_CADENCE_OPTIONS}
            radius="lg"
            size="sm"
          />
          <TextInput
            label="Next date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            onBlur={() => saveField({ next_date: nextDate || null })}
            type="date"
            radius="lg"
            size="sm"
          />
        </Group>
        <Group grow mt="sm">
          <TextInput
            label="Time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            onBlur={() => saveField({ event_time: eventTime || null })}
            type="time"
            radius="lg"
            size="sm"
          />
          <TextInput
            label="Duration (min)"
            value={eventDuration}
            onChange={(e) => setEventDuration(e.target.value)}
            onBlur={() =>
              saveField({
                event_duration: eventDuration ? parseInt(eventDuration) : null,
              })
            }
            type="number"
            placeholder="30"
            radius="lg"
            size="sm"
          />
        </Group>
      </Paper>

      {/* Agenda */}
      <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" mb="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Agenda
          </Text>
          <Button
            size="xs"
            variant="light"
            color="violet"
            radius="xl"
            leftSection={<Sparkle size={12} />}
            onClick={generateAgenda}
            loading={generatingAgenda}
          >
            AI Generate
          </Button>
        </Group>
        <Textarea
          value={agenda}
          onChange={(e) => {
            setAgenda(e.target.value)
            setAgendaDirty(true)
          }}
          placeholder="What will you cover? E.g.&#10;1. Status updates&#10;2. Blockers&#10;3. Next steps"
          minRows={4}
          radius="lg"
          autosize
        />
        {agendaDirty && (
          <Group justify="flex-end" mt="xs">
            <Button size="xs" radius="xl" color="violet" onClick={saveAgenda}>
              Save agenda
            </Button>
          </Group>
        )}
      </Paper>

      {/* Notes */}
      <Paper p="lg" radius="xl" withBorder>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
          Notes
        </Text>
        <Textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setNotesDirty(true)
          }}
          placeholder="Meeting notes, decisions, context..."
          minRows={4}
          radius="lg"
          autosize
        />
        {notesDirty && (
          <Group justify="flex-end" mt="xs">
            <Button size="xs" radius="xl" color="violet" onClick={saveNotes}>
              Save notes
            </Button>
          </Group>
        )}
      </Paper>

      {/* Action Items */}
      <Paper p="lg" radius="xl" withBorder>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
          Action Items {openItems.length > 0 && `· ${openItems.length} open`}
        </Text>

        {loadingItems ? (
          <SkeletonRow count={3} />
        ) : (
          <Stack gap="xs">
            <SortableList items={openItems} onReorder={(r) => persistOrder(r, (id, d) => updateItemStore(id, d), (id, d) => updateActionItem(id, d))} renderItem={(item) => (
              <ActionItemRow
                item={item}
                onToggle={() => toggleItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            )} />

            {/* Quick add */}
            <Group gap="xs" mt="xs">
              <TextInput
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder={STRINGS.ADD_ACTION_ITEM_PH}
                size="xs"
                radius="lg"
                style={{ flex: 1 }}
              />
              <ActionIcon
                color="violet"
                variant="light"
                radius="xl"
                onClick={handleAddItem}
                disabled={!newItem.trim()}
              >
                <Plus size={14} />
              </ActionIcon>
            </Group>

            {/* Done items */}
            {doneItems.length > 0 && (
              <Box mt="sm">
                <Text size="xs" c="dimmed" fw={600} mb="xs">
                  Done ({doneItems.length})
                </Text>
                <Stack gap="xs">
                  {doneItems.map((item) => (
                    <ActionItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggleItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

// ─── ActionItemRow ────────────────────────────────────────────────────────────

function ActionItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: MeetingActionItem
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <Group
      p="xs"
      gap="sm"
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        background: 'var(--mantine-color-dark-6)',
      }}
    >
      <UnstyledButton
        onClick={onToggle}
        w={20}
        h={20}
        style={{
          borderRadius: '50%',
          flexShrink: 0,
          border: item.done
            ? 'none'
            : '2px solid var(--mantine-color-violet-4)',
          background: item.done
            ? 'var(--mantine-color-green-5)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.done && <Check size={11} color="white" weight="bold" />}
      </UnstyledButton>
      <Text
        size="sm"
        fw={600}
        style={{
          flex: 1,
          textDecoration: item.done ? 'line-through' : 'none',
          opacity: item.done ? 0.5 : 1,
        }}
      >
        {item.title}
      </Text>
      <ActionIcon variant="subtle" color="red" size="xs" onClick={onDelete}>
        <Trash size={12} />
      </ActionIcon>
    </Group>
  )
}
