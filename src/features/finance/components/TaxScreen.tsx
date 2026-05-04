// @ts-nocheck
import { useState, useEffect } from 'react'
import { Stack, Group, Text, TextInput, Checkbox, NativeSelect, Box, Button, Progress, Select } from '@mantine/core'
import { Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { useFinanceStore } from '../store/financeStore'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { NavyCard, SectionHeader } from './FinanceDesign'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'

const YEAR_KEY = (y: number) => `atlas-tax-${y}`
const NOTES_KEY = (y: number) => `atlas-tax-notes-${y}`
function loadDocs(year: number) { try { return JSON.parse(localStorage.getItem(YEAR_KEY(year)) ?? '[]') } catch { return [] } }
function saveDocs(year: number, docs: { id: string; label: string; done: boolean }[]) { localStorage.setItem(YEAR_KEY(year), JSON.stringify(docs)) }
function loadNotes(year: number) { try { return JSON.parse(localStorage.getItem(NOTES_KEY(year)) ?? '[]') } catch { return [] } }
function saveNotes(year: number, notes: string[]) { localStorage.setItem(NOTES_KEY(year), JSON.stringify(notes)) }

export function TaxScreen() {
  const store = useFinanceStore()
  const { accounts, refunds, splitwise, subscriptions, loading } = store
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [docs, setDocs] = useState<{ id: string; label: string; done: boolean }[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [newDoc, setNewDoc] = useState('')
  const [addingDoc, setAddingDoc] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editAcct, setEditAcct] = useState<{ name: string; type: string; last_four: string; due_date: string } | null>(null)
  const [editAcctId, setEditAcctId] = useState<string | null>(null)
  const [editNoteIdx, setEditNoteIdx] = useState<number | null>(null)
  const [editNoteVal, setEditNoteVal] = useState('')
  const [editDocId, setEditDocId] = useState<string | null>(null)
  const [editDocVal, setEditDocVal] = useState('')

  useEffect(() => {
    const saved = loadDocs(year)
    if (saved.length > 0) { setDocs(saved); setNotes(loadNotes(year)); return }
    const auto: { id: string; label: string; done: boolean }[] = []
    accounts.forEach((a) => {
      if (a.type === 'checking' || a.type === 'savings') auto.push({ id: crypto.randomUUID(), label: `1099-INT · ${a.name}`, done: false })
      if (a.type === 'investing') { auto.push({ id: crypto.randomUUID(), label: `1099-DIV · ${a.name}`, done: false }); auto.push({ id: crypto.randomUUID(), label: `1099-B · ${a.name}`, done: false }) }
      if (a.label?.includes('employer')) auto.push({ id: crypto.randomUUID(), label: `W2 · employer`, done: false })
    })
    setDocs(auto); saveDocs(year, auto); setNotes(loadNotes(year))
  }, [year, accounts])

  if (loading) return <SkeletonRow count={8} />

  function toggleDoc(id: string) { const u = docs.map((d) => (d.id === id ? { ...d, done: !d.done } : d)); setDocs(u); saveDocs(year, u) }
  function addDoc() { if (!newDoc.trim()) return; const u = [...docs, { id: crypto.randomUUID(), label: newDoc.trim(), done: false }]; setDocs(u); saveDocs(year, u); setNewDoc(''); setAddingDoc(false) }
  function addNote() { if (!newNote.trim()) return; const u = [...notes, newNote.trim()]; setNotes(u); saveNotes(year, u); setNewNote('') }
  function removeNote(i: number) { const u = notes.filter((_, idx) => idx !== i); setNotes(u); saveNotes(year, u) }

  const doneCount = docs.filter((d) => d.done).length
  const subNames = subscriptions.map((s) => s.name.toLowerCase())

  function removeDoc(id: string) { const u = docs.filter((d) => d.id !== id); setDocs(u); saveDocs(year, u) }
  function updateDoc(id: string, label: string) { const u = docs.map((d) => d.id === id ? { ...d, label } : d); setDocs(u); saveDocs(year, u); setEditDocId(null) }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Text size="lg" fw={800}>🧾 Tax Prep · {year}</Text>
        <NativeSelect
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          data={[0, 1, 2, 3].map((i) => String(new Date().getFullYear() - i))}
          w={100}
          radius="lg"
        />
      </Group>

      {/* Docs to collect */}
      <NavyCard>
        <SectionHeader label="Documents to collect" right={
          <Group gap="md">
            <Text size="xs" c="dimmed">{doneCount}/{docs.length}</Text>
            <Button size="xs" radius="xl" variant="light" color="teal" leftSection={<Plus size={10} />} onClick={() => setAddingDoc(true)}>Add</Button>
          </Group>
        } />
        {docs.length > 0 && <Progress value={(doneCount / docs.length) * 100} color="teal" size="xs" radius="xl" mb="md" />}
        <Stack gap="md">
          {docs.map((doc) => (
            editDocId === doc.id ? (
              <Group key={doc.id} gap="md">
                <TextInput value={editDocVal} onChange={(e) => setEditDocVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') updateDoc(doc.id, editDocVal); if (e.key === 'Escape') setEditDocId(null) }} size="xs" radius="lg" style={{ flex: 1 }} autoFocus />
                <Button size="xs" radius="xl" color="teal" onClick={() => updateDoc(doc.id, editDocVal)}>Save</Button>
              </Group>
            ) : (
              <Group key={doc.id} justify="space-between">
                <Checkbox label={doc.label} checked={doc.done} onChange={() => toggleDoc(doc.id)} radius="xl" />
                <Group gap={4}>
                  <PencilSimple size={14} style={{ cursor: 'pointer' }} onClick={() => { setEditDocId(doc.id); setEditDocVal(doc.label) }} />
                  <Trash size={14} color="var(--mantine-color-red-5)" style={{ cursor: 'pointer' }} onClick={() => removeDoc(doc.id)} />
                </Group>
              </Group>
            )
          ))}
        </Stack>
        {addingDoc && (
          <Group gap="md" mt="md">
            <TextInput value={newDoc} onChange={(e) => setNewDoc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addDoc(); if (e.key === 'Escape') setAddingDoc(false) }} placeholder="e.g. Charitable donations receipt" style={{ flex: 1 }} size="xs" radius="lg" autoFocus />
            <Button size="xs" radius="xl" color="teal" onClick={addDoc}>Add</Button>
          </Group>
        )}
      </NavyCard>

      {/* Notes */}
      <NavyCard>
        <SectionHeader label="Notes" />
        <Stack gap="md">
          {notes.length === 0 && <Text size="sm" c="dimmed">No notes yet</Text>}
          {notes.map((note, i) => (
            editNoteIdx === i ? (
              <Group key={i} gap="md">
                <TextInput value={editNoteVal} onChange={(e) => setEditNoteVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const u = [...notes]; u[i] = editNoteVal; setNotes(u); saveNotes(year, u); setEditNoteIdx(null) } if (e.key === 'Escape') setEditNoteIdx(null) }} size="xs" radius="lg" style={{ flex: 1 }} autoFocus />
                <Button size="xs" radius="xl" color="teal" onClick={() => { const u = [...notes]; u[i] = editNoteVal; setNotes(u); saveNotes(year, u); setEditNoteIdx(null) }}>Save</Button>
              </Group>
            ) : (
              <Group key={i} justify="space-between" p="md" style={{ borderRadius: 8, background: 'var(--mantine-color-default-hover)' }}>
                <Text size="sm" style={{ flex: 1 }}>{note}</Text>
                <Group gap={4}>
                  <PencilSimple size={14} style={{ cursor: 'pointer' }} onClick={() => { setEditNoteIdx(i); setEditNoteVal(note) }} />
                  <Trash size={14} color="var(--mantine-color-red-5)" style={{ cursor: 'pointer' }} onClick={() => removeNote(i)} />
                </Group>
              </Group>
            )
          ))}
        </Stack>
        <Group gap="md" mt="md">
          <TextInput value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addNote() }} placeholder={STRINGS.ADD_NOTE_PH} style={{ flex: 1 }} size="xs" radius="lg" />
          <Button size="xs" radius="xl" variant="light" color="teal" onClick={addNote}>Add</Button>
        </Group>
      </NavyCard>

      {/* Accounts */}
      <NavyCard>
        <SectionHeader label="Accounts" right={
          <Button size="xs" radius="xl" variant="light" color="teal" leftSection={<Plus size={10} />} onClick={() => setEditAcct({ name: '', type: 'checking', last_four: '', due_date: '' })}>Add</Button>
        } />
        {editAcct && (
          <AccountForm data={editAcct} onSave={async (d) => {
            if (editAcctId) {
              store.updateAccount(editAcctId, d)
              import('../services/accountService').then(({ updateAccount }) => updateAccount(editAcctId, d).catch(() => {}))
            } else {
              const full = { ...d, user_id: USER_ID }
              import('../services/accountService').then(async ({ insertAccount }) => {
                try { const r = await insertAccount(full); store.addAccount(r) } catch { store.addAccount({ ...full, id: crypto.randomUUID(), created_at: new Date().toISOString() }) }
              })
            }
            setEditAcct(null); setEditAcctId(null)
          }} onCancel={() => { setEditAcct(null); setEditAcctId(null) }} />
        )}
        {accounts.length === 0 && !editAcct && <Text size="sm" c="dimmed">No accounts added</Text>}
        <Stack gap="md" mt={editAcct ? 'md' : 0}>
          {accounts.map((a) => (
            <Group key={a.id} justify="space-between" p="md" style={{ borderRadius: 8, background: 'var(--mantine-color-default-hover)' }}>
              <Box>
                <Text size="sm" fw={600}>{a.name}</Text>
                <Text size="xs" c="dimmed">{a.type}{a.last_four ? ` · ****${a.last_four}` : ''}</Text>
              </Box>
              <Group gap="md">
                {a.due_date && <Text size="xs" c="dimmed">Due: {a.due_date}th</Text>}
                <PencilSimple size={14} style={{ cursor: 'pointer' }} onClick={() => { setEditAcct({ name: a.name, type: a.type, last_four: a.last_four || '', due_date: a.due_date ? String(a.due_date) : '' }); setEditAcctId(a.id) }} />
                <Trash size={14} color="var(--mantine-color-red-5)" style={{ cursor: 'pointer' }} onClick={() => { store.removeAccount(a.id); import('../services/accountService').then(({ deleteAccount }) => deleteAccount(a.id).catch(() => {})) }} />
              </Group>
            </Group>
          ))}
        </Stack>
      </NavyCard>
    </Stack>
  )
}

