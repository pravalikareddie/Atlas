import { useState } from 'react'
import {
  Group,
  Badge,
  Text,
  Stack,
  TextInput,
  NumberInput,
  Modal,
  Button,
  Box,
} from '@mantine/core'
import { useHealthStore } from '../features/health/store/healthStore'
import { upsertDailyLog } from '../features/health/services/dailyLogService'
import { DailyLog } from '../features/health/types/health.types'

const MOODS = ['😞', '😕', '😐', '🙂', '😊']
const ENERGY = ['drained', 'low', 'okay', 'good', 'great']
const STRESS = ['calm', 'mild', 'moderate', 'high', 'overwhelmed']

export function BottomWidgets() {
  const { dailyLogs, upsertLog } = useHealthStore()
  const [modal, setModal] = useState<
    'mood' | 'energy' | 'stress' | 'sleep' | null
  >(null)
  const [moodNote, setMoodNote] = useState('')
  const [sleepInput, setSleepInput] = useState<number | string>('')

  const today = new Date().toISOString().split('T')[0]
  const todayLog: DailyLog | undefined = dailyLogs.find(
    (l: DailyLog) => l.date === today,
  )

  async function save(updates: Record<string, unknown>) {
    const log = { user_id: '00000000-0000-0000-0000-000000000001', date: today, ...updates }
    upsertLog({
      id: todayLog?.id ?? crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      date: today,
      mood: todayLog?.mood ?? null,
      mood_note: todayLog?.mood_note ?? null,
      sleep_hours: todayLog?.sleep_hours ?? null,
      water_cups: todayLog?.water_cups ?? 0,
      energy_level: todayLog?.energy_level ?? null,
      stress_level: todayLog?.stress_level ?? null,
      created_at: todayLog?.created_at ?? new Date().toISOString(),
      ...updates,
    } as Parameters<typeof upsertLog>[0])
    try {
      await upsertDailyLog(log)
    } catch {}
    setModal(null)
  }

  async function addWater() {
    const cups = Math.min((todayLog?.water_cups ?? 0) + 1, 8)
    await save({ water_cups: cups })
  }

  const chipStyle = {
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    transition: 'background 0.15s ease',
  }

  return (
    <>
      <Box
        pt="sm"
        mt="auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          mb="xs"
          style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: 10,
            letterSpacing: 1,
          }}
        >
          Today
        </Text>
        <Group gap={4} wrap="wrap">
          <Box style={chipStyle} onClick={() => setModal('mood')}>
            {todayLog?.mood ? MOODS[todayLog.mood - 1] : '😐'}
          </Box>
          <Box style={chipStyle} onClick={() => setModal('energy')}>
            ⚡
            {todayLog?.energy_level ? ENERGY[todayLog.energy_level - 1] : '--'}
          </Box>
          <Box style={chipStyle} onClick={() => setModal('stress')}>
            🌡
            {todayLog?.stress_level ? STRESS[todayLog.stress_level - 1] : '--'}
          </Box>
          <Box
            style={{
              ...chipStyle,
              color:
                todayLog?.water_cups === 8
                  ? '#38bec9'
                  : 'rgba(255,255,255,0.65)',
            }}
            onClick={addWater}
          >
            💧{todayLog?.water_cups ?? 0}/8
          </Box>
          <Box
            style={chipStyle}
            onClick={() => {
              setSleepInput(todayLog?.sleep_hours ?? '')
              setModal('sleep')
            }}
          >
            🌙{todayLog?.sleep_hours ?? '--'}h
          </Box>
        </Group>
      </Box>

      <Modal
        opened={modal === 'mood'}
        onClose={() => setModal(null)}
        title="How are you feeling?"
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
        title="Energy level?"
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
        title="Stress level?"
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
        title="Hours slept?"
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
    </>
  )
}
