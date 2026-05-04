import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { MealType, getCategoriesForMeal } from '../constants/thali'
import { getWeekId, planKey, customKey } from '../utils/thaliUtils'
import * as svc from '../services/thaliService'

export { planKey, customKey }

export function useWeekPlan() {
  const [plan, setPlan] = useState<Record<string, string>>({})
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({})
  const weekId = getWeekId()

  useEffect(() => {
    svc.fetchWeekPlan(weekId).then((rows) => {
      const p: Record<string, string> = {}
      rows.forEach((r) => { p[planKey(r.meal_type, r.day_index, r.category_id)] = r.item })
      setPlan(p)
    }).catch(() => {})

    svc.fetchCustomOptions().then((rows) => {
      const m: Record<string, string[]> = {}
      rows.forEach((r) => {
        const k = customKey(r.meal_type, r.category_id)
        if (!m[k]) m[k] = []
        m[k].push(r.option_name)
      })
      setCustomOptions(m)
    }).catch(() => {})
  }, [weekId])

  async function setPlanItem(meal: MealType, day: number, catId: string, item: string | null) {
    const key = planKey(meal, day, catId)
    if (item) {
      setPlan((p) => ({ ...p, [key]: item }))
      try { await svc.upsertPlanItem({ user_id: USER_ID, week_id: weekId, meal_type: meal, day_index: day, category_id: catId, item }) } catch {}
    } else {
      setPlan((p) => { const n = { ...p }; delete n[key]; return n })
      try { await svc.deletePlanItem(weekId, meal, day, catId) } catch {}
    }
  }

  async function copyLastWeek(meal: MealType) {
    const lastWeekId = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -7), 'yyyy-MM-dd')
    try {
      const rows = await svc.copyWeekPlan(lastWeekId, weekId, meal)
      const p = { ...plan }
      rows.forEach((r) => { p[planKey(r.meal_type, r.day_index, r.category_id)] = r.item })
      setPlan(p)
    } catch {}
  }

  function getOptions(meal: MealType, catId: string): string[] {
    const cat = getCategoriesForMeal(meal).find((c) => c.id === catId)
    return [...(cat?.defaults ?? []), ...(customOptions[customKey(meal, catId)] ?? [])]
  }

  async function addCustomOption(meal: MealType, catId: string, name: string) {
    const k = customKey(meal, catId)
    setCustomOptions((prev) => ({ ...prev, [k]: [...(prev[k] ?? []), name] }))
    try { await svc.insertCustomOption(meal, catId, name) } catch {}
  }

  async function removeCustomOption(meal: MealType, catId: string, name: string) {
    const k = customKey(meal, catId)
    setCustomOptions((prev) => ({ ...prev, [k]: (prev[k] ?? []).filter((o) => o !== name) }))
    try { await svc.deleteCustomOption(meal, catId, name) } catch {}
  }

  return { plan, setPlanItem, copyLastWeek, getOptions, addCustomOption, removeCustomOption, customOptions }
}
