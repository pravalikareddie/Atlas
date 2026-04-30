import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  Paper,
  SimpleGrid,
  ActionIcon,
  UnstyledButton,
  Box,
  Progress,
  Badge,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { useNeedsAttention } from '../hooks/useNeedsAttention'
import { useBudgetSummary } from '../hooks/useBudgetSummary'
import {
  formatMonthDisplay,
  daysLeftInMonth,
  formatDateShort,
} from '../utils/dateUtils'
import { formatMoneyWhole } from '../utils/moneyUtils'
import { getCategoryInfo, BUDGET_GROUPS } from '../constants/categories'
import { deleteExpense as deleteExpenseDb } from '../services/expenseService'
import { Button } from '@mantine/core'
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
import { CaretRight, Plus, Trash, Warning } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { STRINGS } from '../../tasks/constants/strings'
export function FinanceOverview() {
  useTaskData()
  const { currentMonth, loading } = useFinanceStore()
  const tasks = useTaskStore((s) => s.tasks)
  const {
    create: createTask,
    update: updateTask,
    remove: removeTask,
  } = useTaskActions()
  const attention = useNeedsAttention()
  const { rows, totalSpent, totalBudget, totalSaved, savingsGoal } =
    useBudgetSummary()
  const navigate = useNavigate()

  const left = totalBudget - totalSpent
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
      {/* Hero card */}
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
              {formatMonthDisplay(currentMonth)} · {daysLeft}{' '}
              {STRINGS.DAYS_LEFT}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 36 }}>
              {formatMoneyWhole(left > 0 ? left : 0)}
            </Text>
            <Text size="sm" c="white" opacity={0.75} mt={4}>
              {STRINGS.STILL_YOURS} · {STRINGS.OF}{' '}
              {formatMoneyWhole(totalBudget)}
            </Text>
          </Box>
          <Button
            variant="white"
            color="teal"
            radius="xl"
            size="sm"
            leftSection={<Plus size={14} />}
            onClick={() => navigate(ROUTES.FINANCE_LOG)}
          >
            {STRINGS.LOG}
          </Button>
        </Group>

        <Box mt="md">
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="white" opacity={0.7}>
              {formatMoneyWhole(totalSpent)} {STRINGS.SPENT}
            </Text>
            <Text size="xs" c="white" opacity={0.7}>
              {Math.round(spentRatio * 100)}%
            </Text>
          </Group>
          <Progress
            value={spentRatio * 100}
            color={
              spentRatio > 0.9 ? 'red' : spentRatio > 0.7 ? 'yellow' : 'white'
            }
            bg="rgba(255,255,255,0.2)"
            radius="xl"
            size="sm"
          />
        </Box>
      </Box>

      {/* Stats row */}
      <SimpleGrid cols={2} spacing="md">
        <Paper p="lg" radius="xl" withBorder>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
            {STRINGS.SPENT_THIS_MONTH}
          </Text>
          <Text fw={800} size="xl" c="var(--mantine-color-text)">
            {formatMoneyWhole(totalSpent)}
          </Text>
        </Paper>
        <Paper p="lg" radius="xl" withBorder>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
            {STRINGS.SET_ASIDE} 💚
          </Text>
          <Text
            fw={800}
            size="xl"
            c={savingsHit ? 'green' : 'var(--mantine-color-text)'}
          >
            {formatMoneyWhole(totalSaved)}
          </Text>
          <Text size="xs" c={savingsHit ? 'green' : 'dimmed'} mt={4}>
            {savingsHit
              ? STRINGS.GOAL_REACHED
              : `${STRINGS.GOAL} ${formatMoneyWhole(savingsGoal)}`}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Needs attention */}
      {attention.length > 0 && (
        <Paper
          p="md"
          radius="xl"
          withBorder
          style={{ borderColor: 'var(--mantine-color-orange-3)' }}
        >
          <Group gap="xs" mb="sm">
            <Warning
              size={16}
              color="var(--mantine-color-orange-5)"
              weight="fill"
            />
            <Text size="xs" fw={700} tt="uppercase" c="orange">
              {STRINGS.NEEDS_ATTENTION} · {attention.length}
            </Text>
          </Group>
          <Stack gap="xs">
            {attention.map((item) => (
              <Group
                key={item.id}
                gap="sm"
                p="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-orange-0)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(item.route)}
              >
                <Text size="xs">⚠️</Text>
                <Text size="sm" style={{ flex: 1 }}>
                  {item.text}
                </Text>
                <CaretRight size={14} color="var(--mantine-color-dimmed)" />
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Finance tasks */}
      {financeTasks.length > 0 && (
        <Paper p="lg" radius="xl" withBorder>
          <Group justify="space-between" mb="sm">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.FINANCE_TODOS}
            </Text>
            <Button
              variant="subtle"
              color="teal"
              size="xs"
              radius="xl"
              onClick={() => navigate(ROUTES.TASKS)}
            >
              {STRINGS.VIEW_ALL}
            </Button>
          </Group>
          <Stack gap="xs">
            {financeTasks.slice(0, 5).map((t) => (
              <Group
                key={t.id}
                gap="sm"
                p="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-gray-0)',
                }}
              >
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
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Budget groups */}
      {BUDGET_GROUPS.map((group) => {
        const gr = rows.filter((r) => r.group === group.key)
        if (!gr.length) return null
        const groupSpent = gr.reduce((s, r) => s + r.spent, 0)
        const groupBudget = gr.reduce((s, r) => s + r.budget, 0)

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
            <Stack gap="sm">
              {gr.map((row) => {
                const cat = getCategoryInfo(row.category)
                return (
                  <Group key={row.category} gap="sm" wrap="nowrap">
                    <Text w={20}>{cat.emoji}</Text>
                    <Text size="sm" w={90} truncate>
                      {cat.label}
                    </Text>
                    <Box style={{ flex: 1 }}>
                      <Progress
                        value={Math.min(row.ratio * 100, 100)}
                        color={
                          row.overBudget
                            ? 'red'
                            : row.goalMet
                              ? 'green'
                              : 'teal'
                        }
                        bg="var(--mantine-color-gray-2)"
                        radius="xl"
                        size="sm"
                      />
                    </Box>
                    <Text
                      size="xs"
                      c={row.overBudget ? 'red' : 'dimmed'}
                      w={90}
                      ta="right"
                    >
                      {formatMoneyWhole(row.spent)}/
                      {formatMoneyWhole(row.budget)}
                    </Text>
                    {row.overBudget && (
                      <Badge variant="urgent">{STRINGS.OVER}</Badge>
                    )}
                    {row.goalMet && <Badge variant="done">✓</Badge>}
                  </Group>
                )
              })}
            </Stack>
          </Paper>
        )
      })}

      <RecentExpenses />
    </Stack>
  )
}

function RecentExpenses() {
  const { expenses, currentMonth, removeExpense } = useFinanceStore()
  const navigate = useNavigate()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const recent = useMemo(
    () => expenses.filter((e) => e.month === currentMonth).slice(0, 8),
    [expenses, currentMonth],
  )

  if (!recent.length) return null

  async function handleDelete(id: string) {
    removeExpense(id)
    try {
      await deleteExpenseDb(id)
    } catch {}
    setConfirmId(null)
  }

  return (
    <Paper p="lg" radius="xl" withBorder>
      <Group justify="space-between" mb="sm">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {STRINGS.RECENT_EXPENSES}
        </Text>
        <Button
          variant="subtle"
          color="teal"
          size="xs"
          radius="xl"
          onClick={() => navigate(ROUTES.FINANCE_LOG)}
        >
          {STRINGS.VIEW_ALL}
        </Button>
      </Group>
      <Stack gap="xs">
        {recent.map((e) => {
          const cat = getCategoryInfo(e.category)
          if (confirmId === e.id) {
            return (
              <Group
                key={e.id}
                justify="space-between"
                p="xs"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-red-0)',
                }}
              >
                <Text size="sm">{STRINGS.CONFIRM_DELETE_EXPENSE}</Text>
                <Group gap="xs">
                  <Button
                    variant="filled"
                    color="red"
                    size="xs"
                    radius="xl"
                    onClick={() => handleDelete(e.id)}
                  >
                    {STRINGS.YES}
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    radius="xl"
                    onClick={() => setConfirmId(null)}
                  >
                    {STRINGS.NO}
                  </Button>
                </Group>
              </Group>
            )
          }
          return (
            <Group
              key={e.id}
              gap="sm"
              p="xs"
              style={{ borderRadius: 'var(--mantine-radius-lg)' }}
            >
              <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  {cat.label}
                </Text>
                {e.note && (
                  <Text size="xs" c="dimmed">
                    {e.note}
                  </Text>
                )}
              </Box>
              <Text size="sm" fw={700}>
                {formatMoneyWhole(e.amount)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDateShort(e.logged_at)}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => setConfirmId(e.id)}
                aria-label={STRINGS.DELETE}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          )
        })}
      </Stack>
    </Paper>
  )
}
