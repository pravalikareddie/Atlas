import { useGrowthData } from '../hooks/useGrowthData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'

const tabs = [
  { to: '/growth', label: 'Overview', end: true },
  { to: '/growth/books', label: 'Books' },
  { to: '/growth/calendar', label: 'Calendar' },
]

export function GrowthLayout() {
  useGrowthData()
  return <FeatureLayout title="🧠 Growth" tabs={tabs} accentColor="teal" />
}
