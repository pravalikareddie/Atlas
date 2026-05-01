import { supabase } from '../../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LifeScore {
  id: string
  user_id: string
  date: string // yyyy-MM-dd
  overall: number // 0-100
  work: number
  finance: number
  health: number
  growth: number
  goals: number
  living: number
  created_at: string
}

// ─── Service ──────────────────────────────────────────────────────────────────

const TABLE = 'life_scores'

export async function fetchLifeScores(
  userId: string,
  days = 30,
): Promise<LifeScore[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertLifeScore(
  score: Omit<LifeScore, 'id' | 'created_at'>,
): Promise<LifeScore> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(score, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
