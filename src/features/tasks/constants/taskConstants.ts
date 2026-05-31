import { TaskType } from '../types/task.types'

export const USER_ID = '00000000-0000-0000-0000-000000000001'

export const WORK_TYPES: TaskType[] = [
  'sprint',
  'followup',
  'meeting_prep',
  'misc',
]

export const PERSONAL_TYPES: TaskType[] = [
  'personal',
  'finance',
  'health',
  'living',
  'growth',
  'goal_task',
]

export const WORK_ADD_TYPES: TaskType[] = [
  'sprint',
  'misc',
  'meeting_prep',
  'followup',
]

export const PERSONAL_ADD_TYPES: TaskType[] = [
  'personal',
  'finance',
  'health',
  'living',
  'growth',
  'goal_task',
]

// Use these instead of raw strings throughout the app
export const TASK_TYPE = {
  SPRINT: 'sprint',
  FOLLOWUP: 'followup',
  MEETING_PREP: 'meeting_prep',
  MISC: 'misc',
  PERSONAL: 'personal',
  FINANCE: 'finance',
  HEALTH: 'health',
  LIVING: 'living',
  GROWTH: 'growth',
  GOAL_TASK: 'goal_task',
} as const

export const TYPE_COLOR: Record<TaskType, string> = {
  sprint: 'blue',
  followup: 'amber',
  meeting_prep: 'pink',
  misc: 'gray',
  personal: 'coral',
  finance: 'purple',
  health: 'green',
  living: 'pink',
  growth: 'teal',
  goal_task: 'blue',
}

export const TYPE_LABEL: Record<TaskType, string> = {
  sprint: 'Sprint',
  followup: 'Follow-up',
  meeting_prep: 'Meeting Prep',
  misc: 'Misc',
  personal: 'Personal',
  finance: 'Finance',
  health: 'Health',
  living: 'Living',
  growth: 'Growth',
  goal_task: 'Goal',
}

export const ALL_TYPES: TaskType[] = [
  'sprint',
  'followup',
  'meeting_prep',
  'misc',
  'personal',
  'finance',
  'health',
  'living',
  'growth',
  'goal_task',
]

export const CADENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly'] as const
export const DAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const
export const PRIORITY_OPTIONS = ['high', 'medium', 'low'] as const

export const FILTER_TYPES: TaskType[] = [
  'sprint',
  'personal',
  'finance',
  'health',
  'living',
  'growth',
  'goal_task',
]

export const ADD_MODAL_TYPES: TaskType[] = [
  'sprint',
  'personal',
  'finance',
  'health',
  'living',
  'growth',
  'goal_task',
  'misc',
  'followup',
]

// TASK_STATUS
export const TASK_STATUS = {
  TODO: 'todo',
  DONE: 'done',
} as const

// SPRINT_TASK_STATUS — used as the primary status for sprint tasks
export const SPRINT_TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_CR: 'in_cr',
  MERGED: 'merged',
  DEPLOYED: 'deployed',
  DONE: 'done',
  BLOCKED: 'blocked',
} as const

export const SPRINT_TASK_STATUS_LABEL: Record<string, string> = {
  [SPRINT_TASK_STATUS.NOT_STARTED]: 'Not Started',
  [SPRINT_TASK_STATUS.IN_CR]: 'In CR',
  [SPRINT_TASK_STATUS.MERGED]: 'Merged',
  [SPRINT_TASK_STATUS.DEPLOYED]: 'Deployed',
  [SPRINT_TASK_STATUS.DONE]: 'Done',
  [SPRINT_TASK_STATUS.BLOCKED]: 'Blocked',
}

export const SPRINT_TASK_STATUS_COLOR: Record<string, string> = {
  [SPRINT_TASK_STATUS.NOT_STARTED]: 'gray',
  [SPRINT_TASK_STATUS.IN_CR]: 'blue',
  [SPRINT_TASK_STATUS.MERGED]: 'violet',
  [SPRINT_TASK_STATUS.DEPLOYED]: 'teal',
  [SPRINT_TASK_STATUS.DONE]: 'green',
  [SPRINT_TASK_STATUS.BLOCKED]: 'red',
}

export const SPRINT_TASK_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: SPRINT_TASK_STATUS.NOT_STARTED, label: 'Not Started' },
  { value: SPRINT_TASK_STATUS.IN_CR, label: 'In CR' },
  { value: SPRINT_TASK_STATUS.MERGED, label: 'Merged' },
  { value: SPRINT_TASK_STATUS.DEPLOYED, label: 'Deployed' },
  { value: SPRINT_TASK_STATUS.DONE, label: 'Done' },
  { value: SPRINT_TASK_STATUS.BLOCKED, label: 'Blocked' },
]

// PRIORITY
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

// PRIORITY_LABEL — replaces inline capitalization
export const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// CADENCE_LABEL — replaces inline capitalization
export const CADENCE_LABEL: Record<string, string> = {
  none: 'None',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

// LINK_KIND_LABEL
export const LINK_KIND_LABEL = {
  goal: 'Goal',
  project: 'Project',
  milestone: 'Milestone',
} as const

export const PROJECT_STATUS = { ACTIVE: 'active' } as const

export const DATE_FORMAT = {
  SHORT: 'MMM d',
  API: 'yyyy-MM-dd',
} as const

export const CADENCE = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

export const GOAL_STATUS = {
  ACTIVE: 'active',
  DONE: 'done',
  DROPPED: 'dropped',
} as const
