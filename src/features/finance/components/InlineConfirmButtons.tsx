import { Group, UnstyledButton } from '@mantine/core'

export function InlineConfirmButtons({
  onConfirm, onCancel, confirmLabel = 'Yes', cancelLabel = 'No', confirmColor = 'red',
}: {
  onConfirm: () => void; onCancel: () => void
  confirmLabel?: string; cancelLabel?: string; confirmColor?: string
}) {
  return (
    <Group gap={4}>
      <UnstyledButton onClick={onConfirm} px="xs" py={2} style={{
        borderRadius: 'var(--mantine-radius-xl)',
        background: `var(--mantine-color-${confirmColor}-light)`,
        color: `var(--mantine-color-${confirmColor}-filled)`,
        fontSize: 'var(--mantine-font-size-xs)', fontWeight: 700,
      }}>{confirmLabel}</UnstyledButton>
      <UnstyledButton onClick={onCancel} px="xs" py={2} style={{
        borderRadius: 'var(--mantine-radius-xl)',
        background: 'var(--mantine-color-gray-1)',
        color: 'var(--mantine-color-gray-7)',
        fontSize: 'var(--mantine-font-size-xs)', fontWeight: 700,
      }}>{cancelLabel}</UnstyledButton>
    </Group>
  )
}
