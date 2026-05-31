import { format } from 'date-fns'
import { STRINGS } from '../../tasks/constants/strings'

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
