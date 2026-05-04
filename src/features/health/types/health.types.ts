export interface HealthAppointment {
  id: string
  user_id: string
  name: string
  appointment_type: string
  last_visited: string | null
  next_appointment: string | null
  frequency_months: number | null
  status: 'active' | 'archived'
  snoozed_until: string | null
  notes: string | null
  order_index?: number
  created_at: string
}

export interface HealthMedication {
  id: string
  user_id: string
  name: string
  frequency: 'daily' | 'weekly' | 'as_needed'
  refill_date: string | null
  track_refill: boolean
  notes: string | null
  status: 'active' | 'stopped'
  order_index?: number
  created_at: string
}

export interface HealthTodo {
  id: string
  user_id: string
  description: string
  status: 'todo' | 'done'
  completed_at: string | null
  order_index?: number
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  mood: number | null
  mood_note: string | null
  sleep_hours: number | null
  water_cups: number
  energy_level: number | null
  stress_level: number | null
  exercise_done: boolean
  exercise_notes: string | null
  supplements_done: boolean
  created_at: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlan {
  id: string
  user_id: string
  date: string | null
  meal_type: MealType
  recipe_name: string
  order_index?: number
  created_at: string
}

export interface ShoppingItem {
  id: string
  user_id: string
  name: string
  status: 'todo' | 'done'
  order_index?: number
  created_at: string
}

export interface ShoppingFavorite {
  id: string
  user_id: string
  name: string
  order_index?: number
  created_at: string
}
