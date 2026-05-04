import { useState } from 'react'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { useNavigate } from 'react-router-dom'
import { useMeetingData } from '../hooks/useMeetingData'
import { useMeetingStore } from '../store/meetingStore'
import { Meeting, MEETING_CADENCE_LABEL, MEETING_CADENCE_OPTIONS, MeetingCadence } from '../types/meeting.types'
import { deleteMeeting, insertMeeting, updateMeeting } from '../services/meetingService'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { ActionIcon, Badge, Box, Button, Group, Modal, Paper, Select, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { CaretRight, Check, Plus, Trash } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'


export function MeetingsScreen() {
  useMeetingData()
  const { meetings, addMeeting, removeMeeting, loading } = useMeetingStore()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const navigate = useNavigate()

  if (loading) return <SkeletonRow count={6} />

  async function handleDelete(id: string) {
    removeMeeting(id)
    try { await deleteMeeting(id) } catch {}
    setConfirmDelete(null)
  }

  async function handleCreate(data: { title: string; cadence: MeetingCadence; next_date: string; event_time: string; event_duration: string }) {
    const row: Omit<Meeting, 'id' | 'created_at'> = {
      user_id: USER_ID,
      title: data.title,
      cadence: data.cadence,
      next_date: data.next_date || null,
      event_time: data.event_time || null,
      event_duration: data.event_duration ? parseInt(data.event_duration) : null,
      agenda: null,
      notes: null,
      last_done: null,
    }
    try {
      const created = await insertMeeting(row)
      addMeeting(created)
    } catch {
      addMeeting({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    }
    setShowAdd(false)
  }

  const recurring = meetings.filter((m) => m.cadence !== 'none').sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const adhoc = meetings.filter((m) => m.cadence === 'none').sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  return (
    <Stack gap="lg">
      {/* Top bar */}
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} tracked
        </Text>
        <Button
          variant="light"
          color="violet"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => setShowAdd(true)}
        >
          New
        </Button>
      </Group>

      {/* Recurring */}
      {recurring.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="md">Recurring</Text>
          <Stack gap="md">
            <SortableList items={recurring} onReorder={(r) => persistOrder(r, (id, d) => useMeetingStore.getState().updateMeeting(id, d), (id, d) => updateMeeting(id, d))} renderItem={(m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                onOpen={() => navigate(`/growth/meetings/${m.id}`)}
                onDelete={() => setConfirmDelete(m.id)}
                onDone={() => { const done = m.last_done === format(new Date(), "yyyy-MM-dd") ? null : format(new Date(), "yyyy-MM-dd"); updateMeeting(m.id, { last_done: done }).catch(() => {}); useMeetingStore.getState().updateMeeting(m.id, { last_done: done }) }}
                confirming={confirmDelete === m.id}
                onCancelDelete={() => setConfirmDelete(null)}
                onConfirmDelete={() => handleDelete(m.id)}
              />
            )} />
          </Stack>
        </Paper>
      )}

      {/* Ad hoc */}
      {adhoc.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Text  size="xs" fw={700} tt="uppercase" c="dimmed" mb="md">Ad hoc</Text>
          <Stack gap="md">
            <SortableList items={adhoc} onReorder={(r) => persistOrder(r, (id, d) => useMeetingStore.getState().updateMeeting(id, d), (id, d) => updateMeeting(id, d))} renderItem={(m) => (
              <MeetingRow
                meeting={m}
                onOpen={() => navigate(`/growth/meetings/${m.id}`)}
                onDelete={() => setConfirmDelete(m.id)}
                onDone={() => { const done = m.last_done === format(new Date(), "yyyy-MM-dd") ? null : format(new Date(), "yyyy-MM-dd"); updateMeeting(m.id, { last_done: done }).catch(() => {}); useMeetingStore.getState().updateMeeting(m.id, { last_done: done }) }}
                confirming={confirmDelete === m.id}
                onCancelDelete={() => setConfirmDelete(null)}
                onConfirmDelete={() => handleDelete(m.id)}
              />
            )} />
          </Stack>
        </Paper>
      )}

      {meetings.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">🤝</Text>
          <Text fw={600} mb={4}>No meetings yet</Text>
          <Text size="sm" c="dimmed">Add your 1:1s, standups, and ad hoc meetings.</Text>
        </Paper>
      )}

      <AddMeetingModal
        opened={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={handleCreate}
      />
    </Stack>
  )
}

