import { supabase } from '../../../lib/supabase'
import { ExpenseGroup, GroupExpense } from '../types/finance.types'

export async function fetchExpenseGroups(): Promise<ExpenseGroup[]> {
  const { data, error } = await supabase
    .from('expense_groups')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertExpenseGroup(
  g: Omit<ExpenseGroup, 'id' | 'created_at'>,
): Promise<ExpenseGroup> {
  const { data, error } = await supabase
    .from('expense_groups')
    .insert(g)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpenseGroup(
  id: string,
  u: Partial<Omit<ExpenseGroup, 'id' | 'user_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase.from('expense_groups').update(u).eq('id', id)
  if (error) throw error
}

export async function deleteExpenseGroup(id: string): Promise<void> {
  const { error } = await supabase.from('expense_groups').delete().eq('id', id)
  if (error) throw error
}

export async function fetchGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertGroupExpense(
  e: Omit<GroupExpense, 'id' | 'created_at'>,
): Promise<GroupExpense> {
  const { data, error } = await supabase
    .from('group_expenses')
    .insert(e)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGroupExpense(
  id: string,
  u: Partial<Omit<GroupExpense, 'id' | 'user_id' | 'group_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase.from('group_expenses').update(u).eq('id', id)
  if (error) throw error
}

export async function deleteGroupExpense(id: string): Promise<void> {
  const { error } = await supabase.from('group_expenses').delete().eq('id', id)
  if (error) throw error
}
