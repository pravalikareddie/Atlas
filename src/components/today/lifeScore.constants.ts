import { theme } from '../../theme'

// ─── Pull from theme ──────────────────────────────────────────────────────────

const themeOther = theme.other!
const card = themeOther.scoreCard as Record<string, string>
const areaColors = themeOther.areaColors as Record<string, string>
const thresholds = themeOther.scoreThresholds as { great: number; okay: number }

// ─── Score thresholds ─────────────────────────────────────────────────────────

export const SCORE_THRESHOLD = {
  GREAT: thresholds.great,
  OKAY: thresholds.okay,
} as const

// ─── Targets ──────────────────────────────────────────────────────────────────

export const TARGET = {
  SLEEP_HOURS: 7,
  WATER_CUPS: 8,
} as const

// ─── Area definitions (colors from theme) ─────────────────────────────────────

export const AREAS_META = [
  { key: 'work', label: 'Work', emoji: '💼', color: areaColors.work },
  { key: 'personal', label: 'Personal', emoji: '🌟', color: areaColors.living },
  { key: 'money', label: 'Money', emoji: '💰', color: areaColors.money },
  { key: 'health', label: 'Health', emoji: '💚', color: areaColors.health },
  { key: 'growth', label: 'Growth', emoji: '🧠', color: areaColors.learning },
] as const

// ─── Strings ──────────────────────────────────────────────────────────────────

export const SCORE_STRINGS = {
  LABEL_GREAT: 'Thriving',
  TIP_MONEY_NO_BUDGET: 'No budget set',
  LABEL_OKAY: 'Getting there',
  LABEL_BAD: 'Needs attention',
  STATUS_STRONG: 'Strong',
  STATUS_MODERATE: 'Moderate',
  STATUS_WEAK: 'Weak',
  STATUS_ON_TRACK: 'On track',
  STATUS_NEEDS_WORK: 'Needs work',
  STATUS_FALLING_BEHIND: 'Falling behind',
  SECTION_FEEDS: 'What feeds this score',
  SECTION_DRAGGING: 'Dragging it down',
  SECTION_IMPROVE: 'How to improve',
  CLOSE: 'Close',
  METRIC_SPRINT_DONE: 'Sprint tasks done',
  METRIC_OVERDUE: 'Overdue tasks',
  METRIC_SUBTASKS: 'Subtasks completed',
  METRIC_BUDGET_USED: 'Budget used',
  METRIC_SPENT_VS_BUDGET: 'Spent vs budget',
  METRIC_MOOD: 'Mood (avg)',
  METRIC_ENERGY: 'Energy (avg)',
  METRIC_STRESS: 'Stress (avg)',
  METRIC_HYDRATION: 'Hydration (cups/day)',
  METRIC_LEARNING_ITEMS: 'Learning items done',
  METRIC_BOOKS: 'Books on track',
  METRIC_SLEEP_DAYS: 'Days ≥7hr',
  METRIC_SLEEP_AVG: 'Avg hours',
  METRIC_SLEEP_LOGGED: 'Days logged',
  METRIC_PROJ_DONE: 'Completed this month',
  METRIC_PROJ_ACTIVE: 'Active projects',
  METRIC_LIVING_DONE: 'Personal tasks done',
  METRIC_LIVING_OVERDUE: 'Overdue personal',
  TIP_WORK_OVERDUE: 'Clear overdue tasks to boost this score',
  TIP_WORK_OK: 'Keep completing sprint tasks daily',
  TIP_MONEY_OVER: "You're over budget — cut discretionary spending",
  TIP_MONEY_OK: 'Staying under budget, nice!',
  TIP_HEALTH_STRESS: 'High stress — try a break or walk',
  TIP_HEALTH_MOOD: 'Mood is low — check in with yourself',
  TIP_HEALTH_OK: 'Keep logging daily for accuracy',
  TIP_LEARNING_BEHIND: 'Complete planned learning items this month',
  TIP_LEARNING_OK: 'Great progress on learning!',
  TIP_SLEEP_BAD: 'Aim for 7+ hours — sleep is foundational',
  TIP_SLEEP_OK: 'Solid sleep consistency',
  TIP_PROJ_BEHIND: 'Ship a side project this month',
  TIP_PROJ_OK: 'Keep building!',
  TIP_LIVING_BEHIND: 'Knock out some personal tasks',
  TIP_LIVING_OK: 'Personal life on track!',
} as const

// ─── Style tokens (from theme.other.scoreCard) ────────────────────────────────

export const SCORE_STYLES = {
  BG_BASE: card.bg,
  BG_CARD: card.bgGradient,
  BG_HEADER: card.headerGradient,
  BORDER_SUBTLE: card.borderSubtle,
  BORDER_CARD: card.border,
  TEXT_PRIMARY: card.textPrimary,
  TEXT_SECONDARY: card.textSecondary,
  TEXT_TERTIARY: card.textTertiary,
  TEXT_MUTED: card.textMuted,
  RING_BG: card.ringBg,
  METRIC_BG: card.metricBg,
  METRIC_BORDER: card.metricBorder,
  RADIUS_MODAL: 24,
  RADIUS_CARD: 16,
  RADIUS_METRIC: 12,
  RADIUS_PILL: 999,
} as const

export const SCORE_COLOR_MAP = {
  good: 'teal',
  okay: 'yellow',
  bad: 'red',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLD.GREAT) return 'teal'
  if (score >= SCORE_THRESHOLD.OKAY) return 'yellow'
  return 'red'
}

export function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLD.GREAT) return SCORE_STRINGS.LABEL_GREAT
  if (score >= SCORE_THRESHOLD.OKAY) return SCORE_STRINGS.LABEL_OKAY
  return SCORE_STRINGS.LABEL_BAD
}

export function getStatusLabel(s: 'good' | 'okay' | 'bad'): string {
  if (s === 'good') return SCORE_STRINGS.STATUS_ON_TRACK
  if (s === 'okay') return SCORE_STRINGS.STATUS_NEEDS_WORK
  return SCORE_STRINGS.STATUS_FALLING_BEHIND
}

export function getStrengthLabel(score: number): string {
  if (score >= SCORE_THRESHOLD.GREAT) return SCORE_STRINGS.STATUS_STRONG
  if (score >= SCORE_THRESHOLD.OKAY) return SCORE_STRINGS.STATUS_MODERATE
  return SCORE_STRINGS.STATUS_WEAK
}
