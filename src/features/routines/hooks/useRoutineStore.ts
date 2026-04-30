import { create } from 'zustand'
import { RoutineStore } from '../types'

export const useRoutineStore = create<RoutineStore>((set) => ({
  routines: [],
  sections: [],
  steps: [],
  sessions: [],
  loading: false,
  setAll: (data) => set({ ...data, loading: false }),
  addRoutine: (r) => set((s) => ({ routines: [...s.routines, r] })),
  updateRoutine: (id, data) =>
    set((s) => ({
      routines: s.routines.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),
  removeRoutine: (id) =>
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
  addSection: (sec) => set((s) => ({ sections: [...s.sections, sec] })),
  updateSection: (id, data) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === id ? { ...sec, ...data } : sec,
      ),
    })),
  removeSection: (id) =>
    set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),
  addStep: (step) => set((s) => ({ steps: [...s.steps, step] })),
  updateStep: (id, data) =>
    set((s) => ({
      steps: s.steps.map((st) => (st.id === id ? { ...st, ...data } : st)),
    })),
  removeStep: (id) =>
    set((s) => ({ steps: s.steps.filter((st) => st.id !== id) })),
  upsertSession: (session) =>
    set((s) => {
      const exists = s.sessions.find((x) => x.id === session.id)
      return {
        sessions: exists
          ? s.sessions.map((x) => (x.id === session.id ? session : x))
          : [...s.sessions, session],
      }
    }),
}))
