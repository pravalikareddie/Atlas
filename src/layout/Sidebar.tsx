import { NavLink, useLocation } from 'react-router-dom'
import { Stack, Text, UnstyledButton, Group, Box } from '@mantine/core'
import { NAV_SECTIONS } from './routes'

export function Sidebar() {
  const location = useLocation()

  return (
    <Stack
      gap={0}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #0e1624 0%, #111d2e 100%)',
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
              background: 'linear-gradient(135deg, #38bec9, #74b3ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Atlas
          </Text>
          <Box
            w={6}
            h={6}
            style={{
              borderRadius: '50%',
              background: 'rgba(56,190,201,0.6)',
              flexShrink: 0,
            }}
          />
        </Group>
      </Group>

      {/* Nav sections */}
      {NAV_SECTIONS.map((section) => (
        <Stack key={section.label} gap={2} mb="md">
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            px="xs"
            mb={4}
            lts={1.5}
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          >
            {section.label}
          </Text>

          {section.items.map((item) => {
            const active =
              location.pathname === item.to ||
              location.pathname.startsWith(item.to + '/')

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
                  background: active ? 'rgba(56,190,201,0.15)' : 'transparent',
                  borderLeft: active
                    ? '2px solid rgba(56,190,201,0.7)'
                    : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Group gap={10}>
                  <Text
                    style={{ width: 20, textAlign: 'center', fontSize: 14 }}
                  >
                    {item.icon}
                  </Text>
                  <Text
                    size="sm"
                    fw={active ? 700 : 400}
                    style={{
                      color: active
                        ? 'rgba(56,190,201,0.95)'
                        : 'rgba(255,255,255,0.55)',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {item.label}
                  </Text>
                </Group>
              </UnstyledButton>
            )
          })}
        </Stack>
      ))}
    </Stack>
  )
}
