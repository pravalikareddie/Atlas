import { useEffect } from 'react'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'

let loaded = false

export function usePlanData() {
  const store = usePlanStore()
  useEffect(() => {
    if (loaded || store.loading) return
    loaded = true
    store.setLoading(true)
    Promise.all([
      svc.fetchGoals().catch(() => []),
      svc.fetchMilestones().catch(() => []),
      svc.fetchTasks().catch(() => []),
      svc.fetchProjects().catch(() => []),
      svc.fetchPlanRoadmaps().catch(() => []),
      svc.fetchPlanSections().catch(() => []),
      svc.fetchPlanItems().catch(() => []),
      svc
        .fetchUserSettings('00000000-0000-0000-0000-000000000001')
        .catch(() => null),
    ]).then(
      ([
        goals,
        milestones,
        tasks,
        projects,
        roadmaps,
        sections,
        items,
        settings,
      ]) => {
        store.setGoals(goals)
        store.setMilestones(milestones)
        store.setTasks(tasks)
        store.setProjects(projects)
        store.setRoadmaps(roadmaps)
        store.setSections(sections)
        store.setItems(items)
        store.setMantra(settings?.daily_mantra ?? null)
        store.setLoading(false)
      },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
