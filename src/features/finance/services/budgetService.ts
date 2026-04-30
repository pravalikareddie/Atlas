import { supabase } from '../../../lib/supabase'
import { Budget } from '../types/finance.types'

const TABLE = 'budgets'

export async function fetchBudgets(month: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('month', month)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertBudget(
  budget: Omit<Budget, 'id' | 'created_at'>,
): Promise<Budget> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(budget, { onConflict: 'user_id,category,month' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateBudget(
  id: string,
  updates: Partial<Budget>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}
