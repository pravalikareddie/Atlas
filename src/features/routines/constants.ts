// ─── constants.ts additions ───────────────────────────────────────────────────

import { RoutineType } from './RoutinesScreen'

export const ROUTINE_GRADIENTS = [
  'linear-gradient(135deg, #0f1729, #1a2a4a)',
  'linear-gradient(135deg, #7950f2, #f06595)',
  'linear-gradient(135deg, #fd7e14, #fa5252)',
  'linear-gradient(135deg, #40c057, #38d9a9)',
  'linear-gradient(135deg, #228be6, #9775fa)',
  'linear-gradient(135deg, #f06595, #ffa94d)',
  'linear-gradient(135deg, #4263eb, #74c0fc)',
] as const

export const ROUTINE_TYPE = {
  HABIT: 'habit',
  LEARNING: 'learning',
  FINANCE: 'finance',
  NUTRITION: 'nutrition',
  HOME: 'home',
  HEALTH: 'health',
  TRAVEL: 'travel',
  OTHER: 'other',
} as const

export const ROUTINE_TYPE_LABEL: Record<RoutineType, string> = {
  habit: 'Habit',
  learning: 'Learning',
  finance: 'Finance',
  nutrition: 'Nutrition',
  home: 'Home',
  health: 'Health',
  travel: 'Travel',
  other: 'Other',
}
export const ROUTINE_CADENCE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  TRIGGERED: 'triggered',
  ONCE: 'once',
  NONE: 'none', // add this — ad-hoc, no schedule
} as const

export const CADENCE_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  triggered: 'Triggered',
  once: 'One-time',
  none: 'Ad-hoc', // add this
}

export const TRIGGERED_TYPES = [
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'sick', label: 'Sick day', emoji: '🤒' },
  { key: 'period', label: 'Period', emoji: '🌸' },
  { key: 'guests', label: 'Guests', emoji: '🏠' },
  { key: 'post-flight', label: 'Post-flight', emoji: '🛬' },
] as const

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const ROUTINE_TYPE_EMOJI: Record<string, string> = {
  habit: '🔄',
  learning: '📚',
  finance: '💰',
  nutrition: '🥗',
  home: '🏠',
  health: '💪',
  travel: '✈️',
  other: '⚡',
}
