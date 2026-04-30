export type TaskType =
  | 'sprint'
  | 'followup'
  | 'meeting_prep'
  | 'misc'
  | 'personal'
  | 'finance'
  | 'health'
  | 'living'
  | 'growth'
  | 'goal_task'
  | 'event'

export type TaskStatus = 'todo' | 'done' | 'skipped'
export type TaskPriority = 'high' | 'medium' | 'low'
export type CadenceType =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom'
  | 'none'

export interface Task {
  id: string
  user_id: string
  is_learning: boolean
  title: string
  notes: string | null
  type: TaskType
  priority: TaskPriority | null
  is_must: boolean
  status: TaskStatus
  due_date: string | null
  do_today: boolean
  completed_at: string | null
  goal_id: string | null
  milestone_id: string | null
  project_id: string | null
  roadmap_item_id: string | null
  calendar_event_id: string | null
  parent_task_id: string | null
  ticket_id: string | null
  order_index: number
  event_time: string | null
  event_duration: number | null
  cadence: CadenceType | null
  cadence_days: number[] | null
  cadence_date: number | null
  cadence_interval: number | null
  push_count: number
  created_at: string
}
