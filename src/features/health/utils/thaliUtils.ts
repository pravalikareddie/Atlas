import { format, startOfWeek } from 'date-fns'

export function getWeekId() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function getTodayDayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1 // Mon=0 ... Sun=6
}

export function planKey(meal: string, day: number, catId: string) {
  return `${meal}:${day}:${catId}`
}

export function customKey(meal: string, catId: string) {
  return `${meal}:${catId}`
}
