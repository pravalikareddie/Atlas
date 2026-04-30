import { useEffect } from 'react'
import { useRoutineStore } from './useRoutineStore'
import * as svc from '../routineService'
import { USER_ID } from '../../tasks/constants/taskConstants'
export function useRoutineData() {
  const store = useRoutineStore()

  useEffect(() => {
    Promise.all([
      svc.getRoutines(USER_ID),
      svc.getRoutineSections(USER_ID),
      svc.getRoutineSteps(USER_ID),
      svc.getRoutineSessions(USER_ID),
    ])
      .then(([routines, sections, steps, sessions]) => {
        store.setAll({ routines, sections, steps, sessions })
      })
      .catch(() => {})
  }, [])
}
