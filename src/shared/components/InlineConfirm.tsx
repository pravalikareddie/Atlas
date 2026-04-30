import { Group, Text, ActionIcon } from '@mantine/core'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function InlineConfirm({ message, onConfirm, onCancel }: Props) {
  return (
    <Group gap="xs">
      <Text>{message}</Text>
      <ActionIcon color="red" variant="light" onClick={onConfirm}>
        ✓
      </ActionIcon>
      <ActionIcon color="gray" variant="light" onClick={onCancel}>
        ✕
      </ActionIcon>
    </Group>
  )
}
