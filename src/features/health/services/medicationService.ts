import { supabase } from '../../../lib/supabase'
import { HealthMedication } from '../types/health.types'

const T = 'health_medications'

export async function fetchMedications(): Promise<HealthMedication[]> {
  const { data, error } = await supabase
    .from(T)
    .select('*')
    .eq('status', 'active')
    .order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertMedication(
  m: Omit<HealthMedication, 'id' | 'created_at'>,
): Promise<HealthMedication> {
  const { data, error } = await supabase.from(T).insert(m).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateMedication(
  id: string,
  updates: Partial<HealthMedication>,
): Promise<void> {
  const { error } = await supabase.from(T).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}
