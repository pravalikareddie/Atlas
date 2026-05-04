import { useState } from 'react'
import {
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Modal,
  Button,
  Box,
  Tooltip,
} from '@mantine/core'
import { useHealthStore } from '../features/health/store/healthStore'
import { ResetMode } from '../features/today/components/ResetMode'
import { upsertDailyLog } from '../features/health/services/dailyLogService'
import { DailyLog } from '../features/health/types/health.types'
import { USER_ID } from '../features/tasks/constants/taskConstants'
import { COLORS } from '../shared/constants/styles'
import { syncWaterCups } from '../sw-register'
import { STRINGS } from '../features/tasks/constants/strings'

const MOODS = ['😞', '😕', '😐', '🙂', '😊']
const ENERGY = ['drained', 'low', 'okay', 'good', 'great']
const STRESS = ['calm', 'mild', 'moderate', 'high', 'overwhelmed']

export function BottomWidgets() {
  const { dailyLogs, upsertLog } = useHealthStore()
  const [modal, setModal] = useState<
    'mood' | 'energy' | 'stress' | 'sleep' | 'water' | 'exercise' | null
  >(null)
  const [moodNote, setMoodNote] = useState('')
  const [sleepInput, setSleepInput] = useState<number | string>('')
  const [exerciseNote, setExerciseNote] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayLog: DailyLog | undefined = dailyLogs.find(
    (l: DailyLog) => l.date === today,
  )

  async function save(updates: Record<string, unknown>) {
    const log = {
      user_id: USER_ID,
      date: today,
      ...updates,
    }
    upsertLog({
      id: todayLog?.id ?? crypto.randomUUID(),
      user_id: USER_ID,
      date: today,
      mood: todayLog?.mood ?? null,
      mood_note: todayLog?.mood_note ?? null,
      sleep_hours: todayLog?.sleep_hours ?? null,
      water_cups: todayLog?.water_cups ?? 0,
      energy_level: todayLog?.energy_level ?? null,
      stress_level: todayLog?.stress_level ?? null,
      exercise_done: todayLog?.exercise_done ?? false,
      exercise_notes: todayLog?.exercise_notes ?? null,
      supplements_done: todayLog?.supplements_done ?? false,
      created_at: todayLog?.created_at ?? new Date().toISOString(),
      ...updates,
    } as Parameters<typeof upsertLog>[0])
    try {
      await upsertDailyLog(log)
    } catch {}
    if ('water_cups' in updates) {
      syncWaterCups(updates.water_cups as number)
    }
    setModal(null)
  }

  const chipStyle = {
    cursor: 'pointer',
    background: COLORS.WHITE_08,
    border: `1px solid ${COLORS.WHITE_12}`,
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
    color: COLORS.WHITE_75,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background 0.15s ease',
  }

  const [showReset, setShowReset] = useState(false)

  return (
    <>
      <Box
        pb="md"
        mb="sm"
        style={{ borderBottom: `1px solid ${COLORS.WHITE_08}` }}
      >
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          mb="sm"
          style={{
            color: COLORS.WHITE_30,
            fontSize: 10,
            letterSpacing: 1,
          }}
        >
          Check-in
        </Text>
        <Group gap={8} wrap="wrap">
          <Tooltip label="Mood" withArrow>
            <Box style={chipStyle} onClick={() => setModal('mood')}>
              {todayLog?.mood ? MOODS[todayLog.mood - 1] : '😐'}
            </Box>
          </Tooltip>
          <Tooltip label="Energy" withArrow>
            <Box style={chipStyle} onClick={() => setModal('energy')}>
              ⚡{' '}
              {todayLog?.energy_level
                ? ENERGY[todayLog.energy_level - 1]
                : '--'}
            </Box>
          </Tooltip>
          <Tooltip label="Stress" withArrow>
            <Box style={chipStyle} onClick={() => setModal('stress')}>
              🌡{' '}
              {todayLog?.stress_level
                ? STRESS[todayLog.stress_level - 1]
                : '--'}
            </Box>
          </Tooltip>
          <Tooltip label="Water" withArrow>
            <Box
              style={{
                ...chipStyle,
                color:
                  todayLog?.water_cups === 8
                    ? '#38bec9'
                    : 'rgba(255,255,255,0.75)',
              }}
              onClick={() => setModal('water')}
            >
              💧 {todayLog?.water_cups ?? 0}/8
            </Box>
          </Tooltip>
          <Tooltip label="Sleep" withArrow>
            <Box
              style={chipStyle}
              onClick={() => {
                setSleepInput(todayLog?.sleep_hours ?? '')
                setModal('sleep')
              }}
            >
              🌙 {todayLog?.sleep_hours ?? '--'}h
            </Box>
          </Tooltip>
          <Tooltip label="Reset Mode" withArrow>
            <Box style={chipStyle} onClick={() => setShowReset(true)}>
              🔄
            </Box>
          </Tooltip>
          <Tooltip label="Exercise" withArrow>
            <Box
              style={{
                ...chipStyle,
                color: todayLog?.exercise_done
                  ? '#38bec9'
                  : 'rgba(255,255,255,0.75)',
              }}
              onClick={() => {
                setExerciseNote(todayLog?.exercise_notes ?? '')
                setModal('exercise')
              }}
            >
              🏋️ {todayLog?.exercise_done ? 'Done' : 'Exercise'}
            </Box>
          </Tooltip>
          <Tooltip label="Supplements" withArrow>
            <Box
              style={{
                ...chipStyle,
                color: todayLog?.supplements_done
                  ? '#38bec9'
                  : 'rgba(255,255,255,0.75)',
              }}
              onClick={() =>
                save({ supplements_done: !todayLog?.supplements_done })
              }
            >
              💊 {todayLog?.supplements_done ? 'Done' : 'Supps'}
            </Box>
          </Tooltip>
        </Group>
      </Box>

      <Modal
        opened={modal === 'mood'}
        onClose={() => setModal(null)}
        title={STRINGS.HOW_FEELING}
        radius="xl"
      >
        <Group gap="md" mb="md">
          {MOODS.map((m, i) => (
            <Text
              key={i}
              style={{
                cursor: 'pointer',
                fontSize: 28,
                opacity: todayLog?.mood === i + 1 ? 1 : 0.4,
              }}
              onClick={() => save({ mood: i + 1 })}
            >
              {m}
            </Text>
          ))}
        </Group>
        {(todayLog?.mood ?? 3) <= 2 && (
          <Stack gap="sm">
            <TextInput
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="what's going on? (optional)"
              radius="lg"
            />
            <Button
              onClick={() =>
                save({ mood: todayLog?.mood, mood_note: moodNote || null })
              }
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              radius="xl"
            >
              save note
            </Button>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={modal === 'energy'}
        onClose={() => setModal(null)}
        title={STRINGS.ENERGY_LEVEL}
        radius="xl"
      >
        <Stack gap="xs">
          {ENERGY.map((e, i) => (
            <Button
              key={i}
              variant={todayLog?.energy_level === i + 1 ? 'gradient' : 'subtle'}
              gradient={{ from: 'teal', to: 'blue' }}
              radius="xl"
              onClick={() => save({ energy_level: i + 1 })}
            >
              {e}
            </Button>
          ))}
        </Stack>
      </Modal>

      <Modal
        opened={modal === 'stress'}
        onClose={() => setModal(null)}
        title={STRINGS.STRESS_LEVEL}
        radius="xl"
      >
        <Stack gap="xs">
          {STRESS.map((s, i) => (
            <Button
              key={i}
              variant={todayLog?.stress_level === i + 1 ? 'gradient' : 'subtle'}
              gradient={{ from: 'teal', to: 'blue' }}
              radius="xl"
              onClick={() => save({ stress_level: i + 1 })}
            >
              {s}
            </Button>
          ))}
        </Stack>
      </Modal>

      <Modal
        opened={modal === 'sleep'}
        onClose={() => setModal(null)}
        title={STRINGS.HOURS_SLEPT}
        radius="xl"
      >
        <Stack gap="sm">
          <NumberInput
            value={sleepInput}
            onChange={setSleepInput}
            step={0.5}
            min={0}
            max={14}
            autoFocus
            radius="lg"
          />
          <Button
            onClick={() =>
              save({
                sleep_hours: typeof sleepInput === 'number' ? sleepInput : null,
              })
            }
            disabled={sleepInput === ''}
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
          >
            save
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={modal === 'water'}
        onClose={() => setModal(null)}
        title={STRINGS.WATER_CUPS}
        radius="xl"
      >
        <Stack gap="sm">
          <Group justify="center" gap="md">
            <Button
              size="lg"
              variant="default"
              radius="xl"
              onClick={() =>
                save({
                  water_cups: Math.max((todayLog?.water_cups ?? 0) - 1, 0),
                })
              }
            >
              −
            </Button>
            <Text fw={700} size="xl">
              {todayLog?.water_cups ?? 0} / 8
            </Text>
            <Button
              size="lg"
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              radius="xl"
              onClick={() =>
                save({
                  water_cups: Math.min((todayLog?.water_cups ?? 0) + 1, 8),
                })
              }
            >
              +
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={modal === 'exercise'}
        onClose={() => setModal(null)}
        title={STRINGS.EXERCISE}
        radius="xl"
      >
        <Stack gap="sm">
          <Textarea
            value={exerciseNote}
            onChange={(e) => setExerciseNote(e.target.value)}
            placeholder={STRINGS.EXERCISE_PH}
            radius="lg"
            autoFocus
            minRows={3}
            autosize
          />
          <Group grow>
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              radius="xl"
              onClick={() =>
                save({
                  exercise_done: true,
                  exercise_notes: exerciseNote || null,
                })
              }
            >
              Done ✓
            </Button>
            <Button
              variant="subtle"
              color="gray"
              radius="xl"
              onClick={() =>
                save({
                  exercise_done: false,
                  exercise_notes: null,
                })
              }
            >
              Clear
            </Button>
          </Group>
        </Stack>
      </Modal>

      {showReset && (
        <ResetMode
          weeklyFocus={null}
          onFocusSaved={() => {}}
          onClose={() => setShowReset(false)}
        />
      )}
    </>
  )
}
