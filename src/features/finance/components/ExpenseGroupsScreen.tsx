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
  RingProgress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { CaretLeft, ChatCircle, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
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
import { STRINGS } from '../constants/strings'

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
  const [expTag, setExpTag] = useState<string | null>(null)
  const [expSplitCount, setExpSplitCount] = useState('')
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null)
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<string | null>(null)

  const selected = expenseGroups.find((g) => g.id === selectedId)
  const selectedExpenses = useMemo(
    () => groupExpenses.filter((e) => e.group_id === selectedId),
    [groupExpenses, selectedId],
  )
  const selectedTotal = selectedExpenses.reduce((s, e) => s + e.amount, 0)
  const pendingFollowUps = selectedExpenses.filter((e) => e.tag && e.tag !== 'expense' && e.tag_status === 'pending')
  const splitwiseOwed = pendingFollowUps
    .filter((e) => e.tag === 'splitwise')
    .reduce((s, e) => {
      const split = e.split_count ?? 2
      return s + Math.round(e.amount * (split - 1) / split)
    }, 0)

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
    setExpTag(null)
    setExpSplitCount('')
    setEditingExpense(null)
    setShowAddExpense(false)
  }

  async function handleSaveExpense() {
    if (!selectedId) return
    const cents = dollarsToCents(parseFloat(expAmount) || 0)
    if (cents <= 0) return
    const splitCount = expTag === 'splitwise' && expSplitCount ? parseInt(expSplitCount) || null : null

    if (editingExpense) {
      const u = { amount: cents, category: expCategory || 'other', note: expNote || null, include_in_monthly: expInclude, tag: (expTag as any) || null, tag_status: expTag && expTag !== 'expense' ? 'pending' as const : null, split_count: splitCount }
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
        tag: (expTag as any) || null,
        tag_status: expTag && expTag !== 'expense' ? 'pending' as const : null,
        split_count: splitCount,
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
    setExpTag(e.tag ?? null)
    setExpSplitCount(e.split_count ? String(e.split_count) : '')
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

  const RING_COLORS = ['teal', 'blue', 'violet', 'orange', 'pink', 'cyan', 'yellow', 'red', 'green', 'grape']

  const groupCategoryBreakdown = useMemo(() => {
    if (!selectedId) return []
    const map = new Map<string, number>()
    selectedExpenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount))
    return [...map.entries()]
      .map(([category, amount]) => ({ category, amount, pct: selectedTotal > 0 ? (amount / selectedTotal) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
  }, [selectedExpenses, selectedTotal, selectedId])

  function chatAboutGroup() {
    if (!selected) return
    const summary = groupCategoryBreakdown.map((c) => `${getCategoryInfo(c.category).label}: ${formatMoneyWhole(c.amount)}`).join(', ')
    import('../../chat/ChatWidget').then((m) =>
      m.chatAboutItem('finance', `Expense group "${selected.name}" — Total: ${formatMoneyWhole(selectedTotal)}. Breakdown: ${summary}. ${pendingFollowUps.length} pending follow-ups.`),
    )
  }

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
            <ActionIcon variant="light" color="blue" radius="xl" size="sm" onClick={chatAboutGroup}>
              <ChatCircle size={14} />
            </ActionIcon>
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

        {/* Category breakdown ring */}
        {groupCategoryBreakdown.length > 1 && (
          <Paper p="lg" radius="xl" withBorder>
            <Group gap="lg" align="center" wrap="nowrap">
              <RingProgress
                size={120}
                thickness={12}
                roundCaps
                label={
                  <Box ta="center">
                    <Text fw={700} size="sm">{formatMoneyWhole(selectedTotal)}</Text>
                  </Box>
                }
                sections={groupCategoryBreakdown.map((c, i) => ({
                  value: c.pct,
                  color: `var(--mantine-color-${RING_COLORS[i % RING_COLORS.length]}-5)`,
                  tooltip: `${getCategoryInfo(c.category).label}: ${formatMoneyWhole(c.amount)}`,
                }))}
              />
              <Stack gap={4} style={{ flex: 1 }}>
                {groupCategoryBreakdown.map((c, i) => {
                  const info = getCategoryInfo(c.category)
                  return (
                    <Group key={c.category} gap="sm" py={2}>
                      <Box w={8} h={8} style={{ borderRadius: '50%', background: `var(--mantine-color-${RING_COLORS[i % RING_COLORS.length]}-5)`, flexShrink: 0 }} />
                      <Text size="xs" fw={500} style={{ flex: 1 }}>{info.emoji} {info.label}</Text>
                      <Text size="xs" fw={600}>{formatMoneyWhole(c.amount)}</Text>
                      <Text size="xs" c="dimmed">{Math.round(c.pct)}%</Text>
                    </Group>
                  )
                })}
              </Stack>
            </Group>
          </Paper>
        )}

        {selectedExpenses.length === 0 && (
          <Paper p="xl" radius="xl" withBorder ta="center">
            <Text size="xl" mb="sm">🧾</Text>
            <Text fw={600}>{STRINGS.NO_EXPENSES_IN_GROUP}</Text>
            <Text size="sm" c="dimmed">{STRINGS.NO_EXPENSES_IN_GROUP_DESC}</Text>
          </Paper>
        )}

        {pendingFollowUps.length > 0 && (
          <Paper p="md" radius="lg" withBorder style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}>
            <Text size="xs" fw={700} tt="uppercase" c="orange" mb="xs">{STRINGS.FOLLOW_UP} ({pendingFollowUps.length})</Text>
            {splitwiseOwed > 0 && <Text size="sm">{STRINGS.SPLITWISE_OWED}: <b>{formatMoneyWhole(splitwiseOwed)}</b></Text>}
            <Stack gap={4} mt="xs">
              {pendingFollowUps.map((e) => (
                <Group key={e.id} gap="sm" justify="space-between">
                  <Text size="sm">{e.note || getCategoryInfo(e.category).label} — <Badge size="xs" color={e.tag === 'splitwise' ? 'violet' : e.tag === 'refund' ? 'blue' : 'orange'}>{e.tag}</Badge></Text>
                  <Group gap="xs">
                    <Text size="sm" fw={600}>{formatMoneyWhole(e.amount)}</Text>
                    <Button size="xs" variant="light" color="green" radius="xl" onClick={async () => {
                      updateGroupExpense(e.id, { tag_status: 'settled' })
                      try { await updateGExpDb(e.id, { tag_status: 'settled' }) } catch {}
                    }}>{STRINGS.SETTLED}</Button>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}

        <Stack gap={2}>
          {selectedExpenses.map((e) => {
            const cat = getCategoryInfo(e.category)
            if (confirmDeleteExp === e.id) {
              return (
                <Group key={e.id} justify="space-between" py="xs" px={4}>
                  <Text size="sm">{STRINGS.DELETE_EXPENSE_CONFIRM}</Text>
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
                {e.tag && e.tag !== 'expense' && (
                  <Badge size="xs" variant="light" color={e.tag_status === 'settled' ? 'green' : 'orange'}>
                    {e.tag}{e.tag_status === 'settled' ? ' ✓' : ''}
                  </Badge>
                )}
                <Text size="sm" fw={700} style={{ flexShrink: 0 }}>
                  {e.tag === 'splitwise' && e.split_count
                    ? formatMoneyWhole(Math.round(e.amount / e.split_count))
                    : formatMoneyWhole(e.amount)}
                </Text>
                {e.tag === 'splitwise' && e.split_count && (
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>÷{e.split_count}</Text>
                )}
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
          title={editingExpense ? STRINGS.EDIT_EXPENSE : STRINGS.ADD}
          radius="xl"
          size="sm"
        >
          <Stack gap="md">
            <TextInput
              label={STRINGS.FIELD_AMOUNT}
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              leftSection={<Text size="sm">$</Text>}
              type="number"
              step={0.01}
              radius="lg"
              autoFocus
            />
            <Select
              label={STRINGS.WHERE_IT_WENT}
              value={expCategory || null}
              onChange={(v) => setExpCategory(v ?? '')}
              data={categoryData}
              radius="lg"
              placeholder={STRINGS.WHERE_IT_WENT}
              clearable
            />
            <TextInput
              label={STRINGS.FIELD_NOTE}
              value={expNote}
              onChange={(e) => setExpNote(e.target.value)}
              placeholder={STRINGS.PH_NOTE}
              radius="lg"
            />
            <Checkbox
              label={STRINGS.INCLUDE_IN_MONTHLY}
              checked={expInclude}
              onChange={(e) => setExpInclude(e.currentTarget.checked)}
              description={STRINGS.INCLUDE_IN_MONTHLY_DESC}
            />
            <Select
              label={STRINGS.TAG_LABEL}
              value={expTag}
              onChange={(v) => setExpTag(v)}
              data={[
                { value: 'expense', label: STRINGS.TAG_EXPENSE },
                { value: 'splitwise', label: STRINGS.TAG_SPLITWISE },
                { value: 'refund', label: STRINGS.TAG_REFUND },
                { value: 'return', label: STRINGS.TAG_RETURN },
              ]}
              placeholder="None"
              clearable
              radius="lg"
            />
            {expTag === 'splitwise' && (
              <TextInput
                label={STRINGS.SPLIT_COUNT_LABEL}
                value={expSplitCount}
                onChange={(e) => setExpSplitCount(e.target.value)}
                type="number"
                placeholder="2"
                radius="lg"
              />
            )}
            <Group justify="flex-end">
              <Button variant="default" radius="xl" onClick={resetExpenseForm}>{STRINGS.CANCEL}</Button>
              <Button
                variant="gradient"
                gradient={{ from: 'teal', to: 'blue' }}
                radius="xl"
                onClick={handleSaveExpense}
                disabled={!expAmount}
              >
                {editingExpense ? STRINGS.SAVE_CHANGES : STRINGS.ADD}
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
        <Text fw={700} size="lg">{STRINGS.EXPENSE_GROUPS}</Text>
        <Button
          variant="light"
          color="teal"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => setShowAdd(true)}
        >
          {STRINGS.NEW_GROUP}
        </Button>
      </Group>

      {activeGroups.length === 0 && closedGroups.length === 0 && (
        <Paper p="xl" radius="xl" withBorder ta="center">
          <Text size="xl" mb="sm">📂</Text>
          <Text fw={600}>{STRINGS.NO_GROUPS_YET}</Text>
          <Text size="sm" c="dimmed">{STRINGS.NO_GROUPS_DESC}</Text>
        </Paper>
      )}

      {activeGroups.length > 0 && (
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">{STRINGS.ACTIVE_GROUPS}</Text>
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
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">{STRINGS.CLOSED_GROUPS}</Text>
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
                    <Button size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); handleReopenGroup(g.id) }}>{STRINGS.REOPEN}</Button>
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
      <Modal opened={showAdd} onClose={() => { setShowAdd(false); setName(''); setEmoji('') }} title={STRINGS.NEW_EXPENSE_GROUP} radius="xl" size="sm">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label={STRINGS.GROUP_EMOJI_LABEL}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏕️"
              w={80}
              radius="lg"
            />
            <TextInput
              label={STRINGS.GROUP_NAME_LABEL}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. California Road Trip"
              radius="lg"
              autoFocus
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { setShowAdd(false); setName(''); setEmoji('') }}>{STRINGS.CANCEL}</Button>
            <Button variant="gradient" gradient={{ from: 'teal', to: 'blue' }} radius="xl" onClick={handleCreateGroup} disabled={!name.trim()}>{STRINGS.LOG}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Group Modal */}
      <Modal opened={!!editGroup} onClose={() => { setEditGroup(null); setName(''); setEmoji('') }} title={STRINGS.EDIT_GROUP} radius="xl" size="sm">
        <Stack gap="md">
          <Group grow>
            <TextInput
              label={STRINGS.GROUP_EMOJI_LABEL}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🏕️"
              w={80}
              radius="lg"
            />
            <TextInput
              label={STRINGS.GROUP_NAME_LABEL}
              value={name}
              onChange={(e) => setName(e.target.value)}
              radius="lg"
              autoFocus
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { setEditGroup(null); setName(''); setEmoji('') }}>{STRINGS.CANCEL}</Button>
            <Button variant="gradient" gradient={{ from: 'teal', to: 'blue' }} radius="xl" onClick={handleUpdateGroup} disabled={!name.trim()}>{STRINGS.SAVE_CHANGES}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
