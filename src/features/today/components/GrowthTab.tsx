import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  format,
} from 'date-fns'
import {
  Stack,
  Group,
  Text,
  Box,
  Badge,
  SimpleGrid,
  UnstyledButton,
} from '@mantine/core'
import { usePlanData } from '../../plan/hooks/usePlanData'
import { usePlanStore } from '../../plan/store/planStore'
import { useGrowthData } from '../../growth/hooks/useGrowthData'
import { useGrowthStore } from '../../growth/store/growthStore'
import { useLivingData } from '../../living/hooks/useLivingData'
import { useLivingStore } from '../../living/store/livingStore'
import { COLORS } from '../../../shared/constants/styles'
import { STRINGS } from '../../tasks/constants/strings'

const inThisMonth = (dateStr: string | null) => {
  if (!dateStr) return false
  try {
    const now = new Date()
    return isWithinInterval(parseISO(dateStr), {
      start: startOfMonth(now),
      end: endOfMonth(now),
    })
  } catch {
    return false
  }
}

const fmtDate = (d: string | null) => (d ? format(parseISO(d), 'MMM d') : '')

type Tab = 'goals' | 'learning' | 'living'

const TABS: { value: Tab; label: string; emoji: string }[] = [
  { value: 'goals', label: 'Goals & Projects', emoji: '🎯' },
  { value: 'learning', label: 'Learning & Books', emoji: '📚' },
  { value: 'living', label: 'Living', emoji: '🌟' },
]

const TAB_COLORS: Record<Tab, string> = {
  goals: 'teal',
  learning: 'green',
  living: 'coral',
}

