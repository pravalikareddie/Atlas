import { useState } from 'react'
import { Group, Stack, Paper, Text, Badge, Button, TextInput, UnstyledButton } from '@mantine/core'
import { Plus, Trash } from '@phosphor-icons/react'
import { MealType, THALI_STRINGS as S, getCategoriesForMeal } from '../constants/thali'
import { useWeekPlan, customKey } from '../hooks/useWeekPlan'
import { MealTabs } from './MealTabs'

export function OptionsView() {
  const [meal, setMeal] = useState<MealType>('lunch')
  const wp = useWeekPlan()
  const [newOption, setNewOption] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const cats = getCategoriesForMeal(meal)

  return (
    <Stack gap="md">
      <MealTabs meal={meal} onChange={setMeal} />
      {cats.map((cat) => {
        const options = wp.getOptions(meal, cat.id)
        const custom = wp.customOptions[customKey(meal, cat.id)] ?? []
        return (
          <Paper key={cat.id} p="md" radius="lg" withBorder>
            <Group gap="xs" mb="sm">
              <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
              <Text size="sm" fw={700}>{cat.label}</Text>
              <Badge size="sm" variant="light" color="teal">{options.length}</Badge>
            </Group>
            <Group gap="xs" wrap="wrap">
              {options.map((opt) => (
                <Badge key={opt} size="lg" radius="lg" px="md" variant="light" color="gray"
                  rightSection={custom.includes(opt) ? (
                    <UnstyledButton onClick={() => wp.removeCustomOption(meal, cat.id, opt)} style={{ display: 'flex' }}>
                      <Trash size={10} color="var(--mantine-color-red-5)" />
                    </UnstyledButton>
                  ) : undefined}>
                  {opt}
                </Badge>
              ))}
            </Group>
            {addingTo === cat.id ? (
              <Group gap="xs" mt="sm">
                <TextInput value={newOption} onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newOption.trim()) { wp.addCustomOption(meal, cat.id, newOption.trim()); setNewOption(''); setAddingTo(null) }
                    if (e.key === 'Escape') { setAddingTo(null); setNewOption('') }
                  }}
                  placeholder={S.NEW_OPTION_PH} radius="lg" size="xs" style={{ flex: 1 }} autoFocus />
                <Button size="xs" radius="xl" color="teal"
                  onClick={() => { if (newOption.trim()) { wp.addCustomOption(meal, cat.id, newOption.trim()); setNewOption(''); setAddingTo(null) } }}>
                  {S.ADD}
                </Button>
              </Group>
            ) : (
              <Button variant="subtle" color="teal" size="xs" radius="xl" mt="sm"
                leftSection={<Plus size={12} />} onClick={() => { setAddingTo(cat.id); setNewOption('') }}>
                {S.ADD_OPTION}
              </Button>
            )}
          </Paper>
        )
      })}
    </Stack>
  )
}
