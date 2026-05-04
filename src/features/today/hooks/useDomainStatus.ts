import { useMemo, useState, useEffect } from 'react'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useFinanceStore } from '../../finance/store/financeStore'
import { useHealthStore } from '../../health/store/healthStore'
import { usePlanStore } from '../../plan/store/planStore'
import { useGrowthStore } from '../../growth/store/growthStore'
import { useLivingStore } from '../../living/store/livingStore'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import { TASK_STATUS } from '../../tasks/constants/taskConstants'
import { DomainCard, ALL_DOMAINS, DOMAIN_META } from '../types/domain.types'
import { callClaude } from '../../../lib/anthropic'
import { format, differenceInDays, parseISO, isWithinInterval, startOfWeek } from 'date-fns'

const CACHE_KEY = 'atlas_domain_status'
const CACHE_TS_KEY = 'atlas_domain_status_ts'
const CACHE_TTL = 15 * 60 * 1000 // 15 min

function getCached(): DomainCard[] | null {
  try {
    const ts = sessionStorage.getItem(CACHE_TS_KEY)
    const data = sessionStorage.getItem(CACHE_KEY)
    if (ts && data && Date.now() - parseInt(ts) < CACHE_TTL) return JSON.parse(data)
  } catch {}
  return null
}

function setCache(cards: DomainCard[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cards))
    sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  } catch {}
}

