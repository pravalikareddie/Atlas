import {
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  Divider,
  Modal,
  Button,
  Paper,
  Badge,
  ActionIcon,
  Checkbox,
} from '@mantine/core'
import { useState, useMemo, useEffect } from 'react'
import { useHealthStore } from '../store/healthStore'
import {
  insertAppointment,
  updateAppointment as updateApptDb,
  deleteAppointment as deleteApptDb,
} from '../services/appointmentService'
import {
  updateTask,
  deleteTask,
} from '../../tasks/services/taskService'
import { useTaskStore } from '../../tasks/store/taskStore'
import { differenceInDays, differenceInMonths } from 'date-fns'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import { QuickAddModal } from '../../tasks/components/QuickAddModal'
import { TaskDetailSheet } from '../../tasks/components/TaskDetailSheet'
import { Task as AppTask } from '../../tasks/types/task.types'
import { STRINGS as S } from '../constants/strings'
import { HealthAppointment } from '../types/health.types'
import { USER_ID } from '../../tasks/constants/taskConstants'

// ─── Appointment Form ─────────────────────────────────────────────────────────

function ApptFormModal({
  opened,
  initial,
  onSave,
  onClose,
}: {
  opened: boolean
  initial?: HealthAppointment
  onSave: (d: Partial<HealthAppointment>) => void
  onClose: () => void
}) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    appointment_type: initial?.appointment_type ?? 'doctor',
    last_visited: initial?.last_visited ?? '',
    next_appointment: initial?.next_appointment ?? '',
    frequency_months: initial?.frequency_months?.toString() ?? '',
    notes: initial?.notes ?? '',
  })

  useEffect(() => {
    if (initial) {
      setF({
        name: initial.name ?? '',
        appointment_type: initial.appointment_type ?? 'doctor',
        last_visited: initial.last_visited ?? '',
        next_appointment: initial.next_appointment ?? '',
        frequency_months: initial.frequency_months?.toString() ?? '',
        notes: initial.notes ?? '',
      })
    }
  }, [initial?.id])

  function save() {
    if (!f.name.trim()) return
    onSave({
      name: f.name,
      appointment_type: f.appointment_type,
      last_visited: f.last_visited || null,
      next_appointment: f.next_appointment || null,
      frequency_months: f.frequency_months ? parseInt(f.frequency_months) : null,
      notes: f.notes || null,
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title={initial ? f.name : S.ADD_APPOINTMENT}>
      <Stack>
        <TextInput
          label={S.FIELD_NAME}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.currentTarget.value })}
          placeholder={S.PH_APPT_NAME}
          required
          data-autofocus
        />
        <Select
          label={S.FIELD_TYPE}
          value={f.appointment_type}
          onChange={(v) => setF({ ...f, appointment_type: v ?? 'doctor' })}
          data={S.APPT_TYPES}
        />
        <TextInput
          label={S.FIELD_NEXT_APPT}
          type="date"
          value={f.next_appointment}
          onChange={(e) => setF({ ...f, next_appointment: e.currentTarget.value })}
          rightSection={f.next_appointment ? (
            <ActionIcon size="xs" variant="subtle" onClick={() => setF({ ...f, next_appointment: '' })}>✕</ActionIcon>
          ) : undefined}
        />
        <Select
          label={S.FIELD_FREQUENCY}
          value={f.frequency_months}
          onChange={(v) => setF({ ...f, frequency_months: v ?? '' })}
          data={S.FREQ_OPTIONS}
        />
        <TextInput
          label={S.FIELD_NOTES}
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.currentTarget.value })}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>{S.CANCEL}</Button>
          <Button onClick={save} disabled={!f.name.trim()}>{S.SAVE}</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MedicalScreen() {
  const {
    appointments, addAppointment, updateAppointment, removeAppointment,
    loading,
  } = useHealthStore()
  const taskStore = useTaskStore()
  const healthTasks = useMemo(
    () => taskStore.tasks.filter((t) => t.type === 'health'),
    [taskStore.tasks],
  )

  const [apptForm, setApptForm] = useState<{ open: boolean; id?: string }>({ open: false })
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [detailTask, setDetailTask] = useState<AppTask | null>(null)

  if (loading) return <SkeletonRow count={10} />

  const now = new Date()
  const overdue = appointments.filter((a) => {
    if (a.status !== 'active' || !a.last_visited || !a.frequency_months) return false
    if (a.snoozed_until && new Date(a.snoozed_until) > now) return false
    const due = new Date(a.last_visited)
    due.setMonth(due.getMonth() + a.frequency_months)
    return due < now
  })
  const upcoming = appointments.filter(
    (a) => a.status === 'active' && a.next_appointment && new Date(a.next_appointment) >= now,
  )
  const other = appointments.filter(
    (a) => a.status === 'active' && !overdue.includes(a) && !upcoming.includes(a),
  )

  async function snooze(id: string) {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    const val = d.toISOString().split('T')[0]
    updateAppointment(id, { snoozed_until: val })
    try { await updateApptDb(id, { snoozed_until: val }) } catch {}
  }

  async function saveAppt(data: Partial<HealthAppointment>) {
    if (apptForm.id) {
      updateAppointment(apptForm.id, data)
      try { await updateApptDb(apptForm.id, data) } catch {}
    } else {
      const row = {
        user_id: USER_ID,
        name: data.name!,
        appointment_type: data.appointment_type!,
        last_visited: data.last_visited ?? null,
        next_appointment: data.next_appointment ?? null,
        frequency_months: data.frequency_months ?? null,
        notes: data.notes ?? null,
        status: 'active' as const,
        snoozed_until: null,
      }
      try { addAppointment(await insertAppointment(row)) } catch {
        addAppointment({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      }
    }
    setApptForm({ open: false })
  }

  async function deleteAppt(id: string) {
    if (!confirm(S.CONFIRM_DELETE_APPT)) return
    removeAppointment(id)
    try { await deleteApptDb(id) } catch {}
  }

  // Health task actions
  async function completeTodo(id: string) {
    taskStore.updateTask(id, { status: 'done', completed_at: new Date().toISOString() })
    try { await updateTask(id, { status: 'done', completed_at: new Date().toISOString() }) } catch {}
  }
  async function delTodo(id: string) {
    taskStore.removeTask(id)
    try { await deleteTask(id) } catch {}
  }

  function overdueText(a: HealthAppointment) {
    if (!a.last_visited || !a.frequency_months) return ''
    const due = new Date(a.last_visited)
    due.setMonth(due.getMonth() + a.frequency_months)
    const months = differenceInMonths(now, due)
    return months > 0 ? S.MONTHS_OVERDUE(months) : S.DAYS_OVERDUE(differenceInDays(now, due))
  }

  function ApptRow({ a, isOverdue }: { a: HealthAppointment; isOverdue?: boolean }) {
    return (
      <Paper p="sm" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Text fw={600}>{a.name}</Text>
              {isOverdue && <Badge color="red" size="xs">{S.OVERDUE}</Badge>}
            </Group>
            <Text size="xs" c="dimmed">
              {a.last_visited ? `${S.LAST_VISITED}: ${a.last_visited}` : S.NEVER_VISITED}
              {isOverdue && ` · ${overdueText(a)}`}
            </Text>
          </Stack>
          <Group gap="xs">
            <ActionIcon variant="subtle" size="sm" onClick={() => setApptForm({ open: true, id: a.id })}>
              ✎
            </ActionIcon>
            <ActionIcon variant="subtle" size="sm" color="red" onClick={() => deleteAppt(a.id)}>
              ✕
            </ActionIcon>
            {isOverdue && (
              <Button variant="subtle" size="xs" onClick={() => snooze(a.id)}>
                {S.SNOOZE_2W}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    )
  }

  return (
    <Stack gap="lg">
      {/* Appointments */}
      <Group justify="space-between">
        <SectionLabel>{S.APPOINTMENTS}</SectionLabel>
        <Button variant="subtle" size="xs" onClick={() => setApptForm({ open: true })}>
          {S.ADD_APPOINTMENT}
        </Button>
      </Group>

      {overdue.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="red" fw={700}>{S.OVERDUE}</Text>
          {overdue.map((a) => <ApptRow key={a.id} a={a} isOverdue />)}
        </Stack>
      )}
      {upcoming.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>{S.UPCOMING}</Text>
          {upcoming.map((a) => (
            <Paper key={a.id} p="sm" radius="md" withBorder>
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text fw={600}>{a.name}</Text>
                  <Text size="xs" c="dimmed">
                    {a.next_appointment} · {S.IN_DAYS(differenceInDays(new Date(a.next_appointment!), now))}
                  </Text>
                </Stack>
                <Group gap="xs">
                  <ActionIcon variant="subtle" size="sm" onClick={() => setApptForm({ open: true, id: a.id })}>
                    ✎
                  </ActionIcon>
                  <ActionIcon variant="subtle" size="sm" color="red" onClick={() => deleteAppt(a.id)}>
                    ✕
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
      {other.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="dimmed" fw={700}>{S.OTHER}</Text>
          {other.map((a) => <ApptRow key={a.id} a={a} />)}
        </Stack>
      )}
      {!appointments.filter((a) => a.status === 'active').length && (
        <EmptyState icon="🩺" message={S.EMPTY_APPTS} />
      )}

      <ApptFormModal
        opened={apptForm.open}
        initial={apptForm.id ? appointments.find((a) => a.id === apptForm.id) : undefined}
        onSave={saveAppt}
        onClose={() => setApptForm({ open: false })}
      />

      <Divider />

      {/* Health Tasks */}
      <Group justify="space-between">
        <SectionLabel>{S.HEALTH_TODOS}</SectionLabel>
        <Button variant="subtle" size="xs" onClick={() => setShowQuickAdd(true)}>
          {S.ADD}
        </Button>
      </Group>
      {!healthTasks.length ? (
        <EmptyState icon="✅" message={S.EMPTY_TODOS} />
      ) : (
        <Stack gap="xs">
          {healthTasks.filter((t) => t.status === 'todo').map((t) => (
            <Paper key={t.id} p="sm" radius="md" withBorder style={{ cursor: 'pointer' }}
              onClick={() => setDetailTask(t)}
            >
              <Group justify="space-between">
                <Group gap="sm">
                  <Checkbox
                    size="xs"
                    radius="xl"
                    checked={false}
                    onChange={(e) => { e.stopPropagation(); completeTodo(t.id) }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>{t.title}</Text>
                    {t.due_date && <Text size="xs" c="dimmed">{t.due_date}</Text>}
                  </Stack>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm"
                    onClick={(e) => { e.stopPropagation(); setDetailTask(t) }}
                  >
                    ✎
                  </ActionIcon>
                  <ActionIcon variant="subtle" size="sm" color="red"
                    onClick={(e) => { e.stopPropagation(); delTodo(t.id) }}
                  >
                    ✕
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <QuickAddModal
        open={showQuickAdd}
        defaultType="health"
        allowedTypes={['health']}
        onClose={() => setShowQuickAdd(false)}
      />
      {detailTask && (
        <TaskDetailSheet task={detailTask} onClose={() => setDetailTask(null)} />
      )}
    </Stack>
  )
}
