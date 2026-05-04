import { NavLink, useLocation } from 'react-router-dom'
import { Stack, Text, UnstyledButton, Group, Box, Tooltip } from '@mantine/core'
import { NAV_SECTIONS, QUICK_LINKS } from './routes'
import { COLORS, GRADIENTS, TRANSITION_FAST } from '../shared/constants/styles'

export function Sidebar() {
  const location = useLocation()

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        background: GRADIENTS.SIDEBAR,
        margin: 'calc(-1 * var(--mantine-spacing-md))',
        padding: 'var(--mantine-spacing-md)',
        minHeight: '100%',
      }}
    >
      {/* Logo */}
      <Group justify="space-between" align="center" mb="xl" mt="xs">
        <Group gap="xs" align="baseline">
          <Text
            fw={900}
            style={{
              fontSize: 22,
              letterSpacing: '-0.5px',
              background: GRADIENTS.BRAND_TEXT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Atlas
          </Text>
          <Box w={6} h={6} style={{ borderRadius: '50%', background: COLORS.TEAL_60, flexShrink: 0 }} />
        </Group>
      </Group>

      {/* Scrollable nav */}
      <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {NAV_SECTIONS.map((section) => (
          <Stack key={section.label} gap={2} mb="md">
            <Text size="xs" fw={700} tt="uppercase" px="xs" mb={4} lts={1.5} style={{ color: COLORS.WHITE_30, fontSize: 10 }}>
              {section.label}
            </Text>
            {section.items.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
              return (
                <UnstyledButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  py={8}
                  px="sm"
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    textDecoration: 'none',
                    background: active ? COLORS.TEAL_15 : 'transparent',
                    borderLeft: active ? `2px solid ${COLORS.TEAL_70}` : '2px solid transparent',
                    transition: TRANSITION_FAST,
                  }}
                >
                  <Group gap={10}>
                    <Text style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{item.icon}</Text>
                    <Text size="sm" fw={active ? 700 : 400} style={{ color: active ? COLORS.TEAL_95 : COLORS.WHITE_55, transition: 'color 0.15s ease' }}>
                      {item.label}
                    </Text>
                  </Group>
                </UnstyledButton>
              )
            })}
          </Stack>
        ))}
      </Box>

      {/* Quick links — always visible at bottom */}
      <Box pt="sm" style={{ borderTop: `1px solid ${COLORS.WHITE_08}`, flexShrink: 0 }}>
        <Text size="xs" fw={700} tt="uppercase" px="xs" mb={4} lts={1.5} style={{ color: COLORS.WHITE_30, fontSize: 10 }}>
          Quick Access
        </Text>
        <Group gap={6} px="xs">
          {QUICK_LINKS.map((link) => (
            <Tooltip key={link.to} label={link.label} withArrow position="top">
              <UnstyledButton
                component={NavLink}
                to={link.to}
                p={8}
                style={{
                  borderRadius: 'var(--mantine-radius-md)',
                  textDecoration: 'none',
                  background: location.pathname.startsWith(link.to) ? COLORS.TEAL_15 : 'transparent',
                  transition: TRANSITION_FAST,
                }}
              >
                <Text style={{ fontSize: 20, textAlign: 'center' }}>{link.icon}</Text>
              </UnstyledButton>
            </Tooltip>
          ))}
        </Group>
      </Box>
    </Box>
  )
}
