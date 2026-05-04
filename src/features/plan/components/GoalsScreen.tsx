// @ts-nocheck
import {
  Box,
  Text,
  UnstyledButton,
  Divider,
  Paper,
  Stack,
  Group,
  Badge,
  ActionIcon,
  TextInput,
  Collapse,
  Select,
  Modal,
  CheckIcon,
  Progress,
  Button,
  SimpleGrid,
  ScrollArea,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../app/routes'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { AREA_COLORS, Goal, GOAL_AREAS, GoalArea } from '../types/plan.types'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import {
  GOAL_STATUS,
  PROJECT_STATUS,
  TASK_STATUS,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import {
  CalendarIcon,
  CaretDown,
  CaretDownIcon,
  CaretRightIcon,
  PencilIcon,
  PlusIcon,
  X,
  Trash,
} from '@phosphor-icons/react'
import { callClaude } from '../../../lib/anthropic'

export function GoalsScreen() {
  const store = usePlanStore()
  const {
    goals,
    milestones,
    tasks,
    projects,
    roadmaps,
    mantra,
    loading,
    setMantra,
  } = store
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [goalView, setGoalView] = useState<'list' | 'grid'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [_editingMantra, setEditingMantra] = useState(false)
  const [addingProjectFor, setAddingProjectFor] = useState<string | null>(null)
  const [addingRoadmapFor, setAddingRoadmapFor] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [newMsTitle, setNewMsTitle] = useState('')
  const [newMsDue, setNewMsDue] = useState('')
  const [newProjTitle, setNewProjTitle] = useState('')

  if (loading) return <SkeletonRow count={8} />

  const active = goals.filter((g) => g.status === GOAL_STATUS.ACTIVE)
  const done = goals.filter((g) => g.status === GOAL_STATUS.DONE)
  const dropped = goals.filter((g) => g.status === GOAL_STATUS.DROPPED)
  const grouped = GOAL_AREAS.map((a) => ({
    ...a,
    goals: active.filter((g) => g.area === a.key),
  })).filter((g) => g.goals.length > 0)

  async function quickAddProject(goalId: string) {
    if (!newName.trim()) return
    const row = {
      user_id: USER_ID,
      title: newName,
      description: null,
      status: PROJECT_STATUS.ACTIVE,
      deadline: null,
      goal_id: goalId,
      milestone_id: null,
      roadmap_id: null,
      roadmap_item_id: null,
    }
    try {
      const r = await svc.insertProject(row)
      store.addProject(r)
    } catch {
      store.addProject({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewName('')
    setAddingProjectFor(null)
  }

  async function quickLinkProject(projectId: string, goalId: string) {
    store.updateProject(projectId, { goal_id: goalId })
    try {
      await svc.updateProject(projectId, { goal_id: goalId })
    } catch {}
    setAddingProjectFor(null)
  }

  async function quickAddRoadmap(goalId: string) {
    if (!newName.trim()) return
    const row = {
      user_id: USER_ID,
      title: newName,
      description: null,
      goal_id: goalId,
      project_id: null,
    }
    try {
      const r = await svc.insertPlanRoadmap(row)
      store.addRoadmap(r)
    } catch {
      store.addRoadmap({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewName('')
    setAddingRoadmapFor(null)
  }

  async function quickLinkRoadmap(rmId: string, goalId: string) {
    store.updateRoadmap(rmId, { goal_id: goalId })
    try {
      await svc.updatePlanRoadmap(rmId, { goal_id: goalId })
    } catch {}
    setAddingRoadmapFor(null)
  }

  function GoalRow({ goal }: { goal: Goal }) {
    const ms = milestones.filter((m) => m.goal_id === goal.id)
    const msDone = ms.filter((m) => m.status === TASK_STATUS.DONE).length
    const taskCount = tasks.filter((t) => t.goal_id === goal.id).length
    const projList = projects.filter((p) => p.goal_id === goal.id)
    const rmList = roadmaps.filter((r) => r.goal_id === goal.id)
    const unlinkedProjects = projects.filter(
      (p) => !p.goal_id && p.status === PROJECT_STATUS.ACTIVE,
    )
    const unlinkedRoadmaps = roadmaps.filter((r) => !r.goal_id)
    const isAddingProject = addingProjectFor === goal.id
    const isAddingRoadmap = addingRoadmapFor === goal.id
    const progress = ms.length > 0 ? (msDone / ms.length) * 100 : 0

    return (
      <Paper
        p="lg"
        radius="xl"
        bg="var(--mantine-color-body)"
        withBorder
        style={{ borderColor: 'var(--mantine-color-default-border)' }}
      >
        <Stack gap="sm">
          {/* Goal header */}
          <Group justify="space-between" align="flex-start">
            <Box
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => setDetailGoalId(goal.id)}
            >
              <Group gap="xs" mb={4}>
                <Box
                  w={10}
                  h={10}
                  style={{
                    borderRadius: '50%',
                    backgroundColor: AREA_COLORS[goal.area],
                    flexShrink: 0,
                  }}
                />
                <Text fw={700} size="sm" c="var(--mantine-color-text)">
                  {goal.title}
                </Text>
                {goal.deadline && (
                  <Badge
                    variant="light"
                    color="orange"
                    size="xs"
                    leftSection={<CalendarIcon size={10} />}
                  >
                    {goal.deadline}
                  </Badge>
                )}
              </Group>
              {goal.affirmation && (
                <Text size="xs" c="dimmed" fs="italic" ml={18}>
                  {goal.affirmation}
                </Text>
              )}
              <Group gap="xs" mt={4} ml={18}>
                {taskCount > 0 && (
                  <Badge variant="light" color="blue" size="xs">
                    {taskCount} {STRINGS.TASKS}
                  </Badge>
                )}
              </Group>
            </Box>

            <Group gap="xs">
              <ActionIcon
                variant="light"
                color="teal"
                size="sm"
                radius="xl"
                onClick={() => {
                  setEditId(goal.id)
                  setShowAdd(true)
                }}
                aria-label={STRINGS.EDIT}
              >
                <PencilIcon size={12} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                radius="xl"
                onClick={() => setDetailGoalId(goal.id)}
                aria-label={STRINGS.VIEW}
              >
                <CaretDown size={12} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Progress */}
          {ms.length > 0 && (
            <Progress
              value={progress}
              color="teal"
              radius="xl"
              size="xs"
            />
          )}

          {/* Milestones summary */}
          {ms.length > 0 && (
            <Group gap="m" wrap="wrap">
              {ms.map((m) => (
                <Badge
                  key={m.id}
                  variant="filled"
                  color={m.status === 'done' ? 'green' : 'dark.5'}
                  size="sm"
                >
                  {m.status === 'done' ? '✓' : '○'} {m.title}
                </Badge>
              ))}
            </Group>
          )}

          {/* Linked projects */}
          {projList.length > 0 && (
            <Group gap="xs" wrap="wrap">
              {projList.map((p) => (
                <Badge
                  key={p.id}
                  variant="light"
                  color="violet"
                  size="sm"
                  style={{ cursor: 'pointer' }}
                  rightSection={
                    <X
                      size={10}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        store.updateProject(p.id, { goal_id: null })
                        svc
                          .updateProject(p.id, { goal_id: null })
                          .catch(() => {})
                      }}
                    />
                  }
                  onClick={() => setDetailProjectId(p.id)}
                >
                  🚀 {p.title}
                </Badge>
              ))}
            </Group>
          )}

          {/* Quick link buttons */}
          <Group gap="m">
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              color="violet"
              leftSection={<PlusIcon size={12} />}
              onClick={() => {
                setAddingProjectFor(goal.id)
                setNewName('')
              }}
            >
              {STRINGS.ADD_PROJECT}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              color="teal"
              leftSection={<PlusIcon size={12} />}
              onClick={() => setDetailGoalId(goal.id)}
            >
              Milestone
            </Button>
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              color="blue"
              onClick={() => setDetailGoalId(goal.id)}
            >
              View Details
            </Button>
          </Group>

          {/* Inline project adder */}
          <Collapse in={isAddingProject}>
            <Stack gap="xs">
              {unlinkedProjects.length > 0 && (
                <Group gap="xs" wrap="wrap">
                  <Text size="xs" c="dimmed">
                    {STRINGS.LINK_EXISTING}
                  </Text>
                  {unlinkedProjects.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      size="sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => quickLinkProject(p.id, goal.id)}
                    >
                      {p.title}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap="xs">
                <TextInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') quickAddProject(goal.id)
                    if (e.key === 'Escape') setAddingProjectFor(null)
                  }}
                  placeholder={STRINGS.NEW_PROJECT_NAME}
                  size="xs"
                  radius="lg"
                  style={{ flex: 1 }}
                  autoFocus
                />
                <Button
                  size="xs"
                  radius="xl"
                  color="violet"
                  onClick={() => quickAddProject(goal.id)}
                >
                  {STRINGS.CREATE}
                </Button>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setAddingProjectFor(null)}
                >
                  <X size={12} />
                </ActionIcon>
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group justify="space-between" align="center">
          <Box>
            <Text
              size="xs"
              fw={600}
              c="white"
              tt="uppercase"
              opacity={0.8}
              mb={4}
            >
              {STRINGS.PLAN}
            </Text>
            <Text fw={800} c="white" style={{ fontSize: 24 }}>
              {STRINGS.YOUR_GOALS}
            </Text>
            <Text size="sm" c="white" opacity={0.8} mt={4}>
              {active.length} {STRINGS.ACTIVE} · {done.length}{' '}
              {STRINGS.COMPLETED}
            </Text>
          </Box>
          <Button
            variant="white"
            color="teal"
            radius="xl"
            leftSection={<PlusIcon size={14} />}
            onClick={() => {
              setEditId(null)
              setShowAdd(true)
            }}
          >
            {STRINGS.NEW_GOAL}
          </Button>
          <Button variant="subtle" c="white" size="xs" radius="xl"
            onClick={() => setGoalView(goalView === 'list' ? 'grid' : 'list')}>
            {goalView === 'list' ? '▦ Grid' : '☰ List'}
          </Button>
        </Group>
      </Box>

      {/* Empty state */}
      {!active.length && !showAdd && (
        <EmptyState
          message={STRINGS.GOALS_EMPTY}
          sub={STRINGS.GOALS_EMPTY_SUB}
        />
      )}

      {/* Goal groups by area */}
      {goalView === 'list' ? (
        grouped.map((group) => (
          <Stack key={group.key} gap="sm">
            <Group gap="xs" px={4}>
              <Box w={10} h={10} style={{ borderRadius: '50%', backgroundColor: AREA_COLORS[group.key], flexShrink: 0 }} />
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">{group.label}</Text>
              <Badge variant="light" color="gray" size="xs">{group.goals.length}</Badge>
            </Group>
            {group.goals.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </Stack>
        ))
      ) : (
        <Group gap="md" wrap="nowrap" align="flex-start" grow>
          {grouped.map((group) => (
            <Stack key={group.key} gap="sm" style={{ flex: 1, minWidth: 180 }}>
                <Paper p="sm" radius="lg" style={{ background: AREA_COLORS[group.key] + '22', borderTop: `3px solid ${AREA_COLORS[group.key]}` }}>
                  <Text size="xs" fw={700} tt="uppercase" ta="center">{group.label}</Text>
                  <Text size="xs" c="dimmed" ta="center">{group.goals.length}</Text>
                </Paper>
                {group.goals.map((g) => {
                  const gTasks = store.tasks.filter((t) => t.goal_id === g.id)
                  const ms = milestones.filter((m) => m.goal_id === g.id)
                  const msDone = ms.filter((m) => m.status === 'done').length
                  const doneTasks = gTasks.filter((t) => t.status === 'done').length
                  const pct = ms.length > 0 ? Math.round((msDone / ms.length) * 100) : gTasks.length > 0 ? Math.round((doneTasks / gTasks.length) * 100) : 0
                  return (
                    <Paper key={g.id} p="md" radius="lg" withBorder style={{ cursor: 'pointer' }}
                      onClick={() => navigate(ROUTES.GOAL_DETAIL(g.id))}>
                      <Text size="sm" fw={700} c="white" lineClamp={2} mb={8}>{g.title}</Text>
                      {g.deadline && <Text size="xs" c="dimmed" mb={8}>Due {g.deadline}</Text>}
                      <Progress value={pct} size="sm" color="teal" radius="xl" />
                      <Text size="xs" fw={600} c="white" ta="right">{pct}%</Text>
                    </Paper>
                  )
                })}
              </Stack>
            ))}
          </Group>
      )}

      {done.length > 0 && (
        <CollapsedGoals
          label={STRINGS.COMPLETED_GOALS}
          goals={done}
          color="green"
          onTap={(id) => setDetailGoalId(id)}
          onDelete={(id) => { usePlanStore.getState().removeGoal(id); svc.deleteGoal(id).catch(() => {}) }}
        />
      )}
      {dropped.length > 0 && (
        <CollapsedGoals
          label={STRINGS.DROPPED_GOALS}
          goals={dropped}
          color="gray"
          onTap={(id) => setDetailGoalId(id)}
          onDelete={(id) => { usePlanStore.getState().removeGoal(id); svc.deleteGoal(id).catch(() => {}) }}
        />
      )}

      {showAdd && (
        <GoalFormModal
          goalId={editId}
          onClose={() => {
            setShowAdd(false)
            setEditId(null)
          }}
        />
      )}

      {/* All Milestones */}
      <Paper p="lg" radius="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            All Milestones ({milestones.length})
          </Text>
        </Group>
        <Stack gap="xs">
          {milestones.length === 0 && (
            <Text size="sm" c="dimmed">
              No milestones yet. Add them inside a goal.
            </Text>
          )}
          {milestones.map((m) => {
            const parentGoal = goals.find((g) => g.id === m.goal_id)
            return (
              <Paper
                key={m.id}
                p="sm"
                radius="md"
                withBorder
                style={{ opacity: m.status === 'done' ? 0.5 : 1 }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" style={{ flex: 1 }}>
                    <UnstyledButton
                      onClick={() => {
                        const u =
                          m.status === 'done'
                            ? { status: 'todo' as const }
                            : { status: 'done' as const }
                        store.updateMilestone(m.id, u)
                        svc.updateMilestone(m.id, u).catch(() => {})
                      }}
                      w={18}
                      h={18}
                      style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                        border:
                          m.status === 'done'
                            ? 'none'
                            : '2px solid var(--mantine-color-teal-4)',
                        backgroundColor:
                          m.status === 'done'
                            ? 'var(--mantine-color-green-5)'
                            : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.status === 'done' && <CheckIcon size={10} />}
                    </UnstyledButton>
                    <Box style={{ flex: 1 }}>
                      <Text
                        size="sm"
                        fw={500}
                        td={m.status === 'done' ? 'line-through' : undefined}
                      >
                        {m.title}
                      </Text>
                      <Group gap="xs" mt={2}>
                        {parentGoal && (
                          <Badge size="xs" variant="light" color="teal">
                            {parentGoal.title}
                          </Badge>
                        )}
                        {m.due_date && (
                          <Badge size="xs" variant="light" color="orange">
                            {m.due_date}
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  </Group>
                  <Group gap={4}>
                    <Select
                      size="xs"
                      radius="lg"
                      w={150}
                      placeholder="Link to goal"
                      value={m.goal_id}
                      clearable
                      data={goals
                        .filter((g) => g.status === 'active')
                        .map((g) => ({ value: g.id, label: g.title }))}
                      onChange={(v) => {
                        store.updateMilestone(m.id, { goal_id: v || '' })
                        svc
                          .updateMilestone(m.id, { goal_id: v || '' })
                          .catch(() => {})
                      }}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => {
                        store.removeMilestone(m.id)
                        svc.deleteMilestone(m.id).catch(() => {})
                      }}
                    >
                      <Trash size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            )
          })}
        </Stack>
      </Paper>

      {/* All Projects */}
      <Paper p="lg" radius="lg" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            All Projects ({store.projects.length})
          </Text>
        </Group>
        <Stack gap="xs">
          {store.projects.length === 0 && (
            <Text size="sm" c="dimmed">
              No projects yet.
            </Text>
          )}
          {store.projects.map((p) => {
            const parentGoal = goals.find((g) => g.id === p.goal_id)
            return (
              <Paper key={p.id} p="sm" radius="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" style={{ flex: 1 }}>
                    <Text
                      size="sm"
                      fw={500}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDetailProjectId(p.id)}
                    >
                      {p.title}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={
                        p.status === 'active'
                          ? 'teal'
                          : p.status === 'done'
                            ? 'green'
                            : 'gray'
                      }
                    >
                      {p.status}
                    </Badge>
                    {parentGoal && (
                      <Badge size="xs" variant="light" color="blue">
                        {parentGoal.title}
                      </Badge>
                    )}
                    {p.deadline && (
                      <Badge size="xs" variant="light" color="orange">
                        {p.deadline}
                      </Badge>
                    )}
                  </Group>
                  <Group gap={4}>
                    <Select
                      size="xs"
                      radius="lg"
                      w={150}
                      placeholder="Link to goal"
                      value={p.goal_id}
                      clearable
                      data={goals
                        .filter((g) => g.status === 'active')
                        .map((g) => ({ value: g.id, label: g.title }))}
                      onChange={(v) => {
                        store.updateProject(p.id, { goal_id: v || null })
                        svc
                          .updateProject(p.id, { goal_id: v || null })
                          .catch(() => {})
                      }}
                    />
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => setDetailProjectId(p.id)}
                    >
                      <PencilIcon size={12} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => {
                        store.removeProject(p.id)
                        svc.deleteProject(p.id).catch(() => {})
                      }}
                    >
                      <Trash size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            )
          })}
        </Stack>
      </Paper>

      {/* Goal Detail Modal */}
      {detailGoalId &&
        (() => {
          const goal = goals.find((g) => g.id === detailGoalId)
          if (!goal) return null
          const goalMs = milestones
            .filter((m) => m.goal_id === goal.id)
            .sort((a, b) => a.order_index - b.order_index)
          const goalProjects = store.projects.filter(
            (p) => p.goal_id === goal.id,
          )
          return (
            <Modal
              opened
              onClose={() => {
                setDetailGoalId(null)
                setNewMsTitle('')
                setNewMsDue('')
                setNewProjTitle('')
              }}
              title={goal.title}
              size="lg"
              radius="xl"
            >
              <Stack gap="lg">
                {/* Goal info */}
                <Group gap="xs">
                  <Badge variant="light" color="teal">
                    {goal.area}
                  </Badge>
                  <Badge
                    variant="light"
                    color={goal.status === 'active' ? 'green' : 'gray'}
                  >
                    {goal.status}
                  </Badge>
                  {goal.deadline && (
                    <Badge variant="light" color="orange">
                      {goal.deadline}
                    </Badge>
                  )}
                </Group>

                {/* Milestones */}
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
                    Milestones ({goalMs.length})
                  </Text>
                  <Stack gap="xs">
                    {goalMs.map((m) => (
                      <Paper
                        key={m.id}
                        p="sm"
                        radius="md"
                        withBorder
                        style={{ opacity: m.status === 'done' ? 0.5 : 1 }}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="sm" style={{ flex: 1 }}>
                            <UnstyledButton
                              onClick={() => {
                                const u = m.status === 'done' ? { status: 'todo' as const } : { status: 'done' as const }
                                store.updateMilestone(m.id, u); svc.updateMilestone(m.id, u).catch(() => {})
                              }}
                              w={20} h={20}
                              style={{ borderRadius: '50%', flexShrink: 0, border: m.status === 'done' ? 'none' : '2px solid var(--mantine-color-teal-4)', backgroundColor: m.status === 'done' ? 'var(--mantine-color-green-5)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {m.status === 'done' && <CheckIcon size={10} />}
                            </UnstyledButton>
                            <TextInput
                              variant="unstyled"
                              size="sm"
                              fw={500}
                              defaultValue={m.title}
                              style={{ flex: 1 }}
                              onBlur={(e) => { if (e.target.value !== m.title) { store.updateMilestone(m.id, { title: e.target.value }); svc.updateMilestone(m.id, { title: e.target.value }).catch(() => {}) } }}
                            />
                          </Group>
                          <Group gap={4}>
                            <TextInput
                              type="date"
                              size="xs"
                              variant="unstyled"
                              w={120}
                              defaultValue={m.due_date ?? ''}
                              onBlur={(e) => { store.updateMilestone(m.id, { due_date: e.target.value || null }); svc.updateMilestone(m.id, { due_date: e.target.value || null }).catch(() => {}) }}
                            />
                            <ActionIcon variant="subtle" color="red" size="xs" onClick={() => { store.removeMilestone(m.id); svc.deleteMilestone(m.id).catch(() => {}) }}>
                              <Trash size={12} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                    <Group gap="xs">
                      <TextInput placeholder="New milestone" value={newMsTitle} onChange={(e) => setNewMsTitle(e.currentTarget.value)} radius="lg" style={{ flex: 1 }} size="sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMsTitle.trim()) {
                            const row = { user_id: USER_ID, goal_id: goal.id, title: newMsTitle.trim(), due_date: newMsDue || null, status: 'todo' as const, order_index: goalMs.length }
                            svc.insertMilestone(row).then((r) => store.addMilestone(r)).catch(() => store.addMilestone({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
                            setNewMsTitle(''); setNewMsDue('')
                          }
                        }}
                      />
                      <TextInput type="date" value={newMsDue} onChange={(e) => setNewMsDue(e.currentTarget.value)} radius="lg" size="sm" w={140} />
                      <Button size="sm" radius="xl" color="teal" disabled={!newMsTitle.trim()} onClick={() => {
                        if (!newMsTitle.trim()) return
                        const row = { user_id: USER_ID, goal_id: goal.id, title: newMsTitle.trim(), due_date: newMsDue || null, status: 'todo' as const, order_index: goalMs.length }
                        svc.insertMilestone(row).then((r) => store.addMilestone(r)).catch(() => store.addMilestone({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
                        setNewMsTitle(''); setNewMsDue('')
                      }}>Add</Button>
                    </Group>
                  </Stack>
                </Box>

                {/* Projects */}
                <Box>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
                    Projects ({goalProjects.length})
                  </Text>
                  <Stack gap="xs">
                    {goalProjects.map((p) => (
                      <Paper key={p.id} p="sm" radius="md" withBorder>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" style={{ flex: 1 }}>
                            <TextInput variant="unstyled" size="sm" fw={500} defaultValue={p.title} style={{ flex: 1 }}
                              onBlur={(e) => { if (e.target.value !== p.title) { store.updateProject(p.id, { title: e.target.value }); svc.updateProject(p.id, { title: e.target.value }).catch(() => {}) } }}
                            />
                            <Badge size="xs" variant="light" color={p.status === 'active' ? 'teal' : p.status === 'done' ? 'green' : 'gray'}>{p.status}</Badge>
                          </Group>
                          <Group gap={4}>
                            <TextInput type="date" size="xs" variant="unstyled" w={120} defaultValue={p.deadline ?? ''}
                              onBlur={(e) => { store.updateProject(p.id, { deadline: e.target.value || null }); svc.updateProject(p.id, { deadline: e.target.value || null }).catch(() => {}) }}
                            />
                            <ActionIcon variant="subtle" color="red" size="xs" onClick={() => { store.removeProject(p.id); svc.deleteProject(p.id).catch(() => {}) }}>
                              <Trash size={12} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                    <Group gap="xs">
                      <TextInput placeholder="New project" value={newProjTitle} onChange={(e) => setNewProjTitle(e.currentTarget.value)} radius="lg" size="sm" style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newProjTitle.trim()) {
                            const row = { user_id: USER_ID, title: newProjTitle.trim(), description: null, status: 'active' as const, deadline: null, goal_id: goal.id, milestone_id: null, roadmap_id: null, roadmap_item_id: null }
                            svc.insertProject(row).then((r) => store.addProject(r)).catch(() => store.addProject({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
                            setNewProjTitle('')
                          }
                        }}
                      />
                      <Button size="sm" radius="xl" color="violet" disabled={!newProjTitle.trim()} onClick={() => {
                        if (!newProjTitle.trim()) return
                        const row = { user_id: USER_ID, title: newProjTitle.trim(), description: null, status: 'active' as const, deadline: null, goal_id: goal.id, milestone_id: null, roadmap_id: null, roadmap_item_id: null }
                        svc.insertProject(row).then((r) => store.addProject(r)).catch(() => store.addProject({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
                        setNewProjTitle('')
                      }}>Add</Button>
                    </Group>
                  </Stack>
                </Box>

                {/* Actions */}
                <Group>
                  {goal.status === 'active' && (
                    <Button size="xs" variant="light" color="green" radius="xl"
                      onClick={() => { store.updateGoal(goal.id, { status: 'done' }); svc.updateGoal(goal.id, { status: 'done' }).catch(() => {}) }}>
                      Mark Done
                    </Button>
                  )}
                  {goal.status === 'active' && (
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      radius="xl"
                      onClick={() => {
                        store.updateGoal(goal.id, { status: 'dropped' })
                        svc
                          .updateGoal(goal.id, { status: 'dropped' })
                          .catch(() => {})
                      }}
                    >
                      Drop
                    </Button>
                  )}
                  {(goal.status === 'done' || goal.status === 'dropped') && (
                    <Button size="xs" variant="light" color="teal" radius="xl"
                      onClick={() => { store.updateGoal(goal.id, { status: 'active' }); svc.updateGoal(goal.id, { status: 'active' }).catch(() => {}) }}>
                      Reactivate
                    </Button>
                  )}
                  <Button size="xs" variant="light" color="red" radius="xl"
                    onClick={() => { store.removeGoal(goal.id); svc.deleteGoal(goal.id).catch(() => {}); setDetailGoalId(null) }}>
                    Delete Goal
                  </Button>
                  <Button size="xs" variant="light" color="blue" radius="xl"
                    onClick={() => { import('../../chat/ChatWidget').then(m => m.chatAboutItem('goal', goal.title)) }}>
                    💬 Chat
                  </Button>
                </Group>
              </Stack>
            </Modal>
          )
        })()}

      {/* Project Detail Modal */}
      {detailProjectId &&
        (() => {
          const p = store.projects.find((x) => x.id === detailProjectId)
          if (!p) return null
          const pTasks = store.tasks.filter((t) => t.project_id === p.id)
          const doneTasks = pTasks.filter((t) => t.status === TASK_STATUS.DONE)
          return (
            <Modal
              opened
              onClose={() => setDetailProjectId(null)}
              title={p.title}
              size="lg"
              radius="xl"
            >
              <Stack gap="md">
                <Group gap="xs">
                  <Badge
                    variant="light"
                    color={
                      p.status === 'active'
                        ? 'teal'
                        : p.status === 'done'
                          ? 'green'
                          : 'gray'
                    }
                  >
                    {p.status}
                  </Badge>
                  {p.deadline && (
                    <Badge variant="light" color="orange">
                      {p.deadline}
                    </Badge>
                  )}
                  <Text size="xs" c="dimmed">
                    {doneTasks.length}/{pTasks.length} tasks done
                  </Text>
                </Group>
                {p.description && (
                  <Text size="sm" c="dimmed">
                    {p.description}
                  </Text>
                )}
                <Stack gap="xs">
                  {pTasks.map((t) => (
                    <Group
                      key={t.id}
                      gap="sm"
                      p="sm"
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        background: 'var(--mantine-color-dark-6)',
                      }}
                    >
                      <UnstyledButton
                        onClick={() => {
                          const done = t.status === TASK_STATUS.DONE
                          const u = done
                            ? { status: 'todo' as const, completed_at: null }
                            : {
                                status: 'done' as const,
                                completed_at: new Date().toISOString(),
                              }
                          store.updateTask(t.id, u)
                          svc.updateTask(t.id, u).catch(() => {})
                        }}
                        w={18}
                        h={18}
                        style={{
                          borderRadius: '50%',
                          flexShrink: 0,
                          border:
                            t.status === TASK_STATUS.DONE
                              ? 'none'
                              : '2px solid var(--mantine-color-teal-4)',
                          backgroundColor:
                            t.status === TASK_STATUS.DONE
                              ? 'var(--mantine-color-green-5)'
                              : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {t.status === TASK_STATUS.DONE && (
                          <CheckIcon size={10} color="white" />
                        )}
                      </UnstyledButton>
                      <Text
                        size="sm"
                        td={
                          t.status === TASK_STATUS.DONE
                            ? 'line-through'
                            : undefined
                        }
                        style={{
                          flex: 1,
                          opacity: t.status === TASK_STATUS.DONE ? 0.5 : 1,
                        }}
                      >
                        {t.title}
                      </Text>
                    </Group>
                  ))}
                </Stack>
                <Group>
                  <Button
                    size="xs"
                    variant="light"
                    color="green"
                    radius="xl"
                    onClick={() => {
                      store.updateProject(p.id, { status: 'done' })
                      svc
                        .updateProject(p.id, { status: 'done' })
                        .catch(() => {})
                    }}
                  >
                    Mark Done
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    radius="xl"
                    onClick={() => {
                      store.removeProject(p.id)
                      svc.deleteProject(p.id).catch(() => {})
                      setDetailProjectId(null)
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              </Stack>
            </Modal>
          )
        })()}
    </Stack>
  )
}

function CollapsedGoals({
  label,
  goals,
  color,
  onDelete,
  onTap,
}: {
  label: string
  goals: Goal[]
  color: string
  onDelete?: (id: string) => void
  onTap?: (id: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <Stack gap="sm">
      <UnstyledButton onClick={() => setShow((o) => !o)}>
        <Group gap="xs" px={4}>
          <Box
            w={8}
            h={8}
            style={{
              borderRadius: '50%',
              backgroundColor: `var(--mantine-color-${color}-5)`,
            }}
          />
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {label}
          </Text>
          <Badge variant="light" color={color} size="xs">
            {goals.length}
          </Badge>
          {show ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
        </Group>
      </UnstyledButton>
      <Collapse in={show}>
        <Stack gap="xs">
          {goals.map((g) => (
            <Paper
              key={g.id}
              p="sm"
              radius="xl"
              withBorder
              bg="var(--mantine-color-body)"
            >
              <Group gap="sm">
                <Box
                  w={18}
                  h={18}
                  style={{
                    borderRadius: '50%',
                    backgroundColor:
                      color === 'green'
                        ? 'var(--mantine-color-green-5)'
                        : 'var(--mantine-color-gray-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {color === 'green' ? (
                    <CheckIcon size={10} color="white" />
                  ) : (
                    <X size={10} color="white" />
                  )}
                </Box>
                <Text
                  size="sm"
                  c="dimmed"
                  td={color === 'green' ? 'line-through' : undefined}
                  style={{ flex: 1, cursor: onTap ? 'pointer' : undefined }}
                  onClick={() => onTap?.(g.id)}
                >
                  {g.title}
                </Text>
                {onDelete && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => onDelete(g.id)}
                  >
                    <Trash size={12} />
                  </ActionIcon>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      </Collapse>
    </Stack>
  )
}

function GoalFormModal({
  goalId,
  onClose,
}: {
  goalId: string | null
  onClose: () => void
}) {
  const { goals, addGoal, updateGoal } = usePlanStore()
  const existing = goalId ? goals.find((g) => g.id === goalId) : null
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<GoalArea>('misc')
  const [affirmation, setAffirmation] = useState('')
  const [deadline, setDeadline] = useState('')
  const [aiEval, setAiEval] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [err, setErr] = useState(false)

  useEffect(() => {
    setTitle(existing?.title ?? '')
    setArea(existing?.area ?? 'misc')
    setAffirmation(existing?.affirmation ?? '')
    setDeadline(existing?.deadline ?? '')
    setAiEval(existing?.ai_evaluation ?? '')
    setErr(false)
  }, [goalId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function evaluateWithAI() {
    if (!title.trim()) return
    setAiLoading(true)
    const activeGoals = goals
      .filter((g) => g.status === GOAL_STATUS.ACTIVE)
      .map((g) => g.title)
      .join(', ')
    const prompt = `You evaluate goal quality. One sentence max. No emoji.\nNew goal: "${title}" (area: ${area})\nExisting active goals: ${activeGoals || 'none'}\nRespond with one of: too vague, too big, good and clear, or note if similar goal exists.`
    try {
      const r = await callClaude(prompt)
      setAiEval(r || '')
    } catch {
      setAiEval('')
    } finally {
      setAiLoading(false)
    }
  }

  async function save() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    const data = {
      title,
      area,
      affirmation: affirmation || null,
      deadline: deadline || null,
      ai_evaluation: aiEval || null,
    }
    if (existing) {
      updateGoal(existing.id, data)
      try {
        await svc.updateGoal(existing.id, data)
      } catch {}
    } else {
      const row = { user_id: USER_ID, ...data, status: GOAL_STATUS.ACTIVE }
      try {
        const r = await svc.insertGoal(row)
        addGoal(r)
      } catch {
        addGoal({
          ...row,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
    }
    onClose()
  }

  async function drop() {
    if (!existing) return
    updateGoal(existing.id, { status: GOAL_STATUS.DROPPED })
    try {
      await svc.updateGoal(existing.id, { status: GOAL_STATUS.DROPPED })
    } catch {}
    onClose()
  }

  async function markDone() {
    if (!existing) return
    updateGoal(existing.id, { status: GOAL_STATUS.DONE })
    try {
      await svc.updateGoal(existing.id, { status: GOAL_STATUS.DONE })
    } catch {}
    onClose()
  }

  return (
    <Modal
      opened
      title={null}
      onClose={onClose}
      radius="xl"
      size="md"
      padding={0}
    >
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl) var(--mantine-radius-xl) 0 0',
        }}
      >
        <Text fw={700} c="white" size="lg">
          {existing ? STRINGS.EDIT_GOAL : STRINGS.NEW_GOAL}
        </Text>
      </Box>

      <Stack gap="md" p="xl">
        <TextInput
          label={STRINGS.WHAT_IS_THE_GOAL}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErr(false)
            setAiEval('')
          }}
          onBlur={() => {
            if (title.trim() && !existing) evaluateWithAI()
          }}
          placeholder={STRINGS.GOAL_PLACEHOLDER}
          error={err ? STRINGS.GOAL_NAME_REQUIRED : undefined}
          autoFocus
          radius="lg"
        />

        {aiLoading && (
          <Text size="xs" c="dimmed">
            {STRINGS.AI_EVALUATING}
          </Text>
        )}

        {aiEval && (
          <Paper
            p="sm"
            radius="lg"
            bg="teal.0"
            withBorder
            style={{ borderColor: 'var(--mantine-color-teal-3)' }}
          >
            <Group gap="xs">
              <Text size="xs">🤖</Text>
              <Text size="xs" c="teal.7">
                {aiEval}
              </Text>
            </Group>
          </Paper>
        )}

        <Select
          label={STRINGS.AREA}
          value={area}
          onChange={(v) => v && setArea(v as GoalArea)}
          data={GOAL_AREAS.map((a) => ({ value: a.key, label: a.label }))}
          radius="lg"
        />

        <TextInput
          label={STRINGS.AFFIRMATION}
          value={affirmation}
          onChange={(e) => setAffirmation(e.target.value)}
          placeholder={STRINGS.AFFIRMATION_PLACEHOLDER}
          radius="lg"
        />

        <TextInput
          label={STRINGS.DEADLINE_OPTIONAL}
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          radius="lg"
        />

        <Divider />

        <Group justify="space-between">
          <Group gap="xs">
            {existing && (
              <Button
                variant="light"
                color="red"
                size="sm"
                radius="xl"
                onClick={drop}
              >
                {STRINGS.DROP_GOAL}
              </Button>
            )}
            {existing && existing.status === GOAL_STATUS.ACTIVE && (
              <Button
                variant="light"
                color="green"
                size="sm"
                radius="xl"
                leftSection={<CheckIcon size={14} />}
                onClick={markDone}
              >
                {STRINGS.MARK_DONE}
              </Button>
            )}
          </Group>
          <Group gap="xs">
            <Button variant="default" size="sm" radius="xl" onClick={onClose}>
              {STRINGS.CANCEL}
            </Button>
            <Button
              size="sm"
              radius="xl"
              variant="gradient"
              gradient={{ from: 'teal', to: 'blue' }}
              onClick={save}
            >
              {STRINGS.SAVE}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}
