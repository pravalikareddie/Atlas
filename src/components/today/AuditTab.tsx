import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { Stack, Group, Text, Box } from '@mantine/core'
import {
  ArrowCounterClockwise,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react'
import { useTaskStore } from '../../features/tasks/store/taskStore'
import { useLifeScore } from '../../features/tasks/hooks/useLifeScore'
import { useHealthData } from '../../features/health/hooks/useHealthData'
import {
  TASK_STATUS,
  DATE_FORMAT,
} from '../../features/tasks/constants/taskConstants'
import { STRINGS } from '../../features/tasks/constants/strings'
import { AreaCards } from './AreaCards'
import { GRADIENTS, AUDIT_MAX_WINS } from './constants'

interface AuditTabProps {
  onReset: () => void
  weeklyFocus: string | null
}

export function AuditTab({ onReset, weeklyFocus }: AuditTabProps) {
  useHealthData()
  const lifeScore = useLifeScore()
  const tasks = useTaskStore((s) => s.tasks)

  const yesterday = format(subDays(new Date(), 1), DATE_FORMAT.API)
  const yesterdayDone = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.DONE && t.completed_at?.startsWith(yesterday),
  )

  const last7Done = tasks.filter(
    (t) =>
      t.status === TASK_STATUS.DONE &&
      t.completed_at &&
      new Date(t.completed_at) > subDays(new Date(), 7),
  ).length

  const insightText =
    last7Done === 0
      ? STRINGS.INSIGHT_ZERO
      : last7Done < 5
        ? STRINGS.INSIGHT_LOW(last7Done)
        : STRINGS.INSIGHT_GOOD(last7Done)

  return (
    <Stack gap="xl">
      {/* ── WEEKLY FOCUS ────────────────────────────────────────────── */}
      {weeklyFocus && (
        <Box
          p="md"
          style={{
            background: 'var(--mantine-color-teal-light)',
            borderRadius: 16,
            borderLeft: '3px solid var(--mantine-color-teal-5)',
          }}
        >
          <Text size="xs" c="teal" fw={700} tt="uppercase" lts={2} mb={4}>
            {STRINGS.AUDIT_WEEKS_FOCUS}
          </Text>
          <Text size="md" fw={600} c="var(--mantine-color-text)">
            {weeklyFocus}
          </Text>
        </Box>
      )}

      {/* ── AREA CARDS ──────────────────────────────────────────────── */}
      <AreaCards data={lifeScore} />

      {/* ── YESTERDAY'S WINS ─────────────────────────────────────────── */}
      {yesterdayDone.length > 0 && (
        <Box
          p="lg"
          style={{
            background: 'var(--mantine-color-green-light)',
            borderRadius: 18,
            border: '1px solid var(--mantine-color-green-3)',
          }}
        >
          <Text size="xs" fw={700} tt="uppercase" c="green" lts={2} mb="sm">
            {STRINGS.AUDIT_YESTERDAY_WINS}
          </Text>
          <Stack gap={6}>
            {yesterdayDone.slice(0, AUDIT_MAX_WINS).map((t) => (
              <Group key={t.id} gap="sm">
                <CheckCircle
                  size={15}
                  color="var(--mantine-color-green-6)"
                  weight="fill"
                />
                <Text
                  size="sm"
                  c="dimmed"
                  td="line-through"
                  style={{ flex: 1 }}
                >
                  {t.title}
                </Text>
              </Group>
            ))}
            {yesterdayDone.length > AUDIT_MAX_WINS && (
              <Text size="xs" c="dimmed" ml={23}>
                +{yesterdayDone.length - AUDIT_MAX_WINS}{' '}
                {STRINGS.MORE_COMPLETED}
              </Text>
            )}
          </Stack>
        </Box>
      )}

      {/* ── INSIGHT ──────────────────────────────────────────────────── */}
      <Box
        p="lg"
        style={{
          background: 'var(--mantine-color-teal-light)',
          borderRadius: 18,
          border: '1px solid var(--mantine-color-teal-3)',
        }}
      >
        <Group gap={8} mb={8}>
          <Sparkle
            size={15}
            color="var(--mantine-color-teal-5)"
            weight="fill"
          />
          <Text size="xs" fw={700} tt="uppercase" c="teal" lts={2}>
            {STRINGS.AUDIT_INSIGHT}
          </Text>
        </Group>
        <Text size="md" fw={500} c="var(--mantine-color-text)" lh={1.6}>
          {insightText}
        </Text>
      </Box>

      {/* ── RESET MODE CTA ───────────────────────────────────────────── */}
      <Box
        p="xl"
        onClick={onReset}
        style={{
          background: GRADIENTS.DARK_CARD,
          borderRadius: 20,
          cursor: 'pointer',
          border: '1px solid var(--mantine-color-teal-9)',
          transition: 'border-color 0.2s',
        }}
      >
        <Group gap="lg">
          <Box
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              flexShrink: 0,
              background: 'var(--mantine-color-teal-light)',
              border: '1px solid var(--mantine-color-teal-5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowCounterClockwise
              size={24}
              weight="bold"
              color="var(--mantine-color-teal-5)"
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text fw={800} c="white" size="lg" lh={1.2}>
              {STRINGS.RESET_MODE}
            </Text>
            <Text size="sm" c="rgba(255,255,255,0.4)" mt={4}>
              {STRINGS.RESET_CTA_SUBTITLE}
            </Text>
          </Box>
          <Text c="var(--mantine-color-teal-5)" style={{ fontSize: 20 }}>
            →
          </Text>
        </Group>
      </Box>
    </Stack>
  )
}
