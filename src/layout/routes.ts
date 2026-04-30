import { STRINGS } from '../features/tasks/constants/strings'

export const NAV_SECTIONS = [
  {
    label: STRINGS.NAV_DAILY,
    items: [
      { to: '/today', label: STRINGS.NAV_TODAY, icon: '☀️' },
      { to: '/focus', label: STRINGS.NAV_FOCUS, icon: '🎯' },
    ],
  },
  {
    label: STRINGS.NAV_PLAN,
    items: [
      { to: '/plan/goals', label: STRINGS.NAV_GOALS, icon: '🎯' },
      { to: '/routines', label: STRINGS.NAV_ROUTINES, icon: '🔄' },
      { to: '/tasks', label: STRINGS.NAV_TASKS, icon: '✅' },
      { to: '/inbox', label: STRINGS.NAV_INBOX, icon: '📥' },
    ],
  },
  {
    label: STRINGS.NAV_LIFE,
    items: [
      { to: '/finance', label: STRINGS.NAV_FINANCE, icon: '💜' },
      { to: '/health', label: STRINGS.NAV_HEALTH, icon: '💚' },
      { to: '/living', label: STRINGS.NAV_LIVING, icon: '🌟' },
      { to: '/growth', label: STRINGS.NAV_GROWTH, icon: '🧠' },
    ],
  },
]
