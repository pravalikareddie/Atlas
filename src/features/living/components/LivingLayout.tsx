import { useLivingData } from '../hooks/useLivingData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'
import { STRINGS as S } from '../constants/strings'

const tabs = [
  { to: '/living', label: S.TAB_EXPLORE, end: true },
  { to: '/living/activities', label: S.TAB_ACTIVITIES },
  { to: '/living/done', label: S.TAB_DONE },
]

export function LivingLayout() {
  useLivingData()
  return <FeatureLayout title={S.FEATURE_TITLE} tabs={tabs} accentColor="coral" />
}
