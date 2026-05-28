import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  Paper,
  TextInput,
  SimpleGrid,
  UnstyledButton,
  Box,
  Progress,
  Button,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { useBudgetSummary } from '../hooks/useBudgetSummary'
import {
  getExpenseGridCategories,
  getCategoryInfo,
} from '../constants/categories'
import {
  dollarsToCents,
  formatMoney,
  formatMoneyWhole,
} from '../utils/moneyUtils'
import { getCurrentMonth } from '../utils/dateUtils'
import {
  insertExpense,
  deleteExpense as deleteExpenseDb,
} from '../services/expenseService'
import { callClaude } from '../../../lib/anthropic'
import { STRINGS } from '../../tasks/constants/strings'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { LogHeader } from './LogTypeSelector'
import { ROUTES } from '../../../app/routes'

// ─── LogExpense ───────────────────────────────────────────────────────────────
export function LogExpense({
  defaultCategory = '',
}: { defaultCategory?: string } = {}) {
  const [category, setCategory] = useState(defaultCategory)
  const navigate = useNavigate()
  const { addExpense, removeExpense, expenses, currentMonth } =
    useFinanceStore()
  const { rows } = useBudgetSummary()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [checkResult, setCheckResult] = useState<string | null>(null)
  const [postLog, setPostLog] = useState<{ text: string; id: string } | null>(
    null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cents = dollarsToCents(Number(amount) || 0)
  const canLog = cents > 0 && category !== '' && !saving
  const budgetRow = rows.find((r) => r.category === category)
  const spent = budgetRow?.spent ?? 0
  const budget = budgetRow?.budget ?? 0
  const weekCount = expenses.filter(
    (e) => e.category === category && e.month === currentMonth,
  ).length

  function reset() {
    setPostLog(null)
    setAmount('')
    setCategory('')
    setNote('')
    setCheckResult(null)
    setError(null)
  }

  function handleCheck() {
    if (!canLog) return
    const cat = getCategoryInfo(category)
    const newTotal = spent + cents
    const remaining = budget - newTotal
    const pct = budget > 0 ? Math.round((newTotal / budget) * 100) : 0

    let status = ''
    let warning = ''
    if (budget === 0) {
      status = `No budget set for ${cat.label}`
    } else if (remaining < 0) {
      status = `⚠️ OVER BUDGET by ${formatMoney(Math.abs(remaining))} (${pct}% used)`
      warning = 'This will put you over budget. Consider if this is essential.'
    } else if (pct > 80) {
      status = `⚡ ${formatMoney(remaining)} left (${pct}% used) — getting tight`
      warning = 'You are close to your limit. Proceed with caution.'
    } else {
      status = `✅ ${formatMoney(remaining)} remaining (${pct}% used) — you are good`
    }

    setCheckResult(
      `${cat.label}: ${formatMoneyWhole(spent)} → ${formatMoneyWhole(newTotal)} of ${formatMoneyWhole(budget)}\n${status}${warning ? '\n' + warning : ''}`,
    )
  }

  async function handleLog() {
    if (!canLog) return
    setSaving(true)
    setError(null)
    try {
      const row = {
        user_id: USER_ID,
        amount: cents,
        category,
        note: note || null,
        month: getCurrentMonth(),
        logged_at: new Date().toISOString(),
      }
      let saved: { id: string }
      try {
        saved = await insertExpense(row)
      } catch {
        saved = { id: crypto.randomUUID() }
      }
      const expense = {
        ...row,
        id: saved.id,
        created_at: new Date().toISOString(),
      }
      addExpense(expense)
      const cat = getCategoryInfo(category)
      const newSpent = spent + cents
      const overUnder =
        newSpent > budget
          ? `${formatMoney(newSpent - budget)} over`
          : `${formatMoney(budget - newSpent)} under`
      const fallback = `${cat.label} ${formatMoney(cents)} · ${formatMoneyWhole(newSpent)} of ${formatMoneyWhole(budget)} · ${overUnder}`
      const prompt = `Evaluate expense. Max 2 lines, no emoji. ${cat.label}${note ? `: ${note}` : ''} ${formatMoney(cents)}. Total: ${formatMoneyWhole(newSpent)}/${formatMoneyWhole(budget)}. ${weekCount + 1}x this week.`
      const aiText = await callClaude(prompt)
      setPostLog({ text: aiText || fallback, id: expense.id })
    } catch {
      setError(STRINGS.FAILED_TO_SAVE)
    } finally {
      setSaving(false)
    }
  }

  async function handleUndo() {
    if (!postLog) return
    try {
      await deleteExpenseDb(postLog.id)
    } catch {}
    removeExpense(postLog.id)
    setPostLog(null)
  }

  if (postLog) {
    return (
      <Stack gap="lg">
        <LogHeader title={STRINGS.EXPENSE_LOGGED} emoji="✅" />
        <Paper p="xl" radius="xl" withBorder>
          <Text size="sm" lh={1.8} style={{ whiteSpace: 'pre-line' }}>
            {postLog.text}
          </Text>
          <Group mt="lg">
            <Button radius="xl" color="teal" onClick={reset}>
              {STRINGS.LOG_ANOTHER}
            </Button>
            <Button variant="default" radius="xl" onClick={handleUndo}>
              {STRINGS.UNDO}
            </Button>
            <Button
              variant="subtle"
              radius="xl"
              onClick={() => navigate(ROUTES.FINANCE)}
            >
              {STRINGS.DONE}
            </Button>
          </Group>
        </Paper>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <LogHeader
        title={STRINGS.LOG_EXPENSE}
        subtitle={STRINGS.LOG_EXPENSE_SUB}
        emoji="💸"
      />

      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label={STRINGS.FIELD_AMOUNT}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={STRINGS.PH_AMOUNT}
            leftSection={<Text size="sm">$</Text>}
            type="number"
            step={0.01}
            radius="lg"
            size="lg"
            styles={{ input: { fontSize: 24, fontWeight: 700 } }}
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
                      p="md"
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        textAlign: 'center',
                        background: sel
                          ? 'var(--mantine-color-teal-light)'
                          : 'var(--mantine-color-dark-6)',
                        border: sel
                          ? '2px solid var(--mantine-color-teal-4)'
                          : '2px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
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

          {category && budgetRow && (
            <Paper p="md" radius="lg" bg="var(--mantine-color-dark-6)">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  {getCategoryInfo(category).label} budget
                </Text>
                <Text
                  size="xs"
                  fw={600}
                  c={budgetRow.overBudget ? 'red' : 'teal'}
                >
                  {formatMoneyWhole(spent)} / {formatMoneyWhole(budget)}
                </Text>
              </Group>
              <Progress
                value={budget > 0 ? (spent / budget) * 100 : 0}
                color={budgetRow.overBudget ? 'red' : 'teal'}
                bg="rgba(255,255,255,0.1)"
                radius="xl"
                size="xs"
              />
            </Paper>
          )}

          <TextInput
            label={STRINGS.FIELD_NOTE}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={STRINGS.PH_NOTE}
            radius="lg"
          />
        </Stack>
      </Paper>

      {checkResult && (
        <Paper
          p="lg"
          radius="xl"
          withBorder
          style={{ borderColor: 'var(--mantine-color-orange-3)' }}
        >
          <Text size="sm" lh={1.8} style={{ whiteSpace: 'pre-line' }}>
            {checkResult}
          </Text>
          <Group mt="md">
            <Button
              radius="xl"
              color="teal"
              onClick={() => {
                setCheckResult(null)
                handleLog()
              }}
            >
              {STRINGS.STILL_LOG}
            </Button>
            <Button
              variant="default"
              radius="xl"
              onClick={() => setCheckResult(null)}
            >
              {STRINGS.CANCEL}
            </Button>
          </Group>
        </Paper>
      )}

      {!checkResult && (
        <Group>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            onClick={handleCheck}
            disabled={!canLog}
          >
            {STRINGS.CHECK_BEFORE}
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            style={{ flex: 1 }}
            onClick={handleLog}
            disabled={!canLog}
            loading={saving}
          >
            {STRINGS.LOG_IT}
          </Button>
        </Group>
      )}

      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
    </Stack>
  )
}
