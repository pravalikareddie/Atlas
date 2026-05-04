// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Box,
  ScrollArea,
  Transition,
} from '@mantine/core'
import { ChatCircle } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { callClaudeWithTools, ToolDef, ToolCall } from '../../lib/anthropic'
import { useTaskStore } from '../tasks/store/taskStore'
import { useMeetingStore } from '../meetings/store/meetingStore'
import { usePlanStore } from '../plan/store/planStore'
import { useGrowthStore } from '../growth/store/growthStore'
import { useLivingStore } from '../living/store/livingStore'
import { useHealthStore } from '../health/store/healthStore'
import { useFinanceStore } from '../finance/store/financeStore'
import { useRoutineStore } from '../routines/hooks/useRoutineStore'
import { DATE_FORMAT, TASK_STATUS } from '../tasks/constants/taskConstants'
import { STRINGS } from '../tasks/constants/strings'
import { insertTask, updateTask, deleteTask as deleteTaskSvc } from '../tasks/services/taskService'
import { insertShoppingItem, updateShoppingItem } from '../health/services/shoppingService'
import { insertExpense } from '../finance/services/expenseService'
import { insertGoal, updateGoal, insertMilestone, updateMilestone, insertProject } from '../plan/services/planService'
import { insertMeeting } from '../meetings/services/meetingService'
import { insertPlace, insertExperience, insertActivity, insertLivingTodo } from '../living/services/livingService'
import { insertBook } from '../growth/services/growthService'
import { insertWishlistItem } from '../living/services/wishlistService'
import { insertMealPlan } from '../health/services/mealPlanService'
import { insertHealthTodo } from '../health/services/healthTodoService'
import { insertRefund } from '../finance/services/refundService'
import { insertSubscription } from '../finance/services/subscriptionService'
import { upsertDailyLog } from '../health/services/dailyLogService'
import { USER_ID } from '../tasks/constants/taskConstants'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are Atlas, a life OS assistant. You have full context on the user's tasks, meetings, goals, projects, learning, and living aspirations.

