import { Box, Text, UnstyledButton } from '@mantine/core'
import { useState, useMemo } from 'react'
import { useHealthStore } from '../store/healthStore'
import { differenceInDays, subDays, format } from 'date-fns'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { EmptyState } from '../../../shared/components/EmptyState'

export function HistoryScreen() {
  const { dailyLogs, loading } = useHealthStore()
  const [range, setRange] = useState<7 | 30 | 90>(30)

  const logs = useMemo(() => {
    const now = new Date()
    return dailyLogs
      .filter((l) => differenceInDays(now, new Date(l.date)) < range)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [dailyLogs, range])

  if (loading) return <SkeletonRow count={6} />
  if (!dailyLogs.length)
    return (
      <EmptyState message="Log mood, sleep, and water daily to see trends here." />
    )

  const days = Array.from({ length: range }, (_, i) =>
    format(subDays(new Date(), range - 1 - i), 'yyyy-MM-dd'),
  )

  function avg(fn: (l: (typeof logs)[0]) => number | null) {
    const vals = logs.map(fn).filter((v): v is number => v !== null)
    return vals.length
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : '--'
  }

  function barColor(
    val: number,
    metric: 'sleep' | 'water' | 'mood' | 'energy' | 'stress',
  ) {
    if (metric === 'sleep')
      return val >= 7 ? '#34C78A' : val >= 6 ? '#7C6FE0' : '#F0A429'
    if (metric === 'water') return val >= 8 ? '#34C78A' : '#7C6FE0'
    if (metric === 'stress')
      return val <= 2 ? '#34C78A' : val <= 3 ? '#F0A429' : '#F05050'
    return val >= 4 ? '#34C78A' : val >= 3 ? '#F0A429' : '#F05050'
  }

  function Chart({
    title,
    metric,
    max,
    goal,
    unit,
  }: {
    title: string
    metric: 'sleep' | 'water'
    max: number
    goal: number
    unit: string
  }) {
    return (
      <Box>
        <Box>{title}</Box>
        <Box>
          <Box>
            <Box style={{ bottom: `${(goal / max) * 100}%` }}>
              <Text component="span">
                goal {goal}
                {unit}
              </Text>
            </Box>
            {days.map((d) => {
              const log = logs.find((l) => l.date === d)
              const val = log
                ? ((metric === 'sleep' ? log.sleep_hours : log.water_cups) ?? 0)
                : 0
              return (
                <Box key={d}>
                  <Box
                    style={{
                      height: `${(val / max) * 100}%`,
                      backgroundColor:
                        val > 0 ? barColor(val, metric) : 'transparent',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
          <Box>
            avg{' '}
            {avg((l) => (metric === 'sleep' ? l.sleep_hours : l.water_cups))}
            {unit}
          </Box>
        </Box>
      </Box>
    )
  }

  function DotChart({
    title,
    metric,
  }: {
    title: string
    metric: 'mood' | 'energy' | 'stress'
  }) {
    return (
      <Box>
        <Box>{title}</Box>
        <Box>
          <Box>
            {days.map((d) => {
              const log = logs.find((l) => l.date === d)
              const val = log
                ? log[
                    metric === 'mood'
                      ? 'mood'
                      : metric === 'energy'
                        ? 'energy_level'
                        : 'stress_level'
                  ]
                : null
              return (
                <Box
                  key={d}
                  style={{
                    paddingBottom: val ? `${((val - 1) / 4) * 100}%` : '0',
                  }}
                >
                  {val !== null && (
                    <Box style={{ backgroundColor: barColor(val, metric) }} />
                  )}
                </Box>
              )
            })}
          </Box>
          <Box>
            avg{' '}
            {avg((l) =>
              metric === 'mood'
                ? l.mood
                : metric === 'energy'
                  ? l.energy_level
                  : l.stress_level,
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Box>
        <Box>
          {([7, 30, 90] as const).map((r) => (
            <UnstyledButton key={r} onClick={() => setRange(r)}>
              {r === 90 ? '3mo' : `${r}d`}
            </UnstyledButton>
          ))}
        </Box>
      </Box>

      <Chart title="SLEEP" metric="sleep" max={10} goal={7} unit="hrs" />
      <Chart title="WATER" metric="water" max={10} goal={8} unit=" cups" />
      <DotChart title="MOOD" metric="mood" />
      <DotChart title="ENERGY" metric="energy" />
      <DotChart title="STRESS" metric="stress" />
    </Box>
  )
}
