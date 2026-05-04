

// ─── Meetings ────────────────────────────────────────────────────────────────

import { supabase } from "../../../lib/supabase"
import { Meeting, MeetingActionItem } from "../types/meeting.types"

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertMeeting(
  m: Omit<Meeting, 'id' | 'created_at'>,
): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert(m)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeeting(
  id: string,
  updates: Partial<Omit<Meeting, 'id' | 'user_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase.from('meetings').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('meetings').delete().eq('id', id)
  if (error) throw error
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export async function fetchActionItems(meetingId: string): Promise<MeetingActionItem[]> {
  const { data, error } = await supabase
    .from('meeting_action_items')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data
}

export async function insertActionItem(
  item: Omit<MeetingActionItem, 'id' | 'created_at'>,
): Promise<MeetingActionItem> {
  const { data, error } = await supabase
    .from('meeting_action_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateActionItem(
  id: string,
  updates: Partial<Omit<MeetingActionItem, 'id' | 'user_id' | 'meeting_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase.from('meeting_action_items').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteActionItem(id: string): Promise<void> {
  const { error } = await supabase.from('meeting_action_items').delete().eq('id', id)
  if (error) throw error
}
