import { useMemo, useState } from 'react'
import { Expense } from '../types/finance.types'
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
  RingProgress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import {
  CaretLeft,
  CaretRight,
  FolderPlus,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  dollarsToCents,
  formatDateShort,
  formatMoneyWhole,
  formatMonthDisplay,
} from '../utils'
import { ROUTES } from '../../../app/routes'
import {
  getExpenseGridCategories,
  getCategoryInfo,
} from '../constants/categories'
import { useFinanceStore } from '../store/financeStore'
import { deleteExpense as deleteExpenseDb, updateExpense as updateExpenseDb } from '../services/expenseService'
import { insertGroupExpense } from '../services/groupExpenseService'
import { STRINGS } from '../../tasks/constants/strings'
import { STRINGS as F_STRINGS } from '../constants/strings'

export function ExpensesScreen() {
  const { expenses, removeExpense, currentMonth, expenseGroups, addGroupExpense } = useFinanceStore()
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [month, setMonth] = useState(currentMonth)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'category'>('newest')

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.month === month && e.category !== 'income' && e.category !== 'savings' && e.category !== 'investing'),
    [expenses, month],
  )

  const filtered = useMemo(() => {
    let list = categoryFilter ? monthExpenses.filter((e) => e.category === categoryFilter) : monthExpenses
    return [...list].sort((a, b) => {
      switch (sortOrder) {
        case 'oldest': return a.logged_at.localeCompare(b.logged_at)
        case 'highest': return b.amount - a.amount
        case 'lowest': return a.amount - b.amount
        case 'category': return a.category.localeCompare(b.category)
        default: return b.logged_at.localeCompare(a.logged_at)
      }
    })
  }, [monthExpenses, categoryFilter, sortOrder])

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0)

  const uniqueCategories = useMemo(
    () => [...new Set(monthExpenses.map((e) => e.category))],
    [monthExpenses],
  )

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    monthExpenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount))
    return [...map.entries()]
      .map(([category, amount]) => ({ category, amount, pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses, totalSpent])

  const RING_COLORS = ['teal', 'blue', 'violet', 'orange', 'pink', 'cyan', 'yellow', 'red', 'green', 'grape']

  async function handleDelete(id: string) {
    removeExpense(id)
    try {
      await deleteExpenseDb(id)
    } catch {}
    setConfirmId(null)
  }

  async function handleAddToGroup(expense: Expense, groupId: string) {
    const row = {
      user_id: expense.user_id,
      group_id: groupId,
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      logged_at: expense.logged_at,
      include_in_monthly: true,
      tag: null,
      tag_status: null,
      split_count: null,
    }
    try {
      addGroupExpense(await insertGroupExpense(row))
    } catch {
      addGroupExpense({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    }
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text
              size="xs"
              fw={600}
              c="white"
              tt="uppercase"
              opacity={0.8}
              mb={4}
            >
              {formatMonthDisplay(month)}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 24 }}>
              {STRINGS.EXPENSES}
            </Text>
            <Text size="sm" c="white" opacity={0.8} mt={4}>
              {monthExpenses.length} {STRINGS.TRANSACTIONS} ·{' '}
              {formatMoneyWhole(totalSpent)}
            </Text>
          </Box>
          <Group gap="xs">
            <ActionIcon
              variant="white"
              color="teal"
              radius="xl"
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m + '-01')
                  d.setMonth(d.getMonth() - 1)
                  return format(d, 'yyyy-MM')
                })
              }
            >
              <CaretLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="white"
              color="teal"
              radius="xl"
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m + '-01')
                  d.setMonth(d.getMonth() + 1)
                  return format(d, 'yyyy-MM')
                })
              }
            >
              <CaretRight size={16} />
            </ActionIcon>
            <Button
              variant="white"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() => navigate(ROUTES.FINANCE_LOG_EXPENSE)}
            >
              {STRINGS.LOG_EXPENSE}
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Category breakdown chart */}
      {categoryBreakdown.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Group gap="lg" align="center" wrap="nowrap">
            <RingProgress
              size={140}
              thickness={14}
              roundCaps
              label={
                <Box ta="center">
                  <Text size="xs" c="dimmed">Total</Text>
                  <Text fw={700} size="sm">{formatMoneyWhole(totalSpent)}</Text>
                </Box>
              }
              sections={categoryBreakdown.map((c, i) => ({
                value: c.pct,
                color: `var(--mantine-color-${RING_COLORS[i % RING_COLORS.length]}-5)`,
                tooltip: `${getCategoryInfo(c.category).label}: ${formatMoneyWhole(c.amount)}`,
              }))}
            />
            <Stack gap={4} style={{ flex: 1 }}>
              {categoryBreakdown.map((c, i) => {
                const info = getCategoryInfo(c.category)
                const isActive = categoryFilter === c.category
                return (
                  <UnstyledButton
                    key={c.category}
                    onClick={() => setCategoryFilter(isActive ? null : c.category)}
                    style={{ width: '100%' }}
                  >
                    <Group gap="sm" py={4} px="xs" style={{
                      borderRadius: 'var(--mantine-radius-md)',
                      background: isActive ? `var(--mantine-color-${RING_COLORS[i % RING_COLORS.length]}-light)` : 'transparent',
                    }}>
                      <Box w={10} h={10} style={{ borderRadius: '50%', background: `var(--mantine-color-${RING_COLORS[i % RING_COLORS.length]}-5)`, flexShrink: 0 }} />
                      <Text size="xs" fw={isActive ? 700 : 500} style={{ flex: 1 }}>{info.emoji} {info.label}</Text>
                      <Text size="xs" fw={600}>{formatMoneyWhole(c.amount)}</Text>
                      <Text size="xs" c="dimmed">{Math.round(c.pct)}%</Text>
                    </Group>
                  </UnstyledButton>
                )
              })}
            </Stack>
          </Group>
        </Paper>
      )}

      {/* Category filter */}
      {uniqueCategories.length > 0 && (
        <Group gap="xs" wrap="wrap">
          <Badge
            variant={!categoryFilter ? 'filled' : 'outline'}
            color="teal"
            style={{ cursor: 'pointer' }}
            onClick={() => setCategoryFilter(null)}
          >
            {STRINGS.ALL}
          </Badge>
          {uniqueCategories.map((cat) => {
            const info = getCategoryInfo(cat)
            return (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? 'filled' : 'outline'}
                color="teal"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? null : cat)
                }
              >
                {info.emoji} {info.label}
              </Badge>
            )
          })}
        </Group>
      )}

      {/* Sort & totals */}
      <Group justify="space-between">
        <Select
          size="xs"
          radius="lg"
          w={130}
          value={sortOrder}
          onChange={(v) => v && setSortOrder(v as any)}
          data={[
            { value: 'newest', label: '↓ Newest' },
            { value: 'oldest', label: '↑ Oldest' },
            { value: 'highest', label: '$ High' },
            { value: 'lowest', label: '$ Low' },
            { value: 'category', label: '🏷 Category' },
          ]}
        />
        {categoryFilter && (
          <Text size="sm" fw={600}>
            {filtered.length} items · {formatMoneyWhole(filteredTotal)}
          </Text>
        )}
      </Group>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">
            💸
          </Text>
          <Text fw={600} mb="xs">
            {STRINGS.NO_EXPENSES}
          </Text>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            onClick={() => navigate(ROUTES.FINANCE_LOG_EXPENSE)}
          >
            {STRINGS.LOG_EXPENSE}
          </Button>
        </Paper>
      )}

      {/* Expense list — grouped by fixed/variable */}
      {(() => {
        const FIXED_KEYS = new Set(['rent', 'phone', 'internet', 'emi1', 'emi2'])
        const fixedExpenses = filtered.filter((e) => FIXED_KEYS.has(e.category))
        const variableExpenses = filtered.filter((e) => !FIXED_KEYS.has(e.category))
        const fixedTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0)
        const variableTotal = variableExpenses.reduce((s, e) => s + e.amount, 0)

        function ExpenseRow({ e }: { e: Expense }) {
          const cat = getCategoryInfo(e.category)
          if (confirmId === e.id) {
            return (
              <Group key={e.id} justify="space-between" py="xs" px={4}>
                <Text size="sm">{STRINGS.CONFIRM_DELETE_EXPENSE}</Text>
                <Group gap="xs">
                  <Button variant="filled" color="red" size="xs" radius="xl" onClick={() => handleDelete(e.id)}>{STRINGS.YES}</Button>
                  <Button variant="default" size="xs" radius="xl" onClick={() => setConfirmId(null)}>{STRINGS.NO}</Button>
                </Group>
              </Group>
            )
          }
          return (
            <Group gap="sm" py={8} px={4} wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <Text style={{ fontSize: 16, flexShrink: 0 }}>{cat.emoji}</Text>
              <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{e.note || cat.label}</Text>
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{formatDateShort(e.logged_at)}</Text>
              <Text size="sm" fw={700} style={{ flexShrink: 0 }}>{formatMoneyWhole(e.amount)}</Text>
              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="xs" color="blue"><FolderPlus size={12} /></ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{F_STRINGS.ADD_TO_GROUP}</Menu.Label>
                  {expenseGroups.filter((g) => g.status === 'active').length === 0 && (
                    <Menu.Item disabled>{F_STRINGS.NO_GROUPS_AVAILABLE}</Menu.Item>
                  )}
                  {expenseGroups.filter((g) => g.status === 'active').map((g) => (
                    <Menu.Item key={g.id} onClick={() => handleAddToGroup(e, g.id)}>
                      {g.emoji ?? '📂'} {g.name}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <ActionIcon variant="subtle" size="xs" onClick={() => setEditExpense(e)}><PencilSimple size={12} /></ActionIcon>
              <ActionIcon variant="subtle" color="red" size="xs" onClick={() => setConfirmId(e.id)}><Trash size={12} /></ActionIcon>
            </Group>
          )
        }

        return (
          <Stack gap="md">
            {fixedExpenses.length > 0 && (
              <Paper p="md" radius="lg" withBorder>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Fixed Bills · {formatMoneyWhole(fixedTotal)}</Text>
                <Stack gap={2}>
                  {fixedExpenses.map((e) => <ExpenseRow key={e.id} e={e} />)}
                </Stack>
              </Paper>
            )}
            {variableExpenses.length > 0 && (
              <Paper p="md" radius="lg" withBorder>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Variable · {formatMoneyWhole(variableTotal)}</Text>
                <Stack gap={2}>
                  {variableExpenses.map((e) => <ExpenseRow key={e.id} e={e} />)}
                </Stack>
              </Paper>
            )}
          </Stack>
        )
      })()}

      {/* Edit modal */}
      {editExpense && (
        <ExpenseEditModal
          expense={editExpense}
          onSave={async (_data) => {
            // update in store
            // update in db
            setEditExpense(null)
          }}
          onClose={() => setEditExpense(null)}
        />
      )}
    </Stack>
  )
}

