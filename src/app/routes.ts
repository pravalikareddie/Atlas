// ─── routes.ts ─────────────────────────────────────────────────────────────────
export const ROUTES = {
  TODAY: '/today',
  TASKS: '/tasks',

  FINANCE: '/finance',
  FINANCE_LOG: '/finance/log',
  FINANCE_LOG_EXPENSE: '/finance/log/expense',
  FINANCE_LOG_REFUND: '/finance/log/refund',
  FINANCE_LOG_SPLITWISE: '/finance/log/splitwise',
  FINANCE_LOG_SUBSCRIPTION: '/finance/log/subscription',
  FINANCE_BUDGETS: '/finance/budgets',
  FINANCE_ACCOUNTS: '/finance/accounts',
  FINANCE_TAX: '/finance/tax',
  FINANCE_BLEED: '/finance/bleed',
  FINANCE_EXPENSES: '/finance/expenses',
  FOCUS: '/focus',
  HEALTH: '/health',
  HEALTH_MEDICAL: '/health/medical',
  HEALTH_HISTORY: '/health/history',

  LIVING: '/living',
  LIVING_ACTIVITIES: '/living/activities',
  LIVING_DONE: '/living/done',

  GROWTH: '/growth',
  GROWTH_BOOKS: '/growth/books',
  GROWTH_CALENDAR: '/growth/calendar',
  GROWTH_AREA: (areaId: string) => `/growth/${areaId}`,

  PLAN: '/plan',
  PLAN_GOALS: '/plan/goals',
  PLAN_PROJECTS: '/plan/projects',
  PLAN_ROADMAPS: '/plan/roadmaps',
  PLAN_GOAL_DETAIL: (goalId: string) => `/plan/goals/${goalId}`,
  PLAN_PROJECT_DETAIL: (projectId: string) => `/plan/projects/${projectId}`,
  PLAN_ROADMAP_DETAIL: (roadmapId: string) => `/plan/roadmaps/${roadmapId}`,

  ROUTINES: '/routines',
  ROUTINE_RUN: (id: string) => `/routines/${id}/run`,
  ROUTINE_EDIT: (id: string) => `/routines/${id}/edit`,
  ROUTINE_NEW_EDIT: '/routines/new/edit',
} as const
