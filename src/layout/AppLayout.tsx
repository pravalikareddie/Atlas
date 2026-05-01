import { Outlet } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { Sidebar } from './Sidebar'
import { BottomWidgets } from './BottomWidgets'

export function AppLayout() {
  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 0 }}
      padding="xl"
      styles={{
        main: {
          background: '#f4f6f9',
          minHeight: '100vh',
        },
        navbar: {
          background: '#0e1624',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: 0,
        },
      }}
    >
      <AppShell.Navbar p="md">
        <Sidebar />
        <BottomWidgets />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
