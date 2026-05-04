import { UnstyledButton } from '@mantine/core'
import { Check } from '@phosphor-icons/react'

interface Props {
  done: boolean
  onToggle: () => void
  size?: number
  color?: string
}

export function TaskCheckbox({ done, onToggle, size = 20, color = 'teal' }: Props) {
  return (
    <UnstyledButton
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      w={size}
      h={size}
      style={{
        borderRadius: '50%',
        flexShrink: 0,
        border: done ? 'none' : `2px solid var(--mantine-color-${color}-4)`,
        backgroundColor: done ? 'var(--mantine-color-green-5)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
    >
      {done && <Check size={Math.round(size * 0.5)} color="white" weight="bold" />}
    </UnstyledButton>
  )
}
