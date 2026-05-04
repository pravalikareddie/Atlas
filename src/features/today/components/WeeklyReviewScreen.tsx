import { useState, useMemo } from 'react'
import { Stack, Group, Text, Paper, Button, Textarea, TextInput, Box, Badge } from '@mantine/core'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { callClaude } from '../../../lib/anthropic'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useHealthStore } from '../../health/store/healthStore'
import { usePlanStore } from '../../plan/store/planStore'
import { TASK_STATUS } from '../../tasks/constants/taskConstants'
import { useDomainStatus } from '../hooks/useDomainStatus'
import { upsertWeeklyReview } from '../services/weeklyReviewService'
import { useBudgetSummary } from '../../finance/hooks/useBudgetSummary'

type Phase = 'evidence' | 'reflect' | 'domains' | 'close'

function getWeekId() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function getWeekRange() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  const end = endOfWeek(new Date(), { weekStartsOn: 1 })
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}

export function WeeklyReviewScreen() {
  const [phase, setPhase] = useState<Phase>('evidence')
  const [weekWord, setWeekWord] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [intention, setIntention] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const weekId = getWeekId()
  const domainCards = useDomainStatus()
  const tasks = useTaskStore((s) => s.tasks)
  const { dailyLogs } = useHealthStore()
  const { totalSpent, totalBudget } = useBudgetSummary()
  const { goals } = usePlanStore()

  // Evidence data
  const evidence = useMemo(() => {
    const weekTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE && t.completed_at && t.completed_at >= weekId)
    const weekLogs = dailyLogs.filter((l) => l.date >= weekId)
    const avgMood = weekLogs.filter((l) => l.mood).reduce((s, l) => s + (l.mood ?? 0), 0) / (weekLogs.filter((l) => l.mood).length || 1)
    const avgSleep = weekLogs.filter((l) => l.sleep_hours).reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / (weekLogs.filter((l) => l.sleep_hours).length || 1)
    const exerciseDays = weekLogs.filter((l) => l.exercise_done).length
    const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    return {
      tasksCompleted: weekTasks.length,
      topTasks: weekTasks.slice(0, 5).map((t) => t.title),
      avgMood: avgMood.toFixed(1),
      avgSleep: avgSleep.toFixed(1),
      exerciseDays,
      budgetPct,
      activeGoals: goals.filter((g) => g.status === 'active').length,
    }
  }, [tasks, dailyLogs, totalSpent, totalBudget, goals, weekId])

  // Domain highlights
  const domainHighlights = useMemo(() =>
    domainCards
      .filter((c) => c.status === 'needs_attention')
      .map((c) => ({ domain: c.domain, text: `${c.label} needs attention — ${c.lastEvent || 'check in'}` })),
    [domainCards],
  )

  const steadyDomains = domainCards.filter((c) => c.status === 'holding_steady').map((c) => c.label)

  const goingIntoNextWeek = domainCards
    .filter((c) => c.status === 'needs_attention')
    .map((c) => ({ domain: c.domain, text: `${c.label}: ${c.action?.text || 'needs attention'}` }))

  async function generateAiSummary() {
    setAiLoading(true)
    const prompt = `You are Atlas, a personal life OS. Summarize this week in 2-3 warm sentences. Facts: ${evidence.tasksCompleted} tasks done, mood avg ${evidence.avgMood}/5, sleep avg ${evidence.avgSleep}hrs, exercised ${evidence.exerciseDays} days, budget ${evidence.budgetPct}% used, ${evidence.activeGoals} active goals. Week word: "${weekWord}". Focus: "${focusArea}". Be specific and encouraging. No scores.`
    try {
      const msg = await callClaude(prompt, 150)
      setAiSummary(msg || 'A solid week of progress.')
    } catch {
      setAiSummary('A solid week of progress.')
    }
    setAiLoading(false)
  }

  async function completeReview() {
    try {
      await upsertWeeklyReview(weekId, {
        week_word: weekWord || null,
        ai_summary: aiSummary || null,
        focus_area: focusArea || null,
        intention_text: intention || null,
        domain_highlights: domainHighlights,
        going_into_next_week: goingIntoNextWeek,
        completed_at: new Date().toISOString(),
      })
      setSaved(true)
    } catch {}
  }

  if (saved) {
    return (
      <Stack align="center" gap="xl" p="xl">
        <Text style={{ fontSize: 56 }}>✨</Text>
        <Text fw={800} size="xl" ta="center">Week reviewed.</Text>
        <Text c="dimmed" ta="center">Come back next week. You've got this.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="lg" p="md" maw={600} mx="auto">
      <Text fw={800} size="lg">Weekly Review · {getWeekRange()}</Text>

      {/* Phase indicators */}
      <Group gap="xs">
        {(['evidence', 'reflect', 'domains', 'close'] as Phase[]).map((p, i) => (
          <Box key={p} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= ['evidence', 'reflect', 'domains', 'close'].indexOf(phase) ? 'var(--mantine-color-teal-5)' : 'var(--mantine-color-dark-5)' }} />
        ))}
      </Group>

      {/* Phase 1: Evidence */}
      {phase === 'evidence' && (
        <Stack gap="md">
          <Text fw={700}>What happened this week</Text>
          <Paper p="md" radius="lg" withBorder>
            <Stack gap="sm">
              <Group justify="space-between"><Text size="sm">Tasks completed</Text><Text fw={700}>{evidence.tasksCompleted}</Text></Group>
              <Group justify="space-between"><Text size="sm">Avg mood</Text><Text fw={700}>{evidence.avgMood}/5</Text></Group>
              <Group justify="space-between"><Text size="sm">Avg sleep</Text><Text fw={700}>{evidence.avgSleep} hrs</Text></Group>
              <Group justify="space-between"><Text size="sm">Exercise days</Text><Text fw={700}>{evidence.exerciseDays}</Text></Group>
              <Group justify="space-between"><Text size="sm">Budget used</Text><Text fw={700}>{evidence.budgetPct}%</Text></Group>
              <Group justify="space-between"><Text size="sm">Active goals</Text><Text fw={700}>{evidence.activeGoals}</Text></Group>
            </Stack>
          </Paper>
          {evidence.topTasks.length > 0 && (
            <Paper p="md" radius="lg" withBorder>
              <Text size="xs" fw={700} c="dimmed" mb="xs">Top tasks</Text>
              {evidence.topTasks.map((t, i) => <Text key={i} size="sm">✓ {t}</Text>)}
            </Paper>
          )}
          <Button radius="xl" onClick={() => setPhase('reflect')}>Next →</Button>
        </Stack>
      )}

      {/* Phase 2: Reflect */}
      {phase === 'reflect' && (
        <Stack gap="md">
          <Text fw={700}>Reflect</Text>
          <TextInput
            label="One word for this week"
            value={weekWord}
            onChange={(e) => setWeekWord(e.target.value)}
            placeholder="Productive, chaotic, restful..."
            radius="lg"
          />
          <TextInput
            label="What's your focus for next week?"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="Ship the feature, sleep more..."
            radius="lg"
          />
          <Textarea
            label="Intention or note to future self"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Remember to..."
            radius="lg"
            rows={3}
          />
          <Group>
            <Button variant="subtle" onClick={() => setPhase('evidence')}>← Back</Button>
            <Button radius="xl" onClick={() => setPhase('domains')}>Next →</Button>
          </Group>
        </Stack>
      )}

      {/* Phase 3: Domain highlights */}
      {phase === 'domains' && (
        <Stack gap="md">
          <Text fw={700}>Areas this week</Text>

          {domainHighlights.length > 0 && (
            <Stack gap="xs">
              {domainHighlights.map((d) => (
                <Paper key={d.domain} p="sm" radius="md" withBorder style={{ borderLeft: '3px solid var(--mantine-color-amber-5)' }}>
                  <Text size="sm">{d.text}</Text>
                </Paper>
              ))}
            </Stack>
          )}

          {steadyDomains.length > 0 && (
            <Text size="sm" c="dimmed">Holding steady: {steadyDomains.join(', ')}</Text>
          )}

          <Group>
            <Button variant="subtle" onClick={() => setPhase('reflect')}>← Back</Button>
            <Button radius="xl" onClick={() => { generateAiSummary(); setPhase('close') }}>Next →</Button>
          </Group>
        </Stack>
      )}

      {/* Phase 4: Close */}
      {phase === 'close' && (
        <Stack gap="md">
          <Text fw={700}>Week in review</Text>

          {weekWord && <Badge size="lg" variant="light" color="teal">{weekWord}</Badge>}

          <Paper p="md" radius="lg" withBorder>
            <Text size="xs" fw={700} c="dimmed" mb="xs">Atlas Insight</Text>
            {aiLoading ? <Text size="sm" c="dimmed">Thinking...</Text> : <Text size="sm">{aiSummary}</Text>}
          </Paper>

          {focusArea && (
            <Paper p="md" radius="lg" withBorder>
              <Text size="xs" fw={700} c="dimmed" mb="xs">Next week's focus</Text>
              <Text size="sm" fw={600}>{focusArea}</Text>
            </Paper>
          )}

          {goingIntoNextWeek.length > 0 && (
            <Paper p="md" radius="lg" withBorder>
              <Text size="xs" fw={700} c="dimmed" mb="xs">Going into next week</Text>
              <Stack gap="xs">
                {goingIntoNextWeek.map((d) => (
                  <Text key={d.domain} size="sm">⚠ {d.text}</Text>
                ))}
              </Stack>
            </Paper>
          )}

          <Group>
            <Button variant="subtle" onClick={() => setPhase('domains')}>← Back</Button>
            <Button radius="xl" color="teal" onClick={completeReview} loading={aiLoading}>Complete Review ✨</Button>
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
