import { ActionIcon, Box, Stack, Text } from '@mantine/core'
import { ROUTINE_GRADIENTS } from '../constants'
import { Routine } from '../types/routine.types'
import { STRINGS } from '../../tasks/constants/strings'
import { PencilIcon } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { DATE_FORMAT } from '../../tasks/constants/taskConstants'

export function RoutineCard({
  routine,
  stepCount,
  onRun,
  onEdit,
}: {
  routine: Routine
  stepCount: number
  onRun: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const gradient = ROUTINE_GRADIENTS[routine.gradient ?? 0]

  return (
    <Box
      style={{
        background: gradient,
        borderRadius: 'var(--mantine-radius-xl)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 120,
        padding: 'var(--mantine-spacing-lg)',
      }}
      onClick={onRun}
    >
      {/* Edit button */}
      <ActionIcon
        variant="transparent"
        style={{ position: 'absolute', top: 10, right: 10 }}
        onClick={onEdit}
        aria-label={STRINGS.ROUTINE_EDIT}
      >
        <PencilIcon size={14} color="rgba(255,255,255,0.7)" />
      </ActionIcon>

      <Stack gap="xs" justify="flex-end" style={{ height: '100%' }}>
        <Text fw={600} c="white" size="md" lh={1.3} pr={24}>
          {routine.title}
        </Text>
        <Text size="xs" c="white" opacity={0.7}>
          {stepCount} {STRINGS.ROUTINE_STEPS} ·{' '}
          {routine.last_done
            ? `${STRINGS.ROUTINE_LAST_DONE} ${format(parseISO(routine.last_done), DATE_FORMAT.SHORT)}`
            : STRINGS.ROUTINE_NEVER_DONE}
        </Text>
      </Stack>
    </Box>
  )
}
