import { NavLink, Outlet } from 'react-router-dom'
import { Stack, Group, Text, Title, Box } from '@mantine/core'

// tabs config — easy to update
interface Tab {
  to: string
  label: string
  end?: boolean
}

interface Props {
  title: string
  tabs: Tab[]
  accentColor?: string
  headerRight?: React.ReactNode
}

export function FeatureLayout({
  title,
  tabs,
  accentColor = 'teal',
  headerRight,
}: Props) {
  return (
    <Stack maw={840} gap="lg">
      {/* Header */}
      <Box
        p="xl"
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${accentColor}-6), var(--mantine-color-blue-5))`,
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group justify="space-between" align="center">
          <Text fw={800} c="white" style={{ fontSize: 24 }}>
            {title}
          </Text>
          {headerRight}
        </Group>

        {/* Tabs */}
        <Group gap="xs" mt="md">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <Box
                  px="md"
                  py={6}
                  style={{
                    borderRadius: 'var(--mantine-radius-xl)',
                    background: isActive
                      ? 'rgba(255,255,255,0.2)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.3)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                >
                  <Text
                    size="sm"
                    fw={isActive ? 700 : 500}
                    c="white"
                    opacity={isActive ? 1 : 0.65}
                  >
                    {tab.label}
                  </Text>
                </Box>
              )}
            </NavLink>
          ))}
        </Group>
      </Box>

      <Outlet />
    </Stack>
  )
}
