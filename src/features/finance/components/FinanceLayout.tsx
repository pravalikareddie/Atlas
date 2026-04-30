import { useNavigate } from 'react-router-dom'
import { useFinanceData } from '../hooks/useFinanceData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'
import { Button } from '@mantine/core'
import { STRINGS } from '../constants/strings'

const tabs = [
  { to: '/finance', label: 'Overview', end: true },
  { to: '/finance/expenses', label: 'Expenses' }, // add this
  { to: '/finance/log', label: 'Log' },
  { to: '/finance/budgets', label: 'Budgets' },
  { to: '/finance/accounts', label: 'Accounts' },
  { to: '/finance/tax', label: 'Tax' },
]
export function FinanceLayout() {
  useFinanceData()
  const navigate = useNavigate()
  return (
    <FeatureLayout
      title="💜 Finance"
      tabs={tabs}
      accentColor="purple"
      headerRight={
        <Button onClick={() => navigate('/finance/log')}>{STRINGS.LOG}</Button>
      }
    />
  )
}