function ExpenseEditModal({
  expense,
  onSave,
  onClose,
}: {
  expense: Expense
  onSave: (data: { amount: number; category: string; note: string }) => void
  onClose: () => void
}) {
  const { updateExpense } = useFinanceStore() // add this to store
  const [amount, setAmount] = useState(String(expense.amount / 100))
  const [category, setCategory] = useState(expense.category)
  const [note, setNote] = useState(expense.note ?? '')

  async function save() {
    const newAmount = dollarsToCents(parseFloat(amount) || 0)
    const data = { amount: newAmount, category, note: note || null }
    updateExpense(expense.id, data)
    try {
      await updateExpenseDb(expense.id, data)
    } catch {}
    onSave({ amount: newAmount, category, note })
    onClose()
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={STRINGS.EDIT_EXPENSE}
      radius="xl"
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label={STRINGS.FIELD_AMOUNT}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftSection={<Text size="sm">$</Text>}
          type="number"
          step={0.01}
          radius="lg"
          autoFocus
        />

        <Box>
          <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
            {STRINGS.CATEGORY}
          </Text>
          <SimpleGrid cols={4} spacing="xs">
            {getExpenseGridCategories().map((key) => {
              const cat = getCategoryInfo(key)
              const sel = category === key
              return (
                <UnstyledButton key={key} onClick={() => setCategory(key)}>
                  <Box
                    p="sm"
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      textAlign: 'center',
                      background: sel
                        ? 'var(--mantine-color-teal-light)'
                        : 'var(--mantine-color-gray-0)',
                      border: sel
                        ? '2px solid var(--mantine-color-teal-4)'
                        : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    <Text
                      size="xs"
                      fw={sel ? 700 : 400}
                      c={sel ? 'teal' : 'dimmed'}
                    >
                      {cat.label}
                    </Text>
                  </Box>
                </UnstyledButton>
              )
            })}
          </SimpleGrid>
        </Box>

        <TextInput
          label={STRINGS.FIELD_NOTE}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={STRINGS.PH_NOTE}
          radius="lg"
        />

        <Divider />
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            onClick={save}
          >
            {STRINGS.SAVE}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
