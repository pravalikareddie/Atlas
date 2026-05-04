import { supabase } from '../../../lib/supabase'
import { USER_ID } from '../../tasks/constants/taskConstants'

// ─── Week Plan ────────────────────────────────────────────────────────────────

export interface WeekPlanRow {
  user_id: string
  week_id: string
  meal_type: string
  day_index: number
  category_id: string
  item: string
}

export async function fetchWeekPlan(weekId: string): Promise<WeekPlanRow[]> {
  const { data, error } = await supabase
    .from('thali_week_plan')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('week_id', weekId)
  if (error) throw error
  return data ?? []
}

export async function upsertPlanItem(row: WeekPlanRow) {
  const { error } = await supabase
    .from('thali_week_plan')
    .upsert(row, { onConflict: 'user_id,week_id,meal_type,day_index,category_id' })
  if (error) throw error
}

export async function deletePlanItem(weekId: string, meal: string, day: number, catId: string) {
  const { error } = await supabase
    .from('thali_week_plan')
    .delete()
    .eq('user_id', USER_ID)
    .eq('week_id', weekId)
    .eq('meal_type', meal)
    .eq('day_index', day)
    .eq('category_id', catId)
  if (error) throw error
}

export async function copyWeekPlan(fromWeekId: string, toWeekId: string, meal: string) {
  const { data } = await supabase
    .from('thali_week_plan')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('week_id', fromWeekId)
    .eq('meal_type', meal)
  if (!data?.length) return []
  const rows = data.map(({ id, ...r }) => ({ ...r, week_id: toWeekId }))
  await supabase
    .from('thali_week_plan')
    .upsert(rows, { onConflict: 'user_id,week_id,meal_type,day_index,category_id' })
  return rows
}

// ─── Custom Options ───────────────────────────────────────────────────────────

export interface CustomOptionRow {
  user_id: string
  meal_type: string
  category_id: string
  option_name: string
}

export async function fetchCustomOptions(): Promise<CustomOptionRow[]> {
  const { data, error } = await supabase
    .from('thali_custom_options')
    .select('*')
    .eq('user_id', USER_ID)
  if (error) throw error
  return data ?? []
}

export async function insertCustomOption(meal: string, catId: string, name: string) {
  const { error } = await supabase
    .from('thali_custom_options')
    .insert({ user_id: USER_ID, meal_type: meal, category_id: catId, option_name: name })
  if (error) throw error
}

export async function deleteCustomOption(meal: string, catId: string, name: string) {
  const { error } = await supabase
    .from('thali_custom_options')
    .delete()
    .eq('user_id', USER_ID)
    .eq('meal_type', meal)
    .eq('category_id', catId)
    .eq('option_name', name)
  if (error) throw error
}

// ─── Eaten Log ────────────────────────────────────────────────────────────────

export async function fetchEatenLog(date: string) {
  const { data } = await supabase
    .from('thali_log')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', date)
  return data ?? []
}

export async function upsertEaten(date: string, meal: string, catId: string, eaten: boolean) {
  await supabase.from('thali_log').upsert(
    { user_id: USER_ID, date, meal_type: meal, slot_id: catId, eaten },
    { onConflict: 'user_id,date,meal_type,slot_id' },
  )
}

export async function fetchExtrasLog(date: string) {
  const { data } = await supabase
    .from('thali_extras_log')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', date)
  return data ?? []
}

export async function upsertExtra(date: string, extraId: string, item: string, done: boolean) {
  await supabase.from('thali_extras_log').upsert(
    { user_id: USER_ID, date, extra_id: extraId, item, done },
    { onConflict: 'user_id,date,extra_id,item' },
  )
}
