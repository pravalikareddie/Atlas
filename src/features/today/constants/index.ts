import { STRINGS } from '../../tasks/constants/strings'
import { theme } from '../../../theme'

const metricColors = theme.other!.metricColors as Record<string, string>

// ─── Types ────────────────────────────────────────────────────────────────────

export type TodayTab = 'today' | 'growth' | 'areas'
export type ResetStage = 'breathe' | 'dump' | 'reality' | 'one' | 'recommit'
export type BreathePhase = 'in' | 'hold' | 'out'

// ─── Design tokens ────────────────────────────────────────────────────────────

export const GRADIENTS = {
  HERO: 'linear-gradient(135deg, var(--mantine-color-navy-9) 0%, var(--mantine-color-navy-8) 40%, var(--mantine-color-navy-7) 100%)',
  HERO_GLOW:
    'radial-gradient(ellipse at 80% 50%, rgba(99, 179, 237, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(154, 117, 234, 0.12) 0%, transparent 50%)',
  PRIMARY:
    'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
  DARK_CARD:
    'linear-gradient(135deg, var(--mantine-color-navy-9), var(--mantine-color-navy-8))',
  RESET_BG:
    'linear-gradient(180deg, var(--mantine-color-navy-9) 0%, var(--mantine-color-navy-8) 100%)',
} as const

/** Card header backgrounds keyed by column color name */
export const COLUMN_HEADER_BG: Record<string, string> = {
  violet:
    'linear-gradient(135deg, var(--mantine-color-violet-7), var(--mantine-color-blue-6))',
  teal: 'linear-gradient(135deg, var(--mantine-color-teal-7), var(--mantine-color-green-6))',
  green:
    'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-teal-6))',
  pink: 'linear-gradient(135deg, var(--mantine-color-pink-7), var(--mantine-color-coral-6))',
} as const

export const GLASS = {
  SUBTLE: {
    background: 'var(--mantine-color-default-hover)',
    border: '1px solid var(--mantine-color-default-border)',
  },
  TEAL: {
    background: 'var(--mantine-color-teal-light)',
    border: '1px solid var(--mantine-color-teal-3)',
  },
  DANGER: {
    background: 'var(--mantine-color-red-light)',
    border: '1px solid var(--mantine-color-red-3)',
  },
} as const

// ─── Reset mode ───────────────────────────────────────────────────────────────

export const RESET_BREATHE_CYCLES_BEFORE_SKIP = 2
export const RESET_BREATHE_PHASE_MS = 4000
export const RESET_AI_MAX_TOKENS = 200
export const RESET_AI_FALLBACK = [
  'Clear all overdue tasks this week',
  'Focus on your top goal only',
  'Get monthly finances back on track',
]

// ─── Audit ────────────────────────────────────────────────────────────────────

export const AUDIT_MAX_GOALS = 4
export const AUDIT_MAX_WINS = 5

// ─── AI cache ─────────────────────────────────────────────────────────────────

export const AI_CACHE_KEY = 'atlas_ai_today_summary'
export const AI_CACHE_TS_KEY = 'atlas_ai_today_summary_ts'
export const AI_CACHE_TTL_MS = 30 * 60 * 1000

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export const TABS: { value: TodayTab; label: string }[] = [
  { value: 'today', label: '☀️ Today' },
  { value: 'growth', label: '🌱 Growth' },
]

export const BREATHE_PHASES: BreathePhase[] = ['in', 'hold', 'out']

export const BREATHE_LABELS: Record<BreathePhase, string> = {
  in: STRINGS.BREATHE_IN,
  hold: STRINGS.BREATHE_HOLD,
  out: STRINGS.BREATHE_OUT,
}

// ─── Health score scale maximums ──────────────────────────────────────────────
// Used both in the score formula (useLifeScore) and in the chart Y-axis (AreaCards).
// If a scale changes (e.g. mood becomes 1–10), update here only.

export const HEALTH_SCALE = {
  MOOD: 5,
  ENERGY: 5,
  STRESS: 5, // lower is better; inverted in formula
  SLEEP_MAX: 12,
  WATER_MAX: 8,
} as const

