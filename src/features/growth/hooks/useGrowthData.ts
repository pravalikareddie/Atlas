import { useEffect } from 'react'
import { useGrowthStore } from '../store/growthStore'
import * as svc from '../services/growthService'

export function useGrowthData() {
  const store = useGrowthStore()
  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    Promise.all([
      svc.fetchBooks(new Date().getFullYear()).catch(() => []),
    ]).then(([books]) => {
      store.setAreas([])
      store.setSections([])
      store.setItems([])
      store.setBooks(books)
      store.setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
