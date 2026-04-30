import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Group,
  Text,
  Paper,
  SegmentedControl,
  Progress,
} from '@mantine/core'
import { useFinanceStore } from '../store/financeStore'
import { getCategoryInfo } from '../constants/categories'
import { STRINGS } from '../constants/strings'
import { formatMoneyWhole } from '../utils/moneyUtils'
import { Button } from '@mantine/core'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'

export function SilentBleedReport() {
  const navigate = useNavigate()
  const { expenses, currentMonth, loading } = useFinanceStore()
  const [view, setView] = useState<string>('weekly')

  if (loading) return <SkeletonRow count={6} />

  const monthExpenses = expenses.filter((e) => e.month === currentMonth)
  const byCategory: Record<string, number> = {}
  monthExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  })
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const totalActual = sorted.reduce((s, [, v]) => s + v, 0)
  const assumed = 15000
  const gap = totalActual - assumed
  const maxAmount = sorted[0]?.[1] ?? 1

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Button variant="subtle" onClick={() => navigate('/finance')}>
          {STRINGS.BACK_OVERVIEW}
        </Button>
        <SegmentedControl
          value={view}
          onChange={setView}
          data={['weekly', 'monthly']}
        />
      </Group>

      <Text>{view === 'weekly' ? 'This Week' : 'This Month'}</Text>

      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between" py="xs">
          <Text>Expected</Text>
          <Text>~{formatMoneyWhole(assumed)}</Text>
        </Group>
        <Group justify="space-between" py="xs">
          <Text>Actual</Text>
          <Text>{formatMoneyWhole(totalActual)}</Text>
        </Group>
        <Group justify="space-between" py="xs">
          <Text>Gap</Text>
          <Text c="red">{formatMoneyWhole(gap > 0 ? gap : 0)}</Text>
        </Group>
      </Paper>

      <Text tt="uppercase">where it went</Text>
      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          {sorted.slice(0, 5).map(([cat, amount]) => (
            <Group key={cat} gap="sm" wrap="nowrap">
              <Text w={100}>{getCategoryInfo(cat).label}</Text>
              <Text w={70} ta="right">
                {formatMoneyWhole(amount)}
              </Text>
              <Progress
                value={(amount / maxAmount) * 100}
                color="purple"
                style={{ flex: 1 }}
              />
            </Group>
          ))}
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Text tt="uppercase" mb="xs">
          suggestion
        </Text>
        <Text>{STRINGS.BLEED_SUGGESTION_WEEK}</Text>
      </Paper>

      <Button onClick={() => navigate('/finance')}>{STRINGS.OK_NOTED}</Button>
    </Stack>
  )
}
