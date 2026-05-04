export interface Meeting {
  id: string
  user_id: string
  title: string
  cadence: MeetingCadence
  next_date: string | null
  event_time: string | null // HH:mm
  event_duration: number | null // minutes
  agenda: string | null
  notes: string | null
  last_done: string | null // YYYY-MM-DD
  order_index?: number
  created_at: string
}

export interface MeetingActionItem {
  id: string
  user_id: string
  meeting_id: string
  title: string
  done: boolean
  due_date: string | null
  order_index?: number
  created_at: string
}

export type MeetingCadence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export const MEETING_CADENCE_LABEL: Record<MeetingCadence, string> = {
  none: 'Ad hoc',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}

export const MEETING_CADENCE_OPTIONS: { value: MeetingCadence; label: string }[] = [
  { value: 'none', label: 'Ad hoc' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
]
