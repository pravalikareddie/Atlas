export interface LearningArea {
  id: string
  user_id: string
  name: string
  description: string | null
  emoji: string
  gradient_start: string
  gradient_end: string
  deadline: string | null
  status: 'active' | 'archived'
  order_index: number
  created_at: string
}
export interface RoadmapSection {
  id: string
  user_id: string
  area_id: string
  title: string
  order_index: number
  created_at: string
}
export interface RoadmapItem {
  id: string
  user_id: string
  section_id: string
  area_id: string
  title: string
  status: 'todo' | 'current' | 'done' | 'skipped'
  done_date: string | null
  order_index: number
  created_at: string
}
export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  status: 'want' | 'reading' | 'done'
  year: number
  order_index: number
  created_at: string
}
