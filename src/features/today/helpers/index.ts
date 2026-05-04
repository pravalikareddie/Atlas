import { format } from 'date-fns'
import { STRINGS } from '../../tasks/constants/strings'
import { AI_CACHE_KEY, AI_CACHE_TS_KEY, AI_CACHE_TTL_MS } from '../constants'

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: STRINGS.MORNING, emoji: STRINGS.EMOJI_MORNING }
  if (h < 17) return { text: STRINGS.AFTERNOON, emoji: STRINGS.EMOJI_AFTERNOON }
  return { text: STRINGS.EVENING, emoji: STRINGS.EMOJI_EVENING }
}

export function getWeekNumber(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getWeekInfo(): string {
  const d = new Date()
  return `${format(d, 'EEE, MMM d')} · Wk ${getWeekNumber(d)}`
}

export function getCachedSummary(): string | null {
  try {
    const text = sessionStorage.getItem(AI_CACHE_KEY)
    const ts = sessionStorage.getItem(AI_CACHE_TS_KEY)
    if (text && ts && Date.now() - parseInt(ts) < AI_CACHE_TTL_MS) return text
  } catch {}
  return null
}

export function setCachedSummary(text: string) {
  try {
    sessionStorage.setItem(AI_CACHE_KEY, text)
    sessionStorage.setItem(AI_CACHE_TS_KEY, String(Date.now()))
  } catch {}
}