// @ts-ignore
function _SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" p="md" style={{ borderRadius: 8, background: 'var(--mantine-color-default-hover)' }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={700}>{value}</Text>
    </Group>
  )
}

function AccountForm({ data, onSave, onCancel }: { data: { name: string; type: string; last_four: string; due_date: string }; onSave: (d: { name: string; type: string; last_four: string | null; due_date: number | null }) => void; onCancel: () => void }) {
  const [name, setName] = useState(data.name)
  const [type, setType] = useState(data.type)
  const [lastFour, setLastFour] = useState(data.last_four)
  const [dueDate, setDueDate] = useState(data.due_date)

  return (
    <Stack gap="md" p="md" style={{ borderRadius: 8, background: 'var(--mantine-color-default-hover)' }}>
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" size="xs" radius="lg" />
      <Group gap="md">
        <Select value={type} onChange={(v) => setType(v || 'checking')} data={['checking', 'savings', 'credit', 'investing']} size="xs" radius="lg" style={{ flex: 1 }} />
        <TextInput value={lastFour} onChange={(e) => setLastFour(e.target.value)} placeholder="Last 4" size="xs" radius="lg" w={80} />
        <TextInput value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Due day" type="number" size="xs" radius="lg" w={70} />
      </Group>
      <Group gap="md">
        <Button size="xs" radius="xl" color="teal" onClick={() => onSave({ name, type, last_four: lastFour || null, due_date: dueDate ? parseInt(dueDate) : null })}>Save</Button>
        <Button size="xs" radius="xl" variant="default" onClick={onCancel}>Cancel</Button>
      </Group>
    </Stack>
  )
}
