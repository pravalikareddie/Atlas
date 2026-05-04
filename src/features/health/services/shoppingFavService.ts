import { supabase } from '../../../lib/supabase'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { ShoppingFavorite } from '../types/health.types'

export async function fetchFavorites(): Promise<ShoppingFavorite[]> {
  const { data, error } = await supabase
    .from('shopping_favorites')
    .select('*')
    .eq('user_id', USER_ID)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertFavorite(name: string): Promise<ShoppingFavorite> {
  const { data, error } = await supabase
    .from('shopping_favorites')
    .insert({ user_id: USER_ID, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_favorites').delete().eq('id', id)
  if (error) throw error
}

export async function updateFavorite(id: string, u: Partial<ShoppingFavorite>): Promise<void> {
  const { error } = await supabase.from('shopping_favorites').update(u).eq('id', id)
  if (error) throw error
}
