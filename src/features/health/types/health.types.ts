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
  created_at: string
}

export interface HealthTodo {
  id: string
  user_id: string
  description: string
  status: 'todo' | 'done'
  completed_at: string | null
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
  created_at: string
}
