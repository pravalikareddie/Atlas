import { supabase } from '../../../lib/supabase'
import { Refund } from '../types/finance.types'

const TABLE = 'refunds'

export async function fetchRefunds(): Promise<Refund[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertRefund(
  refund: Omit<Refund, 'id' | 'created_at'>,
): Promise<Refund> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(refund)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateRefund(
  id: string,
  updates: Partial<Refund>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRefund(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
