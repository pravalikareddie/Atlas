import { create } from 'zustand'
import { Task, Sprint } from '../types/task.types'

interface TaskState {
  tasks: Task[]
  sprints: Sprint[]
  loading: boolean
  error: string | null

  setTasks: (t: Task[]) => void
  addTask: (t: Task) => void
  updateTask: (id: string, u: Partial<Task>) => void
  removeTask: (id: string) => void
  removeTasks: (ids: string[]) => void
  setSprints: (s: Sprint[]) => void
  addSprint: (s: Sprint) => void
  updateSprint: (id: string, u: Partial<Sprint>) => void
  removeSprint: (id: string) => void
  setLoading: (l: boolean) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  sprints: [],
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
  setSprints: (sprints) => set({ sprints }),
  addSprint: (s) => set((st) => ({ sprints: [s, ...st.sprints] })),
  updateSprint: (id, u) =>
    set((s) => ({
      sprints: s.sprints.map((sp) => (sp.id === id ? { ...sp, ...u } : sp)),
    })),
  removeSprint: (id) =>
    set((s) => ({
      sprints: s.sprints.filter((sp) => sp.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}))
