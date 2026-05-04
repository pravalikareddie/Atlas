import { Text } from '@mantine/core'

interface Props {
  children: React.ReactNode
}

export function SectionLabel({ children }: Props) {
  return <Text mb="sm">{children}</Text>
}
