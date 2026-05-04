import { Box, Group, Text, Badge } from '@mantine/core'
import { COLORS } from '../constants/styles'

interface Props {
  label: string
  gradient: string
  count?: number
  countColor?: string
  right?: React.ReactNode
  children: React.ReactNode
}

export function CardShell({ label, gradient, count, countColor = 'teal', right, children }: Props) {
  return (
    <Box
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        border: `1px solid ${COLORS.WHITE_07}`,
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Box px="lg" py="sm" style={{ background: gradient }}>
        <Group justify="space-between">
          <Group gap="xs">
            <Box
              w={7}
              h={7}
              style={{
                borderRadius: '50%',
                backgroundColor: COLORS.WHITE_35,
              }}
            />
            <Text size="xs" fw={600} tt="uppercase" lts="0.1em" c="white">
              {label}
            </Text>
            {count != null && (
              <Badge variant="light" color={countColor} size="xs" radius="xl">
                {count}
              </Badge>
            )}
          </Group>
          {right}
        </Group>
      </Box>
      <Box px="lg" py="md" bg="var(--mantine-color-body)">
        {children}
      </Box>
    </Box>
  )
}
