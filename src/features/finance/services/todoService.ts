import { supabase } from '../../../lib/supabase'
import { FinanceTodo } from '../types/finance.types'

const TABLE = 'finance_todos'

export async function fetchTodos(): Promise<FinanceTodo[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertTodo(
  todo: Omit<FinanceTodo, 'id' | 'created_at'>,
): Promise<FinanceTodo> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(todo)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTodo(
  id: string,
  updates: Partial<FinanceTodo>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
