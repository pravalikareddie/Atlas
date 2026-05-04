import { useState } from 'react'
import { Box, Group, Stack, Text, Paper, Button, UnstyledButton, ScrollArea, TextInput } from '@mantine/core'
import { MealType, DAYS, THALI_STRINGS as S, getCategoriesForMeal } from '../constants/thali'
import { useWeekPlan, planKey, customKey } from '../hooks/useWeekPlan'
import { getTodayDayIndex } from '../utils/thaliUtils'
import { MealTabs } from './MealTabs'
import { OptionPickerModal } from './OptionPickerModal'
import { ManageOptionsModal } from './ManageOptionsModal'
import { DailyExtras } from './DailyExtras'
import { insertShoppingItem } from '../services/shoppingService'
import { useHealthStore } from '../store/healthStore'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { Plus } from '@phosphor-icons/react'

export function WeekPlanView() {
  const [meal, setMeal] = useState<MealType>('lunch')
  const wp = useWeekPlan()
  const [picker, setPicker] = useState<{ meal: MealType; day: number; catId: string } | null>(null)
  const [manageCat, setManageCat] = useState<{ meal: MealType; catId: string } | null>(null)
  const [newOption, setNewOption] = useState('')
  const cats = getCategoriesForMeal(meal)
  const todayIdx = getTodayDayIndex()
  const pickerCat = picker ? cats.find((c) => c.id === picker.catId) : null
  const manageCategory = manageCat ? cats.find((c) => c.id === manageCat.catId) : null

  return (
    <Stack gap="md">
      <MealTabs meal={meal} onChange={setMeal} />

      <Group justify="space-between">
        <Text size="lg" fw={800}>{S.WEEK_PLAN}</Text>
        <Button variant="light" color="teal" radius="xl" size="xs" onClick={() => wp.copyLastWeek(meal)}>
          {S.COPY_LAST_WEEK}
        </Button>
      </Group>

      <ScrollArea>
        <Box style={{ minWidth: 600 }}>
          <Group gap={0} mb="xs" wrap="nowrap">
            <Box w={80} />
            {DAYS.map((day, i) => (
              <Box key={day} style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xs" fw={i === todayIdx ? 800 : 600} c={i === todayIdx ? 'teal' : 'dimmed'}>{day}</Text>
              </Box>
            ))}
          </Group>

          {cats.map((cat) => (
            <Group key={cat.id} gap={0} mb="xs" wrap="nowrap" align="stretch">
              <Group w={80} gap={4} pr="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text size="xs" fw={700} c="dimmed" truncate>{cat.label}</Text>
              </Group>
              {DAYS.map((_, dayIdx) => {
                const item = wp.plan[planKey(meal, dayIdx, cat.id)]
                const isToday = dayIdx === todayIdx
                return (
                  <Box key={dayIdx} style={{ flex: 1, padding: 2 }}>
                    <UnstyledButton onClick={() => setPicker({ meal, day: dayIdx, catId: cat.id })} style={{ width: '100%' }}>
                      <Paper p="xs" radius="md" style={{
                        minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: item ? (isToday ? 'var(--mantine-color-teal-light)' : 'var(--mantine-color-dark-6)') : 'var(--mantine-color-dark-7)',
                        border: isToday ? '1px solid var(--mantine-color-teal-5)' : '1px solid var(--mantine-color-dark-4)',
                        cursor: 'pointer',
                      }}>
                        <Text size="xs" ta="center" truncate fw={item ? 600 : 400} c={item ? 'white' : 'dimmed'}>{item || '+'}</Text>
                      </Paper>
                    </UnstyledButton>
                  </Box>
                )
              })}
            </Group>
          ))}
        </Box>
      </ScrollArea>

      <OptionPickerModal
        opened={!!pickerCat}
        onClose={() => setPicker(null)}
        cat={pickerCat}
        dayLabel={picker ? DAYS[picker.day] : ''}
        options={picker ? wp.getOptions(picker.meal, picker.catId) : []}
        selected={picker ? wp.plan[planKey(picker.meal, picker.day, picker.catId)] : undefined}
        onPick={(opt) => { if (picker) { wp.setPlanItem(picker.meal, picker.day, picker.catId, opt); setPicker(null) } }}
        onClear={() => { if (picker) { wp.setPlanItem(picker.meal, picker.day, picker.catId, null); setPicker(null) } }}
        onManage={() => { if (picker) { setManageCat({ meal: picker.meal, catId: picker.catId }); setPicker(null) } }}
      />

      <ManageOptionsModal
        opened={!!manageCategory}
        onClose={() => { setManageCat(null); setNewOption('') }}
        cat={manageCategory}
        customItems={manageCat ? (wp.customOptions[customKey(manageCat.meal, manageCat.catId)] ?? []) : []}
        newOption={newOption}
        setNewOption={setNewOption}
        onAdd={(name) => { if (manageCat) wp.addCustomOption(manageCat.meal, manageCat.catId, name) }}
        onRemove={(name) => { if (manageCat) wp.removeCustomOption(manageCat.meal, manageCat.catId, name) }}
      />

      <QuickAddShopping />
      <DailyExtras />
    </Stack>
  )
}

function QuickAddShopping() {
  const [text, setText] = useState('')
  const [added, setAdded] = useState(false)
  const { addShoppingItem } = useHealthStore()

  async function add() {
    if (!text.trim()) return
    const row = { user_id: USER_ID, name: text.trim(), status: 'todo' as const }
    try {
      const item = await insertShoppingItem(row)
      addShoppingItem(item)
    } catch {
      addShoppingItem({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    }
    setText('')
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Paper p="md" radius="lg" withBorder>
      <Text size="xs" fw={700} c="dimmed" mb="sm">🛒 Add to Shopping List</Text>
      <Group gap="xs">
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Eggs, milk, chicken..."
          radius="lg"
          size="xs"
          style={{ flex: 1 }}
        />
        <Button size="xs" radius="xl" color="teal" onClick={add} leftSection={<Plus size={12} />}>
          {added ? '✓ Added' : 'Add'}
        </Button>
      </Group>
    </Paper>
  )
}
