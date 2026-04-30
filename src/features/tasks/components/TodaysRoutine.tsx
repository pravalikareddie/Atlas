import { useNavigate } from 'react-router-dom'
import { useRoutineData } from '../../routines/hooks/useRoutineData'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import { useMemo } from 'react'
import {
  ROUTINE_CADENCE,
  ROUTINE_GRADIENTS,
  ROUTINE_TYPE_EMOJI,
} from '../../routines/constants'
import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { STRINGS } from '../constants/strings'
import { ROUTES } from '../../../app/routes'
import { DATE_FORMAT } from '../constants/taskConstants'
import { format } from 'date-fns'
import { CaretRight } from '@phosphor-icons/react'

export function TodayRoutines() {
  useRoutineData()
  const store = useRoutineStore()
  const navigate = useNavigate()
  const today = new Date().getDay() // 0=Sun, 1=Mon...

  const todayRoutines = useMemo(() => {
    const todayStr = format(new Date(), DATE_FORMAT.API)
    return store.routines.filter((r) => {
      if (!r.is_active) return false
      if (r.last_done === todayStr) return false
      if (store.steps.filter((s) => s.routine_id === r.id).length === 0)
        return false // hide if no steps
      if (r.cadence === ROUTINE_CADENCE.DAILY) return true
      if (r.show_today) return true
      if (r.cadence === ROUTINE_CADENCE.WEEKLY) {
        try {
          const days = JSON.parse(r.schedule ?? '{}').days ?? []
          return days.includes(today === 0 ? 6 : today - 1)
        } catch {
          return false
        }
      }
      return false
    })
  }, [store.routines, store.steps, today])
  return (
    <Paper p="md" radius="xl" withBorder style={{ minWidth: 0 }}>
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {STRINGS.ROUTINES}
        </Text>
        <Badge variant="light" color="teal" size="xs">
          {todayRoutines.length}
        </Badge>
      </Group>

      {todayRoutines.length === 0 ? (
        <Group gap="sm" py="sm">
          <Text size="xl">🔄</Text>
          <Text size="sm" c="dimmed">
            {STRINGS.NO_ROUTINES_TODAY}
          </Text>
        </Group>
      ) : (
        <Stack gap="xs">
          {todayRoutines.map((r) => {
            const gradient = ROUTINE_GRADIENTS[r.gradient ?? 0]
            const stepCount = store.steps.filter(
              (s) => s.routine_id === r.id,
            ).length
            const doneToday =
              r.last_done === format(new Date(), DATE_FORMAT.API)

            return (
              <UnstyledButton
                key={r.id}
                onClick={() => navigate(ROUTES.ROUTINE_RUN(r.id))}
                style={{ width: '100%' }}
              >
                <Group
                  gap="sm"
                  p="sm"
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    background: 'var(--mantine-color-gray-0)',
                    opacity: doneToday ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Box
                    w={32}
                    h={32}
                    style={{
                      borderRadius: 'var(--mantine-radius-md)',
                      background: gradient,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {ROUTINE_TYPE_EMOJI[r.type] ?? '🔄'}
                    </Text>
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      fw={600}
                      truncate
                      td={doneToday ? 'line-through' : undefined}
                    >
                      {r.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {stepCount} {STRINGS.ROUTINE_STEPS}
                      {doneToday ? ` · ${STRINGS.DONE_TODAY}` : ''}
                    </Text>
                  </Box>
                  <CaretRight size={14} color="var(--mantine-color-dimmed)" />
                </Group>
              </UnstyledButton>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}
