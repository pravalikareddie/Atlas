import { create } from 'zustand'
import {
  Expense,
  Budget,
  Refund,
  SplitwiseEntry,
  Subscription,
  Account,
  ExpenseGroup,
  GroupExpense,
} from '../types/finance.types'
import { getCurrentMonth } from '../utils/dateUtils'

interface FinanceState {
  expenses: Expense[]
  budgets: Budget[]
  refunds: Refund[]
  splitwise: SplitwiseEntry[]
  subscriptions: Subscription[]
  accounts: Account[]
  expenseGroups: ExpenseGroup[]
  groupExpenses: GroupExpense[]
  currentMonth: string
  loading: boolean
  error: string | null

  // Expenses
  setExpenses: (e: Expense[]) => void
  addExpense: (e: Expense) => void
  updateExpense: (id: string, u: Partial<Expense>) => void
  removeExpense: (id: string) => void

  // Budgets
  setBudgets: (b: Budget[]) => void
  updateBudget: (id: string, u: Partial<Budget>) => void

  // Refunds
  setRefunds: (r: Refund[]) => void
  addRefund: (r: Refund) => void
  updateRefund: (id: string, u: Partial<Refund>) => void
  removeRefund: (id: string) => void

  // Splitwise
  setSplitwise: (s: SplitwiseEntry[]) => void
  addSplitwiseEntry: (s: SplitwiseEntry) => void
  updateSplitwiseEntry: (id: string, u: Partial<SplitwiseEntry>) => void
  removeSplitwiseEntry: (id: string) => void

  // Subscriptions
  setSubscriptions: (s: Subscription[]) => void
  addSubscription: (s: Subscription) => void
  updateSubscription: (id: string, u: Partial<Subscription>) => void
  removeSubscription: (id: string) => void

  // Accounts
  setAccounts: (a: Account[]) => void
  addAccount: (a: Account) => void
  updateAccount: (id: string, u: Partial<Account>) => void
  removeAccount: (id: string) => void

  // Expense Groups
  setExpenseGroups: (g: ExpenseGroup[]) => void
  addExpenseGroup: (g: ExpenseGroup) => void
  updateExpenseGroup: (id: string, u: Partial<ExpenseGroup>) => void
  removeExpenseGroup: (id: string) => void

  // Group Expenses
  setGroupExpenses: (e: GroupExpense[]) => void
  addGroupExpense: (e: GroupExpense) => void
  updateGroupExpense: (id: string, u: Partial<GroupExpense>) => void
  removeGroupExpense: (id: string) => void

  // Meta
  setLoading: (l: boolean) => void
  setError: (e: string | null) => void
}

export const useFinanceStore = create<FinanceState>((set) => ({
  expenses: [],
  income: [],
  budgets: [],
  refunds: [],
  splitwise: [],
  subscriptions: [],
  accounts: [],
  expenseGroups: [],
  groupExpenses: [],
  currentMonth: getCurrentMonth(),
  loading: false,
  error: null,

  setExpenses: (expenses) => set({ expenses }),
  addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
  updateExpense: (id, u) =>
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...u } : e)),
    })),
  removeExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

  setBudgets: (budgets) => set({ budgets }),
  updateBudget: (id, u) =>
    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...u } : b)),
    })),

  setRefunds: (refunds) => set({ refunds }),
  addRefund: (r) => set((s) => ({ refunds: [r, ...s.refunds] })),
  updateRefund: (id, u) =>
    set((s) => ({
      refunds: s.refunds.map((r) => (r.id === id ? { ...r, ...u } : r)),
    })),
  removeRefund: (id) =>
    set((s) => ({ refunds: s.refunds.filter((r) => r.id !== id) })),

  setSplitwise: (splitwise) => set({ splitwise }),
  addSplitwiseEntry: (e) => set((s) => ({ splitwise: [e, ...s.splitwise] })),
  updateSplitwiseEntry: (id, u) =>
    set((s) => ({
      splitwise: s.splitwise.map((e) => (e.id === id ? { ...e, ...u } : e)),
    })),
  removeSplitwiseEntry: (id) =>
    set((s) => ({ splitwise: s.splitwise.filter((e) => e.id !== id) })),

  setSubscriptions: (subscriptions) => set({ subscriptions }),
  addSubscription: (s_) =>
    set((s) => ({ subscriptions: [s_, ...s.subscriptions] })),
  updateSubscription: (id, u) =>
    set((s) => ({
      subscriptions: s.subscriptions.map((sub) =>
        sub.id === id ? { ...sub, ...u } : sub,
      ),
    })),
  removeSubscription: (id) =>
    set((s) => ({
      subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
    })),

  setAccounts: (accounts) => set({ accounts }),
  addAccount: (a) => set((s) => ({ accounts: [a, ...s.accounts] })),
  updateAccount: (id, u) =>
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...u } : a)),
    })),
  removeAccount: (id) =>
    set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

  setExpenseGroups: (expenseGroups) => set({ expenseGroups }),
  addExpenseGroup: (g) => set((s) => ({ expenseGroups: [g, ...s.expenseGroups] })),
  updateExpenseGroup: (id, u) =>
    set((s) => ({
      expenseGroups: s.expenseGroups.map((g) => (g.id === id ? { ...g, ...u } : g)),
    })),
  removeExpenseGroup: (id) =>
    set((s) => ({ expenseGroups: s.expenseGroups.filter((g) => g.id !== id) })),

  setGroupExpenses: (groupExpenses) => set({ groupExpenses }),
  addGroupExpense: (e) => set((s) => ({ groupExpenses: [e, ...s.groupExpenses] })),
  updateGroupExpense: (id, u) =>
    set((s) => ({
      groupExpenses: s.groupExpenses.map((e) => (e.id === id ? { ...e, ...u } : e)),
    })),
  removeGroupExpense: (id) =>
    set((s) => ({ groupExpenses: s.groupExpenses.filter((e) => e.id !== id) })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
