import { Group, Paper, Text, UnstyledButton } from '@mantine/core'
import { MEALS, MealType } from '../constants/thali'

interface Props {
  meal: MealType
  onChange: (m: MealType) => void
}

export function MealTabs({ meal, onChange }: Props) {
  return (
    <Group justify="center" gap="xs">
      {MEALS.map((m) => (
        <UnstyledButton key={m.key} onClick={() => onChange(m.key)}>
          <Paper px="lg" py="sm" radius="xl" style={{
            background: meal === m.key
              ? 'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-green-5))'
              : 'var(--mantine-color-dark-6)',
          }}>
            <Text size="sm" fw={700} c="white">{m.emoji} {m.label}</Text>
          </Paper>
        </UnstyledButton>
      ))}
    </Group>
  )
}