export function useDomainStatus(): DomainCard[] {
  const tasks = useTaskStore((s) => s.tasks)
  const sprints = useTaskStore((s) => s.sprints)
  const { expenses, budgets, subscriptions, refunds, accounts } = useFinanceStore()
  const { dailyLogs, appointments, medications } = useHealthStore()
  const { goals, projects } = usePlanStore()
  const { books, items: growthItems } = useGrowthStore()
  const { activities, wishlist } = useLivingStore()
  const routineStore = useRoutineStore()

  const [cards, setCards] = useState<DomainCard[]>(() => {
    return getCached() ?? ALL_DOMAINS.map((d) => ({
      domain: d, label: DOMAIN_META[d].label, icon: DOMAIN_META[d].icon,
      status: 'no_data' as const, lastEvent: null, action: null,
    }))
  })
  const [loading, setLoading] = useState(false)

  // Build context snapshot for AI
  const context = useMemo(() => {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const month = format(now, 'yyyy-MM')

    const activeSprint = sprints.find((s) => {
      try { return isWithinInterval(now, { start: parseISO(s.start_date), end: parseISO(s.end_date) }) } catch { return false }
    })

    const workTasks = tasks.filter((t) => ['sprint', 'meeting_prep', 'followup'].includes(t.type))
    const sprintTasks = activeSprint ? workTasks.filter((t) => t.sprint_id === activeSprint.id) : []
    const sprintDone = sprintTasks.filter((t) => t.status === TASK_STATUS.DONE).length
    const sprintTodo = sprintTasks.filter((t) => t.status === TASK_STATUS.TODO).length
    const lastWorkDone = workTasks.filter((t) => t.status === TASK_STATUS.DONE && t.completed_at).sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))[0]

    const monthExpenses = expenses.filter((e) => e.month === month)
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const monthBudgets = budgets.filter((b) => b.month === month)
    const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0)
    const overBudgetCats = monthBudgets.filter((b) => b.category !== 'savings' && b.category !== 'investments').filter((b) => {
      const catSpent = monthExpenses.filter((e) => e.category === b.category).reduce((s, e) => s + e.amount, 0)
      return catSpent > b.amount
    }).map((b) => b.category)

    const renewingSubs = subscriptions.filter((s) => s.status === 'active' && s.renewal_day - now.getDate() >= 0 && s.renewal_day - now.getDate() <= 3)
    const overdueRefunds = refunds.filter((r) => r.status === 'pending' && r.expected_by < todayStr)
    const ccDueSoon = accounts.filter((a) => a.type === 'credit_card' && a.due_date && a.due_date - now.getDate() >= 0 && a.due_date - now.getDate() <= 5)

    const weekLogs = dailyLogs.filter((l) => l.date >= weekStart)
    const moodLogs = weekLogs.filter((l) => l.mood)
    const avgMood = moodLogs.length ? (moodLogs.reduce((s, l) => s + (l.mood ?? 0), 0) / moodLogs.length).toFixed(1) : null
    const sleepLogs = weekLogs.filter((l) => l.sleep_hours)
    const avgSleep = sleepLogs.length ? (sleepLogs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / sleepLogs.length).toFixed(1) : null
    const exerciseDays = weekLogs.filter((l) => l.exercise_done).length
    const lastExercise = dailyLogs.filter((l) => l.exercise_done).sort((a, b) => b.date.localeCompare(a.date))[0]

    const refillDueMeds = medications.filter((m) => m.status === 'active' && m.refill_date && m.refill_date <= todayStr)
    const overdueAppts = appointments.filter((a) => a.status === 'active' && a.frequency_months && a.last_visited && differenceInDays(now, parseISO(a.last_visited)) / 30 > a.frequency_months)

    const readingBooks = books.filter((b) => b.status === 'reading')
    const activeGoals = goals.filter((g) => g.status === 'active')

    return JSON.stringify({
      today: todayStr,
      work: {
        activeSprint: activeSprint ? { name: activeSprint.name, daysLeft: Math.max(0, differenceInDays(parseISO(activeSprint.end_date), now)), done: sprintDone, todo: sprintTodo } : null,
        lastCompleted: lastWorkDone ? { title: lastWorkDone.title, daysAgo: differenceInDays(now, parseISO(lastWorkDone.completed_at!)) } : null,
        activeProjects: projects.filter((p) => p.status === 'active').length,
      },
      finance: {
        spent: `$${(totalSpent / 100).toFixed(0)}`,
        budget: `$${(totalBudget / 100).toFixed(0)}`,
        percentUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        overBudgetCategories: overBudgetCats,
        renewingSubs: renewingSubs.map((s) => ({ name: s.name, amount: `$${(s.amount / 100).toFixed(0)}`, daysUntil: s.renewal_day - now.getDate() })),
        overdueRefunds: overdueRefunds.map((r) => r.description),
        ccDueSoon: ccDueSoon.map((a) => ({ name: a.name, daysUntil: a.due_date! - now.getDate() })),
      },
      fitness: {
        exerciseDaysThisWeek: exerciseDays,
        lastExerciseDaysAgo: lastExercise ? differenceInDays(now, parseISO(lastExercise.date)) : null,
      },
      selfGrowth: {
        readingBooks: readingBooks.map((b) => b.title),
        activeGoals: activeGoals.filter((g) => g.area === 'self_growth').length,
        doneItemsThisWeek: growthItems.filter((i) => i.status === 'done').length,
      },
      confidence: {
        avgMoodThisWeek: avgMood, moodEntries: moodLogs.length,
        topRoutine: routineStore.routines.length ? routineStore.routines.sort((a, b) => routineStore.sessions.filter((s) => s.routine_id === b.id && s.completed_at).length - routineStore.sessions.filter((s) => s.routine_id === a.id && s.completed_at).length)[0]?.title : null,
      },
      living: {
        totalActivities: activities.length,
        wishlistCount: wishlist.filter((w) => w.status === 'want').length,
      },
      health: {
        avgSleepThisWeek: avgSleep, sleepEntries: sleepLogs.length,
        refillDueMeds: refillDueMeds.map((m) => m.name),
        overdueAppts: overdueAppts.map((a) => a.name),
        waterAvg: weekLogs.filter((l) => l.water_cups).length ? (weekLogs.reduce((s, l) => s + (l.water_cups ?? 0), 0) / weekLogs.filter((l) => l.water_cups).length).toFixed(1) : null,
      },
    })
  }, [tasks, sprints, expenses, budgets, subscriptions, refunds, accounts, dailyLogs, appointments, medications, goals, projects, books, growthItems, activities, wishlist, routineStore])

  useEffect(() => {
    if (loading) return
    const cached = getCached()
    if (cached) return

    setLoading(true)
    const prompt = `You are Atlas, a life OS. Evaluate each domain from this data snapshot.

DATA:
${context}

Return a JSON array of 7 objects (work, finance, fitness, self_growth, confidence, living, health):
{
  "domain": "work",
  "status": "needs_attention" | "holding_steady" | "no_data",
  "lastEvent": "Short 1-line summary. Use actual names/numbers from data. null if no data.",
  "action": { "text": "One specific thing to do", "route": "/route" } | null
}

Rules:
- Be concise. One short sentence for lastEvent, one for action.
- needs_attention = something is actually wrong or overdue
- holding_steady = things are fine, brief summary
- no_data = nothing to report
- Under 50-60% budget used is GOOD. Don't flag it.
- Savings/investments over budget is GOOD.
- action only for needs_attention domains
- Routes: /tasks, /finance/budgets, /finance/accounts, /health, /health/medical, /growth/books, /growth/calendar, /living, /inbox/wishlist
- Return ONLY valid JSON array, no markdown.`

    callClaude(prompt, 800).then((raw) => {
      try {
        console.log('[DomainStatus] AI response:', raw)
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) throw new Error('not array')
        const result: DomainCard[] = parsed.map((item: any) => {
          const meta = DOMAIN_META[item.domain as keyof typeof DOMAIN_META]
          return {
            domain: item.domain,
            label: meta?.label ?? item.domain,
            icon: meta?.icon ?? '📋',
            status: item.status ?? 'no_data',
            lastEvent: item.lastEvent ?? null,
            action: item.action ?? null,
          }
        })
        setCards(result)
        setCache(result)
      } catch (e) {
        console.error('[DomainStatus] Parse error:', e, raw)
      }
    }).catch((e) => { console.error('[DomainStatus] AI call failed:', e) }).finally(() => setLoading(false))
  }, [context]) // eslint-disable-line react-hooks/exhaustive-deps

  return cards
}
