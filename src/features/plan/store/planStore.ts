import { create } from 'zustand'
import {
  Goal,
  Milestone,
  Task,
  Project,
  PlanRoadmap,
  PlanRoadmapSection,
  PlanRoadmapItem,
} from '../types/plan.types'

interface PlanState {
  goals: Goal[]
  milestones: Milestone[]
  tasks: Task[]
  projects: Project[]
  roadmaps: PlanRoadmap[]
  sections: PlanRoadmapSection[]
  items: PlanRoadmapItem[]
  mantra: string | null
  loading: boolean
  loaded: boolean

  setGoals: (g: Goal[]) => void
  addGoal: (g: Goal) => void
  updateGoal: (id: string, u: Partial<Goal>) => void
  removeGoal: (id: string) => void
  setMilestones: (m: Milestone[]) => void
  addMilestone: (m: Milestone) => void
  updateMilestone: (id: string, u: Partial<Milestone>) => void
  removeMilestone: (id: string) => void
  setTasks: (t: Task[]) => void
  addTask: (t: Task) => void
  updateTask: (id: string, u: Partial<Task>) => void
  removeTask: (id: string) => void
  setProjects: (p: Project[]) => void
  addProject: (p: Project) => void
  updateProject: (id: string, u: Partial<Project>) => void
  removeProject: (id: string) => void
  setRoadmaps: (r: PlanRoadmap[]) => void
  addRoadmap: (r: PlanRoadmap) => void
  updateRoadmap: (id: string, u: Partial<PlanRoadmap>) => void
  removeRoadmap: (id: string) => void
  setSections: (s: PlanRoadmapSection[]) => void
  addSection: (s: PlanRoadmapSection) => void
  updateSection: (id: string, u: Partial<PlanRoadmapSection>) => void
  removeSection: (id: string) => void
  setItems: (i: PlanRoadmapItem[]) => void
  addItem: (i: PlanRoadmapItem) => void
  updateItem: (id: string, u: Partial<PlanRoadmapItem>) => void
  removeItem: (id: string) => void
  setMantra: (m: string | null) => void
  setLoading: (l: boolean) => void
  setLoaded: () => void
}

export const usePlanStore = create<PlanState>((set) => ({
  goals: [],
  milestones: [],
  tasks: [],
  projects: [],
  roadmaps: [],
  sections: [],
  items: [],
  mantra: null,
  loading: false,
  loaded: false,

  setGoals: (goals) => set({ goals }),
  addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
  updateGoal: (id, u) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...u } : g)),
    })),
  removeGoal: (id) =>
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

  setMilestones: (milestones) => set({ milestones }),
  addMilestone: (m) => set((s) => ({ milestones: [...s.milestones, m] })),
  updateMilestone: (id, u) =>
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...u } : m)),
    })),
  removeMilestone: (id) =>
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) })),

  setTasks: (tasks) => set({ tasks }),
  addTask: (t) => set((s) => ({ tasks: [...s.tasks, t] })),
  updateTask: (id, u) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...u } : t)),
    })),
  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  setProjects: (projects) => set({ projects }),
  addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),
  updateProject: (id, u) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...u } : p)),
    })),
  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  setRoadmaps: (roadmaps) => set({ roadmaps }),
  addRoadmap: (r) => set((s) => ({ roadmaps: [...s.roadmaps, r] })),
  updateRoadmap: (id, u) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) => (r.id === id ? { ...r, ...u } : r)),
    })),
  removeRoadmap: (id) =>
    set((s) => ({ roadmaps: s.roadmaps.filter((r) => r.id !== id) })),

  setSections: (sections) => set({ sections }),
  addSection: (s_) => set((s) => ({ sections: [...s.sections, s_] })),
  updateSection: (id, u) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === id ? { ...sec, ...u } : sec,
      ),
    })),
  removeSection: (id) =>
    set((s) => ({ sections: s.sections.filter((sec) => sec.id !== id) })),

  setItems: (items) => set({ items }),
  addItem: (i) => set((s) => ({ items: [...s.items, i] })),
  updateItem: (id, u) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...u } : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  setMantra: (mantra) => set({ mantra }),
  setLoading: (loading) => set({ loading }),
  setLoaded: () => set({ loaded: true }),
}))
