export type GoalArea =
  | 'work'
  | 'finance'
  | 'fitness'
  | 'self_growth'
  | 'confidence'
  | 'misc'
export type GoalStatus = 'active' | 'done' | 'dropped'
export type TaskType =
  | 'sprint'
  | 'followup'
  | 'meeting_prep'
  | 'misc_work'
  | 'personal'
  | 'errand'
  | 'finance'
  | 'health'
  | 'living'
  | 'growth'
  | 'goal_task'
export type TaskStatus = 'todo' | 'done' | 'skipped'
export type ProjectStatus = 'active' | 'done' | 'paused' | 'dropped'
export type RoadmapItemStatus = 'todo' | 'current' | 'done' | 'skipped'

export interface Goal {
  id: string
  user_id: string
  title: string
  area: GoalArea
  affirmation: string | null
  deadline: string | null
  status: GoalStatus
  ai_evaluation: string | null
  created_at: string
}

export interface Milestone {
  id: string
  user_id: string
  goal_id: string
  title: string
  due_date: string | null
  status: 'todo' | 'done'
  order_index: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  type: TaskType
  priority: 'high' | 'medium' | 'low' | null
  is_must: boolean
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  goal_id: string | null
  milestone_id: string | null
  project_id: string | null
  roadmap_item_id: string | null
  parent_task_id: string | null
  order_index: number
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  status: ProjectStatus
  deadline: string | null
  goal_id: string | null
  milestone_id: string | null
  roadmap_id: string | null
  roadmap_item_id: string | null
  created_at: string
}

export interface PlanRoadmap {
  id: string
  user_id: string
  title: string
  description: string | null
  goal_id: string | null
  project_id: string | null
  created_at: string
}

export interface PlanRoadmapSection {
  id: string
  user_id: string
  roadmap_id: string
  title: string
  order_index: number
  created_at: string
}

export interface PlanRoadmapItem {
  id: string
  user_id: string
  roadmap_id: string
  section_id: string | null
  title: string
  status: RoadmapItemStatus
  done_date: string | null
  order_index: number
  created_at: string
}

export interface UserSettings {
  user_id: string
  daily_mantra: string | null
  updated_at: string
  weekly_focus: string
  weekly_focus_set_at: string
}

export const GOAL_AREAS: { key: GoalArea; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'finance', label: 'Finance' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'self_growth', label: 'Self growth' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'misc', label: 'Misc' },
]

export const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'followup', label: 'Follow-up' },
  { key: 'meeting_prep', label: 'Meeting prep' },
  { key: 'misc_work', label: 'Misc work' },
  { key: 'errand', label: 'Errand' },
  { key: 'finance', label: 'Finance' },
  { key: 'health', label: 'Health' },
  { key: 'living', label: 'Living' },
  { key: 'growth', label: 'Growth' },
  { key: 'goal_task', label: 'Goal task' },
]

export const AREA_COLORS: Record<GoalArea, string> = {
  work: '#4F9CF9',
  finance: '#7C6FE0',
  fitness: '#34C78A',
  self_growth: '#38BEC9',
  confidence: '#F0A429',
  misc: '#7A7888',
}
