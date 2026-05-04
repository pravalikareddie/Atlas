import { supabase } from "../../../lib/supabase"
import { BrainDumpItem, TriageTarget } from "../types/brainDump.types"


export async function fetchBrainDump(): Promise<BrainDumpItem[]> {
  const { data, error } = await supabase
    .from('brain_dump')
    .select('*')
    .order('order_index', { ascending: true })
  if (error) throw error
  return data
}

export async function insertBrainDumpItem(
  item: Omit<BrainDumpItem, 'id' | 'created_at'>,
): Promise<BrainDumpItem> {
  const { data, error } = await supabase
    .from('brain_dump')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function triageItem(
  id: string,
  triaged_to: TriageTarget,
): Promise<void> {
  const { error } = await supabase
    .from('brain_dump')
    .update({ triaged_to, triaged_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateBrainDumpItem(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('brain_dump')
    .update({ content })
    .eq('id', id)
  if (error) throw error
}

export async function deleteBrainDumpItem(id: string): Promise<void> {
  const { error } = await supabase.from('brain_dump').delete().eq('id', id)
  if (error) throw error
}

export async function updateBrainDumpFields(id: string, updates: Partial<BrainDumpItem>): Promise<void> {
  const { error } = await supabase.from('brain_dump').update(updates).eq('id', id)
  if (error) throw error
}
