import { NavLink, Outlet } from 'react-router-dom'
import { Stack, Group, Text, Box } from '@mantine/core'
import { COLORS, TRANSITION_FAST } from '../../shared/constants/styles'

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
    <Stack gap="lg" p="md">
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
                      ? COLORS.WHITE_20
                      : 'transparent',
                    border: isActive
                      ? `1px solid ${COLORS.WHITE_30}`
                      : '1px solid transparent',
                    transition: TRANSITION_FAST,
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

      <Box p="md">
        <Outlet />
      </Box>
    </Stack>
  )
}
