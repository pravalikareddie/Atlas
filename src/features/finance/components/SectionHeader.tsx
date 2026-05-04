import React from 'react'
import { Group, Text } from '@mantine/core'

export function SectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <Group justify="space-between" mb="md">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>{label}</Text>
      {right}
    </Group>
  )
}
