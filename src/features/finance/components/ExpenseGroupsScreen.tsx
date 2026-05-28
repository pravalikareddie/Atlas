import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { CaretLeft, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useFinanceStore } from '../store/financeStore'
import { ExpenseGroup, GroupExpense } from '../types/finance.types'
import {
  insertExpenseGroup,
  updateExpenseGroup as updateGroupDb,
  deleteExpenseGroup,
  fetchGroupExpenses,
  insertGroupExpense,
  updateGroupExpense as updateGExpDb,
  deleteGroupExpense,
} from '../services/groupExpenseService'
import { getExpenseGridCategories, getCategoryInfo } from '../constants/categories'
import { dollarsToCents, formatMoneyWhole } from '../utils/moneyUtils'
import { formatDateShort } from '../utils'
import { USER_ID } from '../../tasks/constants/taskConstants'

export function ExpenseGroupsScreen() {
  const {
    expenseGroups,
    groupExpenses,
    addExpenseGroup,
    updateExpenseGroup,
    removeExpenseGroup,
    addGroupExpense,
    updateGroupExpense,
    removeGroupExpense,
  } = useFinanceStore()

  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [editGroup, setEditGroup] = useState<ExpenseGroup | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null)

  // Expense form
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('')
  const [expNote, setExpNote] = useState('')
  const [expInclude, setExpInclude] = useState(false)
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null)
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<string | null>(null)

  const selected = expenseGroups.find((g) => g.id === selectedId)
  const selectedExpenses = useMemo(
    () => groupExpenses.filter((e) => e.group_id === selectedId),
    [groupExpenses, selectedId],
  )
  const selectedTotal = selectedExpenses.reduce((s, e) => s + e.amount, 0)

  // Fetch group expenses when selecting a group
  useEffect(() => {
    if (!selectedId) return
    fetchGroupExpenses(selectedId)
      .then((exps) => {
        const others = useFinanceStore.getState().groupExpenses.filter((e) => e.group_id !== selectedId)
        useFinanceStore.getState().setGroupExpenses([...others, ...exps])
      })
      .catch(() => {})
  }, [selectedId])

  async function handleCreateGroup() {
    if (!name.trim()) return
    const row = { user_id: USER_ID, name: name.trim(), emoji: emoji.trim() || null, status: 'active' as const }
    try {
      addExpenseGroup(await insertExpenseGroup(row))
    } catch {
      addExpenseGroup({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    }
    setName('')
    setEmoji('')
    setShowAdd(false)
  }

  async function handleUpdateGroup() {
    if (!editGroup || !name.trim()) return
    const u = { name: name.trim(), emoji: emoji.trim() || null }
    updateExpenseGroup(editGroup.id, u)
    try { await updateGroupDb(editGroup.id, u) } catch {}
    setEditGroup(null)
    setName('')
    setEmoji('')
  }

  async function handleDeleteGroup(id: string) {
    removeExpenseGroup(id)
    if (selectedId === id) setSelectedId(null)
    try { await deleteExpenseGroup(id) } catch {}
    setConfirmDeleteGroup(null)
  }

  async function handleCloseGroup(id: string) {
    updateExpenseGroup(id, { status: 'closed' })
    try { await updateGroupDb(id, { status: 'closed' }) } catch {}
  }

  async function handleReopenGroup(id: string) {
    updateExpenseGroup(id, { status: 'active' })
    try { await updateGroupDb(id, { status: 'active' }) } catch {}
  }

  function openEditGroup(g: ExpenseGroup) {
    setEditGroup(g)
    setName(g.name)
    setEmoji(g.emoji ?? '')
  }

  function resetExpenseForm() {
    setExpAmount('')
    setExpCategory('')
    setExpNote('')
    setExpInclude(false)
    setEditingExpense(null)
    setShowAddExpense(false)
  }

  async function handleSaveExpense() {
    if (!selectedId) return
    const cents = dollarsToCents(parseFloat(expAmount) || 0)
    if (cents <= 0) return

    if (editingExpense) {
      const u = { amount: cents, category: expCategory || 'other', note: expNote || null, include_in_monthly: expInclude }
      updateGroupExpense(editingExpense.id, u)
      try { await updateGExpDb(editingExpense.id, u) } catch {}
    } else {
      const row = {
        user_id: USER_ID,
        group_id: selectedId,
        amount: cents,
        category: expCategory || 'other',
        note: expNote || null,
        logged_at: new Date().toISOString(),
        include_in_monthly: expInclude,
      }
      try {
        addGroupExpense(await insertGroupExpense(row))
      } catch {
        addGroupExpense({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      }
    }
    resetExpenseForm()
  }

  function openEditExpense(e: GroupExpense) {
    setEditingExpense(e)
    setExpAmount(String(e.amount / 100))
    setExpCategory(e.category)
    setExpNote(e.note ?? '')
    setExpInclude(e.include_in_monthly)
    setShowAddExpense(true)
  }

  async function handleDeleteExpense(id: string) {
    removeGroupExpense(id)
    try { await deleteGroupExpense(id) } catch {}
    setConfirmDeleteExp(null)
  }

  const activeGroups = expenseGroups.filter((g) => g.status === 'active')
  const closedGroups = expenseGroups.filter((g) => g.status === 'closed')

  const categoryData = getExpenseGridCategories().map((k) => {
    const c = getCategoryInfo(k)
    return { value: k, label: `${c.emoji} ${c.label}` }
  })

  // ─── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Group gap="sm">
            <UnstyledButton onClick={() => setSelectedId(null)}>
              <CaretLeft size={18} />
            </UnstyledButton>
            <Text fw={700} size="lg">
              {selected.emoji ?? '📂'} {selected.name}
            </Text>
            <Badge color={selected.status === 'active' ? 'teal' : 'gray'} size="sm">
              {selected.status}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text fw={700}>{formatMoneyWhole(selectedTotal)}</Text>
            <Button
              variant="light"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() => setShowAddExpense(true)}
            >
              Add
            </Button>
          </Group>
        </Group>

        {selectedExpenses.length === 0 && (
          <Paper p="xl" radius="xl" withBorder ta="center">
            <Text size="xl" mb="sm">🧾</Text>
            <Text fw={600}>No expenses yet</Text>
            <Text size="sm" c="dimmed">Add expenses to track spending for this group.</Text>
          </Paper>
        )}

        <Stack gap={2}>
          {selectedExpenses.map((e) => {
            const cat = getCategoryInfo(e.category)
            if (confirmDeleteExp === e.id) {
              return (
                <Group key={e.id} justify="space-between" py="xs" px={4}>
                  <Text size="sm">Delete this expense?</Text>
                  <Group gap="xs">
                    <Button variant="filled" color="red" size="xs" radius="xl" onClick={() => handleDeleteExpense(e.id)}>Yes</Button>
                    <Button variant="default" size="xs" radius="xl" onClick={() => setConfirmDeleteExp(null)}>No</Button>
                  </Group>
                </Group>
              )
            }
            return (
              <Group key={e.id} gap="sm" py={8} px={4} wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Text style={{ fontSize: 16, flexShrink: 0 }}>{cat.emoji}</Text>
                <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{e.note || cat.label}</Text>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{formatDateShort(e.logged_at)}</Text>
                {e.include_in_monthly && <Badge size="xs" variant="light" color="blue">Monthly</Badge>}
                <Text size="sm" fw={700} style={{ flexShrink: 0 }}>{formatMoneyWhole(e.amount)}</Text>
                <ActionIcon variant="subtle" size="xs" onClick={() => openEditExpense(e)}><PencilSimple size={12} /></ActionIcon>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => setConfirmDeleteExp(e.id)}><Trash size={12} /></ActionIcon>
              </Group>
            )
          })}
        </Stack>

        {/* Add/Edit Expense Modal */}
        <Modal
          opened={showAddExpense}
          onClose={resetExpenseForm}
          title={editingExpense ? 'Edit Expense' : 'Add Expense'}
          radius="xl"
          size="sm"
        >
          <Stack gap="md">
            <TextInput
              label="Amount"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              leftSection={<Text size="sm">$</Text>}
              type="number"
              step={0.01}
              radius="lg"
              autoFocus
            />
            <Select
              label="Category"
              value={expCategory || null}
              onChange={(v) => setExpCategory(v ?? '')}
              data={categoryData}
              radius="lg"
              placeholder="Select category"
              clearable
            />
            <TextInput
              label="Note"
              value={expNote}
              onChange={(e) => setExpNote(e.target.value)}
              placeholder="What was this for?"
              radius="lg"
            />
            <Checkbox
              label="Include in monthly expenses"
              checked={expInclude}
              onChange={(e) => setExpInclude(e.currentTarget.checked)}
              description="Count this toward your normal monthly budget"
            />
            <Group justify="flex-end">
              <Button variant="default" radius="xl" onClick={resetExpenseForm}>Cancel</Button>
              <Button
                variant="gradient"
                gradient={{ from: 'teal', to: 'blue' }}
                radius="xl"
                onClick={handleSaveExpense}
                disabled={!expAmount}
              >
                {editingExpense ? 'Save' : 'Add'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    )
  }

  // ─── List view ──────────────────────────────────────────────────────────────
  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text fw={700} size="lg">Expense Groups</Text>
        <Button
          variant="light"
          color="teal"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => setShowAdd(true)}
        >
          New Group
        </Button>
      </Group>

      {activeGroups.length === 0 && closedGroups.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">📂</Text>
          <Text fw={600}>No expense groups yet</Text>
          <Text size="sm" c="dimmed">Create a group to track expenses for a trip, event, project, or anything.</Text>
        </Paper>
      )}

      {activeGroups.length > 0 && (
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">Active</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {activeGroups.map((g) => {
              const total = groupExpenses.filter((e) => e.group_id === g.id).reduce((s, e) => s + e.amount, 0)
              return (
                <Paper key={g.id} p="md" radius="lg" withBorder style={{ cursor: 'pointer' }} onClick={() => setSelectedId(g.id)}>
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Text style={{ fontSize: 20 }}>{g.emoji ?? '📂'}</Text>
                      <Box>
                        <Text fw={600} size="sm">{g.name}</Text>
                        {total > 0 && <Text size="xs" c="dimmed">{formatMoneyWhole(total)}</Text>}
                      </Box>
                    </Group>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" size="xs" onClick={(e) => { e.stopPropagation(); openEditGroup(g) }}>
                        <PencilSimple size={12} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" size="xs" color="orange" onClick={(e) => { e.stopPropagation(); handleCloseGroup(g.id) }}>
                        ✓
                      </ActionIcon>
                      {confirmDeleteGroup === g.id ? (
                        <Group gap={4} onClick={(e) => e.stopPropagation()}>
                          <Button size="xs" color="red" radius="xl" onClick={() => handleDeleteGroup(g.id)}>Yes</Button>
                          <Button size="xs" variant="default" radius="xl" onClick={() => setConfirmDeleteGroup(null)}>No</Button>
                        </Group>
                      ) : (
                        <ActionIcon variant="subtle" size="xs" color="red" onClick={(e) => { e.stopPropagation(); setConfirmDeleteGroup(g.id) }}>
                          <Trash size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Paper>
              )
            })}
          </SimpleGrid>
        </Stack>
      )}

      {closedGroups.length > 0 && (
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">Closed</Text>
          {closedGroups.map((g) => {
            const total = groupExpenses.filter((e) => e.group_id === g.id).reduce((s, e) => s + e.amount, 0)
            return (
              <Paper key={g.id} p="md" radius="lg" withBorder style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setSelectedId(g.id)}>
                <Group justify="space-between">
                  <Group gap="sm">
                    <Text style={{ fontSize: 20 }}>{g.emoji ?? '📂'}</Text>
                    <Box>
                      <Text fw={600} size="sm">{g.name}</Text>
                      {total > 0 && <Text size="xs" c="dimmed">{formatMoneyWhole(total)}</Text>}
                    </Box>
                  </Group>
                  <Group gap={4}>
                    <Button size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); handleReopenGroup(g.id) }}>Reopen</Button>
                    <ActionIcon variant="subtle" size="xs" color="red" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id) }}>
                      <Trash size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            )
          })}
        </Stack>
      )}

      {/* Create Group Modal */}
      <Modal opened={showAdd} onClose={() => { setShowAdd(false); setName(''); setEmoji('') }} title="New Expense Group" radius="xl" size="sm">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏕️"
              w={80}
              radius="lg"
            />
            <TextInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. California Road Trip"
              radius="lg"
              autoFocus
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { setShowAdd(false); setName(''); setEmoji('') }}>Cancel</Button>
            <Button variant="gradient" gradient={{ from: 'teal', to: 'blue' }} radius="xl" onClick={handleCreateGroup} disabled={!name.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Group Modal */}
      <Modal opened={!!editGroup} onClose={() => { setEditGroup(null); setName(''); setEmoji('') }} title="Edit Group" radius="xl" size="sm">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏕️"
              w={80}
              radius="lg"
            />
            <TextInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              radius="lg"
              autoFocus
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { setEditGroup(null); setName(''); setEmoji('') }}>Cancel</Button>
            <Button variant="gradient" gradient={{ from: 'teal', to: 'blue' }} radius="xl" onClick={handleUpdateGroup} disabled={!name.trim()}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
