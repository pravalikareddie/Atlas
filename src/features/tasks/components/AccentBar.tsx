import { Box } from '@mantine/core'
import { RADIUS_PILL } from '../../../shared/constants/styles'

export function AccentBar({ color }: { color: string }) {
  return (
    <Box
      w={3}
      h={28}
      style={{
        borderRadius: RADIUS_PILL,
        backgroundColor: `var(--mantine-color-${color}-5)`,
        flexShrink: 0,
      }}
    />
  )
}
