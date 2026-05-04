// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SimpleGrid,
  Text,
  UnstyledButton,
  Stack,
  Box,
  Group,
  ActionIcon,
  Badge,
  TextInput,
  Button,
} from '@mantine/core'
import { NavyCard } from './FinanceDesign'
import { Check, Trash, PencilSimple, Copy } from '@phosphor-icons/react'
import { ROUTES } from '../../../app/routes'
import { useFinanceStore } from '../store/financeStore'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import {
  TASK_TYPE,
  TASK_STATUS,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { formatMoney } from '../utils/moneyUtils'
import {
  updateSplitwise as updateSplitDb,
  deleteSplitwise as deleteSplitDb,
} from '../services/splitwiseService'
import {
  updateSubscription as updateSubDb,
  deleteSubscription as deleteSubDb,
} from '../services/subscriptionService'
import {
  updateRefund as updateRefundDb,
  deleteRefund as deleteRefundDb,
} from '../services/refundService'
import { SplitwiseEntry, Subscription, Refund } from '../types/finance.types'
import { STRINGS } from '../../tasks/constants/strings'

const LOG_TYPES = [
  {
    key: 'expense',
    emoji: '💸',
    label: 'Expense',
    route: ROUTES.FINANCE_LOG_EXPENSE,
  },
  {
    key: 'refund',
    emoji: '🔄',
    label: 'Refund',
    route: ROUTES.FINANCE_LOG_REFUND,
  },
  {
    key: 'splitwise',
    emoji: '👥',
    label: 'Splitwise',
    route: ROUTES.FINANCE_LOG_SPLITWISE,
  },
  {
    key: 'subscription',
    emoji: '📦',
    label: 'Subscription',
    route: ROUTES.FINANCE_LOG_SUBSCRIPTION,
  },
] as const

const VIEW_TABS = ['Tasks', 'Splitwise', 'Subscriptions', 'Refunds'] as const
type ViewTab = (typeof VIEW_TABS)[number]

export function LogHeader({
  title,
  subtitle,
  emoji,
}: {
  title: string
  subtitle?: string
  emoji: string
}) {
  const navigate = useNavigate()
  return (
    <Box
      p="xl"
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
        borderRadius: 'var(--mantine-radius-xl)',
      }}
    >
      <Box
        style={{ cursor: 'pointer', marginBottom: 'var(--mantine-spacing-sm)' }}
        onClick={() => navigate(ROUTES.FINANCE_LOG)}
      >
        <Text size="sm" c="white" opacity={0.7}>
          ← Back
        </Text>
      </Box>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--mantine-spacing-sm)',
        }}
      >
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
        <Box>
          <Text fw={800} c="white" style={{ fontSize: 22 }}>
            {title}
          </Text>
          {subtitle && (
            <Text size="sm" c="white" opacity={0.8}>
              {subtitle}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export function LogTypeSelector() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ViewTab>('Splitwise')
  const store = useFinanceStore()

  return (
    <Stack gap="lg">
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Text fw={800} c="white" style={{ fontSize: 24 }}>
          What are you logging?
        </Text>
        <Text size="sm" c="white" opacity={0.8} mt={4}>
          Track every dollar in and out.
        </Text>
      </Box>

      <SimpleGrid cols={2} spacing="md">
        {LOG_TYPES.map((t) => (
          <UnstyledButton
            key={t.key}
            onClick={() => navigate(t.route)}
            style={{ width: '100%' }}
          >
            <NavyCard>
              <Box ta="center">
                <Text style={{ fontSize: 36 }} mb="sm">
                  {t.emoji}
                </Text>
                <Text fw={700} size="md" c="white">
                  {t.label}
                </Text>
              </Box>
            </NavyCard>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

// ─── Splitwise ────────────────────────────────────────────────────────────────

function SplitwiseList({
  store,
}: {
  store: ReturnType<typeof useFinanceStore>
}) {
  const { splitwise, updateSplitwiseEntry, removeSplitwiseEntry } = store
  const outstanding = splitwise.filter((s) => s.status === 'outstanding')
  const settled = splitwise.filter((s) => s.status === 'settled')

  async function markSettled(id: string) {
    updateSplitwiseEntry(id, {
      status: 'settled',
      settled_at: new Date().toISOString(),
    })
    try {
      await updateSplitDb(id, {
        status: 'settled',
        settled_at: new Date().toISOString(),
      })
    } catch {}
  }
  async function remove(id: string) {
    removeSplitwiseEntry(id)
    try {
      await deleteSplitDb(id)
    } catch {}
  }

  return (
    <Stack gap="md">
      {outstanding.length === 0 && (
        <Text size="sm" c="dimmed">
          No outstanding splits
        </Text>
      )}
      {outstanding.map((s) => (
        <NavyCard p="md" key={s.id}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" fw={600}>
                {s.person}
              </Text>
              <Text size="xs" c="dimmed">
                {s.description} ·{' '}
                {s.direction === 'owed_to_me' ? 'owes you' : 'you owe'}
              </Text>
            </Box>
            <Group gap="md">
              <Text size="sm" fw={700}>
                {formatMoney(s.amount)}
              </Text>
              <ActionIcon
                variant="light"
                color="teal"
                size="sm"
                onClick={() => markSettled(s.id)}
              >
                <Check size={12} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => remove(s.id)}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          </Group>
        </NavyCard>
      ))}
      {settled.length > 0 && (
        <Text size="xs" c="dimmed" mt="sm">
          {settled.length} settled
        </Text>
      )}
    </Stack>
  )
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

function SubscriptionList({
  store,
}: {
  store: ReturnType<typeof useFinanceStore>
}) {
  const { subscriptions, updateSubscription, removeSubscription } = store
  const active = subscriptions.filter((s) => s.status === 'active')

  async function cancel(id: string) {
    updateSubscription(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    try {
      await updateSubDb(id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
    } catch {}
  }
  async function remove(id: string) {
    removeSubscription(id)
    try {
      await deleteSubDb(id)
    } catch {}
  }

  const moTotal = active.reduce(
    (sum, s) =>
      sum + (s.period === 'monthly' ? s.amount : Math.round(s.amount / 12)),
    0,
  )

  return (
    <Stack gap="md">
      <Text size="xs" c="dimmed">
        Monthly total: {formatMoney(moTotal)}
      </Text>
      {active.length === 0 && (
        <Text size="sm" c="dimmed">
          No active subscriptions
        </Text>
      )}
      {active.map((s) => (
        <NavyCard p="md" key={s.id}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" fw={600}>
                {s.name}
              </Text>
              <Text size="xs" c="dimmed">
                {formatMoney(s.amount)}/{s.period} · renews day {s.renewal_day}
              </Text>
            </Box>
            <Group gap="md">
              {daysUntilRenewal(s.renewal_day) <= 3 && (
                <Badge size="xs" color="orange">
                  Soon
                </Badge>
              )}
              <ActionIcon
                variant="light"
                color="orange"
                size="sm"
                onClick={() => cancel(s.id)}
              >
                <Check size={12} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => remove(s.id)}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          </Group>
        </NavyCard>
      ))}
    </Stack>
  )
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

function RefundList({ store }: { store: ReturnType<typeof useFinanceStore> }) {
  const { refunds, updateRefund, removeRefund } = store
  const pending = refunds.filter((r) => r.status === 'pending')

  async function markReceived(id: string) {
    updateRefund(id, {
      status: 'received',
      resolved_at: new Date().toISOString(),
    })
    try {
      await updateRefundDb(id, {
        status: 'received',
        resolved_at: new Date().toISOString(),
      })
    } catch {}
  }
  async function remove(id: string) {
    removeRefund(id)
    try {
      await deleteRefundDb(id)
    } catch {}
  }

  return (
    <Stack gap="md">
      {pending.length === 0 && (
        <Text size="sm" c="dimmed">
          No pending refunds
        </Text>
      )}
      {pending.map((r) => (
        <NavyCard p="md" key={r.id}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" fw={600}>
                {r.description}
              </Text>
              <Text size="xs" c="dimmed">
                Expected by {r.expected_by}
              </Text>
            </Box>
            <Group gap="md">
              <Text size="sm" fw={700}>
                {formatMoney(r.amount)}
              </Text>
              <ActionIcon
                variant="light"
                color="teal"
                size="sm"
                onClick={() => markReceived(r.id)}
              >
                <Check size={12} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => remove(r.id)}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          </Group>
        </NavyCard>
      ))}
    </Stack>
  )
}

// ─── Finance Tasks ────────────────────────────────────────────────────────────

function FinanceTaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const { create, update, remove } = useTaskActions()
  const [newTitle, setNewTitle] = useState('')

  const financeTasks = tasks.filter(
    (t) => t.type === TASK_TYPE.FINANCE && t.status === TASK_STATUS.TODO,
  )
  const doneTasks = tasks.filter(
    (t) => t.type === TASK_TYPE.FINANCE && t.status === TASK_STATUS.DONE,
  )

  async function addTask() {
    if (!newTitle.trim()) return
    await create({
      user_id: USER_ID,
      title: newTitle.trim(),
      notes: null,
      type: TASK_TYPE.FINANCE,
      priority: null,
      is_must: false,
      status: TASK_STATUS.TODO,
      due_date: null,
      do_today: false,
      completed_at: null,
      goal_id: null,
      milestone_id: null,
      project_id: null,
      roadmap_item_id: null,
      calendar_event_id: null,
      parent_task_id: null,
      ticket_id: null,
      order_index: 0,
      cadence: null,
      cadence_days: null,
      cadence_date: null,
      cadence_interval: null,
      push_count: 0,
      is_learning: false,
    })
    setNewTitle('')
  }

  return (
    <Stack gap="md">
      {financeTasks.length === 0 && (
        <Text size="sm" c="dimmed">
          No finance tasks
        </Text>
      )}
      {financeTasks.map((t) => (
        <NavyCard p="md" key={t.id}>
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              {t.title}
            </Text>
            <Group gap="md">
              <ActionIcon
                variant="light"
                color="teal"
                size="sm"
                onClick={() =>
                  update(t.id, {
                    status: TASK_STATUS.DONE,
                    completed_at: new Date().toISOString(),
                  })
                }
              >
                <Check size={12} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => remove(t.id)}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          </Group>
        </NavyCard>
      ))}
      {doneTasks.length > 0 && (
        <Text size="xs" c="dimmed">
          {doneTasks.length} completed
        </Text>
      )}
      <Group gap="md" mt="xs">
        <TextInput
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder={STRINGS.ADD_FINANCE_TASK_PH}
          size="xs"
          radius="lg"
          style={{ flex: 1 }}
        />
        <Button
          size="xs"
          radius="xl"
          color="teal"
          onClick={addTask}
          disabled={!newTitle.trim()}
        >
          Add
        </Button>
      </Group>
    </Stack>
  )
}
