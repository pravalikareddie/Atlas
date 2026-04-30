import { supabase } from '../../../lib/supabase'
import { HealthTodo } from '../types/health.types'

const T = 'health_todos'

export async function fetchHealthTodos(): Promise<HealthTodo[]> {
  const { data, error } = await supabase
    .from(T)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertHealthTodo(
  t: Omit<HealthTodo, 'id' | 'created_at'>,
): Promise<HealthTodo> {
  const { data, error } = await supabase.from(T).insert(t).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateHealthTodo(
  id: string,
  updates: Partial<HealthTodo>,
): Promise<void> {
  const { error } = await supabase.from(T).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteHealthTodo(id: string): Promise<void> {
  const { error } = await supabase.from(T).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
