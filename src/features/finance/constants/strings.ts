export const STRINGS = {
  // Empty states
  EMPTY_ATTENTION: 'All clear. Nothing needs you right now. ✓',
  EMPTY_REFUNDS: 'No refunds waiting. That\u0027s a good sign.',
  EMPTY_SPLITWISE: 'All squared up. No one owes anyone.',
  EMPTY_SUBSCRIPTIONS: 'No subscriptions tracked yet.',
  EMPTY_TODOS: 'Nothing on the list. Enjoy the quiet.',
  EMPTY_EXPENSES: 'Your money story starts here.',
  BUDGETS: 'Budgets',
  // Section labels
  NEEDS_ATTENTION: 'NEEDS ATTENTION',
  BUDGETS_THIS_MONTH: 'BUDGETS · this month',
  SILENT_BLEED: 'SILENT BLEED · this week',
  ACCOUNTS_INVENTORY: 'ACCOUNTS INVENTORY',
  FINANCE_TODOS: 'FINANCE TODOS',
  REFUND_TRACKER: 'REFUND TRACKER',
  SPLITWISE: 'SPLITWISE',
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  DOCS_TO_COLLECT: 'DOCUMENTS TO COLLECT',
  THINGS_TO_REMEMBER: 'THINGS TO REMEMBER',
  ATLAS_DATA: 'FROM YOUR ATLAS DATA',
  LOG_PROMPT: 'WHAT ARE YOU LOGGING?',
  WHERE_IT_WENT: 'WHERE IT WENT',
  WEEK_BY_WEEK: 'WEEK BY WEEK',
  CATEGORY_BREAKDOWN: 'CATEGORY BREAKDOWN',
  PATTERN_NOTICED: 'PATTERN ATLAS NOTICED',
  CHANGE_NEXT_WEEK: 'ONE THING TO CHANGE NEXT WEEK',
  CHANGE_NEXT_MONTH: 'ONE THING TO CHANGE NEXT MONTH',

  // Sub-labels
  PENDING: 'PENDING',
  YOU_ARE_OWED: 'YOU ARE OWED',
  YOU_OWE: 'YOU OWE',
  RENEWING_SOON: 'RENEWING SOON',
  ACTIVE: 'ACTIVE',

  // Buttons
  LOG: 'Log',
  ADD_ACCOUNT: '+ add account',
  ADD_TODO: '+ add todo',
  ADD_ITEM: '+ add item',
  ADD_NOTE: '+ add',
  EDIT_BUDGETS: 'edit budgets',
  SAVE_CHANGES: 'save changes',
  BACK: '← back',
  BACK_OVERVIEW: '← back to overview',
  LOG_IT: 'LOG IT',
  CHECK_BEFORE: 'CHECK BEFORE I LOG',
  STILL_LOG: 'still log it',
  LOG_REFUND: 'LOG REFUND',
  LOG_SPLITWISE: 'LOG SPLITWISE',
  LOG_SUBSCRIPTION: 'LOG SUBSCRIPTION',
  EXPENSES: 'Expenses',
  TRANSACTIONS: 'transactions',
  NO_EXPENSES: 'No expenses this month.',
  EDIT_EXPENSE: 'Edit Expense',
  OK: 'ok',
  UNDO: 'undo',
  CANCEL: 'cancel',
  RECEIVED: 'received',
  GAVE_UP: 'gave up',
  SETTLED: 'settled',
  SEND_REMINDER: 'send reminder →',
  PAY_NOW: 'pay now →',
  KEEP: 'keep',
  SEE_REPORT: 'see full report →',
  OK_NOTED: 'ok, noted',

  // Confirmations
  REFUND_SAVED:
    '→ saved to refund tracker. Atlas flags if not received by expected date.',
  SPLITWISE_SAVED:
    '→ Atlas starts age clock immediately. Flags after 7 days if not settled.',
  SUBSCRIPTION_SAVED:
    '→ Atlas reminds you 3 days before renewal. You decide: keep or cancel at that point.',

  // Placeholders
  PH_AMOUNT: '0.00',
  PH_NOTE: 'uber eats · dinner',
  PH_REFUND_DESC: 'Amazon order · blue jacket',
  PH_PERSON: 'Riya',
  PH_SPLIT_DESC: 'dinner · Apr 14',
  PH_SUB_NAME: 'Duolingo',
  PH_TODO: 'New finance task...',
  PH_TAX_NOTE: 'Add a note...',

  // Field labels
  FIELD_AMOUNT: 'amount?',
  FIELD_WHO: 'who?',
  FIELD_WHAT_FOR: 'what for? · optional',
  FIELD_WHAT_RETURNED: 'what was returned?',
  FIELD_EXPECTED_BY: 'expected by?',
  FIELD_NAME: 'name?',
  FIELD_RENEWS: 'renews?',
  FIELD_NOTE: 'note · optional',

  // Bleed report
  BLEED_ASSUMED: 'assumed ~$150 · actual $284 · gap $134',
  BLEED_LEAK: 'biggest leak: food delivery $89',
  BLEED_PATTERN:
    '"You overspend every Friday. Delivery and shopping spikes consistently on Fridays."',
  BLEED_SUGGESTION_WEEK: '"Cut delivery to 2x max. That\'s $60 back."',
  BLEED_SUGGESTION_MONTH: '"Set a Friday budget. $50 max on Fridays."',

  // Misc
  COMING_SOON: 'Coming soon',
  COMING_SOON_DESC: 'This section is not yet built. Finance is ready to use.',
  FINANCE: 'Finance',
  ATLAS: 'Atlas',
  ADD: 'add',
  OVERDUE: 'OVERDUE ⚠⚠',
} as const

export const LOG_TYPES = [
  { key: 'expense', emoji: '💸', label: 'expense' },
  { key: 'refund', emoji: '🔄', label: 'refund' },
  { key: 'splitwise', emoji: '👥', label: 'splitwise' },
  { key: 'subscription', emoji: '📦', label: 'subscription' },
] as const

export const TAX_DOCS_DEFAULT = [
  { id: '1', label: 'W2 · employer · Chase HR portal', done: false },
  { id: '2', label: '1099-INT · Marcus HYSA · mail', done: false },
  { id: '3', label: '1099-DIV · Fidelity · portal', done: false },
  { id: '4', label: '1099-B · Robinhood · portal', done: false },
  { id: '5', label: 'HSA form · employer benefits portal', done: false },
]

export const TAX_NOTES_DEFAULT = [
  'Charitable donations 2025: $0',
  'Home office deduction: no',
  'Student loan interest: check',
]

export const ACCOUNT_TYPE_LABELS = [
  { key: 'checking', label: 'CHECKING' },
  { key: 'savings', label: 'SAVINGS' },
  { key: 'investing', label: 'INVESTING' },
  { key: 'credit_card', label: 'CREDIT CARDS' },
  { key: 'other', label: 'OTHER' },
] as const
