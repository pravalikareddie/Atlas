import { Group, Modal, Stack, Paper, Text, Badge, Button, UnstyledButton } from '@mantine/core'
import { Plus } from '@phosphor-icons/react'
import { ThaliCategory, THALI_STRINGS as S } from '../constants/thali'

interface Props {
  opened: boolean
  onClose: () => void
  cat: ThaliCategory | null | undefined
  dayLabel: string
  options: string[]
  selected?: string
  onPick: (opt: string) => void
  onClear: () => void
  onManage: () => void
}

export function OptionPickerModal({ opened, onClose, cat, dayLabel, options, selected, onPick, onClear, onManage }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} radius="xl" size="md"
      title={<Group gap="sm"><Text size="xl">{cat?.emoji}</Text><Text fw={700}>{cat?.label} — {dayLabel}</Text></Group>}>
      <Stack gap="sm">
        {options.map((opt) => (
          <UnstyledButton key={opt} onClick={() => onPick(opt)} style={{ width: '100%' }}>
            <Paper p="md" radius="lg" withBorder style={{
              background: selected === opt ? 'var(--mantine-color-teal-light)' : undefined,
              borderColor: selected === opt ? 'var(--mantine-color-teal-4)' : undefined,
            }}>
              <Group justify="space-between">
                <Text size="sm" fw={selected === opt ? 700 : 500}>{opt}</Text>
                {selected === opt && <Badge color="teal" size="sm">{S.SELECTED}</Badge>}
              </Group>
            </Paper>
          </UnstyledButton>
        ))}
        <Button variant="subtle" color="teal" radius="xl" size="sm" leftSection={<Plus size={14} />} onClick={onManage}>
          {S.ADD_CUSTOM}
        </Button>
        {selected && (
          <Button variant="subtle" color="red" radius="xl" size="sm" onClick={onClear}>{S.CLEAR}</Button>
        )}
      </Stack>
    </Modal>
  )
}
