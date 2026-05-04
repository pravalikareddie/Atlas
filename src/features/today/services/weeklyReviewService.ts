import { supabase } from '../../../lib/supabase'
import { USER_ID } from '../../tasks/constants/taskConstants'

export interface WeeklyReview {
  id: string
  user_id: string
  week_id: string
  week_word: string | null
  ai_summary: string | null
  focus_area: string | null
  intention_text: string | null
  domain_highlights: { domain: string; text: string }[]
  going_into_next_week: { domain: string; text: string }[]
  completed_at: string | null
  created_at: string
}

export async function fetchWeeklyReviews(): Promise<WeeklyReview[]> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', USER_ID)
    .order('week_id', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchWeeklyReview(weekId: string): Promise<WeeklyReview | null> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('week_id', weekId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertWeeklyReview(weekId: string, updates: Partial<WeeklyReview>): Promise<WeeklyReview> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert({ user_id: USER_ID, week_id: weekId, ...updates }, { onConflict: 'user_id,week_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function saveDomainCardOrder(order: string[]): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: USER_ID, domain_card_order: order, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function fetchDomainCardOrder(): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('domain_card_order')
    .eq('user_id', USER_ID)
    .maybeSingle()
  if (error) throw error
  return data?.domain_card_order ?? null
}
