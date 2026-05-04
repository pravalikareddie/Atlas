export interface BrainDumpItem {
  id: string
  user_id: string
  content: string
  triaged_to: TriageTarget | null
  triaged_at: string | null
  snoozed_until: string | null
  order_index?: number
  created_at: string
}

export type TriageTarget = 'task' | 'done' | 'list'