Your personality:
- Warm but firm about accountability
- Today's tasks and meetings are MANDATORY - push the user to complete them
- Encourage the user to look at their growth items (goals, learning areas, books)
- Be concise and actionable
- Reference specific items by name when relevant
- When the user asks to add, complete, or log something, use the available tools AND respond with a friendly confirmation message`

function buildContext() {
  const today = format(new Date(), DATE_FORMAT.API)
  const tasks = useTaskStore.getState().tasks
  const meetings = useMeetingStore.getState().meetings
  const { goals, milestones, projects } = usePlanStore.getState()
  const { areas, items, books } = useGrowthStore.getState()
  const { activities, places, experiences, todos: livingTodos, wishlist } = useLivingStore.getState()
  const { dailyLogs, appointments, medications, shoppingItems, mealPlans, todos: healthTodos } = useHealthStore.getState()
  const { subscriptions, refunds, splitwise, budgets, expenses, accounts } = useFinanceStore.getState()
  const routineStore = useRoutineStore.getState()

  const lines: string[] = [`Today: ${format(new Date(), 'EEEE, MMM d, yyyy')}`]

  const todoTasks = tasks.filter((t) => t.status === TASK_STATUS.TODO)
  const doneTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE)
  const todayTasks = todoTasks.filter((t) => t.due_date === today || t.do_today)

  if (todayTasks.length)
    lines.push(`\n## Today\'s Tasks (${todayTasks.length})\n${todayTasks.map((t) => `- ${t.title} [${t.type}${t.is_must ? ', MUST' : ''}${t.due_date ? `, due ${t.due_date}` : ''}]`).join('\n')}`)
  const upcomingTasks = todoTasks.filter((t) => t.due_date && t.due_date > today && !t.do_today)
  if (upcomingTasks.length)
    lines.push(`\n## Upcoming Tasks (${upcomingTasks.length})\n${upcomingTasks.map((t) => `- ${t.title} [${t.type}, due ${t.due_date}]`).join('\n')}`)
  if (doneTasks.length)
    lines.push(`\n## Completed Tasks (${doneTasks.length})\n${doneTasks.slice(0, 20).map((t) => `- \u2713 ${t.title} [${t.type}${t.completed_at ? `, done ${t.completed_at.slice(0, 10)}` : ''}]`).join('\n')}`)

  const todayMeetings = meetings.filter((m) => m.next_date === today)
  if (todayMeetings.length)
    lines.push(`\n## Today\'s Meetings\n${todayMeetings.map((m) => `- ${m.title}${m.event_time ? ` at ${m.event_time}` : ''}`).join('\n')}`)
  const otherMeetings = meetings.filter((m) => m.next_date !== today)
  if (otherMeetings.length)
    lines.push(`\n## Other Meetings\n${otherMeetings.map((m) => `- ${m.title} (${m.next_date ?? 'no date'}${m.cadence !== 'none' ? `, ${m.cadence}` : ''})`).join('\n')}`)

  if (goals.length) lines.push(`\n## Goals\n${goals.map((g) => `- ${g.title} [${g.status}, ${g.area}${g.deadline ? `, deadline ${g.deadline}` : ''}]`).join('\n')}`)
  if (projects.length) lines.push(`\n## Projects\n${projects.map((p) => `- ${p.title} [${p.status}${p.deadline ? `, deadline ${p.deadline}` : ''}]`).join('\n')}`)
  if (milestones.length) lines.push(`\n## Milestones\n${milestones.map((m) => `- ${m.title} [${m.status}${m.due_date ? `, due ${m.due_date}` : ''}]`).join('\n')}`)

  if (areas.length) lines.push(`\n## Learning Areas\n${areas.map((a) => { const ai = items.filter((i) => i.area_id === a.id); return `- ${a.emoji} ${a.name} [${a.status}] \u2014 ${ai.length} items (${ai.filter((i) => i.status === 'done').length} done)` }).join('\n')}`)
  if (books.length) lines.push(`\n## Books\n${books.map((b) => `- ${b.title} [${b.status}]`).join('\n')}`)

  if (routineStore.routines.length) lines.push(`\n## Routines\n${routineStore.routines.map((r) => { const s = routineStore.steps.filter((s) => s.routine_id === r.id).length; return `- ${r.title} [${r.cadence}, ${s} steps${r.last_done ? `, last done ${r.last_done}` : ''}]` }).join('\n')}`)

  if (activities.length) lines.push(`\n## Activities\n${activities.map((a) => `- ${a.name}${a.target_date ? ` (target ${a.target_date})` : ''}`).join('\n')}`)
  if (places.length) lines.push(`\n## Places\n${places.map((p) => `- ${p.name} [${p.status}${p.target_date ? `, target ${p.target_date}` : ''}]`).join('\n')}`)
  if (experiences.length) lines.push(`\n## Experiences\n${experiences.map((e) => `- ${e.name} [${e.status}${e.target_date ? `, target ${e.target_date}` : ''}]`).join('\n')}`)
  if (livingTodos.length) lines.push(`\n## Living Todos\n${livingTodos.map((t) => `- ${t.description} [${t.status}]`).join('\n')}`)
  if (wishlist.length) lines.push(`\n## Wishlist\n${wishlist.map((w) => `- ${w.name} [${w.status}]`).join('\n')}`)

  const todayLog = dailyLogs.find((l) => l.date === today)
  if (todayLog) lines.push(`\n## Today\'s Health\nMood: ${todayLog.mood ?? '--'}/5, Energy: ${todayLog.energy_level ?? '--'}/5, Sleep: ${todayLog.sleep_hours ?? '--'}h, Water: ${todayLog.water_cups ?? 0}/8, Stress: ${todayLog.stress_level ?? '--'}/5`)
  if (appointments.length) lines.push(`\n## Health Appointments\n${appointments.map((a) => `- ${a.name} [${a.status}${a.next_appointment ? `, next ${a.next_appointment}` : ''}]`).join('\n')}`)
  if (medications.length) lines.push(`\n## Medications\n${medications.map((m) => `- ${m.name} [${m.frequency}${m.notes ? `, ${m.notes}` : ''}]`).join('\n')}`)
  if (shoppingItems.length) lines.push(`\n## Shopping List\n${shoppingItems.map((s) => `- ${s.name} [${s.status}]`).join('\n')}`)
  if (mealPlans.length) lines.push(`\n## Meal Plans\n${mealPlans.map((m) => `- ${m.recipe_name} [${m.meal_type}${m.date ? `, ${m.date}` : ''}]`).join('\n')}`)
  if (healthTodos.length) lines.push(`\n## Health Todos\n${healthTodos.map((t) => `- ${t.description} [${t.status}]`).join('\n')}`)

  if (subscriptions.length) lines.push(`\n## Subscriptions\n${subscriptions.map((s) => `- ${s.name} ($${(s.amount / 100).toFixed(2)}/${s.period})`).join('\n')}`)
  if (refunds.length) lines.push(`\n## Refunds\n${refunds.filter((r) => r.status === 'pending').map((r) => `- ${r.description} ($${(r.amount / 100).toFixed(2)})`).join('\n')}`)
  if (splitwise.length) lines.push(`\n## Splitwise\n${splitwise.filter((s) => s.status === 'outstanding').map((s) => `- ${s.person}${s.description ? `: ${s.description}` : ''} ($${(s.amount / 100).toFixed(2)}) ${s.direction}`).join('\n')}`)
  if (budgets.length) lines.push(`\n## Budgets\n${budgets.map((b) => `- ${b.category}: $${(b.amount / 100).toFixed(2)}`).join('\n')}`)
  if (expenses.length) lines.push(`\n## Expenses\n${expenses.slice(0, 30).map((e) => `- $${(e.amount / 100).toFixed(2)} [${e.category}${e.note ? `, ${e.note}` : ''}, ${e.month}]`).join('\n')}`)
  if (accounts.length) lines.push(`\n## Accounts\n${accounts.map((a) => `- ${a.name} [${a.type}]`).join('\n')}`)

  return lines.join('\n')
}

