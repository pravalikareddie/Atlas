import { useMemo } from 'react'
import { useHealthStore } from '../store/healthStore'
import { differenceInDays, differenceInMonths } from 'date-fns'
import { Stack, Text, SimpleGrid, Group, Paper } from '@mantine/core'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import {
  STRINGS as S,
  MOOD_EMOJI,
  MOOD_LABEL,
  ENERGY_LABEL,
} from '../constants/strings'

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
    <Paper p="lg" radius="md" withBorder>
      <Text tt="uppercase" size="xs" c="dimmed" mb="xs">
        {label}
      </Text>
      <Text fw={700} size="xl">
        {value !== null ? format(value) : '--'}
      </Text>
      <Text size="xs" c="dimmed">
        {sub}
      </Text>
    </Paper>
  )
}

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
      if (due < now) {
        const months = differenceInMonths(now, due)
        items.push({
          id: a.id,
          text: `${a.name} · ${months ? S.MONTHS_OVERDUE(months) : S.DAYS_OVERDUE(differenceInDays(now, due))}`,
        })
      }
    })
    medications.forEach((m) => {
      if (!m.track_refill || !m.refill_date) return
      const days = differenceInDays(new Date(m.refill_date), now)
      if (days <= 5 && days >= 0)
        items.push({ id: m.id, text: `${m.name} ${S.REFILL_IN(days)}` })
    })
    return items.slice(0, 5)
  }, [appointments, medications])

  if (loading) return <SkeletonRow count={8} />
  if (!dailyLogs.length)
    return (
      <EmptyState
        icon="🌿"
        message={S.EMPTY_OVERVIEW}
        sub={S.EMPTY_OVERVIEW_SUB}
      />
    )

  const moodRound = stats.mood !== null ? Math.round(stats.mood) : null

  return (
    <Stack gap="lg">
      <Paper p="xl" radius="lg" ta="center" withBorder>
        <Text size="2rem" lh={1} mb="xs">
          {moodRound !== null ? MOOD_EMOJI[moodRound] : '🌿'}
        </Text>
        <Text fw={600} size="lg">
          {moodRound !== null
            ? S.FEELING_WEEK(MOOD_LABEL[moodRound])
            : S.HOW_FEELING}
        </Text>
        <Text size="sm" c="dimmed">
          {stats.energy !== null
            ? `${S.ENERGY_PREFIX}: ${ENERGY_LABEL[Math.round(stats.energy)]}`
            : S.LOG_ENERGY_CTA}
          {stats.stress !== null &&
            ` · ${S.STRESS_PREFIX}: ${stats.stress.toFixed(1)}/5`}
        </Text>
      </Paper>

      <SectionLabel>{S.LAST_7_DAYS}</SectionLabel>
      <SimpleGrid cols={3}>
        <StatCard
          label={S.SLEEP}
          value={stats.sleep}
          format={(v) => `${v.toFixed(1)}h`}
          sub={S.AVG_NIGHT}
        />
        <StatCard
          label={S.WATER}
          value={stats.water}
          format={(v) => `${v.toFixed(1)}`}
          sub={S.CUPS_AVG_DAY}
        />
        <StatCard
          label={S.MOOD}
          value={stats.mood}
          format={(v) => `${v.toFixed(1)}`}
          sub={S.AVG_5}
        />
      </SimpleGrid>

      {attention.length > 0 && (
        <Paper withBorder radius="lg" p="md">
          <SectionLabel>{S.NEEDS_ATTENTION}</SectionLabel>
          <Stack gap="xs">
            {attention.map((item) => (
              <Group key={item.id} gap="sm">
                <Text c="yellow">⚠</Text>
                <Text size="sm">{item.text}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
