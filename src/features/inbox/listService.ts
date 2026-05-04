import { supabase } from '../../lib/supabase'
import { USER_ID } from '../tasks/constants/taskConstants'
import { CustomList, CustomListItem } from './types'

export async function fetchLists(): Promise<CustomList[]> {
  const { data, error } = await supabase
    .from('custom_lists')
    .select('*')
    .eq('user_id', USER_ID)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertList(list: Omit<CustomList, 'id' | 'created_at'>): Promise<CustomList> {
  const { data, error } = await supabase.from('custom_lists').insert(list).select().single()
  if (error) throw error
  return data
}

export async function updateList(id: string, u: Partial<CustomList>): Promise<void> {
  const { error } = await supabase.from('custom_lists').update(u).eq('id', id)
  if (error) throw error
}

export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from('custom_lists').delete().eq('id', id)
  if (error) throw error
}

export async function fetchListItems(listId: string): Promise<CustomListItem[]> {
  const { data, error } = await supabase
    .from('custom_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertListItem(item: Omit<CustomListItem, 'id' | 'created_at'>): Promise<CustomListItem> {
  const { data, error } = await supabase.from('custom_list_items').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updateListItem(id: string, u: Partial<CustomListItem>): Promise<void> {
  const { error } = await supabase.from('custom_list_items').update(u).eq('id', id)
  if (error) throw error
}

export async function deleteListItem(id: string): Promise<void> {
  const { error } = await supabase.from('custom_list_items').delete().eq('id', id)
  if (error) throw error
}
