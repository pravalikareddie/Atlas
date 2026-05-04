import { useState, useEffect } from 'react'
import { AuditTab } from '../../today/components/AuditTab'
import { ResetMode } from '../../today/components/ResetMode'
import { fetchUserSettings } from '../../plan/services/planService'
import { USER_ID } from '../../tasks/constants/taskConstants'

export function AuditScreen() {
  const [weeklyFocus, setWeeklyFocus] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    fetchUserSettings(USER_ID)
      .then((s) => {
        if (s?.weekly_focus) setWeeklyFocus(s.weekly_focus)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {showReset && (
        <ResetMode
          weeklyFocus={weeklyFocus}
          onFocusSaved={setWeeklyFocus}
          onClose={() => setShowReset(false)}
        />
      )}
      <AuditTab onReset={() => setShowReset(true)} weeklyFocus={weeklyFocus} />
    </>
  )
}
