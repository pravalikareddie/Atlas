import { useState, useEffect } from 'react'
import { Stack, Text, Paper, Badge, Group, Box } from '@mantine/core'
import { fetchWeeklyReviews, WeeklyReview } from '../services/weeklyReviewService'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { format, parseISO, addDays } from 'date-fns'

export function PastWeeksScreen() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklyReviews()
      .then((r) => setReviews(r.filter((x) => x.completed_at)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonRow count={5} />

  if (!reviews.length) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Text style={{ fontSize: 40 }}>📖</Text>
        <Text fw={600}>No reviews yet</Text>
        <Text size="sm" c="dimmed">Complete your first weekly review to see it here.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Text fw={800} size="lg">Past Weeks</Text>
      {reviews.map((r) => {
        const start = parseISO(r.week_id)
        const end = addDays(start, 6)
        const range = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
        const highlights = (r.domain_highlights ?? []) as { domain: string; text: string }[]

        return (
          <Paper key={r.id} p="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="sm">
              <Text size="sm" c="dimmed">{range}</Text>
              {r.week_word && <Badge variant="light" color="teal">{r.week_word}</Badge>}
            </Group>

            {r.ai_summary && <Text size="sm" mb="sm">{r.ai_summary}</Text>}

            {r.focus_area && (
              <Group gap="xs" mb="sm">
                <Text size="xs" fw={700} c="dimmed">Focus:</Text>
                <Text size="sm">{r.focus_area}</Text>
              </Group>
            )}

            {r.intention_text && (
              <Group gap="xs" mb="sm">
                <Text size="xs" fw={700} c="dimmed">Intention:</Text>
                <Text size="sm">{r.intention_text}</Text>
              </Group>
            )}

            {highlights.length > 0 && (
              <Box mt="xs">
                <Text size="xs" fw={700} c="dimmed" mb={4}>Areas that needed attention</Text>
                {highlights.map((h, i) => (
                  <Text key={i} size="xs" c="dimmed">⚠ {h.text}</Text>
                ))}
              </Box>
            )}
          </Paper>
        )
      })}
    </Stack>
  )
}
