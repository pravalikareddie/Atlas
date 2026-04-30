import { useMemo } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { BUDGET_GROUPS } from '../constants/categories'

export interface BudgetRow {
  category: string
  spent: number
  budget: number
  ratio: number
  overBudget: boolean
  goalMet: boolean
  group: string
}

export function useBudgetSummary() {
  const { expenses, budgets, currentMonth } = useFinanceStore()

  return useMemo(() => {
    const rows: BudgetRow[] = []
    const monthBudgets = budgets.filter((b) => b.month === currentMonth)
    const monthExpenses = expenses.filter((e) => e.month === currentMonth)

    for (const group of BUDGET_GROUPS) {
      for (const cat of group.categories) {
        const budget = monthBudgets.find((b) => b.category === cat)
        const budgetAmt = budget?.amount ?? 0
        const spent = monthExpenses
          .filter((e) => e.category === cat)
          .reduce((s, e) => s + e.amount, 0)
        if (budgetAmt > 0 || spent > 0) {
          rows.push({
            category: cat,
            spent,
            budget: budgetAmt,
            ratio: budgetAmt > 0 ? spent / budgetAmt : 0,
            overBudget: spent > budgetAmt && budgetAmt > 0,
            goalMet:
              group.key === 'GROWTH' && spent >= budgetAmt && budgetAmt > 0,
            group: group.key,
          })
        }
      }
    }

    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0)
    const totalSaved = monthExpenses
      .filter((e) => ['savings', 'investing'].includes(e.category))
      .reduce((s, e) => s + e.amount, 0)
    const savingsGoal = monthBudgets
      .filter((b) => ['savings', 'investing'].includes(b.category))
      .reduce((s, b) => s + b.amount, 0)

    return { rows, totalSpent, totalBudget, totalSaved, savingsGoal }
  }, [expenses, budgets, currentMonth])
}
