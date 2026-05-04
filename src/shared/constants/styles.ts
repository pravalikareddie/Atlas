// ─── Shared style tokens ──────────────────────────────────────────────────────
// Extracted from repeated inline styles across components.
// Use these instead of hardcoding rgba/hex values in JSX.

export const COLORS = {
  // White overlays (most common pattern in the codebase)
  WHITE_04: 'rgba(255,255,255,0.04)',
  WHITE_05: 'rgba(255,255,255,0.05)',
  WHITE_06: 'rgba(255,255,255,0.06)',
  WHITE_07: 'rgba(255,255,255,0.07)',
  WHITE_08: 'rgba(255,255,255,0.08)',
  WHITE_10: 'rgba(255,255,255,0.1)',
  WHITE_12: 'rgba(255,255,255,0.12)',
  WHITE_15: 'rgba(255,255,255,0.15)',
  WHITE_18: 'rgba(255,255,255,0.18)',
  WHITE_20: 'rgba(255,255,255,0.2)',
  WHITE_25: 'rgba(255,255,255,0.25)',
  WHITE_30: 'rgba(255,255,255,0.3)',
  WHITE_35: 'rgba(255,255,255,0.35)',
  WHITE_40: 'rgba(255,255,255,0.4)',
  WHITE_45: 'rgba(255,255,255,0.45)',
  WHITE_50: 'rgba(255,255,255,0.5)',
  WHITE_55: 'rgba(255,255,255,0.55)',
  WHITE_60: 'rgba(255,255,255,0.6)',
  WHITE_65: 'rgba(255,255,255,0.65)',
  WHITE_70: 'rgba(255,255,255,0.7)',
  WHITE_75: 'rgba(255,255,255,0.75)',
  WHITE_80: 'rgba(255,255,255,0.8)',
  WHITE_85: 'rgba(255,255,255,0.85)',
  WHITE_90: 'rgba(255,255,255,0.9)',

  // Black overlays
  BLACK_70: 'rgba(0,0,0,0.7)',

  // Danger / red overlays
  DANGER_06: 'rgba(240,80,80,0.06)',
  DANGER_02: 'rgba(240,80,80,0.02)',
  DANGER_10: 'rgba(240,80,80,0.1)',
  DANGER_12: 'rgba(240,80,80,0.12)',
  DANGER_15: 'rgba(240,80,80,0.15)',
  DANGER_30: 'rgba(240,80,80,0.3)',
  DANGER_40: 'rgba(240,80,80,0.4)',

  // Teal / brand accent
  TEAL_15: 'rgba(56,190,201,0.15)',
  TEAL_40: 'rgba(56,190,201,0.4)',
  TEAL_50: 'rgba(56,190,201,0.5)',
  TEAL_60: 'rgba(56,190,201,0.6)',
  TEAL_70: 'rgba(56,190,201,0.7)',
  TEAL_95: 'rgba(56,190,201,0.95)',
  TEAL_20: 'rgba(56,190,201,0.2)',

  // Warning
  WARNING_30: 'rgba(255,200,0,0.3)',
  WARNING_50: 'rgba(255,200,0,0.5)',

  // Spotify green (focus screen disc)
  SPOTIFY_10: 'rgba(29,185,84,0.1)',
  SPOTIFY_15: 'rgba(29,185,84,0.15)',
  SPOTIFY_20: 'rgba(29,185,84,0.2)',
  SPOTIFY_30: 'rgba(29,185,84,0.3)',
  SPOTIFY_40: 'rgba(29,185,84,0.4)',
  SPOTIFY_80: 'rgba(29,185,84,0.8)',

  // Dark button text
  DARK_TEXT_70: 'rgba(0,0,0,0.7)',
  DARK_TEXT_75: 'rgba(0,0,0,0.75)',
} as const

export const GRADIENTS = {
  FOCUS_BG: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2e 100%)',
  RESULT_SUCCESS: 'linear-gradient(135deg, #0d2e1a, #0a1f0d)',
  SIDEBAR: 'linear-gradient(180deg, #0e1624 0%, #111d2e 100%)',
  BRAND_TEXT: 'linear-gradient(135deg, #38bec9, #74b3ff)',
  IMAGE_OVERLAY: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))',
  IMAGE_OVERLAY_30: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))',
} as const

// Pill-shaped border radius
export const RADIUS_PILL = 9999

// Common transition
export const TRANSITION_FAST = 'all 0.15s ease'

// Shared unstyled input style (used in QuickAddModal, CalendarScreen, etc.)
export const UNSTYLED_INPUT_STYLES = {
  input: {
    color: 'white',
    fontWeight: 600,
    fontSize: 16,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 'var(--mantine-radius-lg)',
    padding: '10px 14px',
    '::placeholder': { color: 'rgba(255,255,255,0.6)' },
  },
} as const
