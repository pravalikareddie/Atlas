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
    const log = { user_id: 'demo-user', date: today, ...updates }
    upsertLog({
      id: todayLog?.id ?? crypto.randomUUID(),
      user_id: 'demo-user',
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

  return (
    <>
      <Group
        gap="xs"
        pt="sm"
        wrap="wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <Badge
          variant="light"
          color="gray"
          style={{ cursor: 'pointer' }}
          onClick={() => setModal('mood')}
        >
          {todayLog?.mood ? MOODS[todayLog.mood - 1] : '😐'}
        </Badge>
        <Badge
          variant="light"
          color="gray"
          style={{ cursor: 'pointer' }}
          onClick={() => setModal('energy')}
        >
          ⚡{todayLog?.energy_level ? ENERGY[todayLog.energy_level - 1] : '--'}
        </Badge>
        <Badge
          variant="light"
          color="gray"
          style={{ cursor: 'pointer' }}
          onClick={() => setModal('stress')}
        >
          🌡{todayLog?.stress_level ? STRESS[todayLog.stress_level - 1] : '--'}
        </Badge>
        <Badge
          variant="light"
          color={todayLog?.water_cups === 8 ? 'green' : 'gray'}
          style={{ cursor: 'pointer' }}
          onClick={addWater}
        >
          💧{todayLog?.water_cups ?? 0}/8
        </Badge>
        <Badge
          variant="light"
          color="gray"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSleepInput(todayLog?.sleep_hours ?? '')
            setModal('sleep')
          }}
        >
          🌙{todayLog?.sleep_hours ?? '--'}h
        </Badge>
      </Group>

      <Modal
        opened={modal === 'mood'}
        onClose={() => setModal(null)}
        title="How are you feeling?"
      >
        <Group gap="md" mb="md">
          {MOODS.map((m, i) => (
            <Text
              key={i}
              style={{
                cursor: 'pointer',
                opacity: todayLog?.mood === i + 1 ? 1 : 0.5,
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
            />
            <Button
              onClick={() =>
                save({ mood: todayLog?.mood, mood_note: moodNote || null })
              }
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
      >
        <Stack gap="xs">
          {ENERGY.map((e, i) => (
            <Button
              key={i}
              variant={todayLog?.energy_level === i + 1 ? 'filled' : 'subtle'}
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
      >
        <Stack gap="xs">
          {STRESS.map((s, i) => (
            <Button
              key={i}
              variant={todayLog?.stress_level === i + 1 ? 'filled' : 'subtle'}
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
      >
        <Stack gap="sm">
          <NumberInput
            value={sleepInput}
            onChange={setSleepInput}
            step={0.5}
            min={0}
            max={14}
            autoFocus
          />
          <Button
            onClick={() =>
              save({
                sleep_hours: typeof sleepInput === 'number' ? sleepInput : null,
              })
            }
            disabled={sleepInput === ''}
          >
            save
          </Button>
        </Stack>
      </Modal>
    </>
  )
}
