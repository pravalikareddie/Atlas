import { STRINGS } from '../constants/strings'
import { format, isValid, parse, subMinutes } from 'date-fns'
import {
  Paper,
  Stack,
  Group,
  Text,
  Box,
  Badge,
  ActionIcon,
} from '@mantine/core'
import { Meeting } from '../../meetings/types/meeting.types'
import { Plus } from '@phosphor-icons/react'
import { DATE_FORMAT } from '../constants/taskConstants'
import { CardShell } from '../../../shared/components/CardShell'
import { TaskCheckbox } from '../../../shared/components/TaskCheckbox'
import { COLORS } from '../../../shared/constants/styles'

interface Props {
  meetings: Meeting[]
  onTap: (m: Meeting) => void
  onDone?: (m: Meeting) => void
  onAdd?: () => void
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

export function CalendarTimeline({ meetings, onTap, onDone, onAdd }: Props) {
  const now = format(new Date(), 'HH:mm')
  const today = format(new Date(), DATE_FORMAT.API)

  return (
    <CardShell
      label={STRINGS.CALENDAR}
      gradient="linear-gradient(135deg, var(--mantine-color-blue-7), var(--mantine-color-violet-6))"
      count={meetings.length > 0 ? meetings.length : undefined}
      countColor="blue"
      right={
        <Group gap="md">
          <Text
            size="xs"
            fw={500}
            c="white"
            ff="var(--mantine-font-family-monospace)"
          >
            {format(new Date(), 'h:mm a')}
          </Text>
          {onAdd && (
            <ActionIcon
              variant="transparent"
              size="sm"
              onClick={onAdd}
              style={{
                border: `1.5px solid ${COLORS.WHITE_20}`,
                color: COLORS.WHITE_50,
              }}
            >
              <Plus size={12} />
            </ActionIcon>
          )}
        </Group>
      }
    >
      {meetings.length > 0 ? (
        <Stack gap="xs">
          {meetings.map((m) => {
            const isNow =
              m.event_time != null &&
              m.event_time <= now &&
              m.event_time >=
                format(
                  subMinutes(new Date(), m.event_duration ?? 30),
                  'HH:mm',
                )
            const duration = m.event_duration ?? 30
            const isDone = m.last_done === today

            return (
              <Paper
                key={m.id}
                p="sm"
                radius="md"
                withBorder
                onClick={() => onTap(m)}
                style={{
                  cursor: 'pointer',
                  opacity: isDone ? 0.5 : 1,
                  borderColor: isNow
                    ? 'var(--mantine-color-teal-4)'
                    : undefined,
                  transition: 'all 0.15s ease',
                }}
              >
                <Group gap="md" wrap="nowrap">
                  <TaskCheckbox
                    done={isDone}
                    onToggle={() => onDone?.(m)}
                    size={22}
                  />
                  <Text
                    ff="var(--mantine-font-family-monospace)"
                    size="xs"
                    fw={600}
                    w={48}
                    style={{ flexShrink: 0, lineHeight: 1.2 }}
                  >
                    {m.event_time ? formatEventTime(m.event_time) : '—'}
                  </Text>
                  <Box
                    w={3}
                    h={32}
                    style={{
                      borderRadius: 2,
                      flexShrink: 0,
                      background:
                        'linear-gradient(180deg, var(--mantine-color-teal-5), var(--mantine-color-blue-4))',
                    }}
                  />
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>
                      {m.title}
                    </Text>
                    <Text size="xs">{duration} min</Text>
                    {isNow && (
                      <Badge variant="light" color="teal" size="xs" mt={2}>
                        {STRINGS.HAPPENING_NOW}
                      </Badge>
                    )}
                  </Box>
                  <Text size="sm">›</Text>
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
    </CardShell>
  )
}
