import { useState } from 'react'
import {
  Stack,
  Group,
  Text,
  TextInput,
  Paper,
  Box,
  Progress,
  Badge,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { useBudgetSummary } from '../hooks/useBudgetSummary'
import { formatMonthDisplay, daysLeftInMonth } from '../utils/dateUtils'
import { formatMoneyWhole, dollarsToCents } from '../utils/moneyUtils'
import { getCategoryInfo, BUDGET_GROUPS } from '../constants/categories'
import { updateBudget as updateBudgetDb } from '../services/budgetService'
import { Button } from '@mantine/core'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { PencilSimple } from '@phosphor-icons/react'
import { STRINGS } from '../../tasks/constants/strings'

export function BudgetsScreen() {
  const { currentMonth, budgets, updateBudget, loading } = useFinanceStore()
  const { rows, totalSpent, totalBudget } = useBudgetSummary()
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  if (loading) return <SkeletonRow count={10} />

  function startEdit() {
    const vals: Record<string, string> = {}
    budgets
      .filter((b) => b.month === currentMonth)
      .forEach((b) => {
        vals[b.category] = String(b.amount / 100)
      })
    setEditValues(vals)
    setEditing(true)
  }

  async function saveEdit() {
    for (const b of budgets.filter((b) => b.month === currentMonth)) {
      const v = editValues[b.category]
      if (v !== undefined) {
        const newAmount = dollarsToCents(parseFloat(v) || 0)
        updateBudget(b.id, { amount: newAmount })
        try {
          await updateBudgetDb(b.id, { amount: newAmount })
        } catch {}
      }
    }
    setEditing(false)
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
            <Group gap="xs">
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
                variant="filled"
                color="white"
                radius="xl"
                size="sm"
                onClick={saveEdit}
              >
                {STRINGS.SAVE_CHANGES}
              </Button>
            </Group>
          </Group>
        </Box>

        {BUDGET_GROUPS.map((group) => (
          <Paper key={group.key} p="lg" radius="xl" withBorder>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="md">
              {group.label}
            </Text>
            <Stack gap="sm">
              {group.categories.map((cat) => {
                const info = getCategoryInfo(cat)
                return (
                  <Group key={cat} gap="sm">
                    <Text style={{ fontSize: 20 }}>{info.emoji}</Text>
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
          </Paper>
        ))}
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
        </Group>

        <Box mt="md">
          <Progress
            value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
            color={totalSpent > totalBudget ? 'red' : 'white'}
            bg="rgba(255,255,255,0.2)"
            radius="xl"
            size="sm"
          />
        </Box>
      </Box>

      {/* Budget groups */}
      {BUDGET_GROUPS.map((group) => {
        const groupRows = rows.filter((r) => r.group === group.key)
        if (!groupRows.length) return null
        const groupSpent = groupRows.reduce((s, r) => s + r.spent, 0)
        const groupBudget = groupRows.reduce((s, r) => s + r.budget, 0)

        return (
          <Paper key={group.key} p="lg" radius="xl" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                {group.label}
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoneyWhole(groupSpent)} / {formatMoneyWhole(groupBudget)}
              </Text>
            </Group>
            <Stack gap="md">
              {groupRows.map((row) => {
                const cat = getCategoryInfo(row.category)
                return (
                  <Box key={row.category}>
                    <Group gap="sm" wrap="nowrap" mb={4}>
                      <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
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
                      bg="var(--mantine-color-gray-2)"
                      radius="xl"
                      size="xs"
                    />
                  </Box>
                )
              })}
            </Stack>
          </Paper>
        )
      })}
    </Stack>
  )
}
