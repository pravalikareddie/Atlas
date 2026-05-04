// ─── Routine Sections ─────────────────────────────────────────────────────────
import { supabase } from '../../../lib/supabase'

import { Routine, RoutineSection, RoutineSession, RoutineStep } from '../types/routine.types'

export async function getRoutineSections(
  userId: string,
): Promise<RoutineSection[]> {
  const { data, error } = await supabase
    .from('routine_sections')
    .select('*, routines!inner(user_id)')
    .eq('routines.user_id', userId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function insertRoutineSection(
  s: Omit<RoutineSection, 'created_at'>,
): Promise<RoutineSection> {
  const { data, error } = await supabase
    .from('routine_sections')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateRoutine(
  id: string,
  updates: Partial<Routine>,
): Promise<void> {
  const { error } = await supabase.from('routines').update(updates).eq('id', id)
  if (error) throw error
}

export async function updateRoutineSection(
  id: string,
  updates: Partial<RoutineSection>,
): Promise<void> {
  const { error } = await supabase
    .from('routine_sections')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteRoutineSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('routine_sections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Routine Steps ────────────────────────────────────────────────────────────

export async function getRoutineSteps(userId: string): Promise<RoutineStep[]> {
  const { data, error } = await supabase
    .from('routine_steps')
    .select('*, routines!inner(user_id)')
    .eq('routines.user_id', userId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function insertRoutineStep(
  s: Omit<RoutineStep, 'created_at'>,
): Promise<RoutineStep> {
  const { data, error } = await supabase
    .from('routine_steps')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoutineStep(
  id: string,
  updates: Partial<RoutineStep>,
): Promise<void> {
  const { error } = await supabase
    .from('routine_steps')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteRoutineStep(id: string): Promise<void> {
  const { error } = await supabase.from('routine_steps').delete().eq('id', id)
  if (error) throw error
}

// ─── Routine Sessions ─────────────────────────────────────────────────────────

export async function getRoutineSessions(
  userId: string,
): Promise<RoutineSession[]> {
  const { data, error } = await supabase
    .from('routine_sessions')
    .select('*, routines!inner(user_id)')
    .eq('routines.user_id', userId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertRoutineSession(
  s: Omit<RoutineSession, 'created_at'>,
): Promise<RoutineSession> {
  const { data, error } = await supabase
    .from('routine_sessions')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoutineSession(
  id: string,
  updates: Partial<RoutineSession>,
): Promise<void> {
  const { error } = await supabase
    .from('routine_sessions')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function getRoutines(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select()
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}
export async function insertRoutine(
  r: Omit<Routine, 'id' | 'created_at'>,
): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .insert(r)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', id)
  if (error) throw error
}
