import { supabase } from '../../../lib/supabase'
import { Task } from '../types/task.types'

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}

export async function insertTask(
  t: Omit<Task, 'id' | 'created_at'>,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, u: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(u).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpdateTasks(
  ids: string[],
  u: Partial<Task>,
): Promise<void> {
  const { error } = await supabase.from('tasks').update(u).in('id', ids)
  if (error) throw error
}

export async function bulkDeleteTasks(ids: string[]): Promise<void> {
  const { error } = await supabase.from('tasks').delete().in('id', ids)
  if (error) throw error
}
