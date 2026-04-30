import { create } from 'zustand'
import {
  Place,
  PlaceExperience,
  Experience,
  Activity,
  LivingTodo,
} from '../types/living.types'

interface LivingState {
  places: Place[]
  placeExps: PlaceExperience[]
  experiences: Experience[]
  activities: Activity[]
  todos: LivingTodo[]
  loading: boolean

  setPlaces: (p: Place[]) => void
  addPlace: (p: Place) => void
  updatePlace: (id: string, u: Partial<Place>) => void
  removePlace: (id: string) => void
  setPlaceExps: (pe: PlaceExperience[]) => void
  addPlaceExp: (pe: PlaceExperience) => void
  updatePlaceExp: (id: string, u: Partial<PlaceExperience>) => void
  setExperiences: (e: Experience[]) => void
  addExperience: (e: Experience) => void
  updateExperience: (id: string, u: Partial<Experience>) => void
  removeExperience: (id: string) => void
  setActivities: (a: Activity[]) => void
  addActivity: (a: Activity) => void
  removeActivity: (id: string) => void
  setTodos: (t: LivingTodo[]) => void
  addTodo: (t: LivingTodo) => void
  updateTodo: (id: string, u: Partial<LivingTodo>) => void
  setLoading: (l: boolean) => void
}

export const useLivingStore = create<LivingState>((set) => ({
  places: [],
  placeExps: [],
  experiences: [],
  activities: [],
  todos: [],
  loading: false,
  setPlaces: (places) => set({ places }),
  addPlace: (p) => set((s) => ({ places: [p, ...s.places] })),
  updatePlace: (id, u) =>
    set((s) => ({
      places: s.places.map((p) => (p.id === id ? { ...p, ...u } : p)),
    })),
  removePlace: (id) =>
    set((s) => ({ places: s.places.filter((p) => p.id !== id) })),
  setPlaceExps: (placeExps) => set({ placeExps }),
  addPlaceExp: (pe) => set((s) => ({ placeExps: [...s.placeExps, pe] })),
  updatePlaceExp: (id, u) =>
    set((s) => ({
      placeExps: s.placeExps.map((pe) => (pe.id === id ? { ...pe, ...u } : pe)),
    })),
  setExperiences: (experiences) => set({ experiences }),
  addExperience: (e) => set((s) => ({ experiences: [e, ...s.experiences] })),
  updateExperience: (id, u) =>
    set((s) => ({
      experiences: s.experiences.map((e) => (e.id === id ? { ...e, ...u } : e)),
    })),
  removeExperience: (id) =>
    set((s) => ({ experiences: s.experiences.filter((e) => e.id !== id) })),
  setActivities: (activities) => set({ activities }),
  addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
  removeActivity: (id) =>
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
  setTodos: (todos) => set({ todos }),
  addTodo: (t) => set((s) => ({ todos: [t, ...s.todos] })),
  updateTodo: (id, u) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...u } : t)),
    })),
  setLoading: (l) => set({ loading: l }),
}))
