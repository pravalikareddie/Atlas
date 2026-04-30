import { NavLink, useLocation } from 'react-router-dom'
import { Stack, Text, UnstyledButton, Group } from '@mantine/core'
import { ColorSchemeToggle } from './ColorSchemeToggle'
import { NAV_SECTIONS } from './routes'

export function Sidebar() {
  const location = useLocation()

  return (
    <Stack gap={0} style={{ flex: 1, overflowY: 'auto' }}>
      {/* Logo + theme toggle */}
      <Group justify="space-between" align="center" mb="lg">
        <Text
          size="xl"
          fw={800}
          lts="-0.5px"
          variant="gradient"
          gradient={{ from: 'teal', to: 'blue', deg: 135 }}
        >
          Atlas
        </Text>
        <ColorSchemeToggle />
      </Group>

      {/* Nav sections */}
      {NAV_SECTIONS.map((section) => (
        <Stack key={section.label} gap={2} mb="sm">
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            px="xs"
            mt="sm"
            mb={4}
            lts="0.5px"
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
                  background: active
                    ? 'var(--mantine-color-teal-light)'
                    : 'transparent',
                  borderLeft: active
                    ? '3px solid var(--mantine-color-teal-5)'
                    : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Group gap={10}>
                  <Text style={{ width: 22, textAlign: 'center' }} size="sm">
                    {item.icon}
                  </Text>
                  <Text
                    size="sm"
                    fw={active ? 700 : 500}
                    c={active ? 'teal' : 'dimmed'}
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
