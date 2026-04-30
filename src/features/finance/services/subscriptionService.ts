import { supabase } from '../../../lib/supabase'
import { Subscription } from '../types/finance.types'

const TABLE = 'subscriptions'

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertSubscription(
  sub: Omit<Subscription, 'id' | 'created_at'>,
): Promise<Subscription> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(sub)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
