import { useMemo } from 'react'
import { subDays, parseISO, isWithinInterval, differenceInDays } from 'date-fns'
import {
  Stack,
  Group,
  Text,
  Box,
  Paper,
  RingProgress,
  Progress,
} from '@mantine/core'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useHealthStore } from '../../health/store/healthStore'
import { useHealthData } from '../../health/hooks/useHealthData'
import { usePlanStore } from '../../plan/store/planStore'
import { useBudgetSummary } from '../../finance/hooks/useBudgetSummary'
import { formatMoneyWhole } from '../../finance/utils/moneyUtils'
import { TASK_STATUS } from '../../tasks/constants/taskConstants'

interface AuditTabProps {
  onReset: () => void
  weeklyFocus: string | null
}

export function AuditTab(_props: AuditTabProps) {
  useHealthData()
  const tasks = useTaskStore((s) => s.tasks)
  const sprints = useTaskStore((s) => s.sprints)
  const { goals, milestones } = usePlanStore()
  const { dailyLogs } = useHealthStore()
  const budget = useBudgetSummary()

  const now = new Date()

  // Active sprint
  const activeSprint = sprints.find((s) => {
    try {
      return isWithinInterval(now, {
        start: parseISO(s.start_date),
        end: parseISO(s.end_date),
      })
    } catch {
      return false
    }
  })
  const sprintTasks = activeSprint
    ? tasks.filter((t) => t.sprint_id === activeSprint.id && !t.parent_task_id)
    : []
  const sprintDone = sprintTasks.filter(
    (t) => t.status === TASK_STATUS.DONE,
  ).length
  const sprintPct =
    sprintTasks.length > 0
      ? Math.round((sprintDone / sprintTasks.length) * 100)
      : 0
  const sprintDaysLeft = activeSprint
    ? Math.max(0, differenceInDays(parseISO(activeSprint.end_date), now))
    : 0

  // Stale todos
  const staleTasks = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.TODO &&
      !t.parent_task_id &&
      Date.now() - new Date(t.created_at).getTime() > 7 * 86400000,
  )

  // This week's wins
  const weekStart = subDays(now, 7)
  const weekDone = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.DONE &&
      t.completed_at &&
      new Date(t.completed_at) > weekStart,
  )

  // Money
  const overBudget =
    budget.totalSpent > budget.totalBudget && budget.totalBudget > 0
  const savedPct =
    budget.savingsGoal > 0
      ? Math.min(
          Math.round((budget.totalSaved / budget.savingsGoal) * 100),
          100,
        )
      : 0

  // Health — last 7 days averages
  const last7 = useMemo(() => {
    const logs = dailyLogs.filter(
      (l) => differenceInDays(now, new Date(l.date)) < 7,
    )
    const avg = (vals: (number | null)[]) => {
      const v = vals.filter((x): x is number => x !== null)
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    return {
      mood: avg(logs.map((l) => l.mood)),
      energy: avg(logs.map((l) => l.energy_level)),
      sleep: avg(logs.map((l) => l.sleep_hours)),
      water: avg(logs.map((l) => l.water_cups)),
    }
  }, [dailyLogs])

  // Goal nudge
  const activeGoals = goals.filter((g) => g.status === 'active')
  const openMilestones = milestones.filter((m) => m.status === 'todo')

  return (
    <Stack gap="lg">
      {/* Sprint */}
      {activeSprint && (
        <Paper p="lg" radius="lg" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>{activeSprint.name}</Text>
            <Text size="sm" c="dimmed">
              {sprintDaysLeft} days left
            </Text>
          </Group>
          <Progress
            value={sprintPct}
            color={
              sprintPct >= 80 ? 'green' : sprintPct >= 50 ? 'teal' : 'orange'
            }
            radius="xl"
            size="md"
            styles={{ root: { backgroundColor: 'rgba(255,255,255,0.1)' } }}
          />
          <Text size="sm" mt="xs" c="dimmed">
            {sprintPct}% complete · {sprintDone}/{sprintTasks.length} tasks done
          </Text>
          {sprintPct < 50 && sprintDaysLeft < 5 && (
            <Text size="sm" mt="xs" c="orange">
              Sprint wrapping up — open Focus mode and knock out what you can 💪
            </Text>
          )}
        </Paper>
      )}

      {/* Stale todos */}
      {staleTasks.length > 0 && (
        <Paper
          p="lg"
          radius="lg"
          withBorder
          style={{ borderLeft: '3px solid var(--mantine-color-orange-5)' }}
        >
          <Text size="sm">
            ⏰ {staleTasks.length} task{staleTasks.length > 1 ? 's' : ''}{' '}
            sitting for 7+ days:
          </Text>
          <Stack gap={4} mt="xs">
            {staleTasks.slice(0, 5).map((t) => (
              <Text key={t.id} size="xs" c="dimmed">
                • {t.title} —{' '}
                {Math.floor(
                  (Date.now() - new Date(t.created_at).getTime()) / 86400000,
                )}{' '}
                days
              </Text>
            ))}
          </Stack>
          <Text size="xs" c="orange" mt="xs">
            Do them, schedule them, or let them go.
          </Text>
        </Paper>
      )}

      {/* Money verdict */}
      {budget.totalBudget > 0 && (
        <Paper p="lg" radius="lg" withBorder>
          <Group justify="space-between">
            <Box>
              <Text fw={600} size="sm">
                {overBudget ? '🔴 Over budget' : '🟢 Within budget'}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {overBudget
                  ? `Over by ${formatMoneyWhole(budget.totalSpent - budget.totalBudget)}`
                  : `${formatMoneyWhole(budget.totalBudget - budget.totalSpent)} remaining`}
              </Text>
            </Box>
            <Box ta="center">
              <RingProgress
                size={56}
                thickness={5}
                roundCaps
                sections={[{ value: savedPct, color: 'violet' }]}
                label={
                  <Text ta="center" size="xs" fw={700}>
                    🏦
                  </Text>
                }
              />
              <Text size="xs" c="dimmed">
                {formatMoneyWhole(budget.totalSaved)} saved
              </Text>
              {budget.savingsGoal > 0 && (
                <Text size="xs" c="dimmed">
                  {savedPct}% of goal
                </Text>
              )}
            </Box>
          </Group>
        </Paper>
      )}

      {/* Health snapshot */}
      <Paper p="lg" radius="lg" withBorder>
        <Text fw={600} size="sm" mb="sm">
          💚 Health this week
        </Text>
        <Group grow>
          {[
            { label: 'Mood', val: last7.mood, max: 5, unit: '/5' },
            { label: 'Energy', val: last7.energy, max: 5, unit: '/5' },
            { label: 'Sleep', val: last7.sleep, max: 9, unit: 'h' },
            { label: 'Water', val: last7.water, max: 8, unit: 'cups' },
          ].map((m) => (
            <Box key={m.label} ta="center">
              <Text size="lg" fw={700}>
                {m.val !== null ? m.val.toFixed(1) : '--'}
              </Text>
              <Text size="xs" c="dimmed">
                {m.label}
              </Text>
            </Box>
          ))}
        </Group>
      </Paper>

      {/* Goal nudges */}
      {activeGoals.length > 0 && (
        <Paper
          p="lg"
          radius="lg"
          withBorder
          style={{ borderLeft: '3px solid var(--mantine-color-teal-5)' }}
        >
          <Text fw={600} size="sm" mb="sm">
            🎯 Goals
          </Text>
          <Stack gap="xs">
            {activeGoals.slice(0, 3).map((g) => {
              const ms = openMilestones.find((m) => m.goal_id === g.id)
              return (
                <Text key={g.id} size="sm">
                  {ms
                    ? `Completing "${ms.title}" moves you closer to "${g.title}"`
                    : `Keep working toward "${g.title}"`}
                </Text>
              )
            })}
          </Stack>
        </Paper>
      )}

      {/* This week's wins */}
      {weekDone.length > 0 && (
        <Paper
          p="lg"
          radius="lg"
          withBorder
          style={{ borderLeft: '3px solid var(--mantine-color-green-5)' }}
        >
          <Text fw={600} size="sm" mb="sm">
            🏆 This week: {weekDone.length} tasks completed
          </Text>
          <Stack gap={4}>
            {weekDone.slice(0, 5).map((t) => (
              <Text key={t.id} size="xs" c="dimmed">
                ✓ {t.title}
              </Text>
            ))}
            {weekDone.length > 5 && (
              <Text size="xs" c="dimmed">
                +{weekDone.length - 5} more
              </Text>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
