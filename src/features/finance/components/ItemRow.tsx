import React from 'react'
import { Group } from '@mantine/core'

export function ItemRow({ children, faded = false }: { children: React.ReactNode; faded?: boolean }) {
  return (
    <Group gap="sm" p="md" style={{
      borderRadius: 'var(--mantine-radius-lg)',
      background: 'var(--mantine-color-default-hover)',
      opacity: faded ? 0.5 : 1,
    }}>
      {children}
    </Group>
  )
}
