import { Progress } from '@mantine/core'

interface Props {
  value: number
  color?: string
}

export function ProgressBar({ value, color = 'purple' }: Props) {
  return <Progress value={value} color={color} radius="xl" />
}
