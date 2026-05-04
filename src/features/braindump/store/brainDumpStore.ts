import { create } from 'zustand'
import { BrainDumpItem, TriageTarget } from '../types/brainDump.types'

interface BrainDumpState {
  items: BrainDumpItem[]
  loading: boolean

  setItems: (items: BrainDumpItem[]) => void
  addItem: (item: BrainDumpItem) => void
  triageItem: (id: string, target: TriageTarget) => void
  updateItem: (id: string, content: string) => void
  removeItem: (id: string) => void
  setLoading: (l: boolean) => void
}

export const useBrainDumpStore = create<BrainDumpState>((set) => ({
  items: [],
  loading: false,

  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  triageItem: (id, triaged_to) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? { ...i, triaged_to, triaged_at: new Date().toISOString() }
          : i,
      ),
    })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, content) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, content } : i)),
    })),
  setLoading: (loading) => set({ loading }),
}))
