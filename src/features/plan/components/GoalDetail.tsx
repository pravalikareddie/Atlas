import {
  Box,
  Text,
  UnstyledButton,
  Divider,
  Title,
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
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { AREA_COLORS, Goal, GOAL_AREAS, GoalArea } from '../types/plan.types'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import {
  GOAL_STATUS,
  PROJECT_STATUS,
  TASK_STATUS,
  TASK_TYPE,
  USER_ID,
} from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import {
  ArrowArcLeftIcon,
  ArrowLeftIcon,
  CalendarDotIcon,
  CalendarIcon,
  CaretDown,
  CaretDownIcon,
  CaretRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  X,
} from '@phosphor-icons/react'
import { callClaude } from '../../../lib/anthropic'
import { usePlanData } from '../hooks/usePlanData'

// ─── GoalDetail ────────────────────────────────────────────────────────────────

export function GoalDetail() {
  usePlanData()
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()
  const store = usePlanStore()
  const goal = store.goals.find((g) => g.id === goalId)
  const ms = store.milestones
    .filter((m) => m.goal_id === goalId)
    .sort((a, b) => a.order_index - b.order_index)
  const goalTasks = store.tasks.filter((t) => t.goal_id === goalId)
  const goalProjects = store.projects.filter((p) => p.goal_id === goalId)

  const [expandedMs, setExpandedMs] = useState<string | null>(null)
  const [addingMs, setAddingMs] = useState(false)
  const [msText, setMsText] = useState('')
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [taskText, setTaskText] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [editingMsId, setEditingMsId] = useState<string | null>(null)
  const [editMsText, setEditMsText] = useState('')
  const [linkingProject, setLinkingProject] = useState(false)
  const [linkingRoadmap, setLinkingRoadmap] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskText, setEditTaskText] = useState('')

  if (store.loading) return <SkeletonRow count={6} />
  if (!goal)
    return (
      <Stack gap="md">
        <Button
          variant="subtle"
          leftSection={<ArrowLeftIcon size={14} />}
          onClick={() => navigate('/plan/goals')}
          w="fit-content"
        >
          {STRINGS.BACK_TO_GOALS}
        </Button>
        <EmptyState message={STRINGS.GOAL_NOT_FOUND} />
      </Stack>
    )

  const goalId_ = goal.id
  const msDone = ms.filter((m) => m.status === TASK_STATUS.DONE).length
  const progress = ms.length > 0 ? (msDone / ms.length) * 100 : 0
  const accentColor = AREA_COLORS[goal.area] ? 'teal' : 'teal'

  async function addMilestone() {
    if (!msText.trim()) return
    const row = {
      user_id: USER_ID,
      goal_id: goalId_,
      title: msText,
      due_date: null,
      status: TASK_STATUS.TODO,
      order_index: ms.length,
    }
    try {
      const r = await svc.insertMilestone(row)
      store.addMilestone(r)
    } catch {
      store.addMilestone({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setMsText('')
    setAddingMs(false)
  }

  async function toggleMs(id: string) {
    const m = ms.find((x) => x.id === id)
    if (!m) return
    const status =
      m.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE
    store.updateMilestone(id, { status })
    try {
      await svc.updateMilestone(id, { status })
    } catch {}
  }

  async function saveEditMs(id: string) {
    if (!editMsText.trim()) return
    store.updateMilestone(id, { title: editMsText })
    try {
      await svc.updateMilestone(id, { title: editMsText })
    } catch {}
    setEditingMsId(null)
  }

  async function deleteMs(id: string) {
    store.removeMilestone(id)
    try {
      await svc.deleteMilestone(id)
    } catch {}
  }

  async function addTask(milestoneId: string) {
    if (!taskText.trim()) return
    const row = {
      user_id: USER_ID,
      title: taskText,
      notes: null,
      type: TASK_TYPE.GOAL_TASK,
      priority: null,
      is_must: false,
      status: TASK_STATUS.TODO,
      due_date: null,
      completed_at: null,
      goal_id: goalId_,
      milestone_id: milestoneId,
      project_id: null,
      roadmap_item_id: null,
      parent_task_id: null,
      order_index: 0,
    }
    try {
      const r = await svc.insertTask(row)
      store.addTask(r)
    } catch {
      store.addTask({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setTaskText('')
    setAddingTask(null)
  }

  async function toggleTask(id: string) {
    const t = store.tasks.find((x) => x.id === id)
    if (!t) return
    const updates =
      t.status === TASK_STATUS.DONE
        ? { status: TASK_STATUS.TODO, completed_at: null }
        : { status: TASK_STATUS.DONE, completed_at: new Date().toISOString() }
    store.updateTask(id, updates)
    try {
      await svc.updateTask(id, updates)
    } catch {}
  }

  async function saveEditTask(id: string) {
    if (!editTaskText.trim()) return
    store.updateTask(id, { title: editTaskText })
    try {
      await svc.updateTask(id, { title: editTaskText })
    } catch {}
    setEditingTaskId(null)
  }

  async function deleteTask(id: string) {
    store.removeTask(id)
    try {
      await svc.deleteTask(id)
    } catch {}
  }

  async function markGoalDone() {
    store.updateGoal(goalId_, { status: GOAL_STATUS.DONE })
    try {
      await svc.updateGoal(goalId_, { status: GOAL_STATUS.DONE })
    } catch {}
    navigate('/plan/goals')
  }

  return (
    <Stack gap="lg">
      <Button
        variant="subtle"
        size="sm"
        leftSection={<ArrowLeftIcon size={14} />}
        onClick={() => navigate('/plan/goals')}
        w="fit-content"
      >
        {STRINGS.BACK_TO_GOALS}
      </Button>

      {/* Hero */}
      <Box
        p="xl"
        style={{
          background:
            'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          borderRadius: 'var(--mantine-radius-xl)',
        }}
      >
        <Group gap="xs" mb="xs">
          <Box
            w={10}
            h={10}
            style={{
              borderRadius: '50%',
              backgroundColor: AREA_COLORS[goal.area],
              flexShrink: 0,
            }}
          />
          <Text size="xs" fw={600} c="white" tt="uppercase" opacity={0.8}>
            {goal.area}
          </Text>
        </Group>

        <Text fw={800} c="white" style={{ fontSize: 26 }} mb={4}>
          {goal.title}
        </Text>

        {goal.affirmation && (
          <Text size="sm" c="white" opacity={0.85} fs="italic" mb="sm">
            {goal.affirmation}
          </Text>
        )}

        {goal.deadline && (
          <Badge
            variant="white"
            color="teal"
            size="sm"
            leftSection={<CalendarIcon size={10} />}
            mb="sm"
          >
            {goal.deadline}
          </Badge>
        )}

        {ms.length > 0 && (
          <Box mt="md">
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="white" opacity={0.8}>
                {msDone}/{ms.length} {STRINGS.MILESTONES}
              </Text>
              <Text size="xs" c="white" fw={700}>
                {Math.round(progress)}%
              </Text>
            </Group>
            <Progress
              value={progress}
              color="white"
              bg="rgba(255,255,255,0.25)"
              radius="xl"
              size="sm"
            />
          </Box>
        )}
      </Box>

      {/* Milestones */}
      <Paper p="lg" radius="xl" bg="var(--mantine-color-body)" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.MILESTONES}
            </Text>
            <Button
              variant="light"
              color="teal"
              size="xs"
              radius="xl"
              leftSection={<PlusIcon size={12} />}
              onClick={() => setAddingMs(true)}
            >
              {STRINGS.ADD_MILESTONE}
            </Button>
          </Group>

          {!ms.length && !addingMs && (
            <Text size="sm" c="dimmed" py="xs">
              {STRINGS.MILESTONES_EMPTY}
            </Text>
          )}

          {ms.map((m) => {
            const mTasks = store.tasks.filter((t) => t.milestone_id === m.id)
            const mDone = mTasks.filter(
              (t) => t.status === TASK_STATUS.DONE,
            ).length
            const isExpanded = expandedMs === m.id
            const isDone = m.status === TASK_STATUS.DONE

            return (
              <Stack key={m.id} gap="xs">
                <Paper
                  p="sm"
                  radius="lg"
                  bg={isDone ? 'green.0' : 'gray.0'}
                  withBorder
                  style={{
                    borderColor: isDone
                      ? 'var(--mantine-color-green-3)'
                      : 'var(--mantine-color-gray-2)',
                  }}
                >
                  <Group gap="sm">
                    <UnstyledButton
                      onClick={() => toggleMs(m.id)}
                      w={22}
                      h={22}
                      style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: isDone
                          ? 'none'
                          : `2px solid var(--mantine-color-teal-4)`,
                        backgroundColor: isDone
                          ? 'var(--mantine-color-green-5)'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isDone && <CheckIcon size={12} color="white" />}
                    </UnstyledButton>

                    {editingMsId === m.id ? (
                      <TextInput
                        value={editMsText}
                        onChange={(e) => setEditMsText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditMs(m.id)
                          if (e.key === 'Escape') setEditingMsId(null)
                        }}
                        onBlur={() => saveEditMs(m.id)}
                        style={{ flex: 1 }}
                        size="xs"
                        autoFocus
                      />
                    ) : (
                      <Text
                        size="sm"
                        fw={600}
                        td={isDone ? 'line-through' : undefined}
                        c={isDone ? 'dimmed' : 'dark'}
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => setExpandedMs(isExpanded ? null : m.id)}
                      >
                        {m.title}
                      </Text>
                    )}

                    {mTasks.length > 0 && (
                      <Badge variant="light" color="gray" size="xs">
                        {mDone}/{mTasks.length}
                      </Badge>
                    )}

                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => {
                        setEditingMsId(m.id)
                        setEditMsText(m.title)
                      }}
                      aria-label={STRINGS.EDIT}
                    >
                      <PencilIcon size={12} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => deleteMs(m.id)}
                      aria-label={STRINGS.DELETE}
                    >
                      <TrashIcon size={12} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={() => setExpandedMs(isExpanded ? null : m.id)}
                    >
                      {isExpanded ? (
                        <CaretDownIcon size={12} />
                      ) : (
                        <CaretRightIcon size={12} />
                      )}
                    </ActionIcon>
                  </Group>
                </Paper>

                <Collapse in={isExpanded}>
                  <Stack gap="xs" pl="md">
                    {mTasks.map((t) => {
                      const tDone = t.status === TASK_STATUS.DONE
                      return (
                        <Group
                          key={t.id}
                          gap="sm"
                          p="xs"
                          style={{
                            borderRadius: 'var(--mantine-radius-lg)',
                            background: 'white',
                            border: '1px solid var(--mantine-color-gray-2)',
                            opacity: tDone ? 0.6 : 1,
                          }}
                        >
                          <UnstyledButton
                            onClick={() => toggleTask(t.id)}
                            w={16}
                            h={16}
                            style={{
                              borderRadius: '50%',
                              flexShrink: 0,
                              border: tDone
                                ? 'none'
                                : `1.5px solid var(--mantine-color-teal-4)`,
                              backgroundColor: tDone
                                ? 'var(--mantine-color-green-5)'
                                : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {tDone && <CheckIcon size={9} color="white" />}
                          </UnstyledButton>

                          {editingTaskId === t.id ? (
                            <TextInput
                              value={editTaskText}
                              onChange={(e) => setEditTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditTask(t.id)
                                if (e.key === 'Escape') setEditingTaskId(null)
                              }}
                              onBlur={() => saveEditTask(t.id)}
                              style={{ flex: 1 }}
                              size="xs"
                              autoFocus
                            />
                          ) : (
                            <Text
                              size="sm"
                              td={tDone ? 'line-through' : undefined}
                              c={tDone ? 'dimmed' : 'dark'}
                              style={{ flex: 1, cursor: 'pointer' }}
                              onClick={() => {
                                setEditingTaskId(t.id)
                                setEditTaskText(t.title)
                              }}
                            >
                              {t.title}
                            </Text>
                          )}

                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => deleteTask(t.id)}
                            aria-label={STRINGS.DELETE}
                          >
                            <TrashIcon size={12} />
                          </ActionIcon>
                        </Group>
                      )
                    })}

                    {addingTask === m.id ? (
                      <Group gap="xs">
                        <TextInput
                          value={taskText}
                          onChange={(e) => setTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTask(m.id)
                            if (e.key === 'Escape') setAddingTask(null)
                          }}
                          placeholder={STRINGS.ADD_TASK_PLACEHOLDER}
                          size="xs"
                          radius="lg"
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <Button
                          size="xs"
                          radius="xl"
                          color="teal"
                          onClick={() => addTask(m.id)}
                        >
                          {STRINGS.ADD}
                        </Button>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => setAddingTask(null)}
                        >
                          <X size={12} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <Button
                        variant="subtle"
                        size="xs"
                        radius="xl"
                        color="teal"
                        leftSection={<PlusIcon size={12} />}
                        onClick={() => {
                          setAddingTask(m.id)
                          setTaskText('')
                        }}
                        w="fit-content"
                      >
                        {STRINGS.ADD_TASK}
                      </Button>
                    )}
                  </Stack>
                </Collapse>
              </Stack>
            )
          })}

          {addingMs && (
            <Group gap="xs">
              <TextInput
                value={msText}
                onChange={(e) => setMsText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addMilestone()
                  if (e.key === 'Escape') setAddingMs(false)
                }}
                placeholder={STRINGS.MILESTONE_PLACEHOLDER}
                size="sm"
                radius="lg"
                style={{ flex: 1 }}
                autoFocus
              />
              <Button size="sm" radius="xl" color="teal" onClick={addMilestone}>
                {STRINGS.ADD}
              </Button>
              <ActionIcon variant="subtle" onClick={() => setAddingMs(false)}>
                <X size={14} />
              </ActionIcon>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Linked projects */}
      <Paper p="lg" radius="xl" bg="var(--mantine-color-body)" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {STRINGS.LINKED_PROJECTS}
            </Text>
            <Button
              variant="light"
              color="violet"
              size="xs"
              radius="xl"
              leftSection={<PlusIcon size={12} />}
              onClick={() => setLinkingProject(true)}
            >
              {STRINGS.LINK_PROJECT}
            </Button>
          </Group>

          {goalProjects.length === 0 && !linkingProject && (
            <Text size="sm" c="dimmed">
              {STRINGS.NO_LINKED_PROJECTS}
            </Text>
          )}

          {goalProjects.map((p) => (
            <Group
              key={p.id}
              gap="sm"
              p="xs"
              style={{
                borderRadius: 'var(--mantine-radius-lg)',
                background: 'var(--mantine-color-violet-0)',
                border: '1px solid var(--mantine-color-violet-2)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/plan/projects/${p.id}`)}
            >
              <Text size="xs">🚀</Text>
              <Text size="sm" fw={600} style={{ flex: 1 }}>
                {p.title}
              </Text>
              <Badge variant="light" color="violet" size="xs">
                {p.status}
              </Badge>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  store.updateProject(p.id, { goal_id: null })
                  try {
                    await svc.updateProject(p.id, { goal_id: null })
                  } catch {}
                }}
              >
                <X size={12} />
              </ActionIcon>
            </Group>
          ))}

          <Collapse in={linkingProject}>
            <ProjectLinker
              goalId={goalId_}
              onDone={() => setLinkingProject(false)}
            />
          </Collapse>
        </Stack>
      </Paper>

      {/* Linked roadmaps */}
      {(() => {
        const goalRoadmaps = store.roadmaps.filter((r) => r.goal_id === goalId_)
        return (
          <Paper p="lg" radius="xl" bg="var(--mantine-color-body)" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {STRINGS.LINKED_ROADMAPS}
                </Text>
                <Button
                  variant="light"
                  color="orange"
                  size="xs"
                  radius="xl"
                  leftSection={<PlusIcon size={12} />}
                  onClick={() => setLinkingRoadmap(true)}
                >
                  {STRINGS.LINK_ROADMAP}
                </Button>
              </Group>

              {goalRoadmaps.length === 0 && !linkingRoadmap && (
                <Text size="sm" c="dimmed">
                  {STRINGS.NO_LINKED_ROADMAPS}
                </Text>
              )}

              {goalRoadmaps.map((r) => (
                <Group
                  key={r.id}
                  gap="sm"
                  p="xs"
                  style={{
                    borderRadius: 'var(--mantine-radius-lg)',
                    background: 'var(--mantine-color-orange-0)',
                    border: '1px solid var(--mantine-color-orange-2)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/plan/roadmaps/${r.id}`)}
                >
                  <Text size="xs">🗺</Text>
                  <Text size="sm" fw={600} style={{ flex: 1 }}>
                    {r.title}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={async (e) => {
                      e.stopPropagation()
                      store.updateRoadmap(r.id, { goal_id: null })
                      try {
                        await svc.updatePlanRoadmap(r.id, { goal_id: null })
                      } catch {}
                    }}
                  >
                    <X size={12} />
                  </ActionIcon>
                </Group>
              ))}

              <Collapse in={linkingRoadmap}>
                <RoadmapLinker
                  goalId={goalId_}
                  onDone={() => setLinkingRoadmap(false)}
                />
              </Collapse>
            </Stack>
          </Paper>
        )
      })()}

      {/* All tasks */}
      <Paper p="lg" radius="xl" bg="var(--mantine-color-body)" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <UnstyledButton onClick={() => setShowAll((o) => !o)}>
              <Group gap="xs">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {STRINGS.ALL_TASKS}
                </Text>
                <Badge variant="light" color="gray" size="xs">
                  {goalTasks.length}
                </Badge>
                {showAll ? (
                  <CaretDownIcon size={12} />
                ) : (
                  <CaretRightIcon size={12} />
                )}
              </Group>
            </UnstyledButton>
            {goal.status === GOAL_STATUS.ACTIVE && (
              <Button
                variant="gradient"
                gradient={{ from: 'green', to: 'teal' }}
                size="xs"
                radius="xl"
                leftSection={<CheckIcon size={12} />}
                onClick={markGoalDone}
              >
                {STRINGS.MARK_GOAL_DONE}
              </Button>
            )}
          </Group>

          <Collapse in={showAll}>
            <Stack gap="xs">
              {goalTasks.map((t) => {
                const tDone = t.status === TASK_STATUS.DONE
                return (
                  <Group
                    key={t.id}
                    gap="sm"
                    p="xs"
                    style={{
                      borderRadius: 'var(--mantine-radius-lg)',
                      background: 'var(--mantine-color-gray-0)',
                      border: '1px solid var(--mantine-color-gray-2)',
                      opacity: tDone ? 0.6 : 1,
                    }}
                  >
                    <UnstyledButton
                      onClick={() => toggleTask(t.id)}
                      w={16}
                      h={16}
                      style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: tDone
                          ? 'none'
                          : `1.5px solid var(--mantine-color-teal-4)`,
                        backgroundColor: tDone
                          ? 'var(--mantine-color-green-5)'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {tDone && <CheckIcon size={9} color="white" />}
                    </UnstyledButton>
                    <Text
                      size="sm"
                      td={tDone ? 'line-through' : undefined}
                      c={tDone ? 'dimmed' : 'dark'}
                      style={{ flex: 1 }}
                    >
                      {t.title}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => deleteTask(t.id)}
                    >
                      <TrashIcon size={12} />
                    </ActionIcon>
                  </Group>
                )
              })}
            </Stack>
          </Collapse>
        </Stack>
      </Paper>
    </Stack>
  )
}

