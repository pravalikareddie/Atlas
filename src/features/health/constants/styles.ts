export const STYLES = {
  CHART_BAR_GOOD: 'var(--mantine-color-green-5)',
  CHART_BAR_OKAY: 'var(--mantine-color-amber-5)',
  CHART_BAR_BAD: 'var(--mantine-color-coral-5)',
} as const

export function chartColor(
  val: number,
  metric: 'sleep' | 'water' | 'mood' | 'energy' | 'stress',
) {
  if (metric === 'sleep')
    return val >= 7 ? STYLES.CHART_BAR_GOOD : val >= 6 ? STYLES.CHART_BAR_OKAY : STYLES.CHART_BAR_BAD
  if (metric === 'water')
    return val >= 8 ? STYLES.CHART_BAR_GOOD : STYLES.CHART_BAR_OKAY
  if (metric === 'stress')
    return val <= 2 ? STYLES.CHART_BAR_GOOD : val <= 3 ? STYLES.CHART_BAR_OKAY : STYLES.CHART_BAR_BAD
  return val >= 4 ? STYLES.CHART_BAR_GOOD : val >= 3 ? STYLES.CHART_BAR_OKAY : STYLES.CHART_BAR_BAD
}
