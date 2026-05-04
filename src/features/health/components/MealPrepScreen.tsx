import {
  Stack, Group, Text, TextInput, Select, Modal, Button, Paper, Badge, ActionIcon,
} from '@mantine/core'
import { useState, useMemo } from 'react'
import { useHealthStore } from '../store/healthStore'
import * as svc from '../services/mealPlanService'
import { format, addDays, startOfWeek } from 'date-fns'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SectionLabel } from '../../../shared/components/SectionLabel'
import { STRINGS as S } from '../constants/strings'
import { MealPlan, MealType } from '../types/health.types'
import { USER_ID } from '../../tasks/constants/taskConstants'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_EMOJI: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export function MealPrepScreen() {
  const { mealPlans, addMealPlan, updateMealPlan, removeMealPlan, loading } = useHealthStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ recipe_name: '', meal_type: 'lunch' as MealType, date: '' })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))

  const planned = useMemo(() => {
    const map: Record<string, MealPlan[]> = {}
    weekDays.forEach((d) => { map[d] = [] })
    mealPlans.forEach((m) => {
      if (m.date && map[m.date]) map[m.date].push(m)
    })
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
    )
    return map
  }, [mealPlans, weekDays])

  const savedRecipes = useMemo(
    () => mealPlans.filter((m) => !m.date),
    [mealPlans],
  )

  const hasPlanned = mealPlans.some((m) => m.date && weekDays.includes(m.date))

  function openAdd(date?: string) {
    setEditId(null)
    setForm({ recipe_name: '', meal_type: 'lunch', date: date ?? '' })
    setShowForm(true)
  }

  function openEdit(m: MealPlan) {
    setEditId(m.id)
    setForm({ recipe_name: m.recipe_name, meal_type: m.meal_type, date: m.date ?? '' })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditId(null) }

  async function handleSave() {
    if (!form.recipe_name.trim()) return
    const data = { recipe_name: form.recipe_name, meal_type: form.meal_type, date: form.date || null }
    if (editId) {
      updateMealPlan(editId, data)
      try { await svc.updateMealPlan(editId, data) } catch {}
    } else {
      const row = { user_id: USER_ID, ...data }
      try { addMealPlan(await svc.insertMealPlan(row as Parameters<typeof svc.insertMealPlan>[0])) } catch {
        addMealPlan({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() } as MealPlan)
      }
    }
    closeForm()
  }


  async function handleDelete(id: string) {
    removeMealPlan(id)
    try { await svc.deleteMealPlan(id) } catch {}
  }

  if (loading) return <SkeletonRow count={6} />

  function MealRow({ m }: { m: MealPlan }) {
    return (
      <Group justify="space-between">
        <Group gap="md">
          <Text size="sm">{MEAL_EMOJI[m.meal_type]}</Text>
          <Text size="sm">{m.recipe_name}</Text>
          <Badge size="xs" variant="light">{m.meal_type}</Badge>
        </Group>
        <Group gap={4}>
          <ActionIcon variant="subtle" size="xs" onClick={() => openEdit(m)}>✎</ActionIcon>
          <ActionIcon variant="subtle" size="xs" color="red" onClick={() => handleDelete(m.id)}>✕</ActionIcon>
        </Group>
      </Group>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <SectionLabel>{S.MEAL_PREP}</SectionLabel>
        <Button variant="subtle" size="xs" onClick={() => openAdd()}>{S.ADD_MEAL}</Button>
      </Group>

      {/* Weekly calendar — only show days that have meals */}
      {hasPlanned ? (
        <Stack gap="md">
          {weekDays.filter((day) => (planned[day] ?? []).length > 0).map((day) => {
            const meals = planned[day]
            const dayLabel = format(new Date(day + 'T12:00'), 'EEE, MMM d')
            return (
              <Paper key={day} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={700}>{dayLabel}</Text>
                  <ActionIcon variant="subtle" size="xs" onClick={() => openAdd(day)}>+</ActionIcon>
                </Group>
                <Stack gap={4}>{meals.map((m) => <MealRow key={m.id} m={m} />)}</Stack>
              </Paper>
            )
          })}
        </Stack>
      ) : (
        !savedRecipes.length && <EmptyState icon="🍽️" message={S.EMPTY_MEALS} />
      )}

      {/* Saved recipes (unplanned) */}
      {savedRecipes.length > 0 && (
        <Stack gap="md">
          <SectionLabel>{S.SAVED_RECIPES}</SectionLabel>
          {savedRecipes.map((m) => (
            <Paper key={m.id} p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group gap="md">
                  <Text size="sm">{MEAL_EMOJI[m.meal_type]}</Text>
                  <Text size="sm">{m.recipe_name}</Text>
                  <Badge size="xs" variant="light">{m.meal_type}</Badge>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="xs" onClick={() => openEdit(m)}>{S.PLAN_IT}</ActionIcon>
                  <ActionIcon variant="subtle" size="xs" onClick={() => openEdit(m)}>✎</ActionIcon>
                  <ActionIcon variant="subtle" size="xs" color="red" onClick={() => handleDelete(m.id)}>✕</ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <Modal opened={showForm} onClose={closeForm} title={editId ? form.recipe_name : S.ADD_MEAL}>
        <Stack>
          <TextInput
            label={S.FIELD_RECIPE}
            value={form.recipe_name}
            onChange={(e) => setForm({ ...form, recipe_name: e.currentTarget.value })}
            placeholder={S.PH_RECIPE}
            data-autofocus
          />
          <Select
            label={S.FIELD_MEAL_TYPE}
            value={form.meal_type}
            onChange={(v) => setForm({ ...form, meal_type: (v ?? 'lunch') as MealType })}
            data={S.MEAL_TYPES}
          />
          <TextInput
            label={`${S.FIELD_DATE} (optional — leave empty to save for later)`}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeForm}>{S.CANCEL}</Button>
            <Button onClick={handleSave} disabled={!form.recipe_name.trim()}>{S.SAVE}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
