import { ROUTES } from '../../app/routes'
import { FeatureLayout } from '../../shared/components/FeatureLayout'
import { useLivingData } from '../living/hooks/useLivingData'
import { useHealthData } from '../health/hooks/useHealthData'

const TABS = [
  { to: ROUTES.INBOX, label: 'Brain Dump', end: true },
  { to: '/inbox/shopping', label: 'Shopping' },
  { to: '/inbox/wishlist', label: 'Wishlist' },
]

export function InboxLayout() {
  useLivingData()
  useHealthData()
  return <FeatureLayout title="📥 Inbox" tabs={TABS} accentColor="violet" />
}
