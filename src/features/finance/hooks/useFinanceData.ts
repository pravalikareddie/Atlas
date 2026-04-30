import { useEffect } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { getCurrentMonth } from '../utils/dateUtils'
import { fetchExpenses } from '../services/expenseService'
import { fetchBudgets } from '../services/budgetService'
import { fetchRefunds } from '../services/refundService'
import { fetchSplitwise } from '../services/splitwiseService'
import { fetchSubscriptions } from '../services/subscriptionService'
import { fetchAccounts } from '../services/accountService'
import { fetchTodos } from '../services/todoService'

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
      fetchTodos().catch(() => []),
    ]).then(
      ([
        expenses,
        budgets,
        refunds,
        splitwise,
        subscriptions,
        accounts,
        todos,
      ]) => {
        store.setExpenses(expenses)
        store.setBudgets(budgets)
        store.setRefunds(refunds)
        store.setSplitwise(splitwise)
        store.setSubscriptions(subscriptions)
        store.setAccounts(accounts)
        store.setTodos(todos)
        store.setLoading(false)
      },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
