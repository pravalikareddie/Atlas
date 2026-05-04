import { Group, Text, UnstyledButton } from '@mantine/core'
import { CaretDown, CaretUp } from '@phosphor-icons/react'

export function CollapseToggle({ label, count, open, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <UnstyledButton onClick={onToggle} mt="sm">
      <Group gap="xs">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase">{label} ({count})</Text>
        {open ? <CaretUp size={12} /> : <CaretDown size={12} />}
      </Group>
    </UnstyledButton>
  )
}
