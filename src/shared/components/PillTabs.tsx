import { Group, Paper, Text, UnstyledButton } from '@mantine/core'

interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export function PillTabs({ tabs, active, onChange }: Props) {
  return (
    <Group gap="xs">
      {tabs.map((tab) => (
        <UnstyledButton key={tab.key} onClick={() => onChange(tab.key)}>
          <Paper px="md" py={6} radius="xl" style={{
            background: active === tab.key ? 'var(--mantine-color-teal-light)' : 'var(--mantine-color-dark-6)',
            border: active === tab.key ? '1px solid var(--mantine-color-teal-4)' : '1px solid transparent',
          }}>
            <Text size="sm" fw={active === tab.key ? 700 : 500} c={active === tab.key ? 'teal' : 'dimmed'}>
              {tab.label}
            </Text>
          </Paper>
        </UnstyledButton>
      ))}
    </Group>
  )
}
