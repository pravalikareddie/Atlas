export type Priority = 'high' | 'medium' | 'low'
export type AreaType = 'finance' | 'health' | 'living' | 'growth' | 'general'

export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  due_date: string | null
  priority: Priority
  area: AreaType
  status: 'todo' | 'done'
  parent_id: string | null // null = top-level, string = subtask
  order_index: number
  completed_at: string | null
  created_at: string
}

export type CadenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom'

export interface Roadmap {
  id: string
  user_id: string
  name: string
  description: string | null
  emoji: string
  area: AreaType
  created_at: string
}

export interface RoadmapSection {
  id: string
  roadmap_id: string
  title: string
  order_index: number
  cadence: CadenceType | null
  cadence_custom: string | null // e.g. "every 2 weeks"
  created_at: string
}

export interface RoadmapItem {
  id: string
  section_id: string
  roadmap_id: string
  title: string
  status: 'todo' | 'current' | 'done' | 'skipped'
  due_date: string | null
  notes: string | null
  order_index: number
  done_date: string | null
  created_at: string
}