function ProjectLinker({
  goalId,
  onDone,
}: {
  goalId: string
  onDone: () => void
}) {
  const store = usePlanStore()
  const unlinked = store.projects.filter(
    (p) => !p.goal_id && p.status === PROJECT_STATUS.ACTIVE,
  )
  const [newTitle, setNewTitle] = useState('')

  async function link(id: string) {
    store.updateProject(id, { goal_id: goalId })
    try {
      await svc.updateProject(id, { goal_id: goalId })
    } catch {}
    onDone()
  }

  async function createAndLink() {
    if (!newTitle.trim()) return
    const row = {
      user_id: USER_ID,
      title: newTitle,
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
    setNewTitle('')
    onDone()
  }

  return (
    <Stack gap="sm">
      {unlinked.length > 0 && (
        <>
          <Text size="xs" c="dimmed">
            {STRINGS.LINK_EXISTING_PROJECT}
          </Text>
          <Group gap="xs" wrap="wrap">
            {unlinked.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                color="violet"
                size="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => link(p.id)}
              >
                {p.title}
              </Badge>
            ))}
          </Group>
          <Divider label={STRINGS.OR_CREATE_NEW} labelPosition="center" />
        </>
      )}
      <Group gap="xs">
        <TextInput
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createAndLink()
            if (e.key === 'Escape') onDone()
          }}
          placeholder={STRINGS.NEW_PROJECT_NAME}
          size="sm"
          radius="lg"
          style={{ flex: 1 }}
          autoFocus
        />
        <Button size="sm" radius="xl" color="violet" onClick={createAndLink}>
          {STRINGS.CREATE}
        </Button>
        <Button variant="default" size="sm" radius="xl" onClick={onDone}>
          {STRINGS.CANCEL}
        </Button>
      </Group>
    </Stack>
  )
}

