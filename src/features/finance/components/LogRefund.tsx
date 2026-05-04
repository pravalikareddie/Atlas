import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paper, Stack, Text, TextInput , Button } from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { dollarsToCents } from '../utils/moneyUtils'
import { defaultExpectedBy, formatDateShort } from '../utils/dateUtils'
import { insertRefund } from '../services/refundService'
import { LogHeader } from './LogTypeSelector'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import { ROUTES } from '../../../app/routes'

// ─── LogRefund ────────────────────────────────────────────────────────────────
export function LogRefund() {
  const navigate = useNavigate()
  const { addRefund } = useFinanceStore()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedBy, setExpectedBy] = useState(defaultExpectedBy())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canLog =
    description.trim() !== '' && (parseFloat(amount) || 0) > 0 && !saving

  async function handleLog() {
    if (!canLog) return
    setSaving(true)
    setError(null)
    const row = {
      user_id: USER_ID,
      description,
      amount: dollarsToCents(parseFloat(amount)),
      returned_at: new Date().toISOString().split('T')[0],
      expected_by: expectedBy,
      status: 'pending' as const,
      resolved_at: null,
    }
    try {
      let result: { id: string }
      try {
        result = await insertRefund(row)
      } catch {
        result = { id: crypto.randomUUID() }
      }
      addRefund({ ...row, id: result.id, created_at: new Date().toISOString() })
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
        title={STRINGS.LOG_REFUND}
        subtitle={STRINGS.LOG_REFUND_SUB}
        emoji="↩️"
      />

      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label={STRINGS.FIELD_WHAT_RETURNED}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={STRINGS.PH_REFUND_DESC}
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
          <TextInput
            label={STRINGS.FIELD_EXPECTED_BY}
            type="date"
            value={expectedBy}
            onChange={(e) => setExpectedBy(e.target.value)}
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
        {STRINGS.LOG_REFUND}
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
            {STRINGS.REFUND_SAVED} {formatDateShort(expectedBy)}.
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
