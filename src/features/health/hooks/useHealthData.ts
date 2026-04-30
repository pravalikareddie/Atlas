import { useEffect } from 'react'
import { useHealthStore } from '../store/healthStore'
import { fetchDailyLogs } from '../services/dailyLogService'
import { fetchAppointments } from '../services/appointmentService'
import { fetchMedications } from '../services/medicationService'
import { fetchHealthTodos } from '../services/healthTodoService'

export function useHealthData() {
  const store = useHealthStore()

  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)
    Promise.all([
      fetchDailyLogs(30).catch(() => []),
      fetchAppointments().catch(() => []),
      fetchMedications().catch(() => []),
      fetchHealthTodos().catch(() => []),
    ]).then(([logs, appts, meds, todos]) => {
      store.setDailyLogs(logs)
      store.setAppointments(appts)
      store.setMedications(meds)
      store.setTodos(todos)
      store.setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
