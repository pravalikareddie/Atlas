import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Text,
  TextInput,
  Paper,
  UnstyledButton,
  Box,
  Group,
  Button,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { dollarsToCents } from '../utils/moneyUtils'
import { insertSplitwise } from '../services/splitwiseService'
import { ROUTES } from '../../../app/routes'
import { STRINGS } from '../../tasks/constants/strings'
import { LogHeader } from './LogTypeSelector'
import { USER_ID } from '../../tasks/constants/taskConstants'

// ─── LogSplitwise ─────────────────────────────────────────────────────────────
export function LogSplitwise() {
  const navigate = useNavigate()
  const { addSplitwiseEntry } = useFinanceStore()
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'owed_to_me' | 'i_owe'>(
    'owed_to_me',
  )
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canLog =
    person.trim() !== '' && (parseFloat(amount) || 0) > 0 && !saving

  async function handleLog() {
    if (!canLog) return
    setSaving(true)
    setError(null)
    const row = {
      user_id: USER_ID,
      person,
      amount: dollarsToCents(parseFloat(amount)),
      direction,
      description: description || null,
      status: 'outstanding' as const,
      logged_at: new Date().toISOString(),
      settled_at: null,
    }
    try {
      let result: { id: string }
      try {
        result = await insertSplitwise(row)
      } catch {
        result = { id: crypto.randomUUID() }
      }
      addSplitwiseEntry({
        ...row,
        id: result.id,
        created_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => navigate(ROUTES.FINANCE_LOG), 1500)
    } catch {
      setError(STRINGS.FAILED_TO_SAVE)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack gap="lg">
      <LogHeader
        title={STRINGS.LOG_SPLITWISE}
        subtitle={STRINGS.LOG_SPLITWISE_SUB}
        emoji="🤝"
      />

      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label={STRINGS.FIELD_WHO}
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder={STRINGS.PH_PERSON}
            radius="lg"
            autoFocus
          />
          <TextInput
            label={STRINGS.FIELD_AMOUNT}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={STRINGS.PH_AMOUNT}
            leftSection={<Text size="sm">$</Text>}
            type="number"
            step={0.01}
            radius="lg"
          />

          <Box>
            <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
              {STRINGS.DIRECTION}
            </Text>
            <Group gap="sm">
              {[
                {
                  value: 'owed_to_me',
                  label: STRINGS.THEY_OWE_ME,
                  emoji: '💰',
                },
                { value: 'i_owe', label: STRINGS.I_OWE_THEM, emoji: '💸' },
              ].map((opt) => (
                <UnstyledButton
                  key={opt.value}
                  onClick={() => setDirection(opt.value as typeof direction)}
                  style={{ flex: 1 }}
                >
                  <Box
                    p="md"
                    style={{
                      borderRadius: 'var(--mantine-radius-xl)',
                      textAlign: 'center',
                      background:
                        direction === opt.value
                          ? 'var(--mantine-color-teal-light)'
                          : 'var(--mantine-color-dark-6)',
                      border:
                        direction === opt.value
                          ? '2px solid var(--mantine-color-teal-4)'
                          : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                    <Text
                      size="sm"
                      fw={direction === opt.value ? 700 : 400}
                      c={direction === opt.value ? 'teal' : 'dimmed'}
                    >
                      {opt.label}
                    </Text>
                  </Box>
                </UnstyledButton>
              ))}
            </Group>
          </Box>

          <TextInput
            label={STRINGS.FIELD_WHAT_FOR}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={STRINGS.PH_SPLIT_DESC}
            radius="lg"
          />
        </Stack>
      </Paper>

      <Button
        variant="gradient"
        gradient={{ from: 'teal', to: 'blue' }}
        radius="xl"
        onClick={handleLog}
        disabled={!canLog}
        loading={saving}
      >
        {STRINGS.LOG_SPLITWISE}
      </Button>

      {saved && (
        <Paper
          p="md"
          radius="xl"
          bg="var(--mantine-color-green-0)"
          withBorder
          style={{ borderColor: 'var(--mantine-color-green-3)' }}
        >
          <Text size="sm" c="green" fw={600}>
            {STRINGS.SPLITWISE_SAVED}
          </Text>
        </Paper>
      )}
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
    </Stack>
  )
}
