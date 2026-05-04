import { Text, Stack, Paper } from '@mantine/core'

interface Props {
  message: string
  sub?: string
  icon?: string
  children?: React.ReactNode
}

export function EmptyState({ message, sub, icon, children }: Props) {
  return (
    <Paper
      p="xl"
      radius="lg"
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
        border: '1px solid var(--mantine-color-dark-5)',
        textAlign: 'center',
      }}
    >
      <Stack align="center" gap="sm">
        {icon && (
          <Text size="2rem" lh={1}>
            {icon}
          </Text>
        )}
        <Text fw={600} size="md">
          {message}
        </Text>
        {sub && (
          <Text size="sm" c="dimmed" maw={320}>
            {sub}
          </Text>
        )}
        {children}
      </Stack>
    </Paper>
  )
}
