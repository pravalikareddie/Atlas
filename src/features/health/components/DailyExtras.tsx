import { useState, useEffect } from 'react'
import { Group, Paper, Text, Badge, UnstyledButton } from '@mantine/core'
import { format } from 'date-fns'
import { EXTRAS } from '../constants/thali'
import * as svc from '../services/thaliService'

export function DailyExtras() {
  const [extrasLog, setExtrasLog] = useState<Record<string, boolean>>({})
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    svc.fetchExtrasLog(today).then((rows) => {
      const e: Record<string, boolean> = {}
      rows.forEach((r: any) => { e[`${r.extra_id}:${r.item}`] = r.done })
      setExtrasLog(e)
    }).catch(() => {})
  }, [today])

  async function toggle(extraId: string, item: string) {
    const key = `${extraId}:${item}`
    const done = !extrasLog[key]
    setExtrasLog((e) => ({ ...e, [key]: done }))
    try { await svc.upsertExtra(today, extraId, item, done) } catch {}
  }

  return (
    <Group grow align="flex-start" gap="lg">
      {EXTRAS.map((extra) => (
        <Paper key={extra.id} p="lg" radius="lg" withBorder>
          <Text size="xs" fw={700} c="dimmed" mb="sm">{extra.emoji} {extra.label}</Text>
          <Group gap="md" wrap="wrap">
            {extra.items.map((item) => {
              const done = extrasLog[`${extra.id}:${item}`]
              return (
                <UnstyledButton key={item} onClick={() => toggle(extra.id, item)}>
                  <Badge size="lg" radius="lg" px="lg" variant={done ? 'filled' : 'outline'} color={done ? 'green' : 'gray'} style={{ cursor: 'pointer' }}>
                    {done ? '✓ ' : ''}{item}
                  </Badge>
                </UnstyledButton>
              )
            })}
          </Group>
        </Paper>
      ))}
    </Group>
  )
}
