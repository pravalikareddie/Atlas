import { CategoryInfo } from '../types/finance.types'

export const CATEGORIES: CategoryInfo[] = [
  // Income
  { key: 'income', label: 'Income', emoji: '💚' },

  // Expenses
  { key: 'rent', label: 'Rent', emoji: '🏠' },
  { key: 'phone', label: 'Phone', emoji: '📱' },
  { key: 'emi1', label: 'Primary EMI', emoji: '🧾' },
  { key: 'emi2', label: 'Secondary EMI', emoji: '🧾' },
  { key: 'internet', label: 'Internet', emoji: '💡' },
  { key: 'personal', label: 'Personal', emoji: '🧖' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'investing', label: 'Investing', emoji: '📈' },
  { key: 'savings', label: 'Savings', emoji: '🏦' },
  { key: 'transportation', label: 'Transportation', emoji: '✈️' },
  { key: 'other', label: 'Misc', emoji: '📦' },
]

// Shown in log expense grid — income excluded, has its own tile in LogTypeSelector
export const EXPENSE_GRID_CATEGORIES = CATEGORIES.filter(
  (c) => c.key !== 'income',
).map((c) => c.key)

// All categories including income (used in budget flat list)
export const BUDGET_CATEGORIES = CATEGORIES.map((c) => c.key)

export const INCOME_CATEGORY = 'income'

export function getCategoryInfo(key: string): CategoryInfo {
  return (
    CATEGORIES.find((c) => c.key === key) ?? { key, label: key, emoji: '📦' }
  )
}
