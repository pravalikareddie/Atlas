import { STRINGS } from '../features/tasks/constants/strings'

export const QUICK_LINKS = [
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/finance/expenses', label: 'Expenses', icon: '💸' },
  { to: '/growth/routines', label: 'Routines', icon: '🔄' },
  { to: '/inbox/shopping', label: 'Shopping', icon: '🛒' },
]

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
      { to: '/growth', label: 'Plan', icon: '🧠' },
      { to: '/inbox', label: STRINGS.NAV_INBOX, icon: '📥' },
    ],
  },
  {
    label: STRINGS.NAV_LIFE,
    items: [
      { to: '/finance', label: STRINGS.NAV_FINANCE, icon: '💜' },
      { to: '/health', label: STRINGS.NAV_HEALTH, icon: '💚' },
      { to: '/living', label: STRINGS.NAV_LIVING, icon: '🌟' },
    ],
  },
]
