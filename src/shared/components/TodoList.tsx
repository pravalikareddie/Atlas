import { useState } from 'react'
import {
  Stack,
  Group,
  Text,
  TextInput,
  UnstyledButton,
  ActionIcon,
} from '@mantine/core'
import { Button } from '@mantine/core'

interface TodoItem {
  id: string
  description: string
  status: 'todo' | 'done'
}

interface Props {
  items: TodoItem[]
  onComplete: (id: string) => void
  onRestore: (id: string) => void
  onAdd: (text: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string, text: string) => void
  placeholder?: string
  emptyMessage?: string
  addLabel?: string
}

export function TodoList({
  items,
  onComplete,
  onRestore,
  onAdd,
  onDelete,
  onEdit,
  placeholder = 'New task...',
  emptyMessage = 'No tasks.',
  addLabel = '+ add',
}: Props) {
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const active = items.filter((t) => t.status === 'todo')
  const done = items.filter((t) => t.status === 'done')

  function submit() {
    if (newText.trim()) {
      onAdd(newText.trim())
      setNewText('')
    }
  }
  function submitEdit(id: string) {
    if (editText.trim()) {
      onEdit?.(id, editText.trim())
      setEditingId(null)
    }
  }

  return (
    <Stack gap={0}>
      {!active.length && !adding && (
        <Text ta="center" py="xl">
          {emptyMessage}
        </Text>
      )}

      {active.map((t) => (
        <Group key={t.id} gap="sm" py={8}>
          <UnstyledButton
            onClick={() => onComplete(t.id)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          />
          {editingId === t.id ? (
            <TextInput
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit(t.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              style={{ flex: 1 }}
              autoFocus
            />
          ) : (
            <Text
              style={{ flex: 1, cursor: onEdit ? 'pointer' : undefined }}
              c="white"
              onClick={() => {
                if (onEdit) {
                  setEditingId(t.id)
                  setEditText(t.description)
                }
              }}
            >
              {t.description}
            </Text>
          )}
          {onEdit && editingId !== t.id && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => {
                setEditingId(t.id)
                setEditText(t.description)
              }}
            >
              ✏️
            </ActionIcon>
          )}
          {onDelete && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onDelete(t.id)}
            >
              ×
            </ActionIcon>
          )}
        </Group>
      ))}

      {adding && (
        <Group gap="sm" mb="sm">
          <TextInput
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setAdding(false)
                setNewText('')
              }
            }}
            placeholder={placeholder}
            style={{ flex: 1 }}
            autoFocus
          />
          <Button onClick={submit}>add</Button>
        </Group>
      )}

      <Group justify="space-between">
        {!adding && (
          <Button variant="subtle" onClick={() => setAdding(true)}>
            {addLabel}
          </Button>
        )}
        {done.length > 0 && (
          <Button
            variant="subtle"
            color="gray"
            onClick={() => setShowDone(!showDone)}
          >
            {showDone ? 'Hide' : 'Show'} {done.length} completed
          </Button>
        )}
      </Group>

      {showDone &&
        done.map((t) => (
          <Group key={t.id} gap="sm" py={8} opacity={0.5}>
            <Text c="green">✓</Text>
            <Text c="white" td="line-through" style={{ flex: 1 }}>
              {t.description}
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onRestore(t.id)}
            >
              ↩
            </ActionIcon>
            {onDelete && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => onDelete(t.id)}
              >
                ×
              </ActionIcon>
            )}
          </Group>
        ))}
    </Stack>
  )
}
