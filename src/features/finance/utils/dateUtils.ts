import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInWeeks,
  addDays,
  isToday,
  isYesterday,
  isBefore,
  startOfMonth,
  endOfMonth,
  getDate,
} from 'date-fns'

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function formatMonthDisplay(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1)
  return format(d, 'MMMM yyyy')
}

export function daysLeftInMonth(): number {
  const now = new Date()
  const end = endOfMonth(now)
  return differenceInDays(end, now)
}

export function formatAge(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const hours = differenceInHours(now, date)
  if (hours < 24) return `${hours}h`
  const days = differenceInDays(now, date)
  if (days < 7) return `${days} days`
  const weeks = differenceInWeeks(now, date)
  return `${weeks} week${weeks > 1 ? 's' : ''}`
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'today'
  if (isYesterday(d)) return 'yesterday'
  return format(d, 'MMM d')
}

export function defaultExpectedBy(): string {
  return format(addDays(new Date(), 7), 'yyyy-MM-dd')
}

export function isOverdue(expectedBy: string): boolean {
  return isBefore(new Date(expectedBy), new Date())
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), new Date(dateStr))
}

export function daysUntilRenewal(renewalDay: number): number {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), renewalDay)
  if (isBefore(thisMonth, now)) {
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      renewalDay,
    )
    return differenceInDays(nextMonth, now)
  }
  return differenceInDays(thisMonth, now)
}

export function getStartOfMonth(): Date {
  return startOfMonth(new Date())
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getCurrentDay(): number {
  return getDate(new Date())
}
