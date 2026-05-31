import { addDays, addMonths, setDate, isAfter, getDay, format } from 'date-fns'
import { Task, CadenceType } from '../types/task.types'
import { TASK_STATUS, SPRINT_TASK_STATUS } from '../constants/taskConstants'

/** Returns true if the task is considered "active" (not completed) */
export function isTaskActive(t: Task): boolean {
  return t.status !== TASK_STATUS.DONE && t.sprint_status !== SPRINT_TASK_STATUS.DONE
}

/** Returns true if the task is considered "done" */
export function isTaskDone(t: Task): boolean {
  return t.status === TASK_STATUS.DONE || t.sprint_status === SPRINT_TASK_STATUS.DONE
}

export function getNextDueDate(task: Task): string | null {
  if (!task.cadence || task.cadence === 'none' || !task.due_date) return null
  const base = new Date(task.due_date)
  const today = new Date()

  switch (task.cadence as CadenceType) {
    case 'daily':
      return format(addDays(base, 1), 'yyyy-MM-dd')

    case 'weekly': {
      if (!task.cadence_days?.length)
        return format(addDays(base, 7), 'yyyy-MM-dd')
      const sorted = [...task.cadence_days].sort()
      const todayDay = getDay(today)
      const next = sorted.find((d) => d > todayDay) ?? sorted[0]
      let diff = next - todayDay
      if (diff <= 0) diff += 7
      return format(addDays(today, diff), 'yyyy-MM-dd')
    }

    case 'biweekly':
      return format(addDays(base, 14), 'yyyy-MM-dd')

    case 'monthly': {
      const day = task.cadence_date ?? base.getDate()
      const next = setDate(addMonths(base, 1), day)
      return format(
        isAfter(next, today) ? next : setDate(addMonths(today, 1), day),
        'yyyy-MM-dd',
      )
    }

    case 'custom':
      return format(addDays(base, task.cadence_interval ?? 1), 'yyyy-MM-dd')

    default:
      return null
  }
}

export function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

export function ageHours(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3_600_000
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.is_must !== b.is_must) return a.is_must ? -1 : 1
    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const ap = a.priority ? (pOrder[a.priority] ?? 3) : 3
    const bp = b.priority ? (pOrder[b.priority] ?? 3) : 3
    if (ap !== bp) return ap - bp
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
