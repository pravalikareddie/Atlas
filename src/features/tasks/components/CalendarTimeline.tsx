import { STRINGS } from '../constants/strings'
import { format, isValid, parse, subMinutes } from 'date-fns'
import { Paper, Stack, Group, Text, Box, Badge } from '@mantine/core'
import { Task } from '../types/task.types'
import { CaretRightIcon } from '@phosphor-icons/react'
interface Props {
  events: Task[]
  onTap: (t: Task) => void
}

function formatEventTime(time: string): string {
  try {
    const formatStr = time.length > 5 ? 'HH:mm:ss' : 'HH:mm'
    const parsed = parse(time, formatStr, new Date())
    if (!isValid(parsed)) return time
    return format(parsed, 'h:mm a')
  } catch {
    return time
  }
}

export function CalendarTimeline({ events, onTap }: Props) {
  const now = format(new Date(), 'HH:mm')

  return (
    <Paper p="lg" radius="xl" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text size="xs" fw={700} tt="uppercase">
            {STRINGS.CALENDAR}
          </Text>
          {events.length > 0 && (
            <Badge variant="light" color="teal" size="xs">
              {events.length}
            </Badge>
          )}
        </Group>
        <Text size="xs" fw={600} ff="monospace">
          {format(new Date(), 'h:mm a')}
        </Text>
      </Group>

      {events.length > 0 ? (
        <Stack gap="xs">
          {events.map((ev) => {
            const isPast = ev.event_time != null && ev.event_time < now
            const isNow =
              ev.event_time != null &&
              ev.event_time <= now &&
              ev.event_time >=
                format(subMinutes(new Date(), ev.event_duration ?? 30), 'HH:mm')
            const duration = ev.event_duration ?? 30
            const barWidth = Math.min(Math.max((duration / 60) * 180, 40), 260)

            return (
              <Paper
                key={ev.id}
                p="sm"
                radius="lg"
                withBorder
                onClick={() => onTap(ev)}
                style={{
                  cursor: 'pointer',
                  opacity: isPast ? 0.5 : 1,
                  borderColor: isNow
                    ? 'var(--mantine-color-teal-4)'
                    : 'var(--mantine-color-default-border)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Group gap="md" wrap="nowrap">
                  <Text
                    ff="monospace"
                    size="sm"
                    fw={700}
                    c={isNow ? 'teal' : 'var(--mantine-color-text)'}
                    w={60}
                    style={{ flexShrink: 0 }}
                  >
                    {ev.event_time ? formatEventTime(ev.event_time) : '—'}
                  </Text>

                  <Box style={{ flexShrink: 0 }}>
                    <Box
                      h={6}
                      style={{
                        borderRadius: 9999,
                        width: barWidth,
                        background: isNow
                          ? 'linear-gradient(90deg, var(--mantine-color-teal-5), var(--mantine-color-blue-4))'
                          : 'var(--mantine-color-teal-light-color)',
                      }}
                    />
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mt={2}>
                      <Text
                        size="sm"
                        fw={700}
                        truncate
                        c="var(--mantine-color-text)"
                      >
                        {ev.title}
                      </Text>
                      {ev.is_must && (
                        <Badge variant="urgent">{STRINGS.MUST}</Badge>
                      )}
                    </Group>
                    <Text size="xs" fw={500}>
                      {duration}m
                    </Text>
                    {isNow && (
                      <Badge variant="light" color="teal" size="xs">
                        {STRINGS.HAPPENING_NOW}
                      </Badge>
                    )}
                  </Box>

                  <CaretRightIcon size={14} />
                </Group>
              </Paper>
            )
          })}
        </Stack>
      ) : (
        <Group gap="sm" py="sm">
          <Text size="xl">📭</Text>
          <Text size="sm" fw={500}>
            {STRINGS.NO_EVENTS_TODAY}
          </Text>
        </Group>
      )}
    </Paper>
  )
}
