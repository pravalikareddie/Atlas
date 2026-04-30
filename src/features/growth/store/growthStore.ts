import { create } from 'zustand'
import {
  LearningArea,
  RoadmapSection,
  RoadmapItem,
  Book,
} from '../types/growth.types'

interface GrowthState {
  areas: LearningArea[]
  sections: RoadmapSection[]
  items: RoadmapItem[]
  books: Book[]
  loading: boolean
  setAreas: (a: LearningArea[]) => void
  addArea: (a: LearningArea) => void
  updateArea: (id: string, u: Partial<LearningArea>) => void
  removeArea: (id: string) => void
  setSections: (s: RoadmapSection[]) => void
  addSection: (s: RoadmapSection) => void
  updateSection: (id: string, u: Partial<RoadmapSection>) => void
  removeSection: (id: string) => void
  setItems: (i: RoadmapItem[]) => void
  addItem: (i: RoadmapItem) => void
  updateItem: (id: string, u: Partial<RoadmapItem>) => void
  removeItem: (id: string) => void
  setBooks: (b: Book[]) => void
  addBook: (b: Book) => void
  updateBook: (id: string, u: Partial<Book>) => void
  removeBook: (id: string) => void
  setLoading: (l: boolean) => void
}

export const useGrowthStore = create<GrowthState>((set) => ({
  areas: [],
  sections: [],
  items: [],
  books: [],
  loading: false,
  setAreas: (areas) => set({ areas }),
  addArea: (a) => set((s) => ({ areas: [...s.areas, a] })),
  updateArea: (id, u) =>
    set((s) => ({
      areas: s.areas.map((a) => (a.id === id ? { ...a, ...u } : a)),
    })),
  removeArea: (id) =>
    set((s) => ({
      areas: s.areas.filter((a) => a.id !== id),
      sections: s.sections.filter((sec) => sec.area_id !== id),
      items: s.items.filter((i) => i.area_id !== id),
    })),
  setSections: (sections) => set({ sections }),
  addSection: (sec) => set((s) => ({ sections: [...s.sections, sec] })),
  updateSection: (id, u) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === id ? { ...sec, ...u } : sec,
      ),
    })),
  removeSection: (id) =>
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== id),
      items: s.items.filter((i) => i.section_id !== id),
    })),
  setItems: (items) => set({ items }),
  addItem: (i) => set((s) => ({ items: [...s.items, i] })),
  updateItem: (id, u) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...u } : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  setBooks: (books) => set({ books }),
  addBook: (b) => set((s) => ({ books: [...s.books, b] })),
  updateBook: (id, u) =>
    set((s) => ({
      books: s.books.map((b) => (b.id === id ? { ...b, ...u } : b)),
    })),
  removeBook: (id) =>
    set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
  setLoading: (l) => set({ loading: l }),
}))
