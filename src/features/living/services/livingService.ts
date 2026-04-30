import { supabase } from '../../../lib/supabase'
import {
  Place,
  PlaceExperience,
  Experience,
  Activity,
  LivingTodo,
} from '../types/living.types'

export async function fetchPlaces(status?: string): Promise<Place[]> {
  let q = supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertPlace(
  p: Omit<Place, 'id' | 'created_at'>,
): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updatePlace(
  id: string,
  u: Partial<Place>,
): Promise<void> {
  const { error } = await supabase.from('places').update(u).eq('id', id)
  if (error) throw error
}
export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPlaceExperiences(
  placeId: string,
): Promise<PlaceExperience[]> {
  const { data, error } = await supabase
    .from('place_experiences')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}
export async function fetchAllPlaceExperiences(): Promise<PlaceExperience[]> {
  const { data, error } = await supabase
    .from('place_experiences')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}
export async function insertPlaceExperience(
  pe: Omit<PlaceExperience, 'id' | 'created_at'>,
): Promise<PlaceExperience> {
  const { data, error } = await supabase
    .from('place_experiences')
    .insert(pe)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updatePlaceExperience(
  id: string,
  u: Partial<PlaceExperience>,
): Promise<void> {
  const { error } = await supabase
    .from('place_experiences')
    .update(u)
    .eq('id', id)
  if (error) throw error
}

export async function fetchExperiences(status?: string): Promise<Experience[]> {
  let q = supabase
    .from('experiences')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertExperience(
  e: Omit<Experience, 'id' | 'created_at'>,
): Promise<Experience> {
  const { data, error } = await supabase
    .from('experiences')
    .insert(e)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateExperience(
  id: string,
  u: Partial<Experience>,
): Promise<void> {
  const { error } = await supabase.from('experiences').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteExperience(id: string): Promise<void> {
  const { error } = await supabase.from('experiences').delete().eq('id', id)
  if (error) throw error
}

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
export async function insertActivity(
  a: Omit<Activity, 'id' | 'created_at'>,
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(a)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}

export async function fetchLivingTodos(): Promise<LivingTodo[]> {
  const { data, error } = await supabase
    .from('living_todos')
    .select('*')
    .eq('status', 'todo')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
export async function insertLivingTodo(
  t: Omit<LivingTodo, 'id' | 'created_at'>,
): Promise<LivingTodo> {
  const { data, error } = await supabase
    .from('living_todos')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateLivingTodo(
  id: string,
  u: Partial<LivingTodo>,
): Promise<void> {
  const { error } = await supabase.from('living_todos').update(u).eq('id', id)
  if (error) throw error
}
