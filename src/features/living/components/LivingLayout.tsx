import { useLivingData } from '../hooks/useLivingData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'

const tabs = [
  { to: '/living', label: 'Explore', end: true },
  { to: '/living/activities', label: 'Activities' },
  { to: '/living/done', label: 'Done' },
]

export function LivingLayout() {
  useLivingData()
  return (
    <FeatureLayout title="🌟 Living Life" tabs={tabs} accentColor="coral" />
  )
}
