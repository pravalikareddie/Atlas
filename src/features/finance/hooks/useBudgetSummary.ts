import { useMemo } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { getBudgetCategories, INCOME_CATEGORY } from '../constants/categories'

export interface BudgetRow {
  category: string
  spent: number
  budget: number
  ratio: number
  overBudget: boolean
  goalMet: boolean
}

export function useBudgetSummary() {
  const { expenses, budgets, currentMonth } = useFinanceStore()

  return useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.month === currentMonth)
    const monthExpenses = expenses.filter((e) => e.month === currentMonth)

    // Separate income from spending
    const totalIncome = monthExpenses
      .filter((e) => e.category === INCOME_CATEGORY)
      .reduce((s, e) => s + e.amount, 0)

    const spendingExpenses = monthExpenses.filter(
      (e) => e.category !== INCOME_CATEGORY,
    )

    const rows: BudgetRow[] = []

    for (const cat of getBudgetCategories()) {
      const budget = monthBudgets.find((b) => b.category === cat)
      const budgetAmt = budget?.amount ?? 0
      const spent = (cat === INCOME_CATEGORY ? monthExpenses : spendingExpenses)
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0)

      if (budgetAmt > 0 || spent > 0) {
        rows.push({
          category: cat,
          spent,
          budget: budgetAmt,
          ratio: budgetAmt > 0 ? spent / budgetAmt : (spent > 0 ? 1 : 0),
          overBudget:
            cat !== INCOME_CATEGORY && budgetAmt > 0 && spent > budgetAmt,
          goalMet:
            cat === INCOME_CATEGORY
              ? spent >= budgetAmt && budgetAmt > 0 // hit income target
              : (cat === 'savings' || cat === 'investing') &&
                spent >= budgetAmt &&
                budgetAmt > 0,
        })
      }
    }

    const SAVINGS_CATEGORIES = ['savings', 'investing']
    const totalSpent = spendingExpenses
      .filter((e) => !SAVINGS_CATEGORIES.includes(e.category))
      .reduce((s, e) => s + e.amount, 0)
    const totalBudget = monthBudgets
      .filter((b) => b.category !== INCOME_CATEGORY && !SAVINGS_CATEGORIES.includes(b.category))
      .reduce((s, b) => s + b.amount, 0)
    const totalSaved = spendingExpenses
      .filter((e) => SAVINGS_CATEGORIES.includes(e.category))
      .reduce((s, e) => s + e.amount, 0)
    const savingsGoal = monthBudgets
      .filter((b) => ['savings', 'investing'].includes(b.category))
      .reduce((s, b) => s + b.amount, 0)

    rows.sort((a, b) => b.spent - a.spent)

    return {
      rows,
      totalSpent,
      totalBudget,
      totalSaved,
      savingsGoal,
      totalIncome,
    }
  }, [expenses, budgets, currentMonth])
}
