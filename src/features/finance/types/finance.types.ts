export interface Expense {
  id: string
  user_id: string
  amount: number // cents
  category: string
  note: string | null
  month: string // "2026-04"
  logged_at: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number // cents
  month: string
  carried_over: number
  overspend_acknowledged: boolean
  overspend_reason: string | null
  manual_override: boolean
  created_at: string
}

export interface Refund {
  id: string
  user_id: string
  description: string
  amount: number // cents
  returned_at: string
  expected_by: string
  status: 'pending' | 'received' | 'gave_up'
  resolved_at: string | null
  created_at: string
}

export interface SplitwiseEntry {
  id: string
  user_id: string
  person: string
  amount: number // cents
  direction: 'owed_to_me' | 'i_owe'
  description: string | null
  status: 'outstanding' | 'settled'
  logged_at: string
  settled_at: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number // cents
  period: 'monthly' | 'yearly'
  renewal_day: number
  status: 'active' | 'cancelled'
  cancelled_at: string | null
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'investing' | 'credit_card' | 'other'
  last_four: string | null
  label: string | null
  due_date: number | null
  order_index?: number
  created_at: string
}

export interface FinanceTodo {
  id: string
  user_id: string
  description: string
  account_id: string | null
  amount: number | null
  status: 'todo' | 'done'
  completed_at: string | null
  order_index?: number
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  mood: number | null
  mood_note: string | null
  sleep_hours: number | null
  water_cups: number
  created_at: string
}

export type BudgetGroup = 'NEEDS' | 'WANTS' | 'GROWTH'

export interface NeedsAttentionItem {
  id: string
  type: 'over_budget' | 'splitwise' | 'refund_overdue' | 'subscription_renewal'
  text: string
  route: string
  urgency: number
}

export interface CategoryInfo {
  key: string
  label: string
  emoji: string
}

export interface ExpenseGroup {
  id: string
  user_id: string
  name: string
  emoji: string | null
  status: 'active' | 'closed'
  created_at: string
}

export interface GroupExpense {
  id: string
  user_id: string
  group_id: string
  amount: number // cents
  category: string
  note: string | null
  logged_at: string
  include_in_monthly: boolean
  tag: 'expense' | 'splitwise' | 'refund' | 'return' | null
  tag_status: 'pending' | 'settled' | null
  split_count: number | null // how many people splitting (including you)
  created_at: string
}

export type GroupExpenseTag = NonNullable<GroupExpense['tag']>

