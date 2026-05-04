export const STYLES = {
  GRAD_PLACE: 'linear-gradient(135deg, var(--mantine-color-navy-9) 0%, var(--mantine-color-navy-8) 100%)',
  GRAD_EXP: 'linear-gradient(135deg, var(--mantine-color-purple-9) 0%, var(--mantine-color-purple-8) 100%)',
  GRAD_ACTIVITY: 'linear-gradient(135deg, var(--mantine-color-green-9) 0%, var(--mantine-color-green-8) 100%)',
  GRAD_DONE_PLACE: 'linear-gradient(135deg, var(--mantine-color-amber-9) 0%, var(--mantine-color-amber-8) 100%)',
  GRAD_DONE_EXP: 'linear-gradient(135deg, var(--mantine-color-coral-9) 0%, var(--mantine-color-coral-8) 100%)',

  CARD_HEIGHT: 180,
  DETAIL_IMAGE_HEIGHT: 200,
} as const

export function imageOrGrad(url: string | null, grad: string) {
  return url ? `url(${url}) center/cover` : grad
}
