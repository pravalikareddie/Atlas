import { useMemo } from 'react'
import { useHealthStore } from '../store/healthStore'
import { differenceInDays, differenceInMonths } from 'date-fns'
import { Stack, Text, SimpleGrid, Group, Paper } from '@mantine/core'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { EmptyState } from '../../../shared/components/EmptyState'

const MOOD_EMOJI = ['', '😞', '😕', '😐', '🙂', '😊']
const MOOD_LABEL = ['', 'rough', 'low', 'okay', 'good', 'great']
const ENERGY_LABEL = ['', 'drained', 'low', 'okay', 'good', 'great']

export function HealthOverview() {
  const { dailyLogs, appointments, medications, loading } = useHealthStore()

  const stats = useMemo(() => {
    const last7 = dailyLogs.filter(
      (l) => differenceInDays(new Date(), new Date(l.date)) < 7,
    )
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null)
      return valid.length
        ? valid.reduce((a, b) => a + b, 0) / valid.length
        : null
    }
    return {
      sleep: avg(last7.map((l) => l.sleep_hours)),
      water: avg(last7.map((l) => l.water_cups)),
      mood: avg(last7.map((l) => l.mood)),
      energy: avg(last7.map((l) => l.energy_level)),
      stress: avg(last7.map((l) => l.stress_level)),
    }
  }, [dailyLogs])

  const attention = useMemo(() => {
    const items: { id: string; text: string }[] = []
    const now = new Date()
    appointments.forEach((a) => {
      if (!a.last_visited || !a.frequency_months) return
      if (a.snoozed_until && new Date(a.snoozed_until) > now) return
      const due = new Date(a.last_visited)
      due.setMonth(due.getMonth() + a.frequency_months)
      if (due < now)
        items.push({
          id: a.id,
          text: `${a.name} · ${differenceInMonths(now, due) || differenceInDays(now, due) + 'd'} overdue`,
        })
    })
    medications.forEach((m) => {
      if (!m.track_refill || !m.refill_date) return
      const days = differenceInDays(new Date(m.refill_date), now)
      if (days <= 5 && days >= 0)
        items.push({ id: m.id, text: `${m.name} refill in ${days}d` })
    })
    return items.slice(0, 5)
  }, [dailyLogs, appointments, medications])

  if (loading) return <SkeletonRow count={8} />
  if (!dailyLogs.length)
    return (
      <EmptyState
        message="Start logging mood, sleep, and water"
        sub="Your health picture will appear here."
      />
    )

  const moodRound = stats.mood !== null ? Math.round(stats.mood) : null

  return (
    <Stack gap="lg">
      <Paper p="xl" radius="md" ta="center" withBorder>
        <Text mb="xs">{moodRound !== null ? MOOD_EMOJI[moodRound] : '🌿'}</Text>
        <Text>
          {moodRound !== null
            ? `Feeling ${MOOD_LABEL[moodRound]} this week`
            : 'How are you feeling?'}
        </Text>
        <Text>
          {stats.energy !== null
            ? `Energy: ${ENERGY_LABEL[Math.round(stats.energy)]}`
            : 'Log energy to see it here'}
          {stats.stress !== null && ` · Stress: ${stats.stress.toFixed(1)}/5`}
        </Text>
      </Paper>

      <Text tt="uppercase">last 7 days</Text>
      <SimpleGrid cols={3}>
        <StatCard
          label="sleep"
          value={stats.sleep}
          format={(v) => `${v.toFixed(1)}h`}
          sub="avg/night"
        />
        <StatCard
          label="water"
          value={stats.water}
          format={(v) => `${v.toFixed(1)}`}
          sub="cups avg/day"
        />
        <StatCard
          label="mood"
          value={stats.mood}
          format={(v) => `${v.toFixed(1)}`}
          sub="avg/5"
        />
      </SimpleGrid>

      {attention.length > 0 && (
        <Paper withBorder radius="md" p="sm">
          <Text tt="uppercase" mb="xs">
            needs attention
          </Text>
          {attention.map((item) => (
            <Group key={item.id} gap="sm" py="xs">
              <Text c="yellow">⚠</Text>
              <Text>{item.text}</Text>
            </Group>
          ))}
        </Paper>
      )}
    </Stack>
  )
}

function StatCard({
  label,
  value,
  format,
  sub,
}: {
  label: string
  value: number | null
  format: (v: number) => string
  sub: string
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text tt="uppercase" mb="xs">
        {label}
      </Text>
      <Text>{value !== null ? format(value) : '--'}</Text>
      <Text>{sub}</Text>
    </Paper>
  )
}
