import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Group, Text, Paper, Button, Badge, UnstyledButton, Box } from '@mantine/core'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import { ROUTINE_GRADIENTS, ROUTINE_TYPE_EMOJI, ROUTINE_CADENCE, CADENCE_LABEL } from '../../routines/constants'
import { ROUTES } from '../../../app/routes'
import { format } from 'date-fns'
import { CaretRight, Plus } from '@phosphor-icons/react'

const HEALTH_TYPES = ['health', 'maintenance', 'nutrition']

export function HealthRoutines() {
  const store = useRoutineStore()
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const dayOfWeek = new Date().getDay()

  const routines = useMemo(() =>
    store.routines.filter((r) => HEALTH_TYPES.includes(r.type) && r.is_active),
    [store.routines],
  )

  const todayRoutines = useMemo(() =>
    routines.filter((r) => {
      if (r.last_done === today) return true // show done ones too
      if (r.cadence === ROUTINE_CADENCE.DAILY) return true
      if (r.show_today) return true
      if (r.cadence === ROUTINE_CADENCE.WEEKLY) {
        try { const days = JSON.parse(r.schedule ?? '{}').days ?? []; return days.includes(dayOfWeek === 0 ? 6 : dayOfWeek - 1) } catch { return false }
      }
      return false
    }),
    [routines, today, dayOfWeek],
  )

  const otherRoutines = routines.filter((r) => !todayRoutines.includes(r))

  return (
    <Stack gap="lg">
      {/* Today's health routines */}
      {todayRoutines.length > 0 && (
        <Box>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Today</Text>
          <Stack gap="sm">
            {todayRoutines.map((r) => {
              const gradient = ROUTINE_GRADIENTS[r.gradient ?? 0]
              const stepCount = store.steps.filter((s) => s.routine_id === r.id).length
              const doneToday = r.last_done === today
              return (
                <Paper key={r.id} p="lg" radius="lg" withBorder style={{ opacity: doneToday ? 0.5 : 1 }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="md" style={{ flex: 1 }}>
                      <Box w={40} h={40} style={{ borderRadius: 'var(--mantine-radius-md)', background: gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>{ROUTINE_TYPE_EMOJI[r.type] ?? '💪'}</Text>
                      </Box>
                      <Box>
                        <Text fw={600} td={doneToday ? 'line-through' : undefined}>{r.title}</Text>
                        <Group gap="xs" mt={2}>
                          <Badge size="xs" variant="light">{CADENCE_LABEL[r.cadence] ?? r.cadence}</Badge>
                          <Text size="xs" c="dimmed">{stepCount} steps</Text>
                          {doneToday && <Badge size="xs" color="green">Done ✓</Badge>}
                        </Group>
                      </Box>
                    </Group>
                    <Button size="xs" variant="gradient" gradient={{ from: 'teal', to: 'cyan' }} radius="xl"
                      onClick={() => navigate(ROUTES.ROUTINE_RUN(r.id))}>
                      {doneToday ? 'Redo' : 'Start'}
                    </Button>
                  </Group>
                </Paper>
              )
            })}
          </Stack>
        </Box>
      )}

      {/* Other health routines (not scheduled today) */}
      {otherRoutines.length > 0 && (
        <Box>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">All Health Routines</Text>
          <Stack gap="sm">
            {otherRoutines.map((r) => {
              const stepCount = store.steps.filter((s) => s.routine_id === r.id).length
              return (
                <UnstyledButton key={r.id} onClick={() => navigate(ROUTES.ROUTINE_RUN(r.id))} style={{ width: '100%' }}>
                  <Paper p="md" radius="lg" withBorder>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Text>{ROUTINE_TYPE_EMOJI[r.type] ?? '💪'}</Text>
                        <Box>
                          <Text size="sm" fw={600}>{r.title}</Text>
                          <Text size="xs" c="dimmed">{CADENCE_LABEL[r.cadence]} · {stepCount} steps</Text>
                        </Box>
                      </Group>
                      <CaretRight size={14} />
                    </Group>
                  </Paper>
                </UnstyledButton>
              )
            })}
          </Stack>
        </Box>
      )}

      {routines.length === 0 && (
        <Paper p="xl" radius="lg" withBorder ta="center">
          <Text size="lg" mb="sm">💪</Text>
          <Text fw={600}>No health routines yet</Text>
          <Text size="sm" c="dimmed" mb="md">Create routines with type Health, Maintenance, or Nutrition</Text>
          <Button variant="light" color="teal" radius="xl" onClick={() => navigate(ROUTES.ROUTINES)}>
            <Plus size={14} /> Create Routine
          </Button>
        </Paper>
      )}
    </Stack>
  )
}
