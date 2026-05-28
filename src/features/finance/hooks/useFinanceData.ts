import { useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { getCurrentMonth } from '../utils/dateUtils'
import { fetchExpenses } from '../services/expenseService'
import { fetchBudgets, upsertBudget } from '../services/budgetService'
import { fetchRefunds } from '../services/refundService'
import { fetchSplitwise } from '../services/splitwiseService'
import { fetchSubscriptions } from '../services/subscriptionService'
import { fetchAccounts } from '../services/accountService'
import { fetchExpenseGroups } from '../services/groupExpenseService'
import { USER_ID } from '../../tasks/constants/taskConstants'

function getPreviousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2, 1) // month is 0-indexed, so m-2 = previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function useFinanceData() {
  const store = useFinanceStore()

  useEffect(() => {
    if (store.loading) return
    store.setLoading(true)

    const month = getCurrentMonth()

    Promise.all([
      fetchExpenses(month).catch(() => []),
      fetchBudgets(month).catch(() => []),
      fetchRefunds().catch(() => []),
      fetchSplitwise().catch(() => []),
      fetchSubscriptions().catch(() => []),
      fetchAccounts().catch(() => []),
      fetchExpenseGroups().catch(() => []),
    ]).then(
      async ([expenses, budgets, refunds, splitwise, subscriptions, accounts, expenseGroups]) => {
        store.setExpenses(expenses)
        store.setRefunds(refunds)
        store.setSplitwise(splitwise)
        store.setSubscriptions(subscriptions)
        store.setAccounts(accounts)
        store.setExpenseGroups(expenseGroups)

        // Auto-copy budgets from last month if none exist for current month
        if (budgets.length === 0) {
          const prevMonth = getPreviousMonth(month)
          const prevBudgets = await fetchBudgets(prevMonth).catch(() => [])
          if (prevBudgets.length > 0) {
            const copied = await Promise.all(
              prevBudgets.map((b) =>
                upsertBudget({
                  user_id: USER_ID,
                  category: b.category,
                  month,
                  amount: b.amount,
                  carried_over: 0,
                  overspend_acknowledged: false,
                  overspend_reason: null,
                  manual_override: false,
                }).catch(() => null),
              ),
            )
            budgets = copied.filter(Boolean) as typeof budgets
          }
        }

        store.setBudgets(budgets)
        store.setLoading(false)
      },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
