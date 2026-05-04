import { useMemo } from 'react'
import { isSameMonth } from 'date-fns'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useBudgetSummary } from '../../finance/hooks/useBudgetSummary'
import { useHealthStore } from '../../health/store/healthStore'
import { usePlanStore } from '../../plan/store/planStore'
import { useGrowthStore } from '../../growth/store/growthStore'
import { useFinanceStore } from '../../finance/store/financeStore'
import {
  TASK_TYPE,
  TASK_STATUS,
  PERSONAL_TYPES,
} from '../../tasks/constants/taskConstants'
import {
  TARGET,
  AREAS_META,
  getScoreColor,
  getScoreLabel,
} from '../../today/constants/lifeScore'
import { DailyLog } from '../../health/types/health.types'
import { HEALTH_SCALE, MONTHLY_HISTORY_MONTHS } from '../../today'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkData {
  done: number
  planned: number
}
export interface PersonalData {
  done: number
  planned: number
}
export interface MonthlyMoney {
  month: string
  spent: number
  budget: number
}
export interface MoneyData {
  budget: number
  spent: number
  saved: number
  overspent: number
  monthly: MonthlyMoney[]
}
export interface HealthData {
  logs: DailyLog[]
}
export interface GrowthData {
  itemsDone: number
  itemsPlanned: number
  booksDone: number
  booksPlanned: number
  projectsDone: number
  projectsPlanned: number
}

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
  work: WorkData
  personal: PersonalData
  money: MoneyData
  health: HealthData
  growth: GrowthData
}

// ─── Score helpers ────────────────────────────────────────────────────────────

/** Completion rate: 0–100, or 0 if nothing planned */
function completionScore(done: number, planned: number): number {
  return planned > 0 ? (done / planned) * 100 : 0
}

/**
 * Money score: 100 = exactly on budget, scales linearly down as overspend
 * grows, floors at 0. Spending nothing also scores 100.
 */
function moneyScore(spent: number, budget: number): number {
  if (budget <= 0) return 0
  return Math.max(0, Math.min(100, (1 - spent / budget) * 100 + 100) / 2)
}

/**
 * Health score: average of four normalised 0–1 components × 100.
 * Component scales are driven by HEALTH_SCALE so a change in one scale
 * automatically propagates to the score formula.
 */
function healthScore(logs: DailyLog[]): number {
  const n = logs.length
  if (n === 0) return 0

  const avg = (field: keyof DailyLog) =>
    logs.reduce((sum, l) => sum + ((l[field] as number | null) ?? 0), 0) / n

  const normMood = avg('mood') / HEALTH_SCALE.MOOD
  const normEnergy = avg('energy_level') / HEALTH_SCALE.ENERGY
  const normStress = 1 - avg('stress_level') / HEALTH_SCALE.STRESS // inverted
  const normWater = Math.min(1, avg('water_cups') / TARGET.WATER_CUPS)

  const COMPONENT_COUNT = 4
  return (
    ((normMood + normEnergy + normStress + normWater) / COMPONENT_COUNT) * 100
  )
}

