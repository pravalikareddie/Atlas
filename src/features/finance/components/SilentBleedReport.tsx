// @ts-nocheck
import { useState } from 'react'
import { Stack, Group, Text, Box, Progress, Button } from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { getCategoryInfo } from '../constants/categories'
import { STRINGS } from '../../tasks/constants/strings'
import { formatMoneyWhole } from '../utils/moneyUtils'
import { updateBudget as updateBudgetDb } from '../services/budgetService'

const EXCLUDED = ['savings', 'investing', 'income']

export function SilentBleedReport() {
  const { expenses, budgets, currentMonth, updateBudget, subscriptions } = useFinanceStore()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const monthBudgets = budgets.filter((b) => b.month === currentMonth && !EXCLUDED.includes(b.category))
  const monthExpenses = expenses.filter((e) => e.month === currentMonth)

  const spendByCategory = new Map<string, number>()
  for (const e of monthExpenses) spendByCategory.set(e.category, (spendByCategory.get(e.category) || 0) + e.amount)

  const bleeds: { id: string; category: string; spent: number; budget: number }[] = []
  for (const b of monthBudgets) {
    const spent = spendByCategory.get(b.category) || 0
    if (spent > b.amount && !b.overspend_acknowledged && !dismissed.has(b.id)) {
      bleeds.push({ id: b.id, category: b.category, spent, budget: b.amount })
    }
  }
  bleeds.sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget))

  function acknowledge(id: string) {
    setDismissed((s) => new Set([...s, id]))
    updateBudget(id, { overspend_acknowledged: true })
    updateBudgetDb(id, { overspend_acknowledged: true }).catch(() => {})
  }

  const activeSubs = subscriptions.filter((s) => s.status === 'active')
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + (s.period === 'yearly' ? Math.round(s.amount / 12) : s.amount), 0)

  return (
    <Stack gap="lg">
      {/* Over budget */}
      {bleeds.length === 0 ? (
        <Box p="lg" style={{ borderRadius: 16, border: '1px solid var(--mantine-color-teal-3)', background: 'var(--mantine-color-teal-light)' }}>
          <Group gap="md">
            <Text style={{ fontSize: 24 }}>✅</Text>
            <Box>
              <Text size="sm" fw={700} c="teal">All on track</Text>
              <Text size="xs" c="dimmed">{STRINGS.NO_OVER_BUDGET}</Text>
            </Box>
          </Group>
        </Box>
      ) : (
        <Box p="lg" style={{ borderRadius: 16, border: '1px solid rgba(240,80,80,0.3)' }}>
          <Group gap="md" mb="md">
            <Text style={{ fontSize: 24 }}>🚨</Text>
            <Box>
              <Text size="sm" fw={800} c="red">Over budget</Text>
              <Text size="xs" c="dimmed">{bleeds.length} {bleeds.length === 1 ? 'category' : 'categories'}</Text>
            </Box>
          </Group>
          <Stack gap="sm">
            {bleeds.map(({ id, category, spent, budget }) => {
              const info = getCategoryInfo(category)
              const pct = Math.round((spent / budget) * 100)
              return (
                <Box key={id} p="md" style={{ borderRadius: 12, background: 'var(--mantine-color-dark-6)' }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Text>{info.emoji}</Text>
                      <Text size="sm" fw={600}>{info.label}</Text>
                    </Group>
                    <Text size="sm" fw={700} c="red">{pct}%</Text>
                  </Group>
                  <Progress value={Math.min(pct, 100)} color="red" radius="xl" size="xs" styles={{ root: { backgroundColor: 'rgba(255,255,255,0.1)' } }} />
                  <Group justify="space-between" mt="xs">
                    <Text size="xs" c="dimmed">{formatMoneyWhole(spent)} / {formatMoneyWhole(budget)}</Text>
                    <Button size="xs" variant="light" color="orange" radius="xl" onClick={() => acknowledge(id)}>Got it</Button>
                  </Group>
                </Box>
              )
            })}
          </Stack>
        </Box>
      )}

      {/* Subscriptions */}
      <Box p="lg" style={{ borderRadius: 16, border: '1px solid var(--mantine-color-default-border)' }}>
        <Group gap="md" mb="md">
          <Text style={{ fontSize: 24 }}>📦</Text>
          <Box>
            <Text size="sm" fw={700}>Subscriptions</Text>
            <Text size="xs" c="dimmed">{activeSubs.length} active · {formatMoneyWhole(monthlyTotal)}/mo</Text>
          </Box>
        </Group>
        {activeSubs.length === 0 ? (
          <Text size="sm" c="dimmed">{STRINGS.NO_ACTIVE_SUBS}</Text>
        ) : (
          <Stack gap="xs">
            {activeSubs.map((s) => (
              <Group key={s.id} justify="space-between" p="md" style={{ borderRadius: 12, background: 'var(--mantine-color-dark-6)' }}>
                <Text size="sm" fw={500}>{s.name}</Text>
                <Text size="sm" fw={700}>{formatMoneyWhole(s.amount)}/{s.period === 'yearly' ? 'yr' : 'mo'}</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