const TOOLS: ToolDef[] = [
  { name: 'add_task', description: 'Add a new task', input_schema: { type: 'object', properties: { title: { type: 'string' }, task_type: { type: 'string', enum: ['sprint','personal','finance','health','living','growth','goal_task','misc','followup'] }, due_date: { type: 'string', description: 'YYYY-MM-DD' }, is_must: { type: 'boolean' } }, required: ['title','task_type'] } },
  { name: 'complete_task', description: 'Mark a task as done by title', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'update_task', description: 'Update a task field (due_date, title, is_must, do_today)', input_schema: { type: 'object', properties: { title: { type: 'string', description: 'current title to find the task' }, due_date: { type: 'string' }, new_title: { type: 'string' }, is_must: { type: 'boolean' }, do_today: { type: 'boolean' } }, required: ['title'] } },
  { name: 'delete_task', description: 'Delete a task by title', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'add_shopping_item', description: 'Add item to shopping list', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'complete_shopping_item', description: 'Mark shopping item as done', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_expense', description: 'Log an expense in cents', input_schema: { type: 'object', properties: { amount_cents: { type: 'number' }, category: { type: 'string', enum: ['rent','phone','emi1','emi2','internet','personal','groceries','transport','investing','savings','transportation','other'] }, note: { type: 'string' } }, required: ['amount_cents','category'] } },
  { name: 'add_goal', description: 'Create a new goal', input_schema: { type: 'object', properties: { title: { type: 'string' }, area: { type: 'string', enum: ['career','health','finance','learning','relationships','personal'] }, deadline: { type: 'string' } }, required: ['title','area'] } },
  { name: 'complete_goal', description: 'Mark a goal as done', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'add_project', description: 'Create a new project', input_schema: { type: 'object', properties: { title: { type: 'string' }, deadline: { type: 'string' } }, required: ['title'] } },
  { name: 'add_milestone', description: 'Add milestone to a goal', input_schema: { type: 'object', properties: { title: { type: 'string' }, goal_title: { type: 'string' }, due_date: { type: 'string' } }, required: ['title','goal_title'] } },
  { name: 'complete_milestone', description: 'Mark milestone as done', input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
  { name: 'add_meeting', description: 'Create a meeting', input_schema: { type: 'object', properties: { title: { type: 'string' }, next_date: { type: 'string' }, event_time: { type: 'string' } }, required: ['title'] } },
  { name: 'add_place', description: 'Add a place to visit', input_schema: { type: 'object', properties: { name: { type: 'string' }, note: { type: 'string' } }, required: ['name'] } },
  { name: 'add_experience', description: 'Add an experience to try', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_activity', description: 'Add an activity', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_book', description: 'Add a book', input_schema: { type: 'object', properties: { title: { type: 'string' }, status: { type: 'string', enum: ['want','reading'] } }, required: ['title'] } },
  { name: 'add_wishlist_item', description: 'Add to wishlist', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'add_meal_plan', description: 'Plan a meal', input_schema: { type: 'object', properties: { recipe_name: { type: 'string' }, meal_type: { type: 'string', enum: ['breakfast','lunch','dinner','snack'] }, date: { type: 'string' } }, required: ['recipe_name','meal_type'] } },
  { name: 'add_health_todo', description: 'Add health todo', input_schema: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] } },
  { name: 'add_living_todo', description: 'Add living todo', input_schema: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] } },
  { name: 'add_refund', description: 'Track a refund', input_schema: { type: 'object', properties: { description: { type: 'string' }, amount_cents: { type: 'number' }, expected_by: { type: 'string' } }, required: ['description','amount_cents','expected_by'] } },
  { name: 'add_subscription', description: 'Track a subscription', input_schema: { type: 'object', properties: { name: { type: 'string' }, amount_cents: { type: 'number' }, period: { type: 'string', enum: ['monthly','yearly'] } }, required: ['name','amount_cents','period'] } },
  { name: 'log_mood', description: 'Log mood 1-5', input_schema: { type: 'object', properties: { value: { type: 'number' } }, required: ['value'] } },
  { name: 'log_energy', description: 'Log energy 1-5', input_schema: { type: 'object', properties: { value: { type: 'number' } }, required: ['value'] } },
  { name: 'log_stress', description: 'Log stress 1-5', input_schema: { type: 'object', properties: { value: { type: 'number' } }, required: ['value'] } },
  { name: 'log_sleep', description: 'Log sleep hours', input_schema: { type: 'object', properties: { hours: { type: 'number' } }, required: ['hours'] } },
  { name: 'log_water', description: 'Add one cup of water', input_schema: { type: 'object', properties: {}, required: [] } },
]

