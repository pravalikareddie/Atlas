import { Text } from '@mantine/core'

interface Props {
  children: React.ReactNode
}

export function SectionLabel({ children }: Props) {
  return (
    <Text tt="uppercase" mb="sm">
      {children}
    </Text>
  )
}
