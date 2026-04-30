export function centsToDollars(cents: number): number {
  return cents / 100
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function formatMoney(cents: number, showDecimals = true): string {
  const dollars = Math.abs(cents) / 100
  const formatted = showDecimals
    ? dollars.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return `${cents < 0 ? '-' : ''}$${formatted}`
}

export function formatMoneyWhole(cents: number): string {
  return formatMoney(cents, false)
}