async function executeAction(tc: ToolCall) {
  const i = tc.input
  const uid = () => crypto.randomUUID()
  const now = () => new Date().toISOString()
  const today = format(new Date(), DATE_FORMAT.API)
  try {
    switch (tc.name) {
      case 'add_task': {
        const row = { user_id: USER_ID, title: i.title as string, type: (i.task_type as string) || 'personal', priority: null, is_must: !!i.is_must, status: 'todo' as const, due_date: (i.due_date as string) || null, do_today: false, completed_at: null, goal_id: null, milestone_id: null, project_id: null, roadmap_item_id: null, calendar_event_id: null, parent_task_id: null, ticket_id: null, order_index: 0, cadence: null, cadence_days: null, cadence_date: null, cadence_interval: null, push_count: 0, is_learning: false, notes: null }
        const t = await insertTask(row).catch(() => ({ ...row, id: uid(), created_at: now(), event_time: null, event_duration: null }))
        useTaskStore.getState().addTask(t)
        break
      }
      case 'complete_task': {
        const tasks = useTaskStore.getState().tasks
        const t = tasks.find((x) => x.title.toLowerCase().includes((i.title as string).toLowerCase()))
        if (t) { await updateTask(t.id, { status: 'done', completed_at: now() }).catch(() => {}); useTaskStore.getState().updateTask(t.id, { status: 'done', completed_at: now() }) }
        break
      }
      case 'update_task': {
        const tasks = useTaskStore.getState().tasks
        const t = tasks.find((x) => x.title.toLowerCase().includes((i.title as string).toLowerCase()))
        if (t) {
          const updates: Record<string, unknown> = {}
          if (i.due_date !== undefined) updates.due_date = i.due_date
          if (i.new_title !== undefined) updates.title = i.new_title
          if (i.is_must !== undefined) updates.is_must = i.is_must
          if (i.do_today !== undefined) updates.do_today = i.do_today
          await updateTask(t.id, updates).catch(() => {})
          useTaskStore.getState().updateTask(t.id, updates)
        }
        break
      }
      case 'delete_task': {
        const tasks = useTaskStore.getState().tasks
        const t = tasks.find((x) => x.title.toLowerCase().includes((i.title as string).toLowerCase()))
        if (t) {
          await deleteTaskSvc(t.id).catch(() => {})
          useTaskStore.getState().removeTask(t.id)
        }
        break
      }
      case 'add_shopping_item': {
        const item = await insertShoppingItem({ user_id: USER_ID, name: i.name as string, status: 'todo' }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, status: 'todo' as const, created_at: now() }))
        useHealthStore.getState().addShoppingItem(item)
        break
      }
      case 'complete_shopping_item': {
        const items = useHealthStore.getState().shoppingItems
        const item = items.find((x) => x.name.toLowerCase().includes((i.name as string).toLowerCase()))
        if (item) { await updateShoppingItem(item.id, { status: 'done' }).catch(() => {}); useHealthStore.getState().updateShoppingItem(item.id, { status: 'done' }) }
        break
      }
      case 'add_expense': {
        await insertExpense({ user_id: USER_ID, amount: i.amount_cents as number, category: i.category as string, note: (i.note as string) || null, month: format(new Date(), 'yyyy-MM'), logged_at: now() }).catch(() => {})
        break
      }
      case 'add_goal': {
        const g = await insertGoal({ user_id: USER_ID, title: i.title as string, area: i.area as string, affirmation: null, deadline: (i.deadline as string) || null, status: 'active', ai_evaluation: null }).catch(() => ({ id: uid(), user_id: USER_ID, title: i.title as string, area: i.area as string, affirmation: null, deadline: (i.deadline as string) || null, status: 'active' as const, ai_evaluation: null, created_at: now() }))
        usePlanStore.getState().addGoal(g)
        break
      }
      case 'complete_goal': {
        const goals = usePlanStore.getState().goals
        const g = goals.find((x) => x.title.toLowerCase().includes((i.title as string).toLowerCase()))
        if (g) { await updateGoal(g.id, { status: 'done' }).catch(() => {}); usePlanStore.getState().updateGoal(g.id, { status: 'done' }) }
        break
      }
      case 'add_project': {
        const p = await insertProject({ user_id: USER_ID, title: i.title as string, description: null, status: 'active', deadline: (i.deadline as string) || null, goal_id: null, milestone_id: null, roadmap_id: null, roadmap_item_id: null }).catch(() => ({ id: uid(), user_id: USER_ID, title: i.title as string, description: null, status: 'active' as const, deadline: (i.deadline as string) || null, goal_id: null, milestone_id: null, roadmap_id: null, roadmap_item_id: null, created_at: now() }))
        usePlanStore.getState().addProject(p)
        break
      }
      case 'add_milestone': {
        const goals = usePlanStore.getState().goals
        const g = goals.find((x) => x.title.toLowerCase().includes((i.goal_title as string).toLowerCase()))
        if (g) {
          const m = await insertMilestone({ user_id: USER_ID, goal_id: g.id, title: i.title as string, due_date: (i.due_date as string) || null, status: 'todo', order_index: 0 }).catch(() => ({ id: uid(), user_id: USER_ID, goal_id: g.id, title: i.title as string, due_date: (i.due_date as string) || null, status: 'todo' as const, order_index: 0, created_at: now() }))
          usePlanStore.getState().addMilestone(m)
        }
        break
      }
      case 'complete_milestone': {
        const ms = usePlanStore.getState().milestones
        const m = ms.find((x) => x.title.toLowerCase().includes((i.title as string).toLowerCase()))
        if (m) { await updateMilestone(m.id, { status: 'done' }).catch(() => {}); usePlanStore.getState().updateMilestone(m.id, { status: 'done' }) }
        break
      }
      case 'add_meeting': {
        const m = await insertMeeting({ user_id: USER_ID, title: i.title as string, next_date: (i.next_date as string) || today, event_time: (i.event_time as string) || null, event_duration: 30, cadence: 'none', notes: null, agenda: null }).catch(() => ({ id: uid(), user_id: USER_ID, title: i.title as string, next_date: (i.next_date as string) || today, event_time: (i.event_time as string) || null, event_duration: 30, cadence: 'none' as const, notes: null, agenda: null, created_at: now() }))
        useMeetingStore.getState().addMeeting(m)
        break
      }
      case 'add_place': {
        const p = await insertPlace({ user_id: USER_ID, name: i.name as string, note: (i.note as string) || null, image_url: null, status: 'want', visited_date: null, memory: null, done_image_url: null, target_date: null }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, note: (i.note as string) || null, image_url: null, status: 'want' as const, visited_date: null, memory: null, done_image_url: null, target_date: null, created_at: now() }))
        useLivingStore.getState().addPlace(p)
        break
      }
      case 'add_experience': {
        const e = await insertExperience({ user_id: USER_ID, name: i.name as string, image_url: null, place_id: null, status: 'want', done_date: null, memory: null, done_image_url: null, target_date: null }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, image_url: null, place_id: null, status: 'want' as const, done_date: null, memory: null, done_image_url: null, target_date: null, created_at: now() }))
        useLivingStore.getState().addExperience(e)
        break
      }
      case 'add_activity': {
        const a = await insertActivity({ user_id: USER_ID, name: i.name as string, image_url: null, target_date: null }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, image_url: null, target_date: null, created_at: now() }))
        useLivingStore.getState().addActivity(a)
        break
      }
      case 'add_book': {
        const b = await insertBook({ user_id: USER_ID, title: i.title as string, author: null, status: (i.status as string) || 'want', year: new Date().getFullYear(), target_month: null }).catch(() => ({ id: uid(), user_id: USER_ID, title: i.title as string, author: null, status: ((i.status as string) || 'want') as 'want', year: new Date().getFullYear(), target_month: null, created_at: now() }))
        useGrowthStore.getState().addBook(b)
        break
      }
      case 'add_wishlist_item': {
        const w = await insertWishlistItem({ user_id: USER_ID, name: i.name as string, status: 'want', url: null, price_cents: null, notes: null }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, status: 'want' as const, url: null, price_cents: null, notes: null, created_at: now() }))
        useLivingStore.getState().addWishlistItem(w)
        break
      }
      case 'add_meal_plan': {
        const m = await insertMealPlan({ user_id: USER_ID, recipe_name: i.recipe_name as string, meal_type: i.meal_type as 'breakfast', date: (i.date as string) || null }).catch(() => ({ id: uid(), user_id: USER_ID, recipe_name: i.recipe_name as string, meal_type: i.meal_type as 'breakfast', date: (i.date as string) || null, created_at: now() }))
        useHealthStore.getState().addMealPlan(m)
        break
      }
      case 'add_health_todo': {
        const t = await insertHealthTodo({ user_id: USER_ID, description: i.description as string, status: 'todo', completed_at: null }).catch(() => ({ id: uid(), user_id: USER_ID, description: i.description as string, status: 'todo' as const, completed_at: null, created_at: now() }))
        useHealthStore.getState().addTodo(t)
        break
      }
      case 'add_living_todo': {
        const t = await insertLivingTodo({ user_id: USER_ID, description: i.description as string, status: 'todo', completed_at: null }).catch(() => ({ id: uid(), user_id: USER_ID, description: i.description as string, status: 'todo' as const, completed_at: null, created_at: now() }))
        useLivingStore.getState().addTodo(t)
        break
      }
      case 'add_refund': {
        const r = await insertRefund({ user_id: USER_ID, description: i.description as string, amount: i.amount_cents as number, returned_at: today, expected_by: i.expected_by as string, status: 'pending', resolved_at: null }).catch(() => ({ id: uid(), user_id: USER_ID, description: i.description as string, amount: i.amount_cents as number, returned_at: today, expected_by: i.expected_by as string, status: 'pending' as const, resolved_at: null, created_at: now() }))
        useFinanceStore.getState().addRefund(r)
        break
      }
      case 'add_subscription': {
        const s = await insertSubscription({ user_id: USER_ID, name: i.name as string, amount: i.amount_cents as number, period: i.period as 'monthly', renewal_day: new Date().getDate(), status: 'active', cancelled_at: null }).catch(() => ({ id: uid(), user_id: USER_ID, name: i.name as string, amount: i.amount_cents as number, period: i.period as 'monthly', renewal_day: new Date().getDate(), status: 'active' as const, cancelled_at: null, created_at: now() }))
        useFinanceStore.getState().addSubscription(s)
        break
      }
      case 'log_mood': case 'log_energy': case 'log_stress': case 'log_sleep': case 'log_water': {
        const hs = useHealthStore.getState()
        const log = hs.dailyLogs.find((l) => l.date === today)
        const updates: Record<string, unknown> = {}
        if (tc.name === 'log_mood') updates.mood = i.value
        if (tc.name === 'log_energy') updates.energy_level = i.value
        if (tc.name === 'log_stress') updates.stress_level = i.value
        if (tc.name === 'log_sleep') updates.sleep_hours = i.hours
        if (tc.name === 'log_water') updates.water_cups = Math.min((log?.water_cups ?? 0) + 1, 8)
        hs.upsertLog({ id: log?.id ?? uid(), user_id: USER_ID, date: today, mood: log?.mood ?? null, mood_note: log?.mood_note ?? null, sleep_hours: log?.sleep_hours ?? null, water_cups: log?.water_cups ?? 0, energy_level: log?.energy_level ?? null, stress_level: log?.stress_level ?? null, created_at: log?.created_at ?? now(), ...updates } as Parameters<typeof hs.upsertLog>[0])
        await upsertDailyLog({ user_id: USER_ID, date: today, ...updates }).catch(() => {})
        break
      }
    }
  } catch { /* silent */ }
}