// ─── History window ───────────────────────────────────────────────────────────

/** Number of months shown in the MoneyCard bar chart */
export const MONTHLY_HISTORY_MONTHS = 6

/** Number of days fetched for the HealthCard line chart */
export const HEALTH_LOG_DAYS = 30

// ─── Health metric definitions ────────────────────────────────────────────────
// Typed to actual DailyLog field names so the chart key always matches the data.

export type DailyLogMetricKey =
  | 'mood'
  | 'energy_level'
  | 'sleep_hours'
  | 'water_cups'

export interface MetricDef {
  label: string
  key: DailyLogMetricKey
  max: number
  unit: string
  color: string
}

export const HEALTH_METRICS: MetricDef[] = [
  {
    label: 'Mood',
    key: 'mood',
    max: HEALTH_SCALE.MOOD,
    unit: '/5',
    color: metricColors.mood,
  },
  {
    label: 'Energy',
    key: 'energy_level',
    max: HEALTH_SCALE.ENERGY,
    unit: '/5',
    color: metricColors.energy,
  },
  {
    label: 'Sleep',
    key: 'sleep_hours',
    max: HEALTH_SCALE.SLEEP_MAX,
    unit: 'hr',
    color: metricColors.sleep,
  },
  {
    label: 'Water',
    key: 'water_cups',
    max: HEALTH_SCALE.WATER_MAX,
    unit: 'cups',
    color: metricColors.water,
  },
]

// ─── Card visual tokens ───────────────────────────────────────────────────────
// All sizing, spacing, and opacity values used in AreaCards live here.
// Anything that maps to a Mantine theme token uses the CSS variable directly.

export const CARD = {
  BORDER_RADIUS: 'var(--mantine-radius-md)',
  BORDER: '1px solid var(--mantine-color-navy-7)',

  EMOJI_SIZE: '1.125rem', // 18px via em so it scales with root font
  LABEL_LETTER_SPACING: '0.0625rem', // 1px

  STAT_FONT_SIZE: '1.75rem', // 28px — display number
  CHART_HEIGHT: 150, // px — recharts needs a number
  CHART_YAXIS_WIDTH: 25, // px — recharts needs a number
  MONEY_BAR_HEIGHT: 48, // px
  MONEY_BAR_MIN_HEIGHT: 2, // px — ensures zero-spend bars are still visible
  MONEY_BAR_RADIUS: 'var(--mantine-radius-xs)',

  /** Pill tab border radius — large enough to always be fully round */
  TAB_RADIUS: '624rem',
  TAB_TRANSITION: 'background 0.15s ease',
} as const

// ─── Opacity scale for dimmed text ────────────────────────────────────────────
// Five ad-hoc rgba values collapsed into a named scale.
// Use CSS custom properties so they can be overridden by the theme.

export const DIM = {
  /** Section labels, axis ticks, legends */
  LOW: 'rgba(255,255,255,0.25)',
  /** Stat sub-labels, month labels */
  MID: 'rgba(255,255,255,0.4)',
  /** Body text, "No budget set" */
  HIGH: 'rgba(255,255,255,0.5)',
  /** Metric label, current-value label */
  BODY: 'rgba(255,255,255,0.6)',
  /** Inactive tab text */
  TAB_INACTIVE: 'rgba(255,255,255,0.5)',
  /** Inactive tab background */
  TAB_BG: 'rgba(255,255,255,0.05)',
  /** Budget line marker on money bar chart */
  BUDGET_LINE: 'rgba(255,255,255,0.45)',
  /** Tooltip border */
  TOOLTIP_BORDER: 'rgba(255,255,255,0.1)',
  /** Chart axis lines */
  AXIS: 'rgba(255,255,255,0.2)',
} as const

// ─── Tooltip style ────────────────────────────────────────────────────────────
// Recharts contentStyle — extracted so it isn't re-created on every render.

export const TOOLTIP_CONTENT_STYLE = {
  background: 'var(--mantine-color-dark-9)',
  border: `1px solid ${DIM.TOOLTIP_BORDER}`,
  borderRadius: 'var(--mantine-radius-sm)',
  fontSize: 'var(--mantine-font-size-xs)',
} as const