function RoadmapLinker({
  goalId,
  onDone,
}: {
  goalId: string
  onDone: () => void
}) {
  const store = usePlanStore()
  const unlinked = store.roadmaps.filter((r) => !r.goal_id)
  const [newTitle, setNewTitle] = useState('')

  async function link(id: string) {
    store.updateRoadmap(id, { goal_id: goalId })
    try {
      await svc.updatePlanRoadmap(id, { goal_id: goalId })
    } catch {}
    onDone()
  }

  async function createAndLink() {
    if (!newTitle.trim()) return
    const row = {
      user_id: USER_ID,
      title: newTitle,
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
    setNewTitle('')
    onDone()
  }

  return (
    <Stack gap="sm">
      {unlinked.length > 0 && (
        <>
          <Text size="xs" c="dimmed">
            {STRINGS.LINK_EXISTING_ROADMAP}
          </Text>
          <Group gap="xs" wrap="wrap">
            {unlinked.map((r) => (
              <Badge
                key={r.id}
                variant="outline"
                color="orange"
                size="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => link(r.id)}
              >
                {r.title}
              </Badge>
            ))}
          </Group>
          <Divider label={STRINGS.OR_CREATE_NEW} labelPosition="center" />
        </>
      )}
      <Group gap="xs">
        <TextInput
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createAndLink()
            if (e.key === 'Escape') onDone()
          }}
          placeholder={STRINGS.NEW_ROADMAP_NAME}
          size="sm"
          radius="lg"
          style={{ flex: 1 }}
          autoFocus
        />
        <Button size="sm" radius="xl" color="orange" onClick={createAndLink}>
          {STRINGS.CREATE}
        </Button>
        <Button variant="default" size="sm" radius="xl" onClick={onDone}>
          {STRINGS.CANCEL}
        </Button>
      </Group>
    </Stack>
  )
}
