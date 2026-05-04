// ─── types.ts additions ────────────────────────────────────────────────────────

import { RoutineType } from '../components/RoutinesScreen'

export type RoutineCadence =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'triggered'
  | 'once'

export interface Routine {
  id: string
  user_id: string
  title: string
  outcome: string | null
  cadence: RoutineCadence
  schedule: string | null
  gradient: number | null
  is_active: boolean
  last_done: string | null
  order_index: number
  type: RoutineType // add this
  created_at: string
  show_today: boolean
}

export interface RoutineSection {
  id: string
  routine_id: string
  title: string
  order_index: number
}
export interface RoutineStep {
  id: string
  user_id: string // add this
  routine_id: string
  section_id: string | null
  title: string
  description: string | null
  emoji: string | null
  order_index: number
  created_at?: string
}

export interface RoutineSession {
  id: string
  routine_id: string
  started_at: string
  completed_at: string | null
  steps_done: string[]
  steps_skipped: string[]
}

// ─── routineStore.ts ──────────────────────────────────────────────────────────

export interface RoutineStore {
  routines: Routine[]
  sections: RoutineSection[]
  steps: RoutineStep[]
  sessions: RoutineSession[]
  loading: boolean
  setAll: (data: {
    routines: Routine[]
    sections: RoutineSection[]
    steps: RoutineStep[]
    sessions: RoutineSession[]
  }) => void
  addRoutine: (r: Routine) => void
  updateRoutine: (id: string, data: Partial<Routine>) => void
  removeRoutine: (id: string) => void
  addSection: (s: RoutineSection) => void
  updateSection: (id: string, data: Partial<RoutineSection>) => void
  removeSection: (id: string) => void
  addStep: (s: RoutineStep) => void
  updateStep: (id: string, data: Partial<RoutineStep>) => void
  removeStep: (id: string) => void
  upsertSession: (s: RoutineSession) => void
}
