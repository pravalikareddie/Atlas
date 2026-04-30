import { usePlanData } from '../hooks/usePlanData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'

const tabs = [
  { to: '/plan/goals', label: 'Goals' },
  { to: '/plan/projects', label: 'Projects' },
  { to: '/plan/roadmaps', label: 'Roadmaps' },
]

export function PlanLayout() {
  usePlanData()
  return <FeatureLayout title="🎯 Plan" tabs={tabs} accentColor="purple" />
}
