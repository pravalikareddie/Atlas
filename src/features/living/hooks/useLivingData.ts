import { useEffect } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'

export function useLivingData() {
  const store = useLivingStore()
  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    Promise.all([
      svc.fetchPlaces().catch(() => []),
      svc.fetchAllPlaceExperiences().catch(() => []),
      svc.fetchExperiences().catch(() => []),
      svc.fetchActivities().catch(() => []),
      svc.fetchLivingTodos().catch(() => []),
    ]).then(([places, placeExps, experiences, activities, todos]) => {
      store.setPlaces(places)
      store.setPlaceExps(placeExps)
      store.setExperiences(experiences)
      store.setActivities(activities)
      store.setTodos(todos)
      store.setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
