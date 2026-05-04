// @ts-nocheck
import {
  Box,
  Text,
  UnstyledButton,
  Divider,
  Stack,
  Paper,
  Group,
  ActionIcon,
  TextInput,
  Collapse,
  Select,
  Badge,
  Modal,
  Textarea,
  Button,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { formatMoney } from '../utils/moneyUtils'
import {
  formatAge,
  formatDateShort,
  isOverdue,
  daysSince,
  daysUntilRenewal,
} from '../utils'
import { ACCOUNT_TYPE_LABELS } from '../constants/strings'
import {
  updateRefund as updateRefundDb,
  deleteRefund as deleteRefundDb,
} from '../services/refundService'
import {
  updateSplitwise as updateSplitDb,
  deleteSplitwise as deleteSplitDb,
} from '../services/splitwiseService'
import {
  updateSubscription as updateSubDb,
  deleteSubscription as deleteSubDb,
} from '../services/subscriptionService'
import {
  deleteAccount,
  insertAccount as insertAcctDb,
  updateAccount as updateAcctDb,
} from '../services/accountService'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import {
  Account,
  Refund,
  SplitwiseEntry,
  Subscription,
} from '../types/finance.types'
import {
  DATE_FORMAT,
  TASK_STATUS,
  TASK_TYPE,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import {
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  Copy,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { STRINGS } from '../../tasks/constants/strings'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { useNavigate } from 'react-router-dom'
import { Task } from '../../tasks/types/task.types'
import { ROUTES } from '../../../app/routes'
import { TaskDetailSheet } from '../../tasks/components/TaskDetailSheet'
import { format, parseISO } from 'date-fns'
export function AccountsScreen() {
  useTaskData()
  const store = useFinanceStore()
  const tasks = useTaskStore((s) => s.tasks)
  const {
    update: updateTask,
    remove: removeTask,
    create: createTask,
  } = useTaskActions()
  const navigate = useNavigate()
  const {
    accounts,
    addAccount,
    updateAccount: updateAcctState,
    removeAccount,
    refunds,
    updateRefund,
    splitwise,
    updateSplitwiseEntry,
    removeSplitwiseEntry,
    subscriptions,
    updateSubscription,
    loading,
  } = store

  const [showAddAcct, setShowAddAcct] = useState(false)
  const [editAcctId, setEditAcctId] = useState<string | null>(null)
  const [showReceived, setShowReceived] = useState(false)
  const [showSettled, setShowSettled] = useState(false)
  const [showDoneTasks, setShowDoneTasks] = useState(false)
  const [clipboard, setClipboard] = useState<string | null>(null)
  const [editRefundId, setEditRefundId] = useState<string | null>(null)
  const [editSplitId, setEditSplitId] = useState<string | null>(null)
  const [editSubId, setEditSubId] = useState<string | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [confirmDeleteAcct, setConfirmDeleteAcct] = useState<string | null>(
    null,
  )

  if (loading) return <SkeletonRow count={12} />

  const financeTasks = tasks.filter(
    (t) => t.type === TASK_TYPE.FINANCE && t.status === TASK_STATUS.TODO,
  )
  const doneTasks = tasks.filter(
    (t) => t.type === TASK_TYPE.FINANCE && t.status === TASK_STATUS.DONE,
  )
  const pending = refunds.filter((r) => r.status === 'pending')
  const received = refunds.filter((r) => r.status !== 'pending').slice(0, 5)
  const owedToMe = splitwise.filter(
    (s) => s.direction === 'owed_to_me' && s.status === 'outstanding',
  )
  const iOwe = splitwise.filter(
    (s) => s.direction === 'i_owe' && s.status === 'outstanding',
  )
  const settled = splitwise.filter((s) => s.status === 'settled')
  const soon = subscriptions.filter(
    (s) => s.status === 'active' && daysUntilRenewal(s.renewal_day) <= 3,
  )
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' && daysUntilRenewal(s.renewal_day) > 3,
  )
  const moTotal = subscriptions
    .filter((s) => s.status === 'active')
    .reduce(
      (sum, s) =>
        sum + (s.period === 'monthly' ? s.amount : Math.round(s.amount / 12)),
      0,
    )

  // Account CRUD
  async function saveAcct(
    data: {
      name: string
      type: Account['type']
      last_four: string
      label: string
      due_date: string
    },
    id?: string,
  ) {
    const row = {
      name: data.name,
      type: data.type,
      last_four: data.last_four || null,
      label: data.label || null,
      due_date: data.due_date ? parseInt(data.due_date) : null,
    }
    if (id) {
      updateAcctState(id, row)
      try {
        await updateAcctDb(id, row)
      } catch {}
      setEditAcctId(null)
    } else {
      const full = { ...row, user_id: USER_ID }
      try {
        const r = await insertAcctDb(full)
        addAccount(r)
      } catch {
        addAccount({
          ...full,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
      setShowAddAcct(false)
    }
  }

  async function deleteAcct(id: string) {
    removeAccount(id)
    try {
      await deleteAccount(id)
    } catch {}
    setConfirmDeleteAcct(null)
  }

  // Refund CRUD
  async function markRefund(id: string, status: 'received' | 'gave_up') {
    updateRefund(id, { status, resolved_at: new Date().toISOString() })
    try {
      await updateRefundDb(id, {
        status,
        resolved_at: new Date().toISOString(),
      })
    } catch {}
  }

  async function saveRefundEdit(
    id: string,
    data: {
      description: string
      amount: number
      expected_by: string
    },
  ) {
    updateRefund(id, data)
    try {
      await updateRefundDb(id, data)
    } catch {}
    setEditRefundId(null)
  }

  // Splitwise CRUD
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

  async function deleteSplit(id: string) {
    removeSplitwiseEntry(id)
    try {
      await deleteSplitDb(id)
    } catch {}
  }

  async function saveSplitEdit(
    id: string,
    data: {
      person: string
      amount: number
      direction: string
      description: string | null
    },
  ) {
    updateSplitwiseEntry(id, data as Partial<SplitwiseEntry>)
    try {
      await updateSplitDb(id, data as Partial<SplitwiseEntry>)
    } catch {}
    setEditSplitId(null)
  }

  // Subscription CRUD
  async function cancelSub(id: string) {
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

  async function saveSubEdit(
    id: string,
    data: {
      name: string
      amount: number
      period: string
      renewal_day: number
    },
  ) {
    updateSubscription(id, data as Partial<Subscription>)
    try {
      await updateSubDb(id, data as Partial<Subscription>)
    } catch {}
    setEditSubId(null)
  }

  async function deleteRefund(id: string) {
    store.removeRefund(id)
    try {
      await deleteRefundDb(id)
    } catch {}
    setEditRefundId(null)
  }

  async function deleteSub(id: string) {
    store.removeSubscription(id)
    try {
      await deleteSubDb(id)
    } catch {}
    setEditSubId(null)
  }

  // Finance tasks
  async function addFinanceTask() {
    if (!newTaskTitle.trim()) return
    await createTask({
      user_id: USER_ID,
      title: newTaskTitle.trim(),
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
      sprint_id: null,
      blocked: false,
      blocked_note: null,
      is_learning: false,
    })
    setNewTaskTitle('')
  }

  function showFollowUp(r: Refund) {
    setClipboard(
      `Hi, I returned ${r.description} on ${r.returned_at} and was expecting a refund of ${formatMoney(r.amount)} by ${r.expected_by}. Could you please check on the status?`,
    )
  }

  function showReminder(s: SplitwiseEntry) {
    setClipboard(
      `Hey ${s.person}, just following up on the ${formatMoney(s.amount)} from ${s.description ?? 'earlier'} — whenever you get a chance!`,
    )
  }

  const [activeTab, setActiveTab] = useState<'todos' | 'refunds' | 'splitwise' | 'subscriptions' | 'accounts'>('todos')

  return (
    <Stack gap="lg">
      {/* Tabs */}
      <Group gap={6}>
        {([
          { value: 'todos' as const, label: 'Todos' },
          { value: 'refunds' as const, label: 'Refunds' },
          { value: 'splitwise' as const, label: 'Splitwise' },
          { value: 'subscriptions' as const, label: 'Subscriptions' },
          { value: 'accounts' as const, label: 'Bank Accounts' },
        ]).map((tab) => (
          <UnstyledButton key={tab.value} onClick={() => setActiveTab(tab.value)}>
            <Box px="md" py={6} style={{
              borderRadius: 'var(--mantine-radius-xl)',
              background: activeTab === tab.value ? 'var(--mantine-color-teal-6)' : 'rgba(255,255,255,0.05)',
              transition: 'all 0.15s ease',
            }}>
              <Text size="xs" fw={activeTab === tab.value ? 700 : 500} c={activeTab === tab.value ? 'white' : 'dimmed'}>
                {tab.label}
              </Text>
            </Box>
          </UnstyledButton>
        ))}
      </Group>

      {/* ── FINANCE TASKS ── */}
      {activeTab === 'todos' && <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.FINANCE_TODOS}
          </Text>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => {
              setNewTaskTitle('')
              document
                .querySelector<HTMLInputElement>(
                  '[placeholder="' + STRINGS.ADD_FINANCE_TASK + '"]',
                )
                ?.focus()
            }}
          >
            {STRINGS.ADD}
          </Button>
        </Group>

        {financeTasks.length === 0 && (
          <Text size="sm" c="dimmed" mb="sm">
            {STRINGS.NO_FINANCE_TASKS}
          </Text>
        )}

        <Stack gap="md">
          <SortableList items={financeTasks} onReorder={(r) => persistOrder(r, (id, d) => updateTodo(id, d), (id, d) => updateTodoDb(id, d))} renderItem={(t) => (
            <Group
              gap="md"
              p="md"
              style={{
                borderRadius: 'var(--mantine-radius-lg)',
                background: 'var(--mantine-color-dark-6)',
              }}
            >
              <UnstyledButton
                onClick={() =>
                  updateTask(t.id, {
                    status: TASK_STATUS.DONE,
                    completed_at: new Date().toISOString(),
                  })
                }
                w={20}
                h={20}
                style={{
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: '2px solid var(--mantine-color-teal-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              <Text
                size="sm"
                fw={600}
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => setDetailTask(t)}
              >
                {t.title}
              </Text>
              {t.due_date && (
                <Text size="xs" c="dimmed">
                  {format(parseISO(t.due_date), DATE_FORMAT.SHORT)}
                </Text>
              )}
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={() => setDetailTask(t)}
              >
                <PencilSimple size={12} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => removeTask(t.id)}
              >
                <Trash size={12} />
              </ActionIcon>
            </Group>
          )} />
        </Stack>

        {/* Quick add */}
        <Group gap="md" mt="sm">
          <TextInput
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFinanceTask()}
            placeholder={STRINGS.ADD_FINANCE_TASK}
            size="xs"
            radius="lg"
            style={{ flex: 1 }}
          />
          <Button
            size="xs"
            radius="xl"
            color="teal"
            onClick={addFinanceTask}
            disabled={!newTaskTitle.trim()}
          >
            {STRINGS.ADD}
          </Button>
        </Group>

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <>
            <UnstyledButton onClick={() => setShowDoneTasks((o) => !o)} mt="sm">
              <Group gap="md">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  {STRINGS.DONE} ({doneTasks.length})
                </Text>
                {showDoneTasks ? (
                  <CaretUp size={12} />
                ) : (
                  <CaretDown size={12} />
                )}
              </Group>
            </UnstyledButton>
            <Collapse in={showDoneTasks}>
              <Stack gap="md" mt="xs">
                {doneTasks.map((t) => (
                  <Group
                    key={t.id}
                    gap="md"
                    p="md"
                    opacity={0.5}
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: 'var(--mantine-color-dark-6)',
                    }}
                  >
                    <UnstyledButton
                      onClick={() =>
                        updateTask(t.id, {
                          status: TASK_STATUS.TODO,
                          completed_at: null,
                        })
                      }
                      w={18}
                      h={18}
                      style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: 'var(--mantine-color-green-5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={10} color="white" />
                    </UnstyledButton>
                    <Text size="sm" td="line-through" style={{ flex: 1 }}>
                      {t.title}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => removeTask(t.id)}
                    >
                      <Trash size={12} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Paper>}

      {/* ── REFUNDS ── */}
      {activeTab === 'refunds' && <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.REFUND_TRACKER}
          </Text>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => navigate(ROUTES.FINANCE_LOG_REFUND)}
          >
            {STRINGS.ADD}
          </Button>
        </Group>

        {!pending.length && (
          <Text size="sm" c="dimmed" mb="sm">
            {STRINGS.EMPTY_REFUNDS}
          </Text>
        )}

        <Stack gap="md">
          {pending.map((r) => {
            const days = daysSince(r.returned_at)
            const over = isOverdue(r.expected_by)
            if (editRefundId === r.id)
              return (
                <RefundEditForm
                  key={r.id}
                  refund={r}
                  onSave={(d) => saveRefundEdit(r.id, d)}
                  onCancel={() => setEditRefundId(null)}
                  onDelete={() => deleteRefund(r.id)}
                />
              )
            return (
              <Paper
                key={r.id}
                p="md"
                radius="lg"
                withBorder
                style={{
                  borderColor: over
                    ? 'var(--mantine-color-red-3)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <Group justify="space-between" mb={4}>
                  <Text size="sm" fw={600}>
                    {r.description}
                  </Text>
                  <Text size="sm" fw={700} c="teal">
                    {formatMoney(r.amount)}
                  </Text>
                </Group>
                <Group gap="md" mb="sm">
                  <Text size="xs" c="dimmed">
                    {STRINGS.RETURNED} {formatDateShort(r.returned_at)}
                  </Text>
                  <Text size="xs" c={over ? 'red' : 'dimmed'}>
                    · {STRINGS.EXPECTED} {formatDateShort(r.expected_by)}
                    {over ? ` · ${STRINGS.OVERDUE}` : ` · day ${days}`}
                  </Text>
                </Group>
                <Group gap="md">
                  {over && (
                    <Button
                      variant="light"
                      color="orange"
                      size="xs"
                      radius="xl"
                      onClick={() => showFollowUp(r)}
                    >
                      {STRINGS.SEND_FOLLOW_UP}
                    </Button>
                  )}
                  <Button
                    variant="light"
                    color="green"
                    size="xs"
                    radius="xl"
                    onClick={() => markRefund(r.id, 'received')}
                  >
                    {STRINGS.RECEIVED}
                  </Button>
                  <Button
                    variant="light"
                    color="gray"
                    size="xs"
                    radius="xl"
                    onClick={() => markRefund(r.id, 'gave_up')}
                  >
                    {STRINGS.GAVE_UP}
                  </Button>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={() => setEditRefundId(r.id)}
                  >
                    <PencilSimple size={12} />
                  </ActionIcon>
                </Group>
              </Paper>
            )
          })}
        </Stack>

        {received.length > 0 && (
          <>
            <UnstyledButton onClick={() => setShowReceived((o) => !o)} mt="sm">
              <Group gap="md">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  {STRINGS.RECEIVED} ({received.length})
                </Text>
                {showReceived ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </Group>
            </UnstyledButton>
            <Collapse in={showReceived}>
              <Stack gap="md" mt="xs">
                {received.map((r) => (
                  <Group
                    key={r.id}
                    gap="md"
                    p="md"
                    opacity={0.6}
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: 'var(--mantine-color-dark-6)',
                    }}
                  >
                    <CheckCircle
                      size={14}
                      color="var(--mantine-color-green-5)"
                      weight="fill"
                    />
                    <Text size="sm" style={{ flex: 1 }}>
                      {r.description}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatMoney(r.amount)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Paper>}

      {/* ── SPLITWISE ── */}
      {activeTab === 'splitwise' && <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.SPLITWISE}
          </Text>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => navigate(ROUTES.FINANCE_LOG_SPLITWISE)}
          >
            {STRINGS.ADD}
          </Button>
        </Group>

        {!owedToMe.length && !iOwe.length && (
          <Text size="sm" c="dimmed">
            {STRINGS.EMPTY_SPLITWISE}
          </Text>
        )}

        <Stack gap="md">
          {owedToMe.length > 0 && (
            <Stack gap="md">
              <Text size="xs" fw={600} c="dimmed">
                {STRINGS.YOU_ARE_OWED}
              </Text>
              {owedToMe.map((s) => {
                if (editSplitId === s.id)
                  return (
                    <SplitEditForm
                      key={s.id}
                      entry={s}
                      onSave={(d) => saveSplitEdit(s.id, d)}
                      onCancel={() => setEditSplitId(null)}
                    />
                  )
                return (
                  <Paper key={s.id} p="md" radius="lg" withBorder>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={600}>
                        {s.person}
                      </Text>
                      <Text size="sm" fw={700} c="green">
                        {formatMoney(s.amount)}
                      </Text>
                    </Group>
                    {s.description && (
                      <Text size="xs" c="dimmed" mb="xs">
                        {s.description}
                      </Text>
                    )}
                    <Group gap="md">
                      <Text size="xs" c="dimmed">
                        {formatAge(s.logged_at)}
                      </Text>
                      <Button
                        variant="light"
                        color="teal"
                        size="xs"
                        radius="xl"
                        onClick={() => showReminder(s)}
                      >
                        {STRINGS.SEND_REMINDER}
                      </Button>
                      <Button
                        variant="light"
                        color="green"
                        size="xs"
                        radius="xl"
                        onClick={() => markSettled(s.id)}
                      >
                        {STRINGS.SETTLED}
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        onClick={() => setEditSplitId(s.id)}
                      >
                        <PencilSimple size={12} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => deleteSplit(s.id)}
                      >
                        <Trash size={12} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                )
              })}
            </Stack>
          )}

          {iOwe.length > 0 && (
            <Stack gap="md">
              <Text size="xs" fw={600} c="dimmed">
                {STRINGS.YOU_OWE}
              </Text>
              {iOwe.map((s) => {
                if (editSplitId === s.id)
                  return (
                    <SplitEditForm
                      key={s.id}
                      entry={s}
                      onSave={(d) => saveSplitEdit(s.id, d)}
                      onCancel={() => setEditSplitId(null)}
                    />
                  )
                return (
                  <Paper key={s.id} p="md" radius="lg" withBorder>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={600}>
                        {s.person}
                      </Text>
                      <Text size="sm" fw={700} c="red">
                        {formatMoney(s.amount)}
                      </Text>
                    </Group>
                    {s.description && (
                      <Text size="xs" c="dimmed" mb="xs">
                        {s.description}
                      </Text>
                    )}
                    <Group gap="md">
                      <Text size="xs" c="dimmed">
                        {formatAge(s.logged_at)}
                      </Text>
                      <Button
                        variant="light"
                        color="green"
                        size="xs"
                        radius="xl"
                        onClick={() => markSettled(s.id)}
                      >
                        {STRINGS.SETTLED}
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        onClick={() => setEditSplitId(s.id)}
                      >
                        <PencilSimple size={12} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => deleteSplit(s.id)}
                      >
                        <Trash size={12} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                )
              })}
            </Stack>
          )}
        </Stack>

        {settled.length > 0 && (
          <>
            <UnstyledButton onClick={() => setShowSettled((o) => !o)} mt="sm">
              <Group gap="md">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  {STRINGS.SETTLED_THIS_MONTH} ({settled.length})
                </Text>
                {showSettled ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </Group>
            </UnstyledButton>
            <Collapse in={showSettled}>
              <Stack gap="md" mt="xs">
                {settled.map((s) => (
                  <Group
                    key={s.id}
                    gap="md"
                    p="md"
                    opacity={0.5}
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: 'var(--mantine-color-dark-6)',
                    }}
                  >
                    <CheckCircle
                      size={14}
                      color="var(--mantine-color-green-5)"
                      weight="fill"
                    />
                    <Text size="sm" style={{ flex: 1 }}>
                      {s.person}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatMoney(s.amount)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Paper>}

      {/* ── SUBSCRIPTIONS ── */}
      {activeTab === 'subscriptions' && <Paper p="lg" radius="xl" withBorder>
        <Group justify="space-between" mb="md">
          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.SUBSCRIPTIONS}
            </Text>
            {moTotal > 0 && (
              <Text size="xs" c="dimmed">
                {formatMoney(moTotal)}/mo · {formatMoney(moTotal * 12)}/yr
              </Text>
            )}
          </Box>
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => navigate(ROUTES.FINANCE_LOG_SUBSCRIPTION)}
          >
            {STRINGS.ADD}
          </Button>
        </Group>

        {!subscriptions.filter((s) => s.status === 'active').length && (
          <Text size="sm" c="dimmed">
            {STRINGS.EMPTY_SUBSCRIPTIONS}
          </Text>
        )}

        <Stack gap="md">
          {soon.length > 0 && (
            <>
              <Text size="xs" fw={600} c="orange" tt="uppercase">
                {STRINGS.RENEWING_SOON}
              </Text>
              {soon.map((s) => {
                if (editSubId === s.id)
                  return (
                    <SubEditForm
                      key={s.id}
                      sub={s}
                      onSave={(d) => saveSubEdit(s.id, d)}
                      onCancel={() => setEditSubId(null)}
                      onDelete={() => deleteSub(s.id)}
                    />
                  )
                return (
                  <Paper
                    key={s.id}
                    p="md"
                    radius="lg"
                    withBorder
                    style={{ borderColor: 'var(--mantine-color-orange-3)' }}
                  >
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={600}>
                        {s.name}
                      </Text>
                      <Text size="sm" fw={700}>
                        {formatMoney(s.amount)}
                      </Text>
                    </Group>
                    <Group gap="md">
                      <Badge variant="warning" size="xs">
                        {STRINGS.RENEWS_IN} {daysUntilRenewal(s.renewal_day)}{' '}
                        {STRINGS.DAYS}
                      </Badge>
                      <Button
                        variant="light"
                        color="red"
                        size="xs"
                        radius="xl"
                        onClick={() => cancelSub(s.id)}
                      >
                        {STRINGS.CANCEL_SUB}
                      </Button>
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        onClick={() => setEditSubId(s.id)}
                      >
                        <PencilSimple size={12} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                )
              })}
            </>
          )}

          {activeSubs.map((s) => {
            if (editSubId === s.id)
              return (
                <SubEditForm
                  key={s.id}
                  sub={s}
                  onSave={(d) => saveSubEdit(s.id, d)}
                  onCancel={() => setEditSubId(null)}
                  onDelete={() => deleteSub(s.id)}
                />
              )
            return (
              <Group
                key={s.id}
                gap="md"
                p="md"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  background: 'var(--mantine-color-dark-6)',
                }}
              >
                <Box style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>
                    {s.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatMoney(s.amount)}/
                    {s.period === 'monthly' ? 'mo' : 'yr'}· {STRINGS.RENEWS_DAY}{' '}
                    {s.renewal_day}
                  </Text>
                </Box>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => setEditSubId(s.id)}
                >
                  <PencilSimple size={12} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="xs"
                  onClick={() => cancelSub(s.id)}
                >
                  <Trash size={12} />
                </ActionIcon>
              </Group>
            )
          })}
        </Stack>
      </Paper>}

      {/* ── MODALS ── */}
      <AccountFormModal
        open={showAddAcct || !!editAcctId}
        account={
          editAcctId ? accounts.find((a) => a.id === editAcctId) : undefined
        }
        onSave={(data) => saveAcct(data, editAcctId ?? undefined)}
        onClose={() => {
          setShowAddAcct(false)
          setEditAcctId(null)
        }}
      />

      <Modal
        opened={!!clipboard}
        onClose={() => setClipboard(null)}
        title={STRINGS.COPY_MESSAGE}
        radius="xl"
        size="md"
      >
        <Textarea
          value={clipboard ?? ''}
          readOnly
          rows={4}
          radius="lg"
          mb="md"
        />
        <Group justify="flex-end">
          <Button
            variant="default"
            radius="xl"
            onClick={() => setClipboard(null)}
          >
            {STRINGS.DISMISS}
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            leftSection={<Copy size={14} />}
            onClick={() => {
              navigator.clipboard.writeText(clipboard ?? '').catch(() => {})
              setClipboard(null)
            }}
          >
            {STRINGS.COPY_TO_CLIPBOARD}
          </Button>
        </Group>
      </Modal>

      {detailTask && (
        <TaskDetailSheet
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </Stack>
  )
}

// ─── AccountFormModal ─────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: Account['type']; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'investing', label: 'Investing' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
]

function AccountFormModal({
  open,
  account,
  onSave,
  onClose,
}: {
  open: boolean
  account?: Account
  onSave: (d: {
    name: string
    type: Account['type']
    last_four: string
    label: string
    due_date: string
  }) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'checking' as Account['type'],
    last_four: '',
    label: '',
    due_date: '',
  })
  const [err, setErr] = useState(false)

  useEffect(() => {
    setForm({
      name: account?.name ?? '',
      type: account?.type ?? 'checking',
      last_four: account?.last_four ?? '',
      label: account?.label ?? '',
      due_date: account?.due_date?.toString() ?? '',
    })
    setErr(false)
  }, [account?.id, open])

  function save() {
    if (!form.name.trim()) {
      setErr(true)
      return
    }
    onSave(form)
  }

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={account ? STRINGS.EDIT_ACCOUNT : STRINGS.ADD_ACCOUNT}
      radius="xl"
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label={STRINGS.INSTITUTION_NAME}
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value })
            setErr(false)
          }}
          error={err ? STRINGS.REQUIRED : undefined}
          autoFocus
          radius="lg"
        />
        <Select
          label={STRINGS.ACCOUNT_TYPE}
          value={form.type}
          onChange={(v) =>
            v && setForm({ ...form, type: v as Account['type'] })
          }
          data={ACCOUNT_TYPES}
          radius="lg"
        />
        <Group grow>
          <TextInput
            label={STRINGS.LAST_FOUR}
            value={form.last_four}
            onChange={(e) => setForm({ ...form, last_four: e.target.value })}
            maxLength={4}
            radius="lg"
          />
          <TextInput
            label={STRINGS.LABEL_OPTIONAL}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            radius="lg"
          />
        </Group>
        {form.type === 'credit_card' && (
          <TextInput
            label={STRINGS.DUE_DATE_DAY}
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            type="number"
            placeholder="15"
            radius="lg"
          />
        )}
        <Divider />
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            onClick={save}
          >
            {account ? STRINGS.SAVE : STRINGS.ADD}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ─── RefundEditForm ───────────────────────────────────────────────────────────

