import {
  ActionIcon,
  Badge,
  Box,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useState } from 'react'
import { useGrowthStore } from '../store/growthStore'
import * as svc from '../services/growthService'
import { Button } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { ProgressBar } from '../../../shared/components/ProgressBar'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import { Book } from '../types/growth.types'
import {
  Check,
  DotsThree,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
const BOOK_STATUS = {
  WANT: 'want',
  READING: 'reading',
  DONE: 'done',
} as const

type BookStatusType = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS]

const BOOK_STATUS_LABEL: Record<BookStatusType, string> = {
  want: 'Want to read',
  reading: 'Reading',
  done: 'Done',
}

export function BooksScreen() {
  const { books, addBook, updateBook, removeBook, loading } = useGrowthStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)

  const year = new Date().getFullYear()
  const yearBooks = books.filter((b) => b.year === year)
  const reading = yearBooks.filter((b) => b.status === BOOK_STATUS.READING)
  const want = yearBooks.filter((b) => b.status === BOOK_STATUS.WANT)
  const done = yearBooks.filter((b) => b.status === BOOK_STATUS.DONE)

  if (loading) return <SkeletonRow count={6} />

  async function handleSave(d: {
    title: string
    author: string | null
    status: BookStatusType
  }) {
    if (editBook) {
      updateBook(editBook.id, d)
      try {
        await svc.updateBook(editBook.id, d)
      } catch {}
      setEditBook(null)
    } else {
      const row = {
        user_id: USER_ID,
        title: d.title,
        author: d.author,
        status: d.status,
        year,
        order_index: yearBooks.length,
      }
      try {
        const r = await svc.insertBook(row)
        addBook(r)
      } catch {
        addBook({
          ...row,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
      setShowAdd(false)
    }
  }

  async function handleStart(id: string) {
    updateBook(id, { status: BOOK_STATUS.READING })
    try {
      await svc.updateBook(id, { status: BOOK_STATUS.READING })
    } catch {}
  }

  async function handleDone(id: string) {
    updateBook(id, { status: BOOK_STATUS.DONE })
    try {
      await svc.updateBook(id, { status: BOOK_STATUS.DONE })
    } catch {}
  }

  async function handleDelete(id: string) {
    removeBook(id)
    try {
      await svc.deleteBook(id)
    } catch {}
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.BOOKS} · {year}
            </Text>
            <Badge variant="light" color="teal" size="sm">
              {done.length}/52
            </Badge>
          </Group>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="sm"
            leftSection={<Plus size={14} />}
            onClick={() => setShowAdd(true)}
          >
            {STRINGS.ADD_BOOK}
          </Button>
        </Group>
        <Progress
          value={(done.length / 52) * 100}
          color="teal"
          radius="xl"
          size="md"
          bg="var(--mantine-color-gray-2)"
        />
        <Text size="xs" c="dimmed" mt={6}>
          {52 - done.length} {STRINGS.BOOKS_REMAINING}
        </Text>
      </Paper>

      {/* Empty state */}
      {!yearBooks.length && <EmptyState message={STRINGS.BOOKS_EMPTY} />}

      {/* Reading now */}
      {reading.length > 0 && (
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.READING_NOW}
          </Text>
          {reading.map((b) => (
            <BookRow
              key={b.id}
              book={b}
              onDone={() => handleDone(b.id)}
              onEdit={() => setEditBook(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </Stack>
      )}

      {/* Want to read */}
      {want.length > 0 && (
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.WANT_TO_READ}
          </Text>
          {want.map((b) => (
            <BookRow
              key={b.id}
              book={b}
              onStart={() => handleStart(b.id)}
              onEdit={() => setEditBook(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </Stack>
      )}

      {/* Done */}
      {done.length > 0 && (
        <Stack gap="sm">
          <Group gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.DONE}
            </Text>
            <Badge variant="light" color="green" size="xs">
              {done.length}
            </Badge>
          </Group>
          {done.map((b) => (
            <BookRow
              key={b.id}
              book={b}
              onEdit={() => setEditBook(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </Stack>
      )}

      {/* Add/Edit modal */}
      {(showAdd || editBook) && (
        <BookFormModal
          initial={editBook ?? undefined}
          onSave={handleSave}
          onClose={() => {
            setShowAdd(false)
            setEditBook(null)
          }}
        />
      )}
    </Stack>
  )
}

interface BookRowProps {
  book: Book
  onStart?: () => void
  onDone?: () => void
  onEdit: () => void
  onDelete: () => void
}

function BookRow({ book, onStart, onDone, onEdit, onDelete }: BookRowProps) {
  const isDone = book.status === BOOK_STATUS.DONE
  const isReading = book.status === BOOK_STATUS.READING

  return (
    <Paper p="md" radius="xl" withBorder>
      <Group gap="md" wrap="nowrap">
        {/* Status indicator */}
        <Box
          w={40}
          h={40}
          style={{
            borderRadius: 'var(--mantine-radius-lg)',
            background: isDone
              ? 'var(--mantine-color-green-light)'
              : isReading
                ? 'var(--mantine-color-teal-light)'
                : 'var(--mantine-color-gray-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {isDone ? '✅' : isReading ? '📖' : '📚'}
          </Text>
        </Box>

        {/* Info */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            fw={700}
            size="sm"
            truncate
            c="var(--mantine-color-text)"
            td={isDone ? 'line-through' : undefined}
            opacity={isDone ? 0.6 : 1}
          >
            {book.title}
          </Text>
          {book.author && (
            <Text size="xs" c="dimmed">
              {book.author}
            </Text>
          )}
        </Box>

        {/* Actions */}
        <Group gap="xs" wrap="nowrap">
          {onStart && (
            <Button
              variant="light"
              color="teal"
              radius="xl"
              size="xs"
              onClick={onStart}
            >
              {STRINGS.START_READING}
            </Button>
          )}
          {onDone && (
            <Button
              variant="light"
              color="green"
              radius="xl"
              size="xs"
              leftSection={<Check size={12} />}
              onClick={onDone}
            >
              {STRINGS.MARK_DONE}
            </Button>
          )}
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <DotsThree size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<PencilSimple size={14} />}
                onClick={onEdit}
              >
                {STRINGS.EDIT}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<Trash size={14} />}
                color="red"
                onClick={onDelete}
              >
                {STRINGS.DELETE}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  )
}

interface BookFormModalProps {
  initial?: Book
  onSave: (d: {
    title: string
    author: string | null
    status: BookStatusType
  }) => void
  onClose: () => void
}

function BookFormModal({ initial, onSave, onClose }: BookFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [status, setStatus] = useState<BookStatusType>(
    initial?.status ?? BOOK_STATUS.WANT,
  )
  const [err, setErr] = useState(false)

  function submit() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    onSave({ title: title.trim(), author: author || null, status })
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={initial ? STRINGS.EDIT_BOOK : STRINGS.ADD_BOOK}
      radius="xl"
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label={STRINGS.BOOK_TITLE}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErr(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={STRINGS.BOOK_TITLE_PLACEHOLDER}
          error={err ? STRINGS.REQUIRED : undefined}
          autoFocus
          radius="lg"
        />
        <TextInput
          label={STRINGS.AUTHOR_OPTIONAL}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          radius="lg"
        />
        <Box>
          <Text size="xs" fw={600} c="dimmed" mb="xs">
            {STRINGS.STATUS}
          </Text>
          <Group gap="xs">
            {Object.entries(BOOK_STATUS_LABEL).map(([k, v]) => (
              <Badge
                key={k}
                variant={status === k ? 'filled' : 'outline'}
                color="teal"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatus(k as BookStatusType)}
              >
                {v}
              </Badge>
            ))}
          </Group>
        </Box>
        <Divider />
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            onClick={submit}
          >
            {STRINGS.SAVE}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
