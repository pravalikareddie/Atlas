import { useEffect } from 'react'
import { useGrowthStore } from '../store/growthStore'
import * as svc from '../services/growthService'

export function useGrowthData() {
  const store = useGrowthStore()
  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    Promise.all([
      svc.fetchAreas().catch(() => []),
      svc.fetchAllSections().catch(() => []),
      svc.fetchAllItems().catch(() => []),
      svc.fetchBooks(new Date().getFullYear()).catch(() => []),
    ]).then(([areas, sections, items, books]) => {
      store.setAreas(areas)
      store.setSections(sections)
      store.setItems(items)
      store.setBooks(books)
      store.setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
