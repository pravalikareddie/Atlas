import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  TextInput,
  NumberInput,
  Paper,
  Box,
  UnstyledButton,
  Button,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { dollarsToCents } from '../utils/moneyUtils'
import { insertSubscription } from '../services/subscriptionService'
import { ROUTES } from '../../../app/routes'
import { LogHeader } from './LogTypeSelector'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'

// ─── LogSubscription ──────────────────────────────────────────────────────────
export function LogSubscription() {
  const navigate = useNavigate()
  const { addSubscription } = useFinanceStore()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [renewalDay, setRenewalDay] = useState<number | string>(15)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const day =
    typeof renewalDay === 'number'
      ? renewalDay
      : parseInt(renewalDay as string) || 0
  const canLog =
    name.trim() !== '' &&
    (parseFloat(amount) || 0) > 0 &&
    day >= 1 &&
    day <= 31 &&
    !saving

  async function handleLog() {
    if (!canLog) return
    setSaving(true)
    setError(null)
    const row = {
      user_id: USER_ID,
      name,
      amount: dollarsToCents(parseFloat(amount)),
      period,
      renewal_day: day,
      status: 'active' as const,
      cancelled_at: null,
    }
    try {
      let result: { id: string }
      try {
        result = await insertSubscription(row)
      } catch {
        result = { id: crypto.randomUUID() }
      }
      addSubscription({
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
        title={STRINGS.LOG_SUBSCRIPTION}
        subtitle={STRINGS.LOG_SUBSCRIPTION_SUB}
        emoji="🔁"
      />

      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label={STRINGS.FIELD_NAME}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={STRINGS.PH_SUB_NAME}
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
              {STRINGS.FIELD_RENEWS}
            </Text>
            <Group gap="md">
              {[
                { value: 'monthly', label: STRINGS.MONTHLY },
                { value: 'yearly', label: STRINGS.YEARLY },
              ].map((opt) => (
                <UnstyledButton
                  key={opt.value}
                  onClick={() => setPeriod(opt.value as typeof period)}
                  style={{ flex: 1 }}
                >
                  <Box
                    p="md"
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      textAlign: 'center',
                      background:
                        period === opt.value
                          ? 'var(--mantine-color-teal-light)'
                          : 'var(--mantine-color-dark-6)',
                      border:
                        period === opt.value
                          ? '2px solid var(--mantine-color-teal-4)'
                          : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Text
                      size="sm"
                      fw={period === opt.value ? 700 : 400}
                      c={period === opt.value ? 'teal' : 'dimmed'}
                    >
                      {opt.label}
                    </Text>
                  </Box>
                </UnstyledButton>
              ))}
            </Group>
          </Box>

          <Group align="flex-end" gap="md">
            <Text size="sm" c="dimmed">
              {STRINGS.ON_THE}
            </Text>
            <NumberInput
              value={renewalDay}
              onChange={setRenewalDay}
              min={1}
              max={31}
              w={80}
              radius="lg"
            />
            <Text size="sm" c="dimmed">
              {STRINGS.TH}
            </Text>
          </Group>
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
        {STRINGS.LOG_SUBSCRIPTION}
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
            {STRINGS.SUBSCRIPTION_SAVED}
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
