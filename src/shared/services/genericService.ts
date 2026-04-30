import { supabase } from '../../lib/supabase'
import {
  Task,
  Roadmap,
  RoadmapSection,
  RoadmapItem,
} from '../types/generic.types'

// ── Tasks ──
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function insertTask(
  t: Omit<Task, 'id' | 'created_at'>,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateTask(id: string, u: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Roadmaps ──
export async function fetchRoadmaps(): Promise<Roadmap[]> {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}
export async function insertRoadmap(
  r: Omit<Roadmap, 'id' | 'created_at'>,
): Promise<Roadmap> {
  const { data, error } = await supabase
    .from('roadmaps')
    .insert(r)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateRoadmap(
  id: string,
  u: Partial<Roadmap>,
): Promise<void> {
  const { error } = await supabase.from('roadmaps').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteRoadmap(id: string): Promise<void> {
  const { error } = await supabase.from('roadmaps').delete().eq('id', id)
  if (error) throw error
}

// ── Roadmap Sections ──
export async function fetchRoadmapSections(
  roadmapId?: string,
): Promise<RoadmapSection[]> {
  let q = supabase.from('roadmap_sections').select('*').order('order_index')
  if (roadmapId) q = q.eq('roadmap_id', roadmapId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertRoadmapSection(
  s: Omit<RoadmapSection, 'id' | 'created_at'>,
): Promise<RoadmapSection> {
  const { data, error } = await supabase
    .from('roadmap_sections')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateRoadmapSection(
  id: string,
  u: Partial<RoadmapSection>,
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .update(u)
    .eq('id', id)
  if (error) throw error
}
export async function deleteRoadmapSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Roadmap Items ──
export async function fetchRoadmapItems(
  roadmapId?: string,
): Promise<RoadmapItem[]> {
  let q = supabase.from('roadmap_items').select('*').order('order_index')
  if (roadmapId) q = q.eq('roadmap_id', roadmapId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertRoadmapItem(
  i: Omit<RoadmapItem, 'id' | 'created_at'>,
): Promise<RoadmapItem> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .insert(i)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateRoadmapItem(
  id: string,
  u: Partial<RoadmapItem>,
): Promise<void> {
  const { error } = await supabase.from('roadmap_items').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteRoadmapItem(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', id)
  if (error) throw error
}
