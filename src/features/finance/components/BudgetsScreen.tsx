import { useState } from 'react'
import { NavyCard, SectionHeader } from './FinanceDesign'
import {
  Stack,
  Group,
  Text,
  TextInput,
  Box,
  Progress,
  Badge,
  Button,
  Modal,
  ActionIcon,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { useBudgetSummary } from '../hooks/useBudgetSummary'
import { formatMonthDisplay, daysLeftInMonth } from '../utils/dateUtils'
import { formatMoneyWhole, dollarsToCents } from '../utils/moneyUtils'
import {
  getCategoryInfo,
  getBudgetCategories,
  CATEGORIES,
  addCategory,
 
  removeCategory,
} from '../constants/categories'
import { Budget } from '../types/finance.types'
import { upsertBudget as upsertBudgetDb } from '../services/budgetService'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { STRINGS } from '../../tasks/constants/strings'
import { USER_ID } from '../../tasks/constants/taskConstants'

export function BudgetsScreen() {
  const { currentMonth, budgets, setBudgets, loading } = useFinanceStore()
  const { rows, totalSpent, totalBudget, totalIncome } = useBudgetSummary()
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [managingCats, setManagingCats] = useState(false)
  const [newCatKey, setNewCatKey] = useState('')
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('')
  const [, forceUpdate] = useState(0)

  if (loading) return <SkeletonRow count={10} />

  const netSavings = totalIncome - totalSpent
  const spentRatio = totalBudget > 0 ? totalSpent / totalBudget : 0

  function startEdit() {
    const vals: Record<string, string> = {}
    budgets
      .filter((b) => b.month === currentMonth)
      .forEach((b) => {
        vals[b.category] = String(b.amount / 100)
      })
    getBudgetCategories().forEach((cat) => {
      if (!vals[cat]) vals[cat] = '0'
    })
    setEditValues(vals)
    setEditing(true)
  }

  async function saveEdit() {
    const results: Budget[] = [
      ...budgets.filter((b) => b.month !== currentMonth),
    ]
    for (const [category, val] of Object.entries(editValues)) {
      const amount = dollarsToCents(parseFloat(val) || 0)
      if (amount === 0) continue
      try {
        const saved = await upsertBudgetDb({
          user_id: USER_ID,
          category,
          month: currentMonth,
          amount,
          carried_over: 0,
          overspend_acknowledged: false,
          overspend_reason: null,
          manual_override: false,
        })
        results.push(saved)
      } catch {}
    }
    setBudgets(results)
    setEditing(false)
  }

  function handleAddCategory() {
    if (!newCatKey.trim() || !newCatLabel.trim()) return
    addCategory({
      key: newCatKey.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newCatLabel.trim(),
      emoji: newCatEmoji.trim() || '📦',
    })
    setNewCatKey('')
    setNewCatLabel('')
    setNewCatEmoji('')
    forceUpdate((n) => n + 1)
  }

  function handleRemoveCategory(key: string) {
    removeCategory(key)
    forceUpdate((n) => n + 1)
  }

  if (editing) {
    return (
      <Stack gap="lg">
        <Box
          p="xl"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
            borderRadius: 'var(--mantine-radius-xl)',
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text fw={800} c="white" style={{ fontSize: 22 }}>
                {STRINGS.EDIT_BUDGETS}
              </Text>
              <Text size="sm" c="white" opacity={0.8} mt={4}>
                {formatMonthDisplay(currentMonth)}
              </Text>
            </Box>
            <Group gap="md">
              <Button
                variant="white"
                color="teal"
                radius="xl"
                size="sm"
                onClick={() => setEditing(false)}
              >
                {STRINGS.CANCEL}
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'teal', to: 'blue' }}
                radius="xl"
                size="sm"
                onClick={saveEdit}
              >
                {STRINGS.SAVE_CHANGES}
              </Button>
            </Group>
          </Group>
        </Box>

        <NavyCard>
          <Stack gap="md">
            {getBudgetCategories().map((cat) => {
              const info = getCategoryInfo(cat)
              return (
                <Group key={cat} gap="md">
                  <Text style={{ fontSize: 20, width: 28 }}>{info.emoji}</Text>
                  <Text size="sm" fw={600} style={{ flex: 1 }}>
                    {info.label}
                  </Text>
                  <TextInput
                    value={editValues[cat] ?? '0'}
                    onChange={(e) =>
                      setEditValues({ ...editValues, [cat]: e.target.value })
                    }
                    leftSection={<Text size="sm">$</Text>}
                    type="number"
                    w={120}
                    radius="lg"
                    size="sm"
                  />
                </Group>
              )
            })}
          </Stack>
        </NavyCard>
      </Stack>
    )
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
              {formatMonthDisplay(currentMonth)} · {daysLeftInMonth()}{' '}
              {STRINGS.DAYS_LEFT}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 24 }}>
              {STRINGS.BUDGETS}
            </Text>
            <Text size="sm" c="white" opacity={0.8} mt={4}>
              {formatMoneyWhole(totalSpent)} {STRINGS.OF}{' '}
              {formatMoneyWhole(totalBudget)} {STRINGS.SPENT}
            </Text>
          </Box>
          <Group gap="xs">
            <Button
              variant="white"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<PencilSimple size={14} />}
              onClick={startEdit}
            >
              {STRINGS.EDIT_BUDGETS}
            </Button>
            <Button
              variant="white"
              color="violet"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={() => setManagingCats(true)}
            >
              Categories
            </Button>
          </Group>
        </Group>
        <Box mt="md">
          <Progress
            value={spentRatio * 100}
            color={totalSpent > totalBudget ? 'red' : 'white'}
            bg="rgba(255,255,255,0.2)"
            radius="xl"
            size="sm"
          />
        </Box>
      </Box>

      {/* Income vs spend summary */}
      {totalIncome > 0 && (
        <NavyCard>
          <SectionHeader label="This Month" />
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Income
              </Text>
              <Text size="sm" fw={700} c="teal">
                {formatMoneyWhole(totalIncome)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Spent
              </Text>
              <Text size="sm" fw={700}>
                {formatMoneyWhole(totalSpent)}
              </Text>
            </Group>
            <Box
              style={{ height: 1, background: 'rgba(255,255,255,0.1)' }}
            />
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                {netSavings >= 0 ? 'Net saved' : 'Net over'}
              </Text>
              <Text size="sm" fw={800} c={netSavings >= 0 ? 'teal' : 'red'}>
                {formatMoneyWhole(Math.abs(netSavings))}
              </Text>
            </Group>
          </Stack>
        </NavyCard>
      )}

      {/* Flat category list */}
      <NavyCard>
        <SectionHeader label="By category" />
        <Stack gap="md">
          {rows.length === 0 && (
            <Text size="sm" c="dimmed">
              No budget set. Tap Edit Budgets to set limits.
            </Text>
          )}
          {rows.map((row) => {
            const cat = getCategoryInfo(row.category)
            return (
              <Box key={row.category}>
                <Group gap="md" wrap="nowrap" mb={4}>
                  <Text style={{ fontSize: 18, width: 24 }}>{cat.emoji}</Text>
                  <Text size="sm" fw={600} style={{ flex: 1 }}>
                    {cat.label}
                  </Text>
                  <Text size="xs" c={row.overBudget ? 'red' : 'dimmed'}>
                    {formatMoneyWhole(row.spent)} /{' '}
                    {formatMoneyWhole(row.budget)}
                  </Text>
                  {row.overBudget && (
                    <Badge variant="urgent">{STRINGS.OVER}</Badge>
                  )}
                  {row.goalMet && <Badge variant="done">✓</Badge>}
                </Group>
                <Progress
                  value={Math.min(row.ratio * 100, 100)}
                  color={
                    row.overBudget ? 'red' : row.goalMet ? 'green' : 'teal'
                  }
                  bg="rgba(255,255,255,0.1)"
                  radius="xl"
                  size="xs"
                />
              </Box>
            )
          })}
        </Stack>
      </NavyCard>

      {/* Category Management Modal */}
      <Modal
        opened={managingCats}
        onClose={() => setManagingCats(false)}
        title="Manage Budget Categories"
        radius="xl"
        size="md"
      >
        <Stack gap="md">
          {CATEGORIES.map((cat) => (
            <Group key={cat.key} justify="space-between">
              <Group gap="sm">
                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                <Text size="sm" fw={500}>{cat.label}</Text>
                <Text size="xs" c="dimmed">({cat.key})</Text>
              </Group>
              {cat.key !== 'income' && cat.key !== 'other' && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => handleRemoveCategory(cat.key)}
                >
                  <Trash size={14} />
                </ActionIcon>
              )}
            </Group>
          ))}

          <Box style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Add New Category
          </Text>
          <Group grow>
            <TextInput
              placeholder="Emoji"
              value={newCatEmoji}
              onChange={(e) => setNewCatEmoji(e.target.value)}
              w={60}
              radius="lg"
              size="sm"
            />
            <TextInput
              placeholder="Key (e.g. dining)"
              value={newCatKey}
              onChange={(e) => setNewCatKey(e.target.value)}
              radius="lg"
              size="sm"
            />
            <TextInput
              placeholder="Label (e.g. Dining Out)"
              value={newCatLabel}
              onChange={(e) => setNewCatLabel(e.target.value)}
              radius="lg"
              size="sm"
            />
          </Group>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="sm"
            leftSection={<Plus size={14} />}
            onClick={handleAddCategory}
            disabled={!newCatKey.trim() || !newCatLabel.trim()}
          >
            Add Category
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
