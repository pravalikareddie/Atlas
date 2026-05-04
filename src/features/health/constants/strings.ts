export const STRINGS = {
  // Layout
  FEATURE_TITLE: '💚 Health & Body',
  TAB_OVERVIEW: 'Overview',
  TAB_MEDICAL: 'Medical',
  TAB_HISTORY: 'History',

  // Overview
  FEELING_WEEK: (label: string) => `Feeling ${label} this week`,
  HOW_FEELING: 'How are you feeling?',
  ENERGY_PREFIX: 'Energy',
  STRESS_PREFIX: 'Stress',
  LOG_ENERGY_CTA: 'Log energy to see it here',
  LAST_7_DAYS: 'Last 7 days',
  NEEDS_ATTENTION: 'Needs attention',
  OVERDUE_SUFFIX: 'overdue',
  REFILL_IN: (days: number) => `refill in ${days}d`,

  // Stats
  SLEEP: 'Sleep',
  WATER: 'Water',
  MOOD: 'Mood',
  ENERGY: 'Energy',
  STRESS: 'Stress',
  AVG_NIGHT: 'avg/night',
  CUPS_AVG_DAY: 'cups avg/day',
  AVG_5: 'avg/5',

  // Empty states
  EMPTY_OVERVIEW: 'Start logging mood, sleep, and water',
  EMPTY_OVERVIEW_SUB: 'Your health picture will appear here.',
  EMPTY_HISTORY: 'Log mood, sleep, and water daily to see trends here.',
  EMPTY_APPTS: 'No appointments tracked. Add one to stop avoiding.',
  EMPTY_MEDS: 'No medications or supplements added.',
  EMPTY_TODOS: 'No health tasks.',

  // Medical - Appointments
  APPOINTMENTS: 'Appointments',
  ADD_APPOINTMENT: '+ add appointment',
  OVERDUE: 'Overdue',
  UPCOMING: 'Upcoming',
  OTHER: 'Other',
  BOOK_NOW: 'Book now',
  SNOOZE_2W: 'Snooze 2 weeks',
  LAST_VISITED: 'last visited',
  NEVER_VISITED: 'never visited',
  IN_DAYS: (n: number) => `in ${n} days`,
  MONTHS_OVERDUE: (n: number) => `${n} months overdue`,
  DAYS_OVERDUE: (n: number) => `${n} days overdue`,

  // Medical - Medications
  MEDICATIONS: 'Medications & Supplements',
  ADD_MED: '+ add',
  REFILL: 'refill',
  TRACK_REFILL: 'Track refill',

  // Medical - Todos
  HEALTH_TODOS: 'Health Todos',
  PH_TODO: 'New health task...',

  // Form labels
  FIELD_NAME: 'Name',
  FIELD_TYPE: 'Type',
  FIELD_LAST_VISITED: 'Last visited (optional)',
  FIELD_NEXT_APPT: 'Next appointment (optional)',
  FIELD_FREQUENCY: 'How often (optional)',
  FIELD_NOTES: 'Notes (optional)',
  FIELD_REFILL_DATE: 'Refill date',

  // Placeholders
  PH_APPT_NAME: 'Dentist, Eye doctor...',

  // Form options
  APPT_TYPES: [
    { value: 'dentist', label: 'Dentist' },
    { value: 'eye', label: 'Eye' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'dermatologist', label: 'Dermatologist' },
    { value: 'therapy', label: 'Therapy' },
    { value: 'other', label: 'Other' },
  ],
  FREQ_OPTIONS: [
    { value: '', label: 'No schedule' },
    { value: '3', label: 'Every 3 months' },
    { value: '6', label: 'Every 6 months' },
    { value: '12', label: 'Every year' },
    { value: '24', label: 'Every 2 years' },
  ],
  MED_FREQUENCIES: ['daily', 'weekly', 'as_needed'] as const,

  // History
  GOAL: 'goal',
  AVG: 'avg',

  // Shared
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  CONFIRM_DELETE_APPT: 'Remove this appointment?',
  ADD: '+ add',
  REQUIRED: 'This field is required',

  // Tabs
  TAB_MEAL_PREP: 'Meal ideas',
  TAB_SHOPPING: 'Shopping',

  // Meal Prep
  MEAL_PREP: 'Meal ideas',
  ADD_MEAL: 'Add meal',
  EMPTY_MEALS: 'Plan your meals for the week.',
  FIELD_RECIPE: 'Recipe name',
  FIELD_MEAL_TYPE: 'Meal type',
  FIELD_DATE: 'Date',
  PH_RECIPE: 'Chicken stir fry, Overnight oats...',
  CONFIRM_DELETE_MEAL: 'Remove this meal?',
  SAVED_RECIPES: 'Saved Recipes',
  EMPTY_RECIPES: 'Save recipe names for later.',
  PLAN_IT: 'Plan',
  MEAL_TYPES: [
    { value: 'breakfast', label: '🌅 Breakfast' },
    { value: 'lunch', label: '☀️ Lunch' },
    { value: 'dinner', label: '🌙 Dinner' },
    { value: 'snack', label: '🍎 Snack' },
  ],

  // Shopping
  SHOPPING_LIST: 'Shopping List',
  EMPTY_SHOPPING: 'Your shopping list is empty.',
  PH_SHOPPING: 'Eggs, milk, chicken...',
  CONFIRM_DELETE_ITEM: 'Remove this item?',
} as const

export const MOOD_EMOJI = ['', '😞', '😕', '😐', '🙂', '😊'] as const
export const MOOD_LABEL = ['', 'rough', 'low', 'okay', 'good', 'great'] as const
export const ENERGY_LABEL = [
  '',
  'drained',
  'low',
  'okay',
  'good',
  'great',
] as const
