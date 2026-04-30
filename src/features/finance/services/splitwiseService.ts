import { supabase } from '../../../lib/supabase'
import { SplitwiseEntry } from '../types/finance.types'

const TABLE = 'splitwise_entries'

export async function fetchSplitwise(): Promise<SplitwiseEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('logged_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertSplitwise(
  entry: Omit<SplitwiseEntry, 'id' | 'created_at'>,
): Promise<SplitwiseEntry> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(entry)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSplitwise(
  id: string,
  updates: Partial<SplitwiseEntry>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSplitwise(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
