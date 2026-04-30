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
          background: 'var(--mantine-color-gray-0)',
          minHeight: '100vh',
        },
        navbar: {
          background: 'var(--mantine-color-body)',
          borderRight: '1px solid var(--mantine-color-default-border)',
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
