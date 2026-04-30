import { supabase } from '../../../lib/supabase'
import { Account, Expense } from '../types/finance.types'

const TABLE = 'accounts'

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertAccount(
  account: Omit<Account, 'id' | 'created_at'>,
): Promise<Account> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(account)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateAccount(
  id: string,
  updates: Partial<Account>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateExpenseDb(
  id: string,
  updates: Partial<Expense>,
): Promise<void> {
  const { error } = await supabase.from('expenses').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteExpenseDb(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
