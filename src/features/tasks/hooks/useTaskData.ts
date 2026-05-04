import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { fetchAllTasks, fetchSprints } from '../services/taskService'

export function useTaskData() {
  const store = useTaskStore()

  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    Promise.all([
      fetchAllTasks().catch(() => []),
      fetchSprints().catch(() => []),
    ]).then(([tasks, sprints]) => {
      store.setTasks(tasks)
      store.setSprints(sprints)
      store.setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
