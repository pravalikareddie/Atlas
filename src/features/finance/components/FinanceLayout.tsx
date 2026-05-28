import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData.ts'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'
import { Button, Modal, Stack, TextInput, Select, Group } from '@mantine/core'
import { STRINGS } from '../constants/strings'
import { ROUTES } from '../../../app/routes'
import { useFinanceStore } from '../store/financeStore'
import { getExpenseGridCategories, getCategoryInfo, INCOME_CATEGORY } from '../constants/categories'
import { insertExpense } from '../services/expenseService'
import { insertRefund } from '../services/refundService'
import { insertSubscription } from '../services/subscriptionService'
import { insertSplitwise } from '../services/splitwiseService'
import { getCurrentMonth } from '../utils/dateUtils'
import { dollarsToCents } from '../utils/moneyUtils'
import { USER_ID } from '../../tasks/constants/taskConstants'

const TABS = [
  { to: ROUTES.FINANCE, label: 'Overview', end: true },
  { to: ROUTES.FINANCE_EXPENSES, label: STRINGS.EXPENSES },
  { to: ROUTES.FINANCE_GROUPS, label: 'Groups' },
  { to: ROUTES.FINANCE_ACCOUNTS, label: 'Accounts' },
  { to: ROUTES.FINANCE_BUDGETS, label: STRINGS.BUDGETS },
  { to: ROUTES.FINANCE_TAX, label: 'Tax' },
]

const LOG_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'refund', label: 'Refund' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'splitwise', label: 'Splitwise' },
]

export function FinanceLayout() {
  useFinanceData()
  const [showLog, setShowLog] = useState(false)
  const [logType, setLogType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [person, setPerson] = useState('')
  const [direction, setDirection] = useState('i_owe')
  const [period, setPeriod] = useState('monthly')
  const [expectedBy, setExpectedBy] = useState('')
  const [saving, setSaving] = useState(false)

  const { addExpense, addRefund, addSubscription, addSplitwiseEntry } = useFinanceStore()

  function reset() {
    setAmount('')
    setCategory('')
    setNote('')
    setPerson('')
    setDirection('i_owe')
    setPeriod('monthly')
    setExpectedBy('')
    setShowLog(false)
  }

  async function handleLog() {
    const cents = dollarsToCents(Number(amount) || 0)
    if (cents <= 0) return
    setSaving(true)
    try {
      if (logType === 'expense' || logType === 'income') {
        const row = { user_id: USER_ID, amount: cents, category: logType === 'income' ? INCOME_CATEGORY : (category || 'other'), note: note || null, month: getCurrentMonth(), logged_at: new Date().toISOString() }
        try { const e = await insertExpense(row); addExpense({ ...row, id: e.id, created_at: new Date().toISOString() }) }
        catch { addExpense({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }) }
      } else if (logType === 'refund') {
        const row = { user_id: USER_ID, description: note || 'Refund', amount: cents, returned_at: new Date().toISOString().split('T')[0], expected_by: expectedBy || new Date().toISOString().split('T')[0], status: 'pending' as const, resolved_at: null }
        try { addRefund(await insertRefund(row)) }
        catch { addRefund({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }) }
      } else if (logType === 'subscription') {
        const row = { user_id: USER_ID, name: note || 'Subscription', amount: cents, period: period as 'monthly' | 'yearly', renewal_day: new Date().getDate(), status: 'active' as const, cancelled_at: null }
        try { addSubscription(await insertSubscription(row)) }
        catch { addSubscription({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }) }
      } else if (logType === 'splitwise') {
        const row = { user_id: USER_ID, person: person || 'Someone', amount: cents, direction: direction as 'i_owe' | 'owed_to_me', description: note || null, status: 'outstanding' as const, logged_at: new Date().toISOString(), settled_at: null }
        try { addSplitwiseEntry(await insertSplitwise(row)) }
        catch { addSplitwiseEntry({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }) }
      }
    } finally {
      setSaving(false)
      reset()
    }
  }

  const categoryData = getExpenseGridCategories().map((k) => {
    const c = getCategoryInfo(k)
    return { value: k, label: `${c.emoji} ${c.label}` }
  })

  return (
    <>
      <FeatureLayout
        title="💜 Finance"
        tabs={TABS}
        accentColor="purple"
        headerRight={
          <Button onClick={() => setShowLog(true)} variant="white" c="purple">
            + Log
          </Button>
        }
      />

      <Modal opened={showLog} onClose={reset} title="Log Transaction" radius="xl" size="sm">
        <Stack gap="md">
          <Select label="Type" value={logType} onChange={(v) => v && setLogType(v)} data={LOG_TYPES} radius="lg" />
          <TextInput label="Amount ($)" value={amount} onChange={(e) => setAmount(e.currentTarget.value)} type="number" step={0.01} radius="lg" autoFocus />

          {(logType === 'expense') && (
            <Select label="Category" value={category} onChange={(v) => setCategory(v ?? '')} data={categoryData} radius="lg" placeholder="Select category" />
          )}

          {logType === 'splitwise' && (
            <>
              <TextInput label="Person" value={person} onChange={(e) => setPerson(e.currentTarget.value)} radius="lg" placeholder="Who?" />
              <Select label="Direction" value={direction} onChange={(v) => v && setDirection(v)} data={[{ value: 'i_owe', label: 'I owe them' }, { value: 'owed_to_me', label: 'They owe me' }]} radius="lg" />
            </>
          )}

          {logType === 'subscription' && (
            <Select label="Period" value={period} onChange={(v) => v && setPeriod(v)} data={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} radius="lg" />
          )}

          {logType === 'refund' && (
            <TextInput label="Expected by" type="date" value={expectedBy} onChange={(e) => setExpectedBy(e.currentTarget.value)} radius="lg" />
          )}

          <TextInput label={logType === 'subscription' ? 'Name' : logType === 'refund' ? 'Description' : 'Note'} value={note} onChange={(e) => setNote(e.currentTarget.value)} radius="lg" placeholder="Optional" />

          <Group justify="flex-end">
            <Button variant="default" onClick={reset} radius="xl">Cancel</Button>
            <Button onClick={handleLog} disabled={!amount || saving} loading={saving} variant="gradient" gradient={{ from: 'teal', to: 'cyan' }} radius="xl">Log</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
