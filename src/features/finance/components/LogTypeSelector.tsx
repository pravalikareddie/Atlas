import { useNavigate } from 'react-router-dom'
import {
  SimpleGrid,
  Text,
  UnstyledButton,
  Stack,
  Paper,
  Box,
  Button,
  Group,
  TextInput,
  Progress,
  NumberInput,
} from '@mantine/core'
import { CaretLeft } from '@phosphor-icons/react'
import { ROUTES } from '../../../app/routes'
import { STRINGS } from '../../tasks/constants/strings'
import { LOG_TYPES } from '../constants/strings'

// ─── Shared log header ────────────────────────────────────────────────────────
export function LogHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string
  subtitle?: string
  emoji: string
}) {
  const navigate = useNavigate()
  return (
    <Box
      p="xl"
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
        borderRadius: 'var(--mantine-radius-xl)',
      }}
    >
      <Button
        variant="transparent"
        c="white"
        leftSection={<CaretLeft size={16} />}
        px={0}
        mb="sm"
        onClick={() => navigate(ROUTES.FINANCE_LOG)}
      >
        {STRINGS.BACK}
      </Button>
      <Group gap="sm">
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
        <Box>
          <Text fw={800} c="white" style={{ fontSize: 22 }}>
            {title}
          </Text>
          {subtitle && (
            <Text size="sm" c="white" opacity={0.8}>
              {subtitle}
            </Text>
          )}
        </Box>
      </Group>
    </Box>
  )
}

export function LogTypeSelector() {
  const navigate = useNavigate()

  return (
    <Stack gap="lg">
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Text fw={800} c="white" style={{ fontSize: 24 }}>
          {STRINGS.WHAT_ARE_YOU_LOGGING}
        </Text>
        <Text size="sm" c="white" opacity={0.8} mt={4}>
          {STRINGS.LOG_SUBTITLE}
        </Text>
      </Box>

      <SimpleGrid cols={2} spacing="md">
        {LOG_TYPES.map((t) => (
          <UnstyledButton
            key={t.key}
            onClick={() => navigate(`${ROUTES.FINANCE}/log/${t.key}`)}
            style={{ width: '100%' }}
          >
            <Paper
              p="xl"
              radius="xl"
              withBorder
              style={{ textAlign: 'center', transition: 'all 0.15s ease' }}
            >
              <Text style={{ fontSize: 36 }} mb="sm">
                {t.emoji}
              </Text>
              <Text fw={700} size="md">
                {t.label}
              </Text>
            </Paper>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
