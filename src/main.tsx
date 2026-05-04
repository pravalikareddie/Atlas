import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { theme } from './theme'
import { App } from './app/App'
import './styles/globals.css'
import { scheduleNotification, registerHydrationReminders } from './sw-register'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)

scheduleNotification(7, 0, 'Good morning! ☀️', (() => {
  try {
    const tasks = JSON.parse(localStorage.getItem('atlas-task-count') ?? '0')
    const meetings = JSON.parse(localStorage.getItem('atlas-meeting-count') ?? '0')
    return `You have ${tasks} tasks and ${meetings} meetings today. Open Atlas and knock them out! 💪`
  } catch { return 'Time to check your Atlas dashboard and conquer the day!' }
})())

registerHydrationReminders()
