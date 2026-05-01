import { useMemo, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useBudgetSummary } from '../../finance/hooks/useBudgetSummary'
import { useHealthStore } from '../../health/store/healthStore'
import { usePlanStore } from '../../plan/store/planStore'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import {
  TASK_TYPE,
  TASK_STATUS,
  DATE_FORMAT,
  GOAL_STATUS,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { upsertLifeScore } from '../../finance/services/lifeScoreService'

const WORK_TASK_POINTS = 14
const PERSONAL_TASK_POINTS = 20
const ROUTINE_POINTS = 20
const GOAL_PER_ACTIVE = 25
const SCORE_GREAT = 70
const SCORE_OKAY = 40

export interface AreaScore {
  key: string
  label: string
  emoji: string
  color: string
  score: number
}

export interface LifeScoreResult {
  overall: number
  label: string
  color: string
  areas: AreaScore[]
}

const AREAS = [
  {
    key: 'work',
    label: 'Work',
    emoji: '💼',
    color: 'var(--mantine-color-blue-5)',
  },
  {
    key: 'finance',
    label: 'Finance',
    emoji: '💜',
    color: 'var(--mantine-color-purple-5)',
  },
  {
    key: 'health',
    label: 'Health',
    emoji: '💚',
    color: 'var(--mantine-color-green-5)',
  },
  {
    key: 'growth',
    label: 'Growth',
    emoji: '🧠',
    color: 'var(--mantine-color-teal-5)',
  },
  {
    key: 'goals',
    label: 'Goals',
    emoji: '🎯',
    color: 'var(--mantine-color-amber-5)',
  },
  {
    key: 'living',
    label: 'Living',
    emoji: '🌟',
    color: 'var(--mantine-color-coral-5)',
  },
] as const

function getLabel(score: number): string {
  if (score >= SCORE_GREAT) return 'Thriving'
  if (score >= SCORE_OKAY) return 'Getting there'
  return 'Needs attention'
}

function getColor(score: number): string {
  if (score >= SCORE_GREAT) return 'teal'
  if (score >= SCORE_OKAY) return 'amber'
  return 'red'
}

export function useLifeScore(): LifeScoreResult {
  const tasks = useTaskStore((s) => s.tasks)
  const { totalSpent, totalBudget } = useBudgetSummary()
  const { dailyLogs } = useHealthStore()
  const { goals } = usePlanStore()
  const { sessions } = useRoutineStore()
  const weekAgo = subDays(new Date(), 7)
  const todayStr = format(new Date(), DATE_FORMAT.API)

  const result = useMemo<LifeScoreResult>(() => {
    const workDone = tasks.filter(
      (t) =>
        t.type === TASK_TYPE.SPRINT &&
        t.status === TASK_STATUS.DONE &&
        t.completed_at &&
        new Date(t.completed_at) > weekAgo,
    ).length
    const work = Math.min(100, workDone * WORK_TASK_POINTS)

    const financeRatio = totalBudget > 0 ? totalSpent / totalBudget : 0
    const finance =
      financeRatio <= 1
        ? Math.round((1 - financeRatio * 0.5) * 100)
        : Math.max(0, Math.round((2 - financeRatio) * 50))

    const logsThisWeek = dailyLogs.filter(
      (l) => new Date(l.date) > weekAgo,
    ).length
    const recent = dailyLogs.slice(0, 7)
    const avgSleep =
      recent.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) /
      Math.max(1, recent.length)
    const health = Math.min(
      100,
      Math.round((logsThisWeek / 7) * 60) +
        (avgSleep >= 7 ? 40 : Math.round((avgSleep / 7) * 40)),
    )

    const routinesDone = sessions.filter(
      (s) => s.completed_at && new Date(s.completed_at) > weekAgo,
    ).length
    const growth = Math.min(100, routinesDone * ROUTINE_POINTS)

    const activeGoalCount = goals.filter(
      (g) => g.status === GOAL_STATUS.ACTIVE,
    ).length
    const goalScore = Math.min(100, activeGoalCount * GOAL_PER_ACTIVE)

    const livingDone = tasks.filter(
      (t) =>
        (t.type === TASK_TYPE.PERSONAL || t.type === TASK_TYPE.LIVING) &&
        t.status === TASK_STATUS.DONE &&
        t.completed_at &&
        new Date(t.completed_at) > weekAgo,
    ).length
    const living = Math.min(100, livingDone * PERSONAL_TASK_POINTS)

    const scores: Record<string, number> = {
      work,
      finance,
      health,
      growth,
      goals: goalScore,
      living,
    }
    const overall = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) /
        Object.values(scores).length,
    )
    const areas: AreaScore[] = AREAS.map((a) => ({
      ...a,
      score: scores[a.key] ?? 0,
    }))

    return {
      overall,
      label: getLabel(overall),
      color: getColor(overall),
      areas,
    }
  }, [tasks, totalSpent, totalBudget, dailyLogs, goals, sessions])

  const lastSavedRef = useRef<string>('')
  const scoreKey = `${todayStr}:${result.overall}`
  useEffect(() => {
    if (lastSavedRef.current === scoreKey) return
    lastSavedRef.current = scoreKey
    const { areas } = result
    const getScore = (key: string) =>
      areas.find((a) => a.key === key)?.score ?? 0
    upsertLifeScore({
      user_id: USER_ID,
      date: todayStr,
      overall: result.overall,
      work: getScore('work'),
      finance: getScore('finance'),
      health: getScore('health'),
      growth: getScore('growth'),
      goals: getScore('goals'),
      living: getScore('living'),
    }).catch(() => {})
  }, [scoreKey])

  return result
}
