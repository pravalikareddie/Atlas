import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Group, Text, Box, Paper, UnstyledButton, Collapse, Button } from '@mantine/core'
import { DomainCard } from '../types/domain.types'
import { useDomainStatus } from '../hooks/useDomainStatus'
import { SortableList } from '../../../shared/components/SortableList'
import { saveDomainCardOrder, fetchDomainCardOrder } from '../services/weeklyReviewService'
import { ROUTES } from '../../../app/routes'

export function DomainCards() {
  const cards = useDomainStatus()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showNoData, setShowNoData] = useState(false)
  const [userOrder, setUserOrder] = useState<string[] | null>(null)

  useEffect(() => {
    fetchDomainCardOrder().then(setUserOrder).catch(() => {})
  }, [])

  const attention = cards.filter((c) => c.status === 'needs_attention')
  const steady = cards.filter((c) => c.status === 'holding_steady')
  const noData = cards.filter((c) => c.status === 'no_data')

  const orderedSteady = userOrder
    ? [...steady].sort((a, b) => {
        const ai = userOrder.indexOf(a.domain)
        const bi = userOrder.indexOf(b.domain)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
    : steady

  const steadyWithId = orderedSteady.map((c) => ({ ...c, id: c.domain }))

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Box>
          <Text fw={800} size="lg">Your Week</Text>
          <Text size="xs" c="dimmed">How your life areas are doing</Text>
        </Box>
        <Button variant="light" color="teal" radius="xl" size="xs"
          onClick={() => navigate(ROUTES.WEEKLY_REVIEW)}>
          📝 Review
        </Button>
      </Group>

      {/* Needs attention */}
      {attention.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="amber" lts={1}>Needs attention</Text>
          {attention.map((card) => (
            <CardRow key={card.domain} card={card} expanded={expanded === card.domain}
              onToggle={() => setExpanded(expanded === card.domain ? null : card.domain)} />
          ))}
        </Stack>
      )}

      {/* Holding steady */}
      {steadyWithId.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>On track</Text>
          <SortableList
            items={steadyWithId}
            onReorder={(r) => {
              const order = r.map((c) => c.domain)
              setUserOrder(order)
              saveDomainCardOrder(order).catch(() => {})
            }}
            renderItem={(card) => (
              <CardRow card={card} expanded={expanded === card.domain}
                onToggle={() => setExpanded(expanded === card.domain ? null : card.domain)} />
            )}
          />
        </Stack>
      )}

      {/* No data */}
      {noData.length > 0 && (
        <>
          <UnstyledButton onClick={() => setShowNoData(!showNoData)}>
            <Text size="xs" c="dimmed">{showNoData ? 'Hide' : `+ ${noData.length} more`}</Text>
          </UnstyledButton>
          <Collapse in={showNoData}>
            <Stack gap="xs">
              {noData.map((card) => (
                <Paper key={card.domain} p="sm" radius="md" style={{ background: 'var(--mantine-color-dark-7)' }}>
                  <Group gap="sm">
                    <Text style={{ fontSize: 18 }}>{card.icon}</Text>
                    <Text size="sm" c="dimmed">{card.label}</Text>
                    <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>No data yet</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Collapse>
        </>
      )}
    </Stack>
  )
}

function CardRow({ card, expanded, onToggle }: { card: DomainCard; expanded: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const isAttention = card.status === 'needs_attention'

  return (
    <Paper
      p="md"
      radius="lg"
      withBorder
      style={{
        borderLeft: isAttention ? '3px solid var(--mantine-color-amber-5)' : undefined,
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <Group gap="md" wrap="nowrap">
        <Box w={40} h={40} style={{
          borderRadius: 'var(--mantine-radius-md)',
          background: isAttention ? 'var(--mantine-color-amber-light)' : 'var(--mantine-color-dark-6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Text style={{ fontSize: 20 }}>{card.icon}</Text>
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={2}>
            <Text size="sm" fw={700}>{card.label}</Text>
            {isAttention && <Text size="xs" c="amber">⚠</Text>}
          </Group>
          {card.lastEvent && (
            <Text size="xs" c="dimmed" lineClamp={expanded ? undefined : 1}>{card.lastEvent}</Text>
          )}
          {!card.lastEvent && <Text size="xs" c="dimmed">All good</Text>}
        </Box>
      </Group>

      <Collapse in={expanded}>
        {card.action && (
          <UnstyledButton
            onClick={(e) => { e.stopPropagation(); navigate(card.action!.route) }}
            mt="md"
            style={{ width: '100%' }}
          >
            <Paper p="sm" radius="md" style={{
              background: isAttention ? 'var(--mantine-color-amber-light)' : 'var(--mantine-color-teal-light)',
            }}>
              <Group gap="sm" wrap="nowrap">
                <Text size="sm" c={isAttention ? 'amber.8' : 'teal.8'} style={{ flex: 1 }}>
                  {card.action.text}
                </Text>
                <Text c={isAttention ? 'amber' : 'teal'}>→</Text>
              </Group>
            </Paper>
          </UnstyledButton>
        )}
      </Collapse>
    </Paper>
  )
}
