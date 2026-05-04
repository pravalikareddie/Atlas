import { useHealthData } from '../hooks/useHealthData'
import { useRoutineData } from '../../routines/hooks/useRoutineData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'
import { STRINGS as S } from '../constants/strings'

const tabs = [
  { to: '/health', label: S.TAB_MEDICAL, end: true },
  { to: '/health/routines', label: '💪 Routines' },
  { to: '/health/thali', label: '🍽️ Food' },
  { to: '/health/audit', label: '📊 Audit' },
]

export function HealthLayout() {
  useHealthData()
  useRoutineData()
  return <FeatureLayout title={S.FEATURE_TITLE} tabs={tabs} accentColor="green" />
}
