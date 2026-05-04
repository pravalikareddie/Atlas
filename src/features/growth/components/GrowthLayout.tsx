import { useGrowthData } from '../hooks/useGrowthData'
import { usePlanData } from '../../plan/hooks/usePlanData'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useMeetingData } from '../../meetings/hooks/useMeetingData'
import { useRoutineData } from '../../routines/hooks/useRoutineData'
import { FeatureLayout } from '../../../shared/components/FeatureLayout'
import { GROWTH_STRINGS } from '../constants'

const tabs = [
  { to: '/growth', label: 'Sprints', end: true },
  { to: '/growth/tasks', label: 'Tasks' },
  { to: '/growth/meetings', label: 'Meetings' },
  { to: '/growth/routines', label: 'Routines' },
  { to: '/growth/goals', label: 'Goals' },
  { to: '/growth/learning', label: 'Learning' },
  { to: '/growth/books', label: 'Books' },
  { to: '/growth/calendar', label: 'Calendar' },
  { to: '/growth/past-weeks', label: 'Past Weeks' },
]

export function GrowthLayout() {
  useGrowthData()
  usePlanData()
  useTaskData()
  useMeetingData()
  useRoutineData()
  return (
    <FeatureLayout title={GROWTH_STRINGS.TITLE} tabs={tabs} accentColor="teal" />
  )
}
