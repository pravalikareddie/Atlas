import { supabase } from '../../../lib/supabase'
import { Expense } from '../types/finance.types'

const TABLE = 'expenses'

export async function fetchExpenses(month: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('month', month)
    .order('logged_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertExpense(
  expense: Omit<Expense, 'id' | 'created_at'>,
): Promise<Expense> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(expense)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
