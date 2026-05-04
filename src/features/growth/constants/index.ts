// ─── Growth Feature Constants ─────────────────────────────────────────────────

export const BOOK_STATUS = {
  WANT: 'want',
  READING: 'reading',
  DONE: 'done',
} as const

export type BookStatusType = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS]

export const BOOK_STATUS_LABEL: Record<BookStatusType, string> = {
  want: 'Want to read',
  reading: 'Reading',
  done: 'Done',
}

export const BOOK_STATUS_EMOJI: Record<BookStatusType, string> = {
  done: '✅',
  reading: '📖',
  want: '📚',
}

export const YEARLY_BOOK_GOAL = 52

export const GROWTH_STRINGS = {
  // Overview
  WIN_EMOJI: '🧠',
  SESSIONS_AND_BOOKS_SEPARATOR: ' · ',

  // Tabs
  TAB_OVERVIEW: 'Overview',
  TAB_BOOKS: 'Books',
  TAB_CALENDAR: 'Calendar',

  // Layout
  TITLE: '🧠 Plan Life',

  // Books
  TARGET_MONTH_OPTIONAL: 'Target month (optional)',
  DUE: 'Due',

  // Calendar / Learning
  UNSCHEDULED: 'Unscheduled',
  ADD_LEARNING_ITEM_TITLE: 'Add Learning Item',
  DATE_OPTIONAL: 'Schedule for (optional)',
  WHAT_WILL_YOU_LEARN: 'What will you learn?',
} as const

export const CALENDAR_DAY_HEADERS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const