/** Average of available completion rates (ignores areas with no data) */
function growthScore(rates: number[]): number {
  const valid = rates.filter((r) => r >= 0)
  return valid.length > 0
    ? (valid.reduce((a, b) => a + b, 0) / valid.length) * 100
    : 0
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLifeScore(): LifeScoreResult {
  const tasks = useTaskStore((s) => s.tasks)
  const { totalSpent, totalBudget } = useBudgetSummary()
  const { dailyLogs } = useHealthStore()
  const { projects } = usePlanStore()
  const { items: growthItems, books } = useGrowthStore()
  const { expenses, budgets } = useFinanceStore()

  // Stable date values — computed once per mount, not on every render
  const now = useMemo(() => new Date(), [])
  const currentMonthPrefix = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    [now],
  )

  const result = useMemo<LifeScoreResult>(() => {
    // ─── WORK ─────────────────────────────────────────────────────
    const allSubtasks = tasks.filter((t) => t.parent_task_id)
    const hasSubtasks = (id: string) =>
      allSubtasks.some((s) => s.parent_task_id === id)

    const sprintTasks = tasks.filter(
      (t) => t.type === TASK_TYPE.SPRINT && !t.parent_task_id,
    )
    let workPlanned = 0,
      workDone = 0
    for (const t of sprintTasks) {
      if (hasSubtasks(t.id)) {
        const subs = allSubtasks.filter((s) => s.parent_task_id === t.id)
        workPlanned += subs.length
        workDone += subs.filter((s) => s.status === TASK_STATUS.DONE).length
      } else {
        workPlanned++
        if (t.status === TASK_STATUS.DONE) workDone++
      }
    }

    // ─── PERSONAL ─────────────────────────────────────────────────
    const personalTasks = tasks.filter(
      (t) => PERSONAL_TYPES.includes(t.type) && !t.parent_task_id,
    )
    let personalPlanned = 0,
      personalDone = 0
    for (const t of personalTasks) {
      if (hasSubtasks(t.id)) {
        const subs = allSubtasks.filter((s) => s.parent_task_id === t.id)
        personalPlanned += subs.length
        personalDone += subs.filter((s) => s.status === TASK_STATUS.DONE).length
      } else {
        personalPlanned++
        if (t.status === TASK_STATUS.DONE) personalDone++
      }
    }

    // ─── MONEY ────────────────────────────────────────────────────
    const saved = Math.max(0, totalBudget - totalSpent)
    const overspent = Math.max(0, totalSpent - totalBudget)

    const months: MonthlyMoney[] = Array.from(
      { length: MONTHLY_HISTORY_MONTHS },
      (_, i) => {
        const offset = MONTHLY_HISTORY_MONTHS - 1 - i
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const mSpent = (expenses ?? [])
          .filter((e) => e.month === m)
          .reduce((s, e) => s + e.amount, 0)
        const mBudget = (budgets ?? [])
          .filter((b) => b.month === m)
          .reduce((s, b) => s + b.amount, 0)
        return { month: m, spent: mSpent, budget: mBudget }
      },
    )

    // ─── HEALTH ───────────────────────────────────────────────────
    // Filter to current month — consistent with every other area
    const logsThisMonth = dailyLogs.filter((l) =>
      isSameMonth(new Date(l.date), now),
    )

    // ─── GROWTH ───────────────────────────────────────────────────
    const itemsThisMonth = growthItems.filter(
      (i) =>
        i.status === 'current' ||
        (i.done_date && isSameMonth(new Date(i.done_date), now)),
    )
    const itemsDone = itemsThisMonth.filter((i) => i.status === 'done').length
    const itemsPlanned = itemsThisMonth.length

    const booksTarget = books.filter(
      (b) => b.target_month === currentMonthPrefix,
    )
    const booksDone = booksTarget.filter((b) => b.status === 'done').length
    const booksPlanned = booksTarget.length

    const projThisMonth = projects.filter(
      (p) =>
        p.status === 'active' ||
        (p.status === 'done' &&
          p.deadline &&
          isSameMonth(new Date(p.deadline), now)),
    )
    const projectsDone = projThisMonth.filter((p) => p.status === 'done').length
    const projectsPlanned = projThisMonth.length

    // ─── SCORES ───────────────────────────────────────────────────
    const scores = {
      work: completionScore(workDone, workPlanned),
      personal: completionScore(personalDone, personalPlanned),
      money: moneyScore(totalSpent, totalBudget),
      health: healthScore(logsThisMonth),
      growth: growthScore([
        itemsPlanned > 0 ? itemsDone / itemsPlanned : -1,
        booksPlanned > 0 ? booksDone / booksPlanned : -1,
        projectsPlanned > 0 ? projectsDone / projectsPlanned : -1,
      ]),
    }

    // Only areas with actual data contribute to the overall —
    // unconfigured areas don't penalise the score.
    const activeScores = [
      workPlanned > 0 && scores.work,
      personalPlanned > 0 && scores.personal,
      totalBudget > 0 && scores.money,
      logsThisMonth.length > 0 && scores.health,
      projectsPlanned > 0 || booksPlanned > 0 || itemsPlanned > 0
        ? scores.growth
        : false,
    ].filter((s): s is number => s !== false)

    const overall =
      activeScores.length > 0
        ? Math.round(
            activeScores.reduce((a, b) => a + b, 0) / activeScores.length,
          )
        : 0

    const areas: AreaScore[] = AREAS_META.map((a) => ({
      ...a,
      score: Math.round(scores[a.key as keyof typeof scores] ?? 0),
    }))

    return {
      overall,
      label: getScoreLabel(overall),
      color: getScoreColor(overall),
      areas,
      work: { done: workDone, planned: workPlanned },
      personal: { done: personalDone, planned: personalPlanned },
      money: {
        budget: totalBudget,
        spent: totalSpent,
        saved,
        overspent,
        monthly: months,
      },
      health: { logs: logsThisMonth },
      growth: {
        itemsDone,
        itemsPlanned,
        booksDone,
        booksPlanned,
        projectsDone,
        projectsPlanned,
      },
    }
  }, [
    tasks,
    totalSpent,
    totalBudget,
    dailyLogs,
    projects,
    growthItems,
    books,
    expenses,
    budgets,
    now,
    currentMonthPrefix,
  ])

  // ─── Persist ──────────────────────────────────────────────────────────────
  // Persist disabled — life_scores table needs schema update
  /*
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    const healthArea = result.areas.find((a) => a.key === 'health')
    const growthArea = result.areas.find((a) => a.key === 'growth')

    // Composite key covers every field written to the DB — prevents redundant upserts
    const scoreKey = [
      todayStr,
      result.overall,
      healthArea?.score,
      growthArea?.score,
      result.work.done,
      result.personal.done,
      result.money.spent,
    ].join(':')

    if (lastSavedRef.current === scoreKey) return
    lastSavedRef.current = scoreKey

      date: todayStr,
      overall: result.overall,
      work: result.work.done,
      finance: result.money.spent,
      health: healthArea?.score ?? 0,
      growth: growthArea?.score ?? 0,
      goals: 0,
      living: result.personal.done,
    }).catch((err) => {
      console.error('[useLifeScore] Failed to persist life score:', err)
    })
  }, [result, todayStr])
  */

  return result
}
