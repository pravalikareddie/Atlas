import { useState, useEffect } from 'react'
import {
  Stack,
  Group,
  Text,
  Paper,
  TextInput,
  Checkbox,
  NativeSelect,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { STRINGS } from '../constants/strings'
import { Button } from '@mantine/core'
import { formatMoneyWhole } from '../utils/moneyUtils'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'

const YEAR_KEY = (y: number) => `atlas-tax-${y}`
const NOTES_KEY = (y: number) => `atlas-tax-notes-${y}`
function loadDocs(year: number) {
  try {
    return JSON.parse(localStorage.getItem(YEAR_KEY(year)) ?? '[]')
  } catch {
    return []
  }
}
function saveDocs(
  year: number,
  docs: { id: string; label: string; done: boolean }[],
) {
  localStorage.setItem(YEAR_KEY(year), JSON.stringify(docs))
}
function loadNotes(year: number) {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY(year)) ?? '[]')
  } catch {
    return []
  }
}
function saveNotes(year: number, notes: string[]) {
  localStorage.setItem(NOTES_KEY(year), JSON.stringify(notes))
}

export function TaxScreen() {
  const { accounts, refunds, splitwise, subscriptions, loading } =
    useFinanceStore()
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [docs, setDocs] = useState<
    { id: string; label: string; done: boolean }[]
  >([])
  const [notes, setNotes] = useState<string[]>([])
  const [newDoc, setNewDoc] = useState('')
  const [addingDoc, setAddingDoc] = useState(false)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    const saved = loadDocs(year)
    if (saved.length > 0) {
      setDocs(saved)
      setNotes(loadNotes(year))
      return
    }
    const auto: { id: string; label: string; done: boolean }[] = []
    accounts.forEach((a) => {
      if (a.type === 'checking' || a.type === 'savings')
        auto.push({
          id: crypto.randomUUID(),
          label: `1099-INT · ${a.name}`,
          done: false,
        })
      if (a.type === 'investing') {
        auto.push({
          id: crypto.randomUUID(),
          label: `1099-DIV · ${a.name}`,
          done: false,
        })
        auto.push({
          id: crypto.randomUUID(),
          label: `1099-B · ${a.name}`,
          done: false,
        })
      }
      if (a.label?.includes('employer'))
        auto.push({
          id: crypto.randomUUID(),
          label: `W2 · employer`,
          done: false,
        })
    })
    setDocs(auto)
    saveDocs(year, auto)
    setNotes(loadNotes(year))
  }, [year, accounts])

  if (loading) return <SkeletonRow count={8} />

  function toggleDoc(id: string) {
    const u = docs.map((d) => (d.id === id ? { ...d, done: !d.done } : d))
    setDocs(u)
    saveDocs(year, u)
  }
  function addDoc() {
    if (!newDoc.trim()) return
    const u = [
      ...docs,
      { id: crypto.randomUUID(), label: newDoc.trim(), done: false },
    ]
    setDocs(u)
    saveDocs(year, u)
    setNewDoc('')
    setAddingDoc(false)
  }
  function addNote() {
    if (!newNote.trim()) return
    const u = [...notes, newNote.trim()]
    setNotes(u)
    saveNotes(year, u)
    setNewNote('')
  }
  function removeNote(i: number) {
    const u = notes.filter((_, idx) => idx !== i)
    setNotes(u)
    saveNotes(year, u)
  }

  const totalRefunds = refunds
    .filter((r) => r.status === 'received')
    .reduce((s, r) => s + r.amount, 0)
  const totalSubs = subscriptions.reduce((s, sub) => s + sub.amount * 12, 0)
  const totalSettled = splitwise
    .filter((s) => s.status === 'settled')
    .reduce((s, e) => s + e.amount, 0)

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text>Tax Prep · {year}</Text>
        <Group gap="sm">
          <NativeSelect
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            data={[0, 1, 2, 3].map((i) => String(new Date().getFullYear() - i))}
            w={100}
          />
          <Button variant="subtle" onClick={() => setAddingDoc(true)}>
            {STRINGS.ADD_ITEM}
          </Button>
        </Group>
      </Group>

      <Text tt="uppercase">docs to collect</Text>
      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          {docs.map((doc) => (
            <Checkbox
              key={doc.id}
              label={doc.label}
              checked={doc.done}
              onChange={() => toggleDoc(doc.id)}
            />
          ))}
        </Stack>
      </Paper>

      {addingDoc && (
        <Group gap="sm">
          <TextInput
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addDoc()
              if (e.key === 'Escape') setAddingDoc(false)
            }}
            placeholder="e.g. Charitable donations receipt"
            style={{ flex: 1 }}
            autoFocus
          />
          <Button onClick={addDoc}>add</Button>
        </Group>
      )}

      <Text tt="uppercase">notes</Text>
      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          {notes.length === 0 && <Text>No notes yet.</Text>}
          {notes.map((note, i) => (
            <Group key={i} justify="space-between">
              <Text>· {note}</Text>
              <Button
                variant="subtle"
                color="red"
                onClick={() => removeNote(i)}
              >
                ×
              </Button>
            </Group>
          ))}
        </Stack>
      </Paper>
      <Group gap="sm">
        <TextInput
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addNote()
          }}
          placeholder={STRINGS.PH_TAX_NOTE}
          style={{ flex: 1 }}
        />
        <Button variant="subtle" onClick={addNote}>
          {STRINGS.ADD_NOTE}
        </Button>
      </Group>

      <Text tt="uppercase">atlas data · {year}</Text>
      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between" py="xs">
          <Text>Total refunds received</Text>
          <Text>{formatMoneyWhole(totalRefunds)}</Text>
        </Group>
        <Group justify="space-between" py="xs">
          <Text>Total subscriptions paid</Text>
          <Text>{formatMoneyWhole(totalSubs)}</Text>
        </Group>
        <Group justify="space-between" py="xs">
          <Text>Total splitwise settled</Text>
          <Text>{formatMoneyWhole(totalSettled)}</Text>
        </Group>
      </Paper>
    </Stack>
  )
}
