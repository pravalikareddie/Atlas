import { STRINGS } from '../constants/strings'
import { useState, useMemo } from 'react'
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns'
import {
  SimpleGrid,
  Stack,
  Group,
  Text,
  Paper,
  UnstyledButton,
  Box,
  Badge,
  Button,
} from '@mantine/core'
import { Task } from '../types/task.types'
import { sortTasks } from '../utils/taskUtils'
import { TypeBadge } from './TypeBadge'

interface Props {
  tasks: Task[]
  onDone: (t: Task) => void
  onTap: (t: Task) => void
  onAddForDay: (date: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarView({ tasks, onDone, onTap, onAddForDay }: Props) {
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())

  const calDays = eachDayOfInterval({
    start: startOfMonth(calMonth),
    end: endOfMonth(calMonth),
  })
  const startDow = getDay(startOfMonth(calMonth))
  const startPad = startDow === 0 ? 6 : startDow - 1

  const taskCountByDay = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((t) => {
      if (!t.due_date) return
      map.set(t.due_date, (map.get(t.due_date) ?? 0) + 1)
    })
    return map
  }, [tasks])

  const dayTasks = useMemo(() => {
    const ds = format(selectedDay, 'yyyy-MM-dd')
    return sortTasks(tasks.filter((t) => t.due_date === ds))
  }, [tasks, selectedDay])

  return (
    <Stack gap="md">
      <Group gap="md">
        <UnstyledButton onClick={() => setCalMonth(subMonths(calMonth, 1))}>
          <Text>◄</Text>
        </UnstyledButton>
        <Text>{format(calMonth, 'MMMM yyyy')}</Text>
        <UnstyledButton onClick={() => setCalMonth(addMonths(calMonth, 1))}>
          <Text>►</Text>
        </UnstyledButton>
      </Group>

      <SimpleGrid cols={7} spacing={4}>
        {WEEKDAYS.map((d) => (
          <Text key={d} ta="center" tt="uppercase">
            {d}
          </Text>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <Box key={`pad-${i}`} />
        ))}
        {calDays.map((day) => {
          const ds = format(day, 'yyyy-MM-dd')
          const count = taskCountByDay.get(ds)
          const isSelected = isSameDay(day, selectedDay)
          const isCurrentDay = isToday(day)
          const isPast = isBefore(day, startOfDay(new Date())) && !isCurrentDay
          return (
            <UnstyledButton
              key={ds}
              onClick={() => setSelectedDay(day)}
              p={8}
              style={{
                borderRadius: 10,
                textAlign: 'center',
                minHeight: 52,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                opacity: isPast ? 0.5 : 1,
                border: isSelected
                  ? '1px solid var(--mantine-color-purple-5)'
                  : '1px solid transparent',
                backgroundColor: isSelected
                  ? 'var(--mantine-color-purple-9)'
                  : undefined,
              }}
            >
              <Text
                c={isCurrentDay ? 'purple' : undefined}
                fw={isCurrentDay ? 700 : 400}
              >
                {format(day, 'd')}
              </Text>
              {count && (
                <Group gap={2}>
                  {Array.from({ length: Math.min(count, 5) }).map(
                    (_, i) => (
                      <Box
                        key={i}
                        w={4}
                        h={4}
                        style={{
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-gray-6)',
                        }}
                      />
                    ),
                  )}
                </Group>
              )}
            </UnstyledButton>
          )
        })}
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder>
        <Text mb="md">{format(selectedDay, 'EEEE, MMM d')}</Text>
        {dayTasks.map((t) => (
            <Group key={t.id} gap="sm" py={8}>
              <UnstyledButton
                onClick={() => onDone(t)}
                w={18}
                h={18}
                style={{
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.15)',
                  flexShrink: 0,
                }}
              />
              <Text
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => onTap(t)}
              >
                {t.title}
              </Text>
              <TypeBadge type={t.type} />
              {t.is_must && <Badge variant="urgent">must</Badge>}
            </Group>
          ))}
        {dayTasks.length === 0 && <Text>{STRINGS.NO_TASKS_FOR_DAY}</Text>}
        <Button
          variant="subtle"
          mt="sm"
          onClick={() => onAddForDay(format(selectedDay, 'yyyy-MM-dd'))}
        >
          + add task for this day
        </Button>
      </Paper>
    </Stack>
  )
}
