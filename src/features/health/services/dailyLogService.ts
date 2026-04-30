import { supabase } from '../../../lib/supabase'
import { DailyLog } from '../types/health.types'

export async function fetchDailyLogs(days: number): Promise<DailyLog[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertDailyLog(
  log: Partial<DailyLog> & { date: string; user_id: string },
): Promise<DailyLog> {
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(log, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