function Card({
  title,
  subtitle,
  badge,
  emoji,
  color,
}: {
  title: string
  subtitle?: string
  badge?: string
  emoji?: string
  color: string
}) {
  return (
    <Box
      p="lg"
      style={{
        background: 'var(--mantine-color-navy-8)',
        borderRadius: 'var(--mantine-radius-md)',
        borderLeft: `3px solid var(--mantine-color-${color}-5)`, boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Group gap="xs">
        {emoji && <Text style={{ fontSize: 14 }}>{emoji}</Text>}
        <Text size="md" fw={600} c="white">
          {title}
        </Text>
      </Group>
      {(badge || subtitle) && (
        <Group gap="xs" mt={4}>
          {badge && (
            <Badge size="xs" variant="light" color={color}>
              {badge}
            </Badge>
          )}
          {subtitle && (
            <Text size="xs" c={COLORS.WHITE_50}>
              {subtitle}
            </Text>
          )}
        </Group>
      )}
    </Box>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <Box
      p="xl"
      ta="center"
      style={{
        background: 'var(--mantine-color-navy-8)',
        borderRadius: 'var(--mantine-radius-md)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Text size="sm" c={COLORS.WHITE_30}>
        {text}
      </Text>
    </Box>
  )
}

export function GrowthTab() {
  usePlanData()
  useGrowthData()
  useLivingData()

  const [tab, setTab] = useState<Tab>('goals')

  const goals = usePlanStore((s) => s.goals)
  const milestones = usePlanStore((s) => s.milestones)
  const projects = usePlanStore((s) => s.projects)
  const areas = useGrowthStore((s) => s.areas)
  const growthItems = useGrowthStore((s) => s.items)
  const books = useGrowthStore((s) => s.books)
  const activities = useLivingStore((s) => s.activities)
  const places = useLivingStore((s) => s.places)
  const experiences = useLivingStore((s) => s.experiences)
  const livingTodos = useLivingStore((s) => s.todos)

  const f = useMemo(
    () => ({
      goals: goals.filter(
        (g) => g.status === 'active' && inThisMonth(g.deadline),
      ),
      projects: projects.filter(
        (p) => p.status === 'active' && inThisMonth(p.deadline),
      ),
      milestones: milestones.filter(
        (m) => m.status === 'todo' && inThisMonth(m.due_date),
      ),
      areas: areas.filter((a) => a.status === 'active'),
      items: growthItems.filter((i) => i.status === 'current'),
      books: books.filter((b) => b.status === 'reading' || (b.target_month && b.target_month.startsWith(format(new Date(), 'yyyy-MM')))),
      activities: activities.filter((a) => inThisMonth(a.target_date)),
      places: places.filter(
        (p) => p.status === 'want' && inThisMonth(p.target_date),
      ),
      experiences: experiences.filter(
        (e) => e.status === 'want' && inThisMonth(e.target_date),
      ),
    }),
    [
      goals,
      projects,
      milestones,
      areas,
      growthItems,
      books,
      activities,
      places,
      experiences,
    ],
  )

  return (
    <Stack gap="lg">
      <Box
        px="sm"
        py="xs"
        style={{
          width: '100%',
          overflow: 'hidden',
          background: 'var(--mantine-color-navy-8)',
          borderRadius: 'var(--mantine-radius-lg)',
          boxShadow: 'var(--mantine-shadow-sm)',
        }}
      >
        <SimpleGrid cols={8} spacing={0}>
          {TABS.map((t) => (
            <UnstyledButton
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{ textAlign: 'center' }}
            >
              <Box
                py={8}
                style={{
                  borderBottom:
                    tab === t.value
                      ? `2px solid var(--mantine-color-${TAB_COLORS[t.value]}-5)`
                      : '2px solid transparent',
                }}
              >
                <Text
                  size="s"
                  c={
                    tab === t.value
                      ? TAB_COLORS[t.value]
                      : COLORS.WHITE_40
                  }
                >
                  {t.emoji}
                </Text>
                <Text
                  size="xs"
                  fw={tab === t.value ? 700 : 500}
                  c={tab === t.value ? 'white' : COLORS.WHITE_40}
                  mt={2}
                  truncate
                >
                  {t.label}
                </Text>
              </Box>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Box>

      {/* Goals & Projects & Milestones */}
      {tab === 'goals' && (
        <Stack gap="md">
          {f.goals.length > 0 && f.goals.map((g) => <Card key={g.id} color="teal" title={g.title} badge={g.area} subtitle={fmtDate(g.deadline)} />)}
          {f.projects.length > 0 && f.projects.map((p) => <Card key={p.id} color="blue" title={p.title} subtitle={fmtDate(p.deadline)} />)}
          {f.milestones.length > 0 && f.milestones.map((m) => <Card key={m.id} color="violet" title={m.title} subtitle={fmtDate(m.due_date)} />)}
          {f.goals.length === 0 && f.projects.length === 0 && f.milestones.length === 0 && <Empty text={STRINGS.EMPTY_GOALS_MONTH} />}
        </Stack>
      )}

      {/* Learning & Books */}
      {tab === 'learning' && (
        <Stack gap="md">
          {f.areas.map((a) => {
            const count = f.items.filter((i) => i.area_id === a.id).length
            return <Card key={a.id} color="green" emoji={a.emoji} title={a.name} subtitle={`${count} active item${count !== 1 ? 's' : ''}`} />
          })}
          {f.books.map((b) => <Card key={b.id} color="amber" title={b.title} badge="reading" />)}
          {f.areas.length === 0 && f.books.length === 0 && <Empty text={STRINGS.EMPTY_LEARNING_MONTH} />}
        </Stack>
      )}

      {/* Living — activities, places, experiences */}
      {tab === 'living' && (
        <Stack gap="md">
          {f.activities.map((a) => <Card key={a.id} color="coral" title={a.name} subtitle={fmtDate(a.target_date)} />)}
          {f.places.map((p) => <Card key={p.id} color="pink" title={p.name} subtitle={fmtDate(p.target_date)} />)}
          {f.experiences.map((e) => <Card key={e.id} color="purple" title={e.name} subtitle={fmtDate(e.target_date)} />)}
          {livingTodos.filter((t) => t.status === 'todo').map((t) => <Card key={t.id} color="gray" title={t.description} emoji="🔍" />)}
          {f.activities.length === 0 && f.places.length === 0 && f.experiences.length === 0 && livingTodos.filter((t) => t.status === 'todo').length === 0 && <Empty text={STRINGS.EMPTY_LIVING_MONTH} />}
        </Stack>
      )}
    </Stack>
  )
}
