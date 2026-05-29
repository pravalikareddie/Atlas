import { useMemo } from 'react'
import { ItemRow,NavyCard,SectionHeader } from './FinanceDesign'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  UnstyledButton,
  Box,
  Badge,
  Paper,
  Progress,
  RingProgress,
  Button,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { useNeedsAttention } from '../hooks/useNeedsAttention'
import { useBudgetSummary } from '../hooks/useBudgetSummary'
import { formatMonthDisplay, daysLeftInMonth } from '../utils/dateUtils'
import { formatMoneyWhole } from '../utils/moneyUtils'
import { getCategoryInfo } from '../constants/categories'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { ROUTES } from '../../../app/routes'
import {
  DATE_FORMAT,
  TASK_STATUS,
  TASK_TYPE,
} from '../../tasks/constants/taskConstants'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { CaretRight, Warning } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { STRINGS } from '../../tasks/constants/strings'
import { INCOME_CATEGORY } from '../constants/categories'

export function FinanceOverview() {
  useTaskData()
  const { currentMonth, loading } = useFinanceStore()
  const tasks = useTaskStore((s) => s.tasks)
  const { update: updateTask } = useTaskActions()
  const attention = useNeedsAttention()
  const { updateBudget } = useFinanceStore()

  function handleAcknowledge(id: string) {
    updateBudget(id, { overspend_acknowledged: true })
    import('../services/budgetService').then(({ updateBudget: db }) =>
      db(id, { overspend_acknowledged: true }).catch(() => {}),
    )
  }

  const { rows, totalSpent, totalBudget, totalSaved, savingsGoal } =
    useBudgetSummary()
  const navigate = useNavigate()

  const left = Math.max(0, totalBudget - totalSpent)
  const daysLeft = daysLeftInMonth()
  const savingsHit = totalSaved >= savingsGoal
  const spentRatio = totalBudget > 0 ? totalSpent / totalBudget : 0

  const financeTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.type === TASK_TYPE.FINANCE && t.status === TASK_STATUS.TODO,
      ),
    [tasks],
  )

  if (loading) return <SkeletonRow count={8} />

  return (
    <Stack gap="lg">
      {/* Hero */}
      {/* Money rings */}
      <Paper p="lg" radius="lg" withBorder>
        <Group justify="space-around">
          <Box ta="center">
            <RingProgress size={64} thickness={5} roundCaps sections={[{ value: 100, color: 'teal' }]}
              label={<Text ta="center" style={{ fontSize: 20 }}>💰</Text>} />
            <Text size="sm" fw={700} mt={4}>{formatMoneyWhole(totalBudget)}</Text>
            <Text size="xs" c="dimmed">Budget</Text>
          </Box>
          <Box ta="center">
            <RingProgress size={64} thickness={5} roundCaps
              sections={[{ value: Math.min(spentRatio * 100, 100), color: spentRatio > 1 ? 'red' : 'orange' }]}
              label={<Text ta="center" style={{ fontSize: 20 }}>🔥</Text>} />
            <Text size="sm" fw={700} mt={4}>{formatMoneyWhole(totalSpent)}</Text>
            <Text size="xs" c="dimmed">{totalBudget > 0 ? `${Math.round(spentRatio * 100)}%` : ''} Spent</Text>
          </Box>
          <Box ta="center">
            <RingProgress size={64} thickness={5} roundCaps
              sections={[{ value: totalBudget > 0 ? Math.max((left / totalBudget) * 100, 0) : 0, color: 'green' }]}
              label={<Text ta="center" style={{ fontSize: 20 }}>✅</Text>} />
            <Text size="sm" fw={700} mt={4}>{formatMoneyWhole(left)}</Text>
            <Text size="xs" c="dimmed">{totalBudget > 0 ? `${Math.round((left / totalBudget) * 100)}%` : ''} Left</Text>
          </Box>
          <Box ta="center">
            <RingProgress size={64} thickness={5} roundCaps
              sections={[{ value: savingsGoal > 0 ? Math.min((totalSaved / savingsGoal) * 100, 100) : (totalSaved > 0 ? 100 : 0), color: 'violet' }]}
              label={<Text ta="center" style={{ fontSize: 20 }}>🏦</Text>} />
            <Text size="sm" fw={700} mt={4}>{formatMoneyWhole(totalSaved)}</Text>
            <Text size="xs" c="dimmed">{savingsHit ? '✅ Goal hit' : `of ${formatMoneyWhole(savingsGoal)}`}</Text>
          </Box>
        </Group>
      </Paper>

      {/* Needs attention */}
      {attention.length > 0 && (
        <NavyCard>
          <Group gap="md" mb="sm">
            <Warning
              size={16}
              color="var(--mantine-color-orange-5)"
              weight="fill"
            />
            <Text size="xs" fw={700} tt="uppercase" c="orange">
              {STRINGS.NEEDS_ATTENTION} · {attention.length}
            </Text>
          </Group>
          <Stack gap="md">
            {attention.map((item) => (
              <Group
                key={item.id}
                gap="md"
                p="md"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-orange-light)',
                }}
              >
                <Text size="xs">⚠️</Text>
                <Text size="sm" style={{ flex: 1 }}>
                  {item.text}
                </Text>
                {item.type === 'over_budget' ? (
                  <Button
                    size="xs"
                    radius="xl"
                    variant="light"
                    color="orange"
                    onClick={() => handleAcknowledge(item.id)}
                  >
                    Got it
                  </Button>
                ) : (
                  <CaretRight
                    size={14}
                    color="var(--mantine-color-dimmed)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(item.route)}
                  />
                )}
              </Group>
            ))}
          </Stack>
        </NavyCard>
      )}

      {/* Finance tasks */}
      {financeTasks.length > 0 && (
        <NavyCard>
          <SectionHeader
            label={STRINGS.FINANCE_TODOS}
            right={
              <Button
                variant="subtle"
                color="teal"
                size="xs"
                radius="xl"
                onClick={() => navigate(ROUTES.TASKS)}
              >
                {STRINGS.VIEW_ALL}
              </Button>
            }
          />
          <Stack gap="md">
            {financeTasks.slice(0, 5).map((t) => (
              <ItemRow key={t.id}>
                <UnstyledButton
                  onClick={() =>
                    updateTask(t.id, {
                      status: TASK_STATUS.DONE,
                      completed_at: new Date().toISOString(),
                    })
                  }
                  w={18}
                  h={18}
                  style={{
                    borderRadius: '50%',
                    border: '2px solid var(--mantine-color-teal-4)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
                <Text size="sm" fw={600} style={{ flex: 1 }}>
                  {t.title}
                </Text>
                {t.due_date && (
                  <Text size="xs" c="dimmed">
                    {format(parseISO(t.due_date), DATE_FORMAT.SHORT)}
                  </Text>
                )}
              </ItemRow>
            ))}
          </Stack>
        </NavyCard>
      )}

      {/* Budget rows — split into Fixed Bills and Variable */}
      {rows.filter((r) => r.category !== INCOME_CATEGORY).length > 0 && (() => {
        const FIXED_KEYS = new Set(['rent', 'phone', 'internet', 'emi1', 'emi2'])
        const fixedRows = rows.filter((r) => FIXED_KEYS.has(r.category))
        const variableRows = rows.filter((r) => r.category !== INCOME_CATEGORY && !FIXED_KEYS.has(r.category) && r.category !== 'savings' && r.category !== 'investing')
        const fixedTotal = fixedRows.reduce((s, r) => s + r.spent, 0)
        const fixedBudget = fixedRows.reduce((s, r) => s + r.budget, 0)
        const variableTotal = variableRows.reduce((s, r) => s + r.spent, 0)
        const variableBudget = variableRows.reduce((s, r) => s + r.budget, 0)

        function BudgetRow({ row }: { row: typeof rows[0] }) {
          const cat = getCategoryInfo(row.category)
          return (
            <Group gap="md" wrap="nowrap">
              <Text w={20}>{cat.emoji}</Text>
              <Text size="sm" w={90} truncate>{cat.label}</Text>
              <Box style={{ flex: 1 }}>
                <Progress
                  value={Math.min(row.ratio * 100, 100)}
                  color={row.overBudget ? 'red' : row.goalMet ? 'green' : 'teal'}
                  bg="rgba(255,255,255,0.1)"
                  radius="xl"
                  size="sm"
                />
              </Box>
              <Text size="xs" c={row.overBudget ? 'red' : 'dimmed'} w={90} ta="right">
                {formatMoneyWhole(row.spent)}/{formatMoneyWhole(row.budget)}
              </Text>
              {row.overBudget && <Badge variant="urgent">{STRINGS.OVER}</Badge>}
              {row.goalMet && <Badge variant="done">✓</Badge>}
            </Group>
          )
        }

        return (
          <>
            {fixedRows.length > 0 && (
              <NavyCard>
                <SectionHeader
                  label={`Fixed Bills · ${formatMoneyWhole(fixedTotal)}${fixedBudget > 0 ? ` / ${formatMoneyWhole(fixedBudget)}` : ''}`}
                />
                <Stack gap="md">
                  {fixedRows.map((row) => <BudgetRow key={row.category} row={row} />)}
                </Stack>
              </NavyCard>
            )}
            {variableRows.length > 0 && (
              <NavyCard>
                <SectionHeader
                  label={`Variable · ${formatMoneyWhole(variableTotal)}${variableBudget > 0 ? ` / ${formatMoneyWhole(variableBudget)}` : ''}`}
                  right={
                    <Button variant="subtle" color="teal" size="xs" radius="xl" onClick={() => navigate(ROUTES.FINANCE_BUDGETS)}>
                      {STRINGS.VIEW_ALL}
                    </Button>
                  }
                />
                <Stack gap="md">
                  {variableRows.map((row) => <BudgetRow key={row.category} row={row} />)}
                </Stack>
              </NavyCard>
            )}
          </>
        )
      })()}

      {/* Month info */}
      <Text size="xs" c="dimmed" ta="center">
        {formatMonthDisplay(currentMonth)} · {daysLeft} {STRINGS.DAYS_LEFT}
      </Text>
    </Stack>
  )
}