// Global ref to open chat with a pre-filled message
let openChatWithMessage: ((msg: string) => void) | null = null
export function chatAboutItem(type: string, title: string) {
  openChatWithMessage?.(`Tell me about my ${type} "${title}" — help me think through it, unblock me, or motivate me.`)
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const contextRef = useRef('')
  const contextVersionRef = useRef('')
  const viewportRef = useRef<HTMLDivElement>(null)

  // Build a lightweight fingerprint from store sizes to detect changes
  const storeFingerprint = useCallback(() => {
    const t = useTaskStore.getState().tasks.length
    const m = useMeetingStore.getState().meetings.length
    const g = usePlanStore.getState().goals.length
    const h = useHealthStore.getState().dailyLogs.length
    const f = useFinanceStore.getState().expenses.length
    const l = useLivingStore.getState().activities.length
    const r = useRoutineStore.getState().routines.length
    return `${t}:${m}:${g}:${h}:${f}:${l}:${r}`
  }, [])

  const refreshContextIfNeeded = useCallback(() => {
    const fp = storeFingerprint()
    if (fp !== contextVersionRef.current) {
      contextRef.current = buildContext()
      contextVersionRef.current = fp
    }
  }, [storeFingerprint])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
  }, [])

  useEffect(scrollToBottom, [messages, scrollToBottom])

  useEffect(() => {
    openChatWithMessage = (msg: string) => {
      setOpen(true)
      refreshContextIfNeeded()
      setInput(msg)
      setTimeout(() => { const el = document.querySelector<HTMLInputElement>('[placeholder={STRINGS.CHAT_PH}]'); el?.focus() }, 200)
    }
    return () => { openChatWithMessage = null }
  })

  const handleOpen = () => {
    if (!open) refreshContextIfNeeded()
    setOpen((o) => !o)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    refreshContextIfNeeded()
    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)
    try {
      const system = `${SYSTEM_PROMPT}\n\n--- USER CONTEXT ---\n${contextRef.current}\n--- END CONTEXT ---`
      const apiMessages = next.map((m) => ({ role: m.role, content: m.content }))
      const { text: reply, toolCalls } = await callClaudeWithTools(apiMessages, system, TOOLS)
      for (const tc of toolCalls) await executeAction(tc)
      const actionSummary = toolCalls.length > 0 ? `\n✅ ${toolCalls.map((tc) => tc.name.replace(/_/g, ' ')).join(', ')}` : ''
      setMessages([...next, { role: 'assistant', content: (reply || 'Done!') + actionSummary }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      <Transition mounted={open} transition="slide-up" duration={200}>
        {(styles) => (
          <Paper
            shadow="xl"
            radius="md"
            style={{ ...styles, width: 400, height: 500, marginBottom: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            withBorder
          >
            {/* Header */}
            <Group px="lg" py="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <Text fw={600} size="sm" c="white">Atlas Chat</Text>
            </Group>

            {/* Messages */}
            <ScrollArea flex={1} px="md" py="sm" viewportRef={viewportRef}>
              <Stack gap="xs">
                {messages.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xl">{STRINGS.CHAT_EMPTY}</Text>
                )}
                {messages.map((m, i) => (
                  <Box
                    key={i}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      px="sm"
                      py={6}
                      radius="lg"
                      bg={m.role === 'user' ? 'teal.6' : 'dark.6'}
                    >
                      <Box
                        style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--mantine-font-size-sm)', color: 'white' }}
                        dangerouslySetInnerHTML={{ __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px">$1</code>')
                          .replace(/\n/g, '<br/>')
                        }}
                      />
                    </Paper>
                  </Box>
                ))}
                {loading && (
                  <Box style={{ alignSelf: 'flex-start' }}>
                    <Paper px="md" py="sm" radius="lg" bg="var(--mantine-color-dark-6)">
                      <Text size="sm" c="dimmed">{STRINGS.CHAT_THINKING}</Text>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            {/* Input */}
            <Group px="lg" py="md" gap="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <TextInput
                placeholder={STRINGS.CHAT_PH}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                style={{ flex: 1 }}
                size="sm"
                disabled={loading}
              />
              <ActionIcon variant="filled" color="teal" onClick={send} disabled={loading || !input.trim()} size="lg">
                <ChatCircle size={18} />
              </ActionIcon>
            </Group>
          </Paper>
        )}
      </Transition>

      {/* Floating button */}
      <ActionIcon
        size={56}
        radius="xl"
        variant="gradient"
        gradient={{ from: 'teal', to: 'cyan' }}
        onClick={handleOpen}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        <ChatCircle size={28} weight="fill" color="white" />
      </ActionIcon>
    </Box>
  )
}
