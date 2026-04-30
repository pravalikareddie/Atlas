import { Box, Text, UnstyledButton, Divider } from '@mantine/core'
import { useState } from 'react'
import { useHealthStore } from '../store/healthStore'
import {
  insertAppointment,
  updateAppointment as updateApptDb,
} from '../services/appointmentService'
import {
  insertMedication,
  updateMedication as updateMedDb,
} from '../services/medicationService'
import {
  insertHealthTodo,
  updateHealthTodo,
  deleteHealthTodo,
} from '../services/healthTodoService'
import { differenceInDays, differenceInMonths } from 'date-fns'
import { Button } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { TodoList } from '../../../shared/components/TodoList'
import { HealthAppointment, HealthMedication } from '../types/health.types'

export function MedicalScreen() {
  const {
    appointments,
    addAppointment,
    updateAppointment,
    medications,
    addMedication,
    updateMedication,
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    loading,
  } = useHealthStore()
  const [apptForm, setApptForm] = useState<{ open: boolean; id?: string }>({
    open: false,
  })
  const [medForm, setMedForm] = useState<{ open: boolean; id?: string }>({
    open: false,
  })

  if (loading) return <SkeletonRow count={10} />

  const now = new Date()
  const overdue = appointments.filter((a) => {
    if (a.status !== 'active' || !a.last_visited || !a.frequency_months)
      return false
    if (a.snoozed_until && new Date(a.snoozed_until) > now) return false
    const due = new Date(a.last_visited)
    due.setMonth(due.getMonth() + a.frequency_months)
    return due < now
  })
  const upcoming = appointments.filter(
    (a) =>
      a.status === 'active' &&
      a.next_appointment &&
      new Date(a.next_appointment) >= now,
  )
  const other = appointments.filter(
    (a) =>
      a.status === 'active' && !overdue.includes(a) && !upcoming.includes(a),
  )
  const activeMeds = medications.filter((m) => m.status === 'active')

  async function snooze(id: string) {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    updateAppointment(id, { snoozed_until: d.toISOString().split('T')[0] })
    try {
      await updateApptDb(id, { snoozed_until: d.toISOString().split('T')[0] })
    } catch {}
  }

  // Todo actions
  async function addNewTodo(text: string) {
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      description: text,
      status: 'todo' as const,
      completed_at: null,
    }
    try {
      const r = await insertHealthTodo(row)
      addTodo(r)
    } catch {
      addTodo({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
  }
  async function completeTodo(id: string) {
    updateTodo(id, { status: 'done', completed_at: new Date().toISOString() })
    try {
      await updateHealthTodo(id, {
        status: 'done',
        completed_at: new Date().toISOString(),
      })
    } catch {}
  }
  async function restoreTodo(id: string) {
    updateTodo(id, { status: 'todo', completed_at: null })
    try {
      await updateHealthTodo(id, { status: 'todo', completed_at: null })
    } catch {}
  }
  async function delTodo(id: string) {
    removeTodo(id)
    try {
      await deleteHealthTodo(id)
    } catch {}
  }

  function ApptRow({
    a,
    showOverdue,
  }: {
    a: HealthAppointment
    showOverdue?: boolean
  }) {
    let overdueText = ''
    if (showOverdue && a.last_visited && a.frequency_months) {
      const due = new Date(a.last_visited)
      due.setMonth(due.getMonth() + a.frequency_months)
      const months = differenceInMonths(now, due)
      const days = differenceInDays(now, due)
      overdueText =
        months > 0 ? `${months} months overdue` : `${days} days overdue`
    }
    return (
      <Box>
        <Box>
          <Box>{a.name}</Box>
        </Box>
        <Box>
          {a.last_visited ? `last visited: ${a.last_visited}` : 'never visited'}
          {overdueText && <Text component="span">· {overdueText}</Text>}
        </Box>
        {showOverdue && (
          <Box>
            <Button variant="ghost">book now</Button>
            <Button variant="ghost" onClick={() => snooze(a.id)}>
              snooze 2 weeks
            </Button>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      {/* Appointments */}
      <Box>
        <Box>APPOINTMENTS</Box>
        <Button variant="ghost" onClick={() => setApptForm({ open: true })}>
          + add appointment
        </Button>
      </Box>

      {apptForm.open && (
        <ApptFormCard
          initial={
            apptForm.id
              ? appointments.find((a) => a.id === apptForm.id)
              : undefined
          }
          onSave={async (data) => {
            if (apptForm.id) {
              updateAppointment(apptForm.id, data)
              try {
                await updateApptDb(apptForm.id, data)
              } catch {}
            } else {
              const row = {
                user_id: '00000000-0000-0000-0000-000000000001',
                name: data.name!,
                appointment_type: data.appointment_type!,
                last_visited: data.last_visited ?? null,
                next_appointment: data.next_appointment ?? null,
                frequency_months: data.frequency_months ?? null,
                notes: data.notes ?? null,
                status: 'active' as const,
                snoozed_until: null,
              }
              try {
                const r = await insertAppointment(row)
                addAppointment(r)
              } catch {
                addAppointment({
                  ...row,
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                })
              }
            }
            setApptForm({ open: false })
          }}
          onCancel={() => setApptForm({ open: false })}
        />
      )}

      {overdue.length > 0 && (
        <>
          <Box>OVERDUE</Box>
          <Box>
            {overdue.map((a) => (
              <Box key={a.id}>
                <ApptRow a={a} showOverdue />
              </Box>
            ))}
          </Box>
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <Box>UPCOMING</Box>
          <Box>
            {upcoming.map((a) => {
              const days = differenceInDays(new Date(a.next_appointment!), now)
              return (
                <Box key={a.id}>
                  <Box>
                    <Box>{a.name}</Box>
                    <Box>
                      {a.next_appointment} · in {days} days
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </>
      )}
      {other.length > 0 && (
        <>
          <Box>OTHER</Box>
          <Box>
            {other.map((a) => (
              <Box key={a.id}>
                <ApptRow a={a} />
              </Box>
            ))}
          </Box>
        </>
      )}
      {!appointments.filter((a) => a.status === 'active').length &&
        !apptForm.open && (
          <EmptyState message="No appointments tracked. Add one to stop avoiding." />
        )}

      <Divider />

      {/* Medications */}
      <Box>
        <Box>MEDICATIONS & SUPPLEMENTS</Box>
        <Button variant="ghost" onClick={() => setMedForm({ open: true })}>
          + add
        </Button>
      </Box>

      {medForm.open && (
        <MedFormCard
          initial={
            medForm.id
              ? medications.find((m) => m.id === medForm.id)
              : undefined
          }
          onSave={async (data) => {
            if (medForm.id) {
              updateMedication(medForm.id, data)
              try {
                await updateMedDb(medForm.id, data)
              } catch {}
            } else {
              const row = {
                user_id: '00000000-0000-0000-0000-000000000001',
                name: data.name!,
                frequency: data.frequency!,
                track_refill: data.track_refill ?? false,
                refill_date: data.refill_date ?? null,
                notes: data.notes ?? null,
                status: 'active' as const,
              }
              try {
                const r = await insertMedication(row)
                addMedication(r)
              } catch {
                addMedication({
                  ...row,
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                })
              }
            }
            setMedForm({ open: false })
          }}
          onCancel={() => setMedForm({ open: false })}
        />
      )}

      {!activeMeds.length && !medForm.open ? (
        <EmptyState message="No medications or supplements added." />
      ) : (
        <Box>
          {activeMeds.map((m) => {
            const refillSoon =
              m.track_refill &&
              m.refill_date &&
              differenceInDays(new Date(m.refill_date), now) <= 5 &&
              differenceInDays(new Date(m.refill_date), now) >= 0
            return (
              <Box key={m.id}>
                <Box>
                  <Text component="span">{m.name}</Text>
                  <Text component="span">{m.frequency.replace('_', ' ')}</Text>
                </Box>
                <Box>
                  {m.track_refill && m.refill_date && (
                    <Text component="span">refill {m.refill_date}</Text>
                  )}
                  {refillSoon && <Text component="span">⚠</Text>}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      <Divider />

      {/* Health Todos */}
      <Box>HEALTH TODOS</Box>
      <TodoList
        items={todos.map((t) => ({
          id: t.id,
          description: t.description,
          status: t.status,
        }))}
        onComplete={completeTodo}
        onRestore={restoreTodo}
        onAdd={addNewTodo}
        onDelete={delTodo}
        onEdit={async (id, text) => {
          updateTodo(id, { description: text })
          try {
            await updateHealthTodo(id, { description: text })
          } catch {}
        }}
        placeholder="New health task..."
        emptyMessage="No health tasks."
        addLabel="+ add"
      />
    </Box>
  )
}

function ApptFormCard({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HealthAppointment
  onSave: (d: Partial<HealthAppointment>) => void
  onCancel: () => void
}) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    appointment_type: initial?.appointment_type ?? 'doctor',
    last_visited: initial?.last_visited ?? '',
    next_appointment: initial?.next_appointment ?? '',
    frequency_months: initial?.frequency_months?.toString() ?? '',
    notes: initial?.notes ?? '',
  })
  const [err, setErr] = useState(false)

  function save() {
    if (!f.name.trim()) {
      setErr(true)
      return
    }
    onSave({
      name: f.name,
      appointment_type: f.appointment_type,
      last_visited: f.last_visited || null,
      next_appointment: f.next_appointment || null,
      frequency_months: f.frequency_months
        ? parseInt(f.frequency_months)
        : null,
      notes: f.notes || null,
    })
  }

  return (
    <Box>
      <label>name</label>
      <input
        value={f.name}
        onChange={(e) => {
          setF({ ...f, name: e.target.value })
          setErr(false)
        }}
        placeholder="Dentist, Eye doctor..."
      />
      {err && <Box>This field is required</Box>}
      <label>type</label>
      <select
        value={f.appointment_type}
        onChange={(e) => setF({ ...f, appointment_type: e.target.value })}
      >
        <option value="dentist">Dentist</option>
        <option value="eye">Eye</option>
        <option value="doctor">Doctor</option>
        <option value="dermatologist">Dermatologist</option>
        <option value="therapy">Therapy</option>
        <option value="other">Other</option>
      </select>
      <label>last visited (optional)</label>
      <Box>
        <input
          type="date"
          value={f.last_visited}
          onChange={(e) => setF({ ...f, last_visited: e.target.value })}
        />
        {f.last_visited && (
          <UnstyledButton onClick={() => setF({ ...f, last_visited: '' })}>
            ×
          </UnstyledButton>
        )}
      </Box>
      <label>next appointment (optional)</label>
      <Box>
        <input
          type="date"
          value={f.next_appointment}
          onChange={(e) => setF({ ...f, next_appointment: e.target.value })}
        />
        {f.next_appointment && (
          <UnstyledButton onClick={() => setF({ ...f, next_appointment: '' })}>
            ×
          </UnstyledButton>
        )}
      </Box>
      <label>how often (optional)</label>
      <select
        value={f.frequency_months}
        onChange={(e) => setF({ ...f, frequency_months: e.target.value })}
      >
        <option value="">No schedule</option>
        <option value="3">Every 3 months</option>
        <option value="6">Every 6 months</option>
        <option value="12">Every year</option>
        <option value="24">Every 2 years</option>
      </select>
      <label>notes (optional)</label>
      <input
        value={f.notes}
        onChange={(e) => setF({ ...f, notes: e.target.value })}
      />
      <Box>
        <Button variant="secondary" onClick={onCancel}>
          cancel
        </Button>
        <Button onClick={save}>save</Button>
      </Box>
    </Box>
  )
}

function MedFormCard({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HealthMedication
  onSave: (d: Partial<HealthMedication>) => void
  onCancel: () => void
}) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    frequency: (initial?.frequency ?? 'daily') as
      | 'daily'
      | 'weekly'
      | 'as_needed',
    track_refill: initial?.track_refill ?? false,
    refill_date: initial?.refill_date ?? '',
    notes: initial?.notes ?? '',
  })
  const [err, setErr] = useState(false)

  function save() {
    if (!f.name.trim()) {
      setErr(true)
      return
    }
    onSave({
      name: f.name,
      frequency: f.frequency,
      track_refill: f.track_refill,
      refill_date: f.refill_date || null,
      notes: f.notes || null,
    })
  }

  return (
    <Box>
      <label>name</label>
      <input
        value={f.name}
        onChange={(e) => {
          setF({ ...f, name: e.target.value })
          setErr(false)
        }}
      />
      {err && <Box>This field is required</Box>}
      <label>frequency</label>
      <Box>
        {(['daily', 'weekly', 'as_needed'] as const).map((freq) => (
          <UnstyledButton
            key={freq}
            onClick={() => setF({ ...f, frequency: freq })}
          >
            {freq.replace('_', ' ')}
          </UnstyledButton>
        ))}
      </Box>
      <Box>
        <input
          type="checkbox"
          checked={f.track_refill}
          onChange={(e) => setF({ ...f, track_refill: e.target.checked })}
        />
        <Text component="span">Track refill</Text>
      </Box>
      {f.track_refill && (
        <>
          <label>refill date</label>
          <Box>
            <input
              type="date"
              value={f.refill_date}
              onChange={(e) => setF({ ...f, refill_date: e.target.value })}
            />
            {f.refill_date && (
              <UnstyledButton onClick={() => setF({ ...f, refill_date: '' })}>
                ×
              </UnstyledButton>
            )}
          </Box>
        </>
      )}
      <label>notes (optional)</label>
      <input
        value={f.notes}
        onChange={(e) => setF({ ...f, notes: e.target.value })}
      />
      <Box>
        <Button variant="secondary" onClick={onCancel}>
          cancel
        </Button>
        <Button onClick={save}>save</Button>
      </Box>
    </Box>
  )
}
