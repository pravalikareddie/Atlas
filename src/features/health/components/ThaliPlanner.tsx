import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Stack } from '@mantine/core'
import { PillTabs } from '../../../shared/components/PillTabs'
import { THALI_STRINGS as S } from '../constants/thali'
import { WeekPlanView } from './WeekPlanView'
import { OptionsView } from './OptionsView'

type SubTab = 'plan' | 'options'

const TABS = [
  { key: 'plan', label: `📅 ${S.WEEK_PLAN}` },
  { key: 'options', label: `🍽️ ${S.OPTIONS}` },
]

export function ThaliPlanner() {
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('tab') === 'options' ? 'options' : 'plan'
  const [subTab, setSubTab] = useState<SubTab>(initial)

  return (
    <Stack gap="md">
      <PillTabs tabs={TABS} active={subTab} onChange={(k) => setSubTab(k as SubTab)} />
      {subTab === 'plan' ? <WeekPlanView /> : <OptionsView />}
    </Stack>
  )
}
