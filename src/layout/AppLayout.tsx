import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell, Box } from '@mantine/core'
import { Sidebar } from './Sidebar'
import { BottomWidgets } from './BottomWidgets'
import ChatWidget from '../features/chat/ChatWidget'
import { useTaskStore } from '../features/tasks/store/taskStore'
import { useMeetingStore } from '../features/meetings/store/meetingStore'
import { useHealthData } from '../features/health/hooks/useHealthData'
import { useFinanceData } from '../features/finance/hooks/useFinanceData'
import { useRoutineData } from '../features/routines/hooks/useRoutineData'
import { usePlanData } from '../features/plan/hooks/usePlanData'
import { useGrowthData } from '../features/growth/hooks/useGrowthData'
import { useLivingData } from '../features/living/hooks/useLivingData'
import { COLORS } from '../shared/constants/styles'
import { scheduleAllReminders } from '../sw-register'

export function AppLayout() {
  useHealthData()
  useFinanceData()
  useRoutineData()
  usePlanData()
  useGrowthData()
  useLivingData()

  // Cache counts for morning notification + schedule reminders
  const tasks = useTaskStore((s) => s.tasks)
  const meetings = useMeetingStore((s) => s.meetings)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter((t) => t.status === 'todo' && (t.do_today || t.due_date === today)).length
    const todayMeetings = meetings.filter((m) => m.next_date === today).length
    localStorage.setItem('atlas-task-count', String(todayTasks))
    localStorage.setItem('atlas-meeting-count', String(todayMeetings))
    scheduleAllReminders(tasks)
  }, [tasks, meetings])

  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 0 }}
      padding={0}
      styles={{
        main: {
          minHeight: '100vh',
        },
        navbar: {
          borderRight: `1px solid ${COLORS.WHITE_06}`,
          padding: 0,
        },
      }}
    >
      <AppShell.Navbar p="md" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Sidebar />
        </Box>
        <BottomWidgets />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <ChatWidget />
    </AppShell>
  )
}
