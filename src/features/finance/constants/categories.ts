import { CategoryInfo, BudgetGroup } from '../types/finance.types'

export const CATEGORIES: CategoryInfo[] = [
  { key: 'rent', label: 'Rent', emoji: '🏠', group: 'NEEDS' },
  { key: 'phone', label: 'Phone', emoji: '📱', group: 'NEEDS' },
  { key: 'internet', label: 'Internet', emoji: '💡', group: 'NEEDS' },
  { key: 'insurance', label: 'Insurance', emoji: '🛡️', group: 'NEEDS' },
  { key: 'food_delivery', label: 'Food', emoji: '🍔', group: 'WANTS' },
  { key: 'transport', label: 'Transport', emoji: '🚗', group: 'WANTS' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍', group: 'WANTS' },
  { key: 'coffee', label: 'Coffee', emoji: '☕', group: 'WANTS' },
  { key: 'entertainment', label: 'Entertain', emoji: '🎬', group: 'WANTS' },
  { key: 'personal_care', label: 'Personal', emoji: '💅', group: 'WANTS' },
  { key: 'other_wants', label: 'Other', emoji: '📦', group: 'WANTS' },
  { key: 'investing', label: 'Investing', emoji: '📈', group: 'GROWTH' },
  { key: 'savings', label: 'Savings', emoji: '🏦', group: 'GROWTH' },
  { key: 'learning', label: 'Learning', emoji: '📚', group: 'GROWTH' },
  { key: 'other_growth', label: 'Other', emoji: '🌱', group: 'GROWTH' },
  // Health added for expense grid
  { key: 'health', label: 'Health', emoji: '💊', group: 'WANTS' },
]

export const EXPENSE_GRID_CATEGORIES = [
  'food_delivery',
  'transport',
  'shopping',
  'coffee',
  'health',
  'entertainment',
  'personal_care',
  'other_wants',
  'rent',
  'internet',
  'learning',
]

export const BUDGET_GROUPS: {
  key: BudgetGroup
  label: string
  categories: string[]
}[] = [
  {
    key: 'NEEDS',
    label: 'NEEDS',
    categories: ['rent', 'phone', 'internet', 'insurance'],
  },
  {
    key: 'WANTS',
    label: 'WANTS',
    categories: [
      'food_delivery',
      'coffee',
      'shopping',
      'entertainment',
      'personal_care',
      'transport',
      'other_wants',
    ],
  },
  {
    key: 'GROWTH',
    label: 'GROWTH',
    categories: ['investing', 'savings', 'learning', 'other_growth'],
  },
]

export function getCategoryInfo(key: string): CategoryInfo {
  return (
    CATEGORIES.find((c) => c.key === key) ?? {
      key,
      label: key,
      emoji: '📦',
      group: 'WANTS',
    }
  )
}
