import { supabase } from '../../../lib/supabase'
import {
  LearningArea,
  RoadmapSection,
  RoadmapItem,
  Book,
} from '../types/growth.types'

export async function fetchAreas(): Promise<LearningArea[]> {
  const { data, error } = await supabase
    .from('learning_areas')
    .select('*')
    .eq('status', 'active')
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function insertArea(
  a: Omit<LearningArea, 'id' | 'created_at'>,
): Promise<LearningArea> {
  const { data, error } = await supabase
    .from('learning_areas')
    .insert(a)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateArea(
  id: string,
  u: Partial<LearningArea>,
): Promise<void> {
  const { error } = await supabase.from('learning_areas').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteArea(id: string): Promise<void> {
  const { error } = await supabase.from('learning_areas').delete().eq('id', id)
  if (error) throw error
}

export async function fetchSections(areaId: string): Promise<RoadmapSection[]> {
  const { data, error } = await supabase
    .from('roadmap_sections')
    .select('*')
    .eq('area_id', areaId)
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function fetchAllSections(): Promise<RoadmapSection[]> {
  const { data, error } = await supabase
    .from('roadmap_sections')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function insertSection(
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
export async function updateSection(
  id: string,
  u: Partial<RoadmapSection>,
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .update(u)
    .eq('id', id)
  if (error) throw error
}
export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchItems(areaId: string): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('area_id', areaId)
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function fetchAllItems(): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function insertItem(
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
export async function updateItem(
  id: string,
  u: Partial<RoadmapItem>,
): Promise<void> {
  const { error } = await supabase.from('roadmap_items').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', id)
  if (error) throw error
}

export async function fetchBooks(year?: number): Promise<Book[]> {
  let q = supabase.from('books').select('*').order('order_index')
  if (year) q = q.eq('year', year)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertBook(
  b: Omit<Book, 'id' | 'created_at'>,
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert(b)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateBook(id: string, u: Partial<Book>): Promise<void> {
  const { error } = await supabase.from('books').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
