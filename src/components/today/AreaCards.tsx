import { useState, useEffect, useMemo } from 'react'
import { Stack, Group, Text, Box, SimpleGrid } from '@mantine/core'
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  LifeScoreResult,
  MonthlyMoney,
} from '../../features/tasks/hooks/useLifeScore'
import { GRADIENTS } from './constants'
import { formatMoneyWhole } from '../../features/finance/utils/moneyUtils'
import { fetchDailyLogs } from '../../features/health/services/dailyLogService'
import { DailyLog } from '../../features/health/types/health.types'
import {
  CARD,
  DIM,
  HEALTH_METRICS,
  HEALTH_LOG_DAYS,
  TOOLTIP_CONTENT_STYLE,
} from './constants'

interface Props {
  data: LifeScoreResult
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function AreaCards({ data }: Props) {
  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        <WorkCard done={data.work.done} planned={data.work.planned} />
        <PersonalCard
          done={data.personal.done}
          planned={data.personal.planned}
        />
        <MoneyCard {...data.money} monthly={data.money.monthly} />
        <GrowthCard {...data.growth} />
      </SimpleGrid>
      <HealthCard logs={data.health.logs} />
    </Stack>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

const CARD_STYLE = {
  background: GRADIENTS.DARK_CARD,
  borderRadius: CARD.BORDER_RADIUS,
  border: CARD.BORDER,
} as const

function Card({
  emoji,
  label,
  children,
}: {
  emoji: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Box p="lg" style={CARD_STYLE}>
      <Group gap="xs" mb="sm">
        <Text style={{ fontSize: CARD.EMOJI_SIZE }}>{emoji}</Text>
        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          c={DIM.MID}
          lts={CARD.LABEL_LETTER_SPACING}
        >
          {label}
        </Text>
      </Group>
      {children}
    </Box>
  )
}

function Stat({ value, label }: { value: string; label?: string }) {
  return (
    <Box>
      <Text
        fw={900}
        c="white"
        ff="var(--mantine-font-family-monospace)"
        style={{ fontSize: CARD.STAT_FONT_SIZE, lineHeight: 1 }}
      >
        {value}
      </Text>
      {label && (
        <Text size="xs" c={DIM.HIGH} mt={4}>
          {label}
        </Text>
      )}
    </Box>
  )
}

// ─── Work ─────────────────────────────────────────────────────────────────────

function WorkCard({ done, planned }: { done: number; planned: number }) {
  return (
    <Card emoji="💼" label="Work">
      <Stat value={`${done} / ${planned}`} label="tasks done / planned" />
    </Card>
  )
}

// ─── Personal ─────────────────────────────────────────────────────────────────

function PersonalCard({ done, planned }: { done: number; planned: number }) {
  return (
    <Card emoji="🌟" label="Personal">
      <Stat value={`${done} / ${planned}`} label="tasks done / planned" />
    </Card>
  )
}

// ─── Money ────────────────────────────────────────────────────────────────────

function MoneyCard({
  budget,
  spent,
  saved,
  overspent,
  monthly,
}: {
  budget: number
  spent: number
  saved: number
  overspent: number
  monthly: MonthlyMoney[]
}) {
  const isOver = overspent > 0
  // Max across both spent and budget so the budget marker is always in-range
  const maxVal = Math.max(...monthly.map((m) => Math.max(m.spent, m.budget)), 1)

  return (
    <Card emoji="💰" label="Money">
      {budget === 0 ? (
        <Text size="sm" c={DIM.HIGH}>
          No budget set
        </Text>
      ) : (
        <Stack gap="sm">
          <Stat
            value={
              isOver
                ? `-${formatMoneyWhole(overspent)}`
                : formatMoneyWhole(saved)
            }
            label={isOver ? 'overspent this month' : 'saved this month'}
          />
          <Group
            gap={4}
            align="flex-end"
            style={{ height: CARD.MONEY_BAR_HEIGHT }}
          >
            {monthly.map((m) => {
              const spentH = (m.spent / maxVal) * 100
              const budgetH = m.budget > 0 ? (m.budget / maxVal) * 100 : null
              const overBudget = m.budget > 0 && m.spent > m.budget
              return (
                <Box
                  key={m.month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: CARD.MONEY_BAR_HEIGHT,
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Box
                      style={{
                        width: '100%',
                        height: `${spentH}%`,
                        borderRadius: CARD.MONEY_BAR_RADIUS,
                        background: overBudget
                          ? 'var(--mantine-color-red-5)'
                          : 'var(--mantine-color-teal-5)',
                        minHeight: CARD.MONEY_BAR_MIN_HEIGHT,
                      }}
                    />
                    {budgetH !== null && (
                      <Box
                        style={{
                          position: 'absolute',
                          bottom: `${budgetH}%`,
                          left: 0,
                          right: 0,
                          height: 1,
                          background: DIM.BUDGET_LINE,
                        }}
                      />
                    )}
                  </Box>
                  <Text
                    size="xs"
                    c={DIM.MID}
                    style={{ fontSize: 'var(--mantine-font-size-xs)' }}
                  >
                    {m.month.slice(5)}
                  </Text>
                </Box>
              )
            })}
          </Group>
          <Group justify="space-between">
            <Text size="xs" c={DIM.MID}>
              🟩 under budget
            </Text>
            <Text size="xs" c={DIM.MID}>
              — budget line
            </Text>
            <Text size="xs" c={DIM.MID}>
              🟥 over
            </Text>
          </Group>
        </Stack>
      )}
    </Card>
  )
}

// ─── Health ───────────────────────────────────────────────────────────────────

function HealthCard({ logs: propLogs }: { logs: DailyLog[] }) {
  const [active, setActive] = useState(0)
  // Start with propLogs so there is never a blank frame on re-render.
  // The effect silently swaps in fresher API data without resetting to empty first.
  const [logs, setLogs] = useState<DailyLog[]>(propLogs)

  useEffect(() => {
    let cancelled = false
    fetchDailyLogs(HEALTH_LOG_DAYS)
      .then((fetched) => {
        if (!cancelled) setLogs(fetched)
      })
      .catch(() => {
        /* keep current logs on error */
      })
    return () => {
      cancelled = true
    }
  }, [propLogs])

  // Stable date — lazy useState so the reference never changes between renders
  const [now] = useState(() => new Date())
  const daysSoFar = now.getDate()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Normalise to YYYY-MM-DD regardless of whether date is a full ISO timestamp
  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>()
    for (const l of logs) map.set(l.date.slice(0, 10), l)
    return map
  }, [logs])

  const m = HEALTH_METRICS[active]

  const chartData = useMemo(
    () =>
      Array.from({ length: daysSoFar }, (_, i) => {
        const day = i + 1
        const key = `${monthPrefix}-${String(day).padStart(2, '0')}`
        const log = logMap.get(key)
        const value =
          log != null
            ? ((log[m.key] as number | null | undefined) ?? null)
            : null
        return { day, value }
      }),
    [daysSoFar, monthPrefix, logMap, m.key],
  )

  const latest: number | null =
    chartData.filter((d) => d.value !== null).pop()?.value ?? null

  return (
    <Card emoji="💚" label="Health">
      <Stack gap="md">
        <Group gap={6}>
          {HEALTH_METRICS.map((met, i) => (
            <Box
              key={met.key}
              onClick={() => setActive(i)}
              px="sm"
              py={4}
              style={{
                borderRadius: CARD.TAB_RADIUS,
                cursor: 'pointer',
                background: i === active ? met.color : DIM.TAB_BG,
                transition: CARD.TAB_TRANSITION,
              }}
            >
              <Text
                size="xs"
                fw={700}
                c={i === active ? 'white' : DIM.TAB_INACTIVE}
              >
                {met.label}
              </Text>
            </Box>
          ))}
        </Group>

        <Group justify="space-between">
          <Text size="sm" c={DIM.BODY} fw={600}>
            {m.label}
          </Text>
          <Text
            size="lg"
            c="white"
            fw={900}
            ff="var(--mantine-font-family-monospace)"
          >
            {latest !== null ? (
              <>
                {latest}{' '}
                <Text span size="xs" c={DIM.MID}>
                  {m.unit}
                </Text>
              </>
            ) : (
              <Text span size="sm" c={DIM.LOW}>
                —
              </Text>
            )}
          </Text>
        </Group>

        <ResponsiveContainer width="100%" height={CARD.CHART_HEIGHT}>
          <RechartsLine data={chartData}>
            <XAxis
              dataKey="day"
              tick={{ fill: DIM.HIGH, fontSize: 'var(--mantine-font-size-xs)' }}
              axisLine={{ stroke: DIM.AXIS }}
              tickLine={false}
            />
            <YAxis
              domain={[0, m.max]}
              tick={{ fill: DIM.HIGH, fontSize: 'var(--mantine-font-size-xs)' }}
              axisLine={{ stroke: DIM.AXIS }}
              tickLine={false}
              width={CARD.CHART_YAXIS_WIDTH}
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value) => {
                const v = value != null ? Number(value) : null
                return v !== null
                  ? [`${v} ${m.unit}`, m.label]
                  : ['No entry', m.label]
              }}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={m.color}
              strokeWidth={3}
              dot={{
                r: 5,
                fill: m.color,
                stroke: 'var(--mantine-color-dark-9)',
                strokeWidth: 2,
              }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          </RechartsLine>
        </ResponsiveContainer>

        {chartData.some((d) => d.value === null) && (
          <Text size="xs" c={DIM.LOW} ta="center">
            Gaps indicate days with no log entry
          </Text>
        )}
      </Stack>
    </Card>
  )
}

// ─── Growth ───────────────────────────────────────────────────────────────────

function GrowthCard({
  itemsDone,
  itemsPlanned,
  booksDone,
  booksPlanned,
  projectsDone,
  projectsPlanned,
}: {
  itemsDone: number
  itemsPlanned: number
  booksDone: number
  booksPlanned: number
  projectsDone: number
  projectsPlanned: number
}) {
  return (
    <Card emoji="🧠" label="Growth">
      <Stack gap={6}>
        <GrowthRow label="Learning" done={itemsDone} planned={itemsPlanned} />
        <GrowthRow label="Books" done={booksDone} planned={booksPlanned} />
        <GrowthRow
          label="Projects"
          done={projectsDone}
          planned={projectsPlanned}
        />
      </Stack>
    </Card>
  )
}

function GrowthRow({
  label,
  done,
  planned,
}: {
  label: string
  done: number
  planned: number
}) {
  return (
    <Group justify="space-between">
      <Text size="sm" c={DIM.BODY}>
        {label}
      </Text>
      <Text
        size="sm"
        fw={800}
        c="white"
        ff="var(--mantine-font-family-monospace)"
      >
        {done} / {planned}
      </Text>
    </Group>
  )
}
