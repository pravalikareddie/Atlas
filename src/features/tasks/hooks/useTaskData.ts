import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { fetchAllTasks } from '../services/taskService'

export function useTaskData() {
  const store = useTaskStore()

  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    fetchAllTasks()
      .catch(() => [])
      .then((data) => {
        store.setTasks(data)
        store.setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
