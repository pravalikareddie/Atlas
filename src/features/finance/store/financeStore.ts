import { create } from 'zustand'
import {
  Expense,
  Budget,
  Refund,
  SplitwiseEntry,
  Subscription,
  Account,
  FinanceTodo,
  DailyLog,
} from '../types/finance.types'
import { getCurrentMonth } from '../utils/dateUtils'

interface FinanceState {
  expenses: Expense[]
  budgets: Budget[]
  refunds: Refund[]
  splitwise: SplitwiseEntry[]
  subscriptions: Subscription[]
  accounts: Account[]
  todos: FinanceTodo[]
  dailyLog: DailyLog | null
  currentMonth: string
  loading: boolean
  error: string | null

  setExpenses: (e: Expense[]) => void
  addExpense: (e: Expense) => void
  removeExpense: (id: string) => void
  setBudgets: (b: Budget[]) => void
  updateBudget: (id: string, updates: Partial<Budget>) => void
  setRefunds: (r: Refund[]) => void
  addRefund: (r: Refund) => void
  updateRefund: (id: string, updates: Partial<Refund>) => void
  removeRefund: (id: string) => void
  setSplitwise: (s: SplitwiseEntry[]) => void
  addSplitwiseEntry: (s: SplitwiseEntry) => void
  updateSplitwiseEntry: (id: string, updates: Partial<SplitwiseEntry>) => void
  removeSplitwiseEntry: (id: string) => void
  setSubscriptions: (s: Subscription[]) => void
  addSubscription: (s: Subscription) => void
  updateSubscription: (id: string, updates: Partial<Subscription>) => void
  removeSubscription: (id: string) => void
  setAccounts: (a: Account[]) => void
  addAccount: (a: Account) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  removeAccount: (id: string) => void
  setTodos: (t: FinanceTodo[]) => void
  addTodo: (t: FinanceTodo) => void
  updateTodo: (id: string, updates: Partial<FinanceTodo>) => void
  removeTodo: (id: string) => void
  setDailyLog: (d: DailyLog | null) => void
  setLoading: (l: boolean) => void
  setError: (e: string | null) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
}

export const useFinanceStore = create<FinanceState>((set) => ({
  expenses: [],
  budgets: [],
  refunds: [],
  splitwise: [],
  subscriptions: [],
  accounts: [],
  todos: [],
  dailyLog: null,
  currentMonth: getCurrentMonth(),
  loading: false,
  error: null,

  setExpenses: (expenses) => set({ expenses }),
  addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
  removeExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
  setBudgets: (budgets) => set({ budgets }),
  updateBudget: (id, updates) =>
    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  setRefunds: (refunds) => set({ refunds }),
  addRefund: (r) => set((s) => ({ refunds: [r, ...s.refunds] })),
  updateRefund: (id, updates) =>
    set((s) => ({
      refunds: s.refunds.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  removeRefund: (id) =>
    set((s) => ({ refunds: s.refunds.filter((r) => r.id !== id) })),
  setSplitwise: (splitwise) => set({ splitwise }),
  addSplitwiseEntry: (e) => set((s) => ({ splitwise: [e, ...s.splitwise] })),
  updateSplitwiseEntry: (id, updates) =>
    set((s) => ({
      splitwise: s.splitwise.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    })),
  removeSplitwiseEntry: (id) =>
    set((s) => ({ splitwise: s.splitwise.filter((e) => e.id !== id) })),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  addSubscription: (s_) =>
    set((s) => ({ subscriptions: [s_, ...s.subscriptions] })),
  updateSubscription: (id, updates) =>
    set((s) => ({
      subscriptions: s.subscriptions.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub,
      ),
    })),
  removeSubscription: (id) =>
    set((s) => ({
      subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
    })),
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (a) => set((s) => ({ accounts: [a, ...s.accounts] })),
  updateAccount: (id, updates) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAccount: (id) =>
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
  setTodos: (todos) => set({ todos }),
  addTodo: (t) => set((s) => ({ todos: [t, ...s.todos] })),
  updateTodo: (id, updates) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTodo: (id) =>
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
  setDailyLog: (dailyLog) => set({ dailyLog }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // In store:
  updateExpense: (id, updates) =>
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
}))
