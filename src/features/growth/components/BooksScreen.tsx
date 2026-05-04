import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useState } from 'react'
import { useGrowthStore } from '../store/growthStore'
import * as svc from '../services/growthService'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
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
import {
  BOOK_STATUS,
  BOOK_STATUS_EMOJI,
  BOOK_STATUS_LABEL,
  BookStatusType,
  GROWTH_STRINGS,
  YEARLY_BOOK_GOAL,
} from '../constants'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTargetMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const bgColor = isDone
    ? 'var(--mantine-color-green-light)'
    : isReading
      ? 'var(--mantine-color-teal-light)'
      : 'rgba(255,255,255,0.1)'

  return (
    <Paper p="md" radius="xl" withBorder>
      <Group gap="md" wrap="nowrap">
        <Box
          w={40}
          h={40}
          style={{
            borderRadius: 'var(--mantine-radius-lg)',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text fz={18}>{BOOK_STATUS_EMOJI[book.status]}</Text>
        </Box>

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
          <Group gap="xs">
            {book.author && (
              <Text size="xs" c="dimmed">
                {book.author}
              </Text>
            )}
            {book.target_month && !isDone && (
              <Text size="xs" c="dimmed">
                · {GROWTH_STRINGS.DUE} {formatTargetMonth(book.target_month)}
              </Text>
            )}
          </Group>
        </Box>

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

interface BookFormData {
  title: string
  author: string | null
  status: BookStatusType
  target_month: string | null
}

interface BookFormModalProps {
  initial?: Book
  onSave: (d: BookFormData) => void
  onClose: () => void
}

function BookFormModal({ initial, onSave, onClose }: BookFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [status, setStatus] = useState<BookStatusType>(
    initial?.status ?? BOOK_STATUS.WANT,
  )
  const [targetMonth, setTargetMonth] = useState(initial?.target_month ?? '')
  const [err, setErr] = useState(false)

  function submit() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    onSave({
      title: title.trim(),
      author: author || null,
      status,
      target_month: targetMonth || null,
    })
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
        <TextInput
          label={GROWTH_STRINGS.TARGET_MONTH_OPTIONAL}
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
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

// ─── Book Section ─────────────────────────────────────────────────────────────

function BookSection({
  label,
  books,
  badge,
  renderRow,
  onReorder,
}: {
  label: string
  books: Book[]
  badge?: number
  renderRow: (b: Book) => React.ReactNode
  onReorder: (items: Book[]) => void
}) {
  if (!books.length) return null
  return (
    <Stack gap="sm">
      <Group gap="xs">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {label}
        </Text>
        {badge !== undefined && (
          <Badge variant="light" color="green" size="xs">
            {badge}
          </Badge>
        )}
      </Group>
      <SortableList items={books} onReorder={onReorder} renderItem={renderRow} />
    </Stack>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  async function handleSave(d: BookFormData) {
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
        target_month: d.target_month,
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

  async function handleStatusChange(id: string, status: BookStatusType) {
    updateBook(id, { status })
    try {
      await svc.updateBook(id, { status })
    } catch {}
  }

  async function handleDelete(id: string) {
    removeBook(id)
    try {
      await svc.deleteBook(id)
    } catch {}
  }

  const makeRowProps = (b: Book) => ({
    key: b.id,
    book: b,
    onEdit: () => setEditBook(b),
    onDelete: () => handleDelete(b.id),
  })

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
              {done.length}/{YEARLY_BOOK_GOAL}
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
          value={(done.length / YEARLY_BOOK_GOAL) * 100}
          color="teal"
          radius="xl"
          size="md"
          styles={{ root: { backgroundColor: 'rgba(255,255,255,0.1)' } }}
        />
        <Text size="xs" c="dimmed" mt={6}>
          {YEARLY_BOOK_GOAL - done.length} {STRINGS.BOOKS_REMAINING}
        </Text>
      </Paper>

      {!yearBooks.length && <EmptyState message={STRINGS.BOOKS_EMPTY} />}

      <BookSection onReorder={(r) => persistOrder(r, (id, d) => updateBook(id, d), (id, d) => svc.updateBook(id, d))}
        label={STRINGS.READING_NOW}
        books={reading}
        renderRow={(b) => (
          <BookRow
            {...makeRowProps(b)}
            onDone={() => handleStatusChange(b.id, BOOK_STATUS.DONE)}
          />
        )}
      />

      <BookSection onReorder={(r) => persistOrder(r, (id, d) => updateBook(id, d), (id, d) => svc.updateBook(id, d))}
        label={STRINGS.WANT_TO_READ}
        books={want}
        renderRow={(b) => (
          <BookRow
            {...makeRowProps(b)}
            onStart={() => handleStatusChange(b.id, BOOK_STATUS.READING)}
          />
        )}
      />

      <BookSection onReorder={(r) => persistOrder(r, (id, d) => updateBook(id, d), (id, d) => svc.updateBook(id, d))}
        label={STRINGS.DONE}
        books={done}
        badge={done.length}
        renderRow={(b) => <BookRow {...makeRowProps(b)} />}
      />

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
