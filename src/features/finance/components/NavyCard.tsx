import React from 'react'
import { Box } from '@mantine/core'

export function NavyCard({ children, p = 'lg' }: { children: React.ReactNode; p?: string }) {
  return (
    <Box p={p} style={{ background: 'var(--mantine-color-body)', borderRadius: 16, border: '1px solid var(--mantine-color-default-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {children}
    </Box>
  )
}