function RefundEditForm({
  refund,
  onSave,
  onCancel,
  onDelete,
}: {
  refund: { description: string; amount: number; expected_by: string }
  onSave: (d: {
    description: string
    amount: number
    expected_by: string
  }) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [desc, setDesc] = useState(refund.description)
  const [amt, setAmt] = useState(String(refund.amount / 100))
  const [exp, setExp] = useState(refund.expected_by)

  return (
    <Paper p="md" radius="lg" withBorder>
      <Stack gap="md">
        <TextInput
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          label={STRINGS.FIELD_WHAT_RETURNED}
          size="xs"
          radius="lg"
        />
        <TextInput
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          label={STRINGS.FIELD_AMOUNT}
          type="number"
          step="0.01"
          leftSection={<Text size="xs">$</Text>}
          size="xs"
          radius="lg"
        />
        <TextInput
          value={exp}
          onChange={(e) => setExp(e.target.value)}
          label={STRINGS.FIELD_EXPECTED_BY}
          type="date"
          size="xs"
          radius="lg"
        />
        <Group gap="md">
          <Button
            size="xs"
            radius="xl"
            color="teal"
            onClick={() =>
              onSave({
                description: desc,
                amount: Math.round(parseFloat(amt) * 100),
                expected_by: exp,
              })
            }
          >
            {STRINGS.SAVE}
          </Button>
          <Button size="xs" radius="xl" variant="default" onClick={onCancel}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            size="xs"
            radius="xl"
            color="red"
            variant="light"
            onClick={onDelete}
          >
            {STRINGS.DELETE}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

// ─── SplitEditForm ────────────────────────────────────────────────────────────

function SplitEditForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: { person: string; amount: number; description: string | null }
  onSave: (d: {
    person: string
    amount: number
    direction: string
    description: string | null
  }) => void
  onCancel: () => void
}) {
  const [person, setPerson] = useState(entry.person)
  const [amt, setAmt] = useState(String(entry.amount / 100))
  const [desc, setDesc] = useState(entry.description ?? '')

  return (
    <Paper p="md" radius="lg" withBorder>
      <Stack gap="md">
        <TextInput
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          label={STRINGS.FIELD_WHO}
          size="xs"
          radius="lg"
        />
        <TextInput
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          label={STRINGS.FIELD_AMOUNT}
          type="number"
          step="0.01"
          leftSection={<Text size="xs">$</Text>}
          size="xs"
          radius="lg"
        />
        <TextInput
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          label={STRINGS.FIELD_WHAT_FOR}
          size="xs"
          radius="lg"
        />
        <Group gap="md">
          <Button
            size="xs"
            radius="xl"
            color="teal"
            onClick={() =>
              onSave({
                person,
                amount: Math.round(parseFloat(amt) * 100),
                direction: 'owed_to_me',
                description: desc || null,
              })
            }
          >
            {STRINGS.SAVE}
          </Button>
          <Button size="xs" radius="xl" variant="default" onClick={onCancel}>
            {STRINGS.CANCEL}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

// ─── SubEditForm ──────────────────────────────────────────────────────────────

function SubEditForm({
  sub,
  onSave,
  onCancel,
  onDelete,
}: {
  sub: { name: string; amount: number; period: string; renewal_day: number }
  onSave: (d: {
    name: string
    amount: number
    period: string
    renewal_day: number
  }) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [name, setName] = useState(sub.name)
  const [amt, setAmt] = useState(String(sub.amount / 100))
  const [period, setPeriod] = useState(sub.period)
  const [day, setDay] = useState(String(sub.renewal_day))

  return (
    <Paper p="md" radius="lg" withBorder>
      <Stack gap="md">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={STRINGS.FIELD_NAME}
          size="xs"
          radius="lg"
        />
        <TextInput
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          label={STRINGS.FIELD_AMOUNT}
          type="number"
          step="0.01"
          leftSection={<Text size="xs">$</Text>}
          size="xs"
          radius="lg"
        />
        <Group gap="md">
          {['monthly', 'yearly'].map((p) => (
            <Badge
              key={p}
              variant={period === p ? 'filled' : 'outline'}
              color="teal"
              style={{ cursor: 'pointer' }}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Badge>
          ))}
          <TextInput
            value={day}
            onChange={(e) => setDay(e.target.value)}
            type="number"
            min="1"
            max="31"
            w={70}
            size="xs"
            radius="lg"
            placeholder="15"
          />
        </Group>
        <Group gap="md">
          <Button
            size="xs"
            radius="xl"
            color="teal"
            onClick={() =>
              onSave({
                name,
                amount: Math.round(parseFloat(amt) * 100),
                period,
                renewal_day: parseInt(day) || 1,
              })
            }
          >
            {STRINGS.SAVE}
          </Button>
          <Button size="xs" radius="xl" variant="default" onClick={onCancel}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            size="xs"
            radius="xl"
            color="red"
            variant="light"
            onClick={onDelete}
          >
            {STRINGS.DELETE}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
