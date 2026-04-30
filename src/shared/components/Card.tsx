import { Paper, PaperProps } from '@mantine/core'

interface Props extends PaperProps {
  children: React.ReactNode
  onClick?: () => void
}

export function Card({ children, onClick, ...rest }: Props) {
  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      {...rest}
    >
      {children}
    </Paper>
  )
}
