// @ts-nocheck
import {
  Modal,
  Stack,
  Group,
  Text,
  Box,
  Progress,
  RingProgress,
} from '@mantine/core'
import { AreaScore, SubMetric } from '../../tasks/hooks/useLifeScore'
import {
  SCORE_STRINGS as S,
  SCORE_STYLES as ST,
  SCORE_COLOR_MAP,
  getScoreColor,
  getStrengthLabel,
  getStatusLabel,
} from './lifeScore.constants'

interface Props {
  area: AreaScore | null
  onClose: () => void
}

export function ScoreBreakdownModal({ area, onClose }: Props) {
  if (!area) return null

  const strengthColor = getScoreColor(area.score)
  const strengthLabel = getStrengthLabel(area.score)

  return (
    <Modal
      opened={!!area}
      onClose={onClose}
      withCloseButton
      radius={ST.RADIUS_MODAL}
      size="md"
      padding={0}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, background: ST.BG_BASE },
        content: {
          background: ST.BG_BASE,
          border: `1px solid ${ST.BORDER_SUBTLE}`,
          borderRadius: ST.RADIUS_MODAL,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        p="xl"
        pb="lg"
        style={{
          background: ST.BG_HEADER,
          borderBottom: `1px solid ${ST.BORDER_SUBTLE}`,
        }}
      >
        <Group gap="lg" align="center">
          <RingProgress
            size={80}
            thickness={7}
            roundCaps
            sections={[{ value: area.score || 1, color: area.color }]}
            rootColor={ST.RING_BG}
            label={
              <Text ta="center" style={{ fontSize: 24, lineHeight: 1 }}>
                {area.emoji}
              </Text>
            }
          />
          <Box style={{ flex: 1 }}>
            <Text size="lg" fw={800} c={ST.TEXT_PRIMARY} lh={1.2}>
              {area.label}
            </Text>
            <Group gap="xs" mt={6}>
              <Text
                size="xl"
                fw={900}
                c={ST.TEXT_PRIMARY}
                ff="var(--mantine-font-family-monospace)"
              >
                {area.score}
              </Text>
              <Text size="sm" c={ST.TEXT_MUTED} fw={500}>
                / 100
              </Text>
            </Group>
          </Box>
          <StatusPill label={strengthLabel} color={strengthColor} />
        </Group>
      </Box>

      <Stack gap={0} p="xl" pt="lg">
        <SectionHeader label={S.SECTION_FEEDS} />
        <Stack gap="md" mb="xl">
          {area.breakdown.map((m) => (
            <MetricRow key={m.label} metric={m} />
          ))}
        </Stack>

        {area.dragging && (
          <InfoCard
            color="red"
            label={S.SECTION_DRAGGING}
            text={area.dragging}
            mb="lg"
          />
        )}

        <InfoCard color="teal" label={S.SECTION_IMPROVE} text={area.tip} />

        <Box
          mt="xl"
          py="sm"
          ta="center"
          onClick={onClose}
          style={{
            cursor: 'pointer',
            borderRadius: ST.RADIUS_METRIC,
            background: ST.METRIC_BG,
            border: `1px solid ${ST.METRIC_BORDER}`,
            transition: 'background 0.15s',
          }}
        >
          <Text size="sm" fw={600} c={ST.TEXT_TERTIARY}>
            {S.CLOSE}
          </Text>
        </Box>
      </Stack>
    </Modal>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <Text size="xs" fw={700} tt="uppercase" c={ST.TEXT_MUTED} lts={2} mb="md">
      {label}
    </Text>
  )
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <Box
      px={12}
      py={6}
      style={{
        borderRadius: ST.RADIUS_PILL,
        background: `var(--mantine-color-${color}-light)`,
        border: `1px solid var(--mantine-color-${color}-3)`,
      }}
    >
      <Text size="xs" fw={700} c={color}>
        {label}
      </Text>
    </Box>
  )
}

function InfoCard({
  color,
  label,
  text,
  mb,
}: {
  color: string
  label: string
  text: string
  mb?: string
}) {
  return (
    <Box
      p="md"
      mb={mb}
      style={{
        borderRadius: ST.RADIUS_CARD,
        background: `var(--mantine-color-${color}-light)`,
        border: `1px solid var(--mantine-color-${color}-3)`,
        opacity: 0.85,
      }}
    >
      <Group gap="sm" mb={6}>
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: `var(--mantine-color-${color}-5)`,
            flexShrink: 0,
          }}
        />
        <Text size="xs" fw={700} tt="uppercase" c={color} lts={1}>
          {label}
        </Text>
      </Group>
      <Text size="sm" c={ST.TEXT_SECONDARY} lh={1.5} pl={14}>
        {text}
      </Text>
    </Box>
  )
}

function MetricRow({ metric }: { metric: SubMetric }) {
  const inverted = metric.unit === 'lower=better'
  const pct = metric.max > 0
    ? Math.min(100, (inverted ? (metric.max - metric.value) / metric.max : metric.value / metric.max) * 100)
    : 0
  const color = SCORE_COLOR_MAP[metric.status]
  const display = metric.unit === '%'
    ? `${metric.value}%`
    : inverted
      ? `${metric.value} / ${metric.max}`
      : metric.max > 0
        ? `${metric.value} / ${metric.max}`
        : `${metric.value}`
  const suffix = metric.unit && metric.unit !== '%' && metric.unit !== '$' && !inverted
    ? ` ${metric.unit}` : ''

  return (
    <Box
      p="sm"
      style={{
        borderRadius: ST.RADIUS_METRIC,
        background: ST.METRIC_BG,
        border: `1px solid ${ST.METRIC_BORDER}`,
      }}
    >
      <Group justify="space-between" mb={metric.max > 0 ? 10 : 0}>
        <Text size="sm" c={ST.TEXT_SECONDARY} fw={500}>
          {metric.label}
        </Text>
        <Group gap={8}>
          <Text
            size="sm"
            fw={700}
            c={ST.TEXT_PRIMARY}
            ff="var(--mantine-font-family-monospace)"
          >
            {display}
            {suffix}
          </Text>
          <StatusPill label={getStatusLabel(metric.status)} color={color} />
        </Group>
      </Group>
      {metric.max > 0 && (
        <Progress
          value={pct}
          color={color}
          size={6}
          radius="xl"
          style={{ background: ST.RING_BG }}
        />
      )}
    </Box>
  )
}
