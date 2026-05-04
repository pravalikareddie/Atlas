import { create } from 'zustand'
import {
  DailyLog,
  HealthAppointment,
  HealthMedication,
  HealthTodo,
  MealPlan,
  ShoppingItem,
} from '../types/health.types'

interface HealthState {
  dailyLogs: DailyLog[]
  appointments: HealthAppointment[]
  medications: HealthMedication[]
  todos: HealthTodo[]
  mealPlans: MealPlan[]
  shoppingItems: ShoppingItem[]
  loading: boolean
  error: string | null

  setDailyLogs: (d: DailyLog[]) => void
  upsertLog: (d: DailyLog) => void
  setAppointments: (a: HealthAppointment[]) => void
  addAppointment: (a: HealthAppointment) => void
  updateAppointment: (id: string, u: Partial<HealthAppointment>) => void
  removeAppointment: (id: string) => void
  setMedications: (m: HealthMedication[]) => void
  addMedication: (m: HealthMedication) => void
  updateMedication: (id: string, u: Partial<HealthMedication>) => void
  setTodos: (t: HealthTodo[]) => void
  addTodo: (t: HealthTodo) => void
  updateTodo: (id: string, u: Partial<HealthTodo>) => void
  removeTodo: (id: string) => void
  setMealPlans: (m: MealPlan[]) => void
  addMealPlan: (m: MealPlan) => void
  updateMealPlan: (id: string, u: Partial<MealPlan>) => void
  removeMealPlan: (id: string) => void
  setShoppingItems: (i: ShoppingItem[]) => void
  addShoppingItem: (i: ShoppingItem) => void
  updateShoppingItem: (id: string, u: Partial<ShoppingItem>) => void
  removeShoppingItem: (id: string) => void
  setLoading: (l: boolean) => void
}

export const useHealthStore = create<HealthState>((set) => ({
  dailyLogs: [],
  appointments: [],
  medications: [],
  todos: [],
  mealPlans: [],
  shoppingItems: [],
  loading: false,
  error: null,

  setDailyLogs: (dailyLogs) => set({ dailyLogs }),
  upsertLog: (d) =>
    set((s) => {
      const idx = s.dailyLogs.findIndex((l) => l.date === d.date)
      if (idx >= 0) {
        const logs = [...s.dailyLogs]
        logs[idx] = { ...logs[idx], ...d }
        return { dailyLogs: logs }
      }
      return { dailyLogs: [d, ...s.dailyLogs] }
    }),
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (a) => set((s) => ({ appointments: [a, ...s.appointments] })),
  updateAppointment: (id, u) =>
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, ...u } : a,
      ),
    })),
  removeAppointment: (id) =>
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
  setMedications: (medications) => set({ medications }),
  addMedication: (m) => set((s) => ({ medications: [m, ...s.medications] })),
  updateMedication: (id, u) =>
    set((s) => ({
      medications: s.medications.map((m) => (m.id === id ? { ...m, ...u } : m)),
    })),
  setTodos: (todos) => set({ todos }),
  addTodo: (t) => set((s) => ({ todos: [t, ...s.todos] })),
  updateTodo: (id, u) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...u } : t)),
    })),
  removeTodo: (id) =>
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
  setMealPlans: (mealPlans) => set({ mealPlans }),
  addMealPlan: (m) => set((s) => ({ mealPlans: [...s.mealPlans, m] })),
  updateMealPlan: (id, u) =>
    set((s) => ({ mealPlans: s.mealPlans.map((m) => (m.id === id ? { ...m, ...u } : m)) })),
  removeMealPlan: (id) =>
    set((s) => ({ mealPlans: s.mealPlans.filter((m) => m.id !== id) })),
  setShoppingItems: (shoppingItems) => set({ shoppingItems }),
  addShoppingItem: (i) => set((s) => ({ shoppingItems: [i, ...s.shoppingItems] })),
  updateShoppingItem: (id, u) =>
    set((s) => ({ shoppingItems: s.shoppingItems.map((i) => (i.id === id ? { ...i, ...u } : i)) })),
  removeShoppingItem: (id) =>
    set((s) => ({ shoppingItems: s.shoppingItems.filter((i) => i.id !== id) })),
  setLoading: (loading) => set({ loading }),
}))
