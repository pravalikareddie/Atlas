import { supabase } from '../../../lib/supabase'
import { HealthAppointment } from '../types/health.types'

const T = 'health_appointments'

export async function fetchAppointments(): Promise<HealthAppointment[]> {
  const { data, error } = await supabase
    .from(T)
    .select('*')
    .eq('status', 'active')
    .order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertAppointment(
  a: Omit<HealthAppointment, 'id' | 'created_at'>,
): Promise<HealthAppointment> {
  const { data, error } = await supabase.from(T).insert(a).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateAppointment(
  id: string,
  updates: Partial<HealthAppointment>,
): Promise<void> {
  const { error } = await supabase.from(T).update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}
