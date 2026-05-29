import { CategoryInfo } from '../types/finance.types'

const STORAGE_KEY = 'atlas-budget-categories'

const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { key: 'income', label: 'Income', emoji: '💚' },
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

function loadCategories(): CategoryInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_CATEGORIES
}

function saveCategories(cats: CategoryInfo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export let CATEGORIES: CategoryInfo[] = loadCategories()

export function addCategory(cat: CategoryInfo) {
  CATEGORIES = [...CATEGORIES, cat]
  saveCategories(CATEGORIES)
}

export function updateCategory(key: string, updates: Partial<CategoryInfo>) {
  CATEGORIES = CATEGORIES.map((c) => (c.key === key ? { ...c, ...updates } : c))
  saveCategories(CATEGORIES)
}

export function removeCategory(key: string) {
  CATEGORIES = CATEGORIES.filter((c) => c.key !== key)
  saveCategories(CATEGORIES)
}

export function resetCategories() {
  CATEGORIES = DEFAULT_CATEGORIES
  saveCategories(CATEGORIES)
}

// Shown in log expense grid — income excluded
export const INCOME_CATEGORY = 'income'
const NON_EXPENSE_KEYS = new Set(['income', 'savings', 'investing'])

export const EXPENSE_GRID_CATEGORIES = (() => CATEGORIES.filter(
  (c) => !NON_EXPENSE_KEYS.has(c.key),
).map((c) => c.key))()

// All categories including income (used in budget flat list)
export const BUDGET_CATEGORIES = (() => CATEGORIES.map((c) => c.key))()

export function getCategoryInfo(key: string): CategoryInfo {
  return (
    CATEGORIES.find((c) => c.key === key) ?? { key, label: key, emoji: '📦' }
  )
}

export function getExpenseGridCategories(): string[] {
  return CATEGORIES.filter((c) => !NON_EXPENSE_KEYS.has(c.key)).map((c) => c.key)
}

export function getBudgetCategories(): string[] {
  return CATEGORIES.map((c) => c.key)
}
