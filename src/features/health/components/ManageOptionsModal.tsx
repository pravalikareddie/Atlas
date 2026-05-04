import { Group, Modal, Stack, Text, TextInput, Button, UnstyledButton } from '@mantine/core'
import { Trash } from '@phosphor-icons/react'
import { ThaliCategory, THALI_STRINGS as S } from '../constants/thali'

interface Props {
  opened: boolean
  onClose: () => void
  cat: ThaliCategory | null | undefined
  customItems: string[]
  newOption: string
  setNewOption: (v: string) => void
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}

export function ManageOptionsModal({ opened, onClose, cat, customItems, newOption, setNewOption, onAdd, onRemove }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} radius="xl" size="md"
      title={<Group gap="sm"><Text size="xl">{cat?.emoji}</Text><Text fw={700}>{S.MANAGE} {cat?.label}</Text></Group>}>
      <Stack gap="sm">
        {customItems.map((opt) => (
          <Group key={opt} justify="space-between">
            <Text size="sm">{opt}</Text>
            <UnstyledButton onClick={() => onRemove(opt)}>
              <Trash size={14} color="var(--mantine-color-red-5)" />
            </UnstyledButton>
          </Group>
        ))}
        <Group gap="xs">
          <TextInput value={newOption} onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newOption.trim()) { onAdd(newOption.trim()); setNewOption('') } }}
            placeholder={S.ADD_OPTION_PH} radius="lg" style={{ flex: 1 }} />
          <Button radius="xl" color="teal" onClick={() => { if (newOption.trim()) { onAdd(newOption.trim()); setNewOption('') } }}>{S.ADD}</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
