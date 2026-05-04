import { useEffect } from 'react'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { USER_ID } from '../../tasks/constants/taskConstants'

export function usePlanData() {
  const store = usePlanStore()
  useEffect(() => {
    if (store.loaded || store.loading) return
    store.setLoading(true)
    Promise.all([
      svc.fetchGoals().catch(() => []),
      svc.fetchMilestones().catch(() => []),
      svc.fetchTasks().catch(() => []),
      svc.fetchProjects().catch(() => []),
      svc.fetchPlanRoadmaps().catch(() => []),
      svc.fetchPlanSections().catch(() => []),
      svc.fetchPlanItems().catch(() => []),
      svc.fetchUserSettings(USER_ID).catch(() => null),
    ]).then(
      ([goals, milestones, tasks, projects, roadmaps, sections, items]) => {
        store.setGoals(goals)
        store.setMilestones(milestones)
        store.setTasks(tasks)
        store.setProjects(projects)
        store.setRoadmaps(roadmaps)
        store.setSections(sections)
        store.setItems(items)
        store.setLoaded()
        store.setLoading(false)
      },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
