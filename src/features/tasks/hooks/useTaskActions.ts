import { useCallback, useRef, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import {
  insertTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
} from '../services/taskService'
import { getNextDueDate } from '../utils/taskUtils'
import { Task } from '../types/task.types'

export function useTaskActions() {
  const {
    addTask,
    updateTask: storeUpdate,
    removeTask,
    removeTasks,
  } = useTaskStore()
  const [undoTarget, setUndoTarget] = useState<Task | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>()

  const create = useCallback(
    async (t: Omit<Task, 'id' | 'created_at'>) => {
      try {
        const created = await insertTask(t)
        addTask(created)
        return created
      } catch {
        return null
      }
    },
    [addTask],
  )

  const update = useCallback(
    async (id: string, u: Partial<Task>) => {
      storeUpdate(id, u)
      try {
        await updateTask(id, u)
      } catch {}
    },
    [storeUpdate],
  )

  const remove = useCallback(
    async (id: string) => {
      removeTask(id)
      try {
        await deleteTask(id)
      } catch {}
    },
    [removeTask],
  )

  const markDone = useCallback(
    async (task: Task) => {
      const now = new Date().toISOString()
      storeUpdate(task.id, { status: 'done', completed_at: now })
      try {
        await updateTask(task.id, { status: 'done', completed_at: now })
      } catch {}

      // cadence: create next occurrence
      if (task.cadence && task.cadence !== 'none') {
        const nextDate = getNextDueDate(task)
        if (nextDate) {
          const { id: _id, created_at: _ca, ...rest } = task
          const next = {
            ...rest,
            status: 'todo' as const,
            completed_at: null,
            due_date: nextDate,
            do_today: false,
            push_count: 0,
          }
          try {
            const created = await insertTask(next)
            addTask(created)
          } catch {}
        }
      }

      // undo window
      clearTimeout(undoTimer.current)
      setUndoTarget(task)
      undoTimer.current = setTimeout(() => setUndoTarget(null), 5000)
    },
    [storeUpdate, addTask],
  )

  const undoDone = useCallback(async () => {
    if (!undoTarget) return
    clearTimeout(undoTimer.current)
    storeUpdate(undoTarget.id, { status: 'todo', completed_at: null })
    try {
      await updateTask(undoTarget.id, { status: 'todo', completed_at: null })
    } catch {}
    setUndoTarget(null)
  }, [undoTarget, storeUpdate])

  const bulkDone = useCallback(
    async (ids: string[]) => {
      const now = new Date().toISOString()
      ids.forEach((id) =>
        storeUpdate(id, { status: 'done', completed_at: now }),
      )
      try {
        await bulkUpdateTasks(ids, { status: 'done', completed_at: now })
      } catch {}
    },
    [storeUpdate],
  )

  const bulkRemove = useCallback(
    async (ids: string[]) => {
      removeTasks(ids)
      try {
        await bulkDeleteTasks(ids)
      } catch {}
    },
    [removeTasks],
  )

  return {
    create,
    update,
    remove,
    markDone,
    undoDone,
    undoTarget,
    bulkDone,
    bulkRemove,
  }
}
