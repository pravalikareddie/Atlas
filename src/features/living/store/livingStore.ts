import { create } from 'zustand'
import {
  Place,
  PlaceExperience,
  Experience,
  Activity,
  LivingTodo,
  WishlistItem,
} from '../types/living.types'

interface LivingState {
  places: Place[]
  placeExps: PlaceExperience[]
  experiences: Experience[]
  activities: Activity[]
  todos: LivingTodo[]
  wishlist: WishlistItem[]
  loading: boolean

  setPlaces: (p: Place[]) => void
  addPlace: (p: Place) => void
  updatePlace: (id: string, u: Partial<Place>) => void
  removePlace: (id: string) => void
  setPlaceExps: (pe: PlaceExperience[]) => void
  addPlaceExp: (pe: PlaceExperience) => void
  updatePlaceExp: (id: string, u: Partial<PlaceExperience>) => void
  removePlaceExp: (id: string) => void
  setExperiences: (e: Experience[]) => void
  addExperience: (e: Experience) => void
  updateExperience: (id: string, u: Partial<Experience>) => void
  removeExperience: (id: string) => void
  setActivities: (a: Activity[]) => void
  addActivity: (a: Activity) => void
  updateActivity: (id: string, u: Partial<Activity>) => void
  removeActivity: (id: string) => void
  setTodos: (t: LivingTodo[]) => void
  addTodo: (t: LivingTodo) => void
  updateTodo: (id: string, u: Partial<LivingTodo>) => void
  removeTodo: (id: string) => void
  setWishlist: (w: WishlistItem[]) => void
  addWishlistItem: (w: WishlistItem) => void
  updateWishlistItem: (id: string, u: Partial<WishlistItem>) => void
  removeWishlistItem: (id: string) => void
  setLoading: (l: boolean) => void
}

export const useLivingStore = create<LivingState>((set) => ({
  places: [],
  placeExps: [],
  experiences: [],
  activities: [],
  todos: [],
  wishlist: [],
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
  removePlaceExp: (id) =>
    set((s) => ({ placeExps: s.placeExps.filter((pe) => pe.id !== id) })),
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
  updateActivity: (id, u) =>
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...u } : a)),
    })),
  removeActivity: (id) =>
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
  setTodos: (todos) => set({ todos }),
  addTodo: (t) => set((s) => ({ todos: [t, ...s.todos] })),
  updateTodo: (id, u) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...u } : t)),
    })),
  removeTodo: (id) =>
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
  setWishlist: (wishlist) => set({ wishlist }),
  addWishlistItem: (w) => set((s) => ({ wishlist: [w, ...s.wishlist] })),
  updateWishlistItem: (id, u) =>
    set((s) => ({ wishlist: s.wishlist.map((w) => (w.id === id ? { ...w, ...u } : w)) })),
  removeWishlistItem: (id) =>
    set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) })),
  setLoading: (l) => set({ loading: l }),
}))
