import { create } from 'zustand'
import { Task } from '../types/task.types'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null

  setTasks: (t: Task[]) => void
  addTask: (t: Task) => void
  updateTask: (id: string, u: Partial<Task>) => void
  removeTask: (id: string) => void
  removeTasks: (ids: string[]) => void
  setLoading: (l: boolean) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  addTask: (t) => set((s) => ({ tasks: [t, ...s.tasks] })),
  updateTask: (id, u) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...u } : t)),
    })),
  removeTask: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
    })),
  removeTasks: (ids) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => !ids.includes(t.id)),
    })),
  setLoading: (loading) => set({ loading }),
}))
