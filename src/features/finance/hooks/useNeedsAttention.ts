import { useMemo } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { NeedsAttentionItem } from '../types/finance.types'
import { getCategoryInfo } from '../constants/categories'
import { formatMoney } from '../utils/moneyUtils'
import {
  daysSince,
  daysUntilRenewal,
  isOverdue,
  formatAge,
} from '../utils/dateUtils'

export function useNeedsAttention(): NeedsAttentionItem[] {
  const { expenses, budgets, splitwise, refunds, subscriptions, currentMonth } =
    useFinanceStore()

  return useMemo(() => {
    const items: NeedsAttentionItem[] = []

    // Over budget
    budgets
      .filter((b) => b.month === currentMonth)
      .forEach((budget) => {
        const spent = expenses
          .filter(
            (e) => e.category === budget.category && e.month === currentMonth,
          )
          .reduce((sum, e) => sum + e.amount, 0)
        if (spent > budget.amount && !budget.overspend_acknowledged) {
          const over = spent - budget.amount
          const cat = getCategoryInfo(budget.category)
          items.push({
            id: budget.id,
            type: 'over_budget',
            text: `${cat.label} over ${formatMoney(over)} · acknowledge`,
            route: '/finance/budgets',
            urgency: 4,
          })
        }
      })

    // Splitwise > 7 days
    splitwise
      .filter((s) => s.status === 'outstanding')
      .forEach((entry) => {
        const days = daysSince(entry.logged_at)
        if (days >= 7) {
          const age = formatAge(entry.logged_at)
          const text =
            entry.direction === 'owed_to_me'
              ? `${entry.person} owes ${formatMoney(entry.amount)} · ${age} · remind?`
              : `You owe ${entry.person} ${formatMoney(entry.amount)} · ${age}`
          items.push({
            id: entry.id,
            type: 'splitwise',
            text,
            route: '/finance/accounts',
            urgency: 3,
          })
        }
      })

    // Refund overdue
    refunds
      .filter((r) => r.status === 'pending' && isOverdue(r.expected_by))
      .forEach((refund) => {
        const days = daysSince(refund.returned_at)
        items.push({
          id: refund.id,
          type: 'refund_overdue',
          text: `${refund.description.split('·')[0].trim()} refund ${formatMoney(refund.amount)} · day ${days} · overdue`,
          route: '/finance/accounts',
          urgency: 2,
        })
      })

    // Subscription renewal within 3 days
    subscriptions
      .filter((s) => s.status === 'active')
      .forEach((sub) => {
        const days = daysUntilRenewal(sub.renewal_day)
        if (days <= 3) {
          items.push({
            id: sub.id,
            type: 'subscription_renewal',
            text: `${sub.name} renews in ${days} day${days !== 1 ? 's' : ''} · ${formatMoney(sub.amount)}`,
            route: '/finance/accounts',
            urgency: 1,
          })
        }
      })

    items.sort((a, b) => b.urgency - a.urgency)
    return items.slice(0, 7)
  }, [expenses, budgets, splitwise, refunds, subscriptions, currentMonth])
}
