import { Text, Stack } from '@mantine/core'

interface Props {
  message: string
  sub?: string
}

export function EmptyState({ message, sub }: Props) {
  return (
    <Stack align="center" py="xl" gap="xs">
      <Text>{message}</Text>
      {sub && <Text>{sub}</Text>}
    </Stack>
  )
}
