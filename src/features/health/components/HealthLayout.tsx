import { useHealthData } from '../hooks/useHealthData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'

const tabs = [
  { to: '/health', label: 'Overview', end: true },
  { to: '/health/medical', label: 'Medical' },
  { to: '/health/history', label: 'History' },
]

export function HealthLayout() {
  useHealthData()
  return (
    <FeatureLayout title="💚 Health & Body" tabs={tabs} accentColor="green" />
  )
}