// ─── MeetingRow ───────────────────────────────────────────────────────────────

function MeetingRow({
  meeting, onOpen, onDelete, onDone, confirming, onCancelDelete, onConfirmDelete,
}: {
  meeting: Meeting
  onOpen: () => void
  onDelete: () => void
  onDone: () => void
  confirming: boolean
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const isDone = meeting.last_done === today

  if (confirming) {
    return (
      <Group justify="space-between" p="md"
        style={{ borderRadius: 'var(--mantine-radius-lg)', background: 'rgba(240, 80, 80, 0.1)' }}>
        <Text size="sm" c="white">Delete "{meeting.title}"?</Text>
        <Group gap="md">
          <Button size="xs" color="red" radius="xl" onClick={onConfirmDelete}>Yes</Button>
          <Button size="xs" variant="default" radius="xl" onClick={onCancelDelete}>No</Button>
        </Group>
      </Group>
    )
  }

  return (
    <UnstyledButton onClick={onOpen} style={{ width: '100%' }}>
      <Group
        p="md"
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          background: 'var(--mantine-color-dark-6)',
          cursor: 'pointer',
          opacity: isDone ? 0.5 : 1,
        }}
        justify="space-between"
      >
        <Group gap="md" style={{ flex: 1 }}>
          <UnstyledButton
            onClick={(e) => { e.stopPropagation(); onDone() }}
            w={22}
            h={22}
            style={{
              borderRadius: '50%',
              flexShrink: 0,
              border: isDone ? 'none' : '2px solid var(--mantine-color-teal-4)',
              backgroundColor: isDone ? 'var(--mantine-color-green-5)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDone && <Check size={12} color="white" weight="bold" />}
          </UnstyledButton>
          <Box>
            <Text size="sm" fw={600} td={isDone ? 'line-through' : undefined}>{meeting.title}</Text>
            <Group gap="md" mt={2}>
              <Badge size="xs" variant="light" color="violet">
                {MEETING_CADENCE_LABEL[meeting.cadence]}
              </Badge>
              {meeting.next_date && (
                <Text size="xs" c="dimmed">Next: {meeting.next_date}</Text>
              )}
            </Group>
          </Box>
        </Group>
        <Group gap="md">
          <ActionIcon
            variant="subtle" color="red" size="xs"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash size={12} />
          </ActionIcon>
          <CaretRight size={14} color="var(--mantine-color-dimmed)" />
        </Group>
      </Group>
    </UnstyledButton>
  )
}

// ─── AddMeetingModal ──────────────────────────────────────────────────────────

function AddMeetingModal({
  opened, onClose, onCreate,
}: {
  opened: boolean
  onClose: () => void
  onCreate: (data: { title: string; cadence: MeetingCadence; next_date: string; event_time: string; event_duration: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [cadence, setCadence] = useState<MeetingCadence>('weekly')
  const [nextDate, setNextDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventDuration, setEventDuration] = useState('')
  const [err, setErr] = useState(false)

  function handleCreate() {
    if (!title.trim()) { setErr(true); return }
    onCreate({ title: title.trim(), cadence, next_date: nextDate, event_time: eventTime, event_duration: eventDuration })
    setTitle('')
    setCadence('weekly')
    setNextDate('')
    setEventTime('')
    setEventDuration('')
    setErr(false)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Meeting" radius="xl" size="sm">
      <Stack gap="md">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErr(false) }}
          placeholder="e.g. 1:1 with Manager"
          error={err ? 'Title is required' : undefined}
          autoFocus radius="lg"
        />
        <Select
          label="Cadence"
          value={cadence}
          onChange={(v) => v && setCadence(v as MeetingCadence)}
          data={MEETING_CADENCE_OPTIONS}
          radius="lg"
        />
        <TextInput
          label="Next date (optional)"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          type="date"
          radius="lg"
        />
        <Group grow>
          <TextInput
            label="Time (optional)"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            type="time"
            radius="lg"
          />
          <TextInput
            label="Duration (min)"
            value={eventDuration}
            onChange={(e) => setEventDuration(e.target.value)}
            type="number"
            placeholder="30"
            radius="lg"
          />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>Cancel</Button>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'indigo' }}
            radius="xl"
            onClick={handleCreate}
          >
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
