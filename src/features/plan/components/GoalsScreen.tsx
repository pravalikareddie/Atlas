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
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { AREA_COLORS, Goal, GOAL_AREAS, GoalArea } from '../types/plan.types'
import { Button } from '@mantine/core'
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
  const [editId, setEditId] = useState<string | null>(null)
  const [editingMantra, setEditingMantra] = useState(false)
  const [mantraText, setMantraText] = useState(mantra ?? '')
  const [addingProjectFor, setAddingProjectFor] = useState<string | null>(null)
  const [addingRoadmapFor, setAddingRoadmapFor] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  if (loading) return <SkeletonRow count={8} />

  const active = goals.filter((g) => g.status === GOAL_STATUS.ACTIVE)
  const done = goals.filter((g) => g.status === GOAL_STATUS.DONE)
  const dropped = goals.filter((g) => g.status === GOAL_STATUS.DROPPED)
  const grouped = GOAL_AREAS.map((a) => ({
    ...a,
    goals: active.filter((g) => g.area === a.key),
  })).filter((g) => g.goals.length > 0)

  async function saveMantra() {
    setMantra(mantraText || null)
    setEditingMantra(false)
    try {
      await svc.upsertUserSettings({
        user_id: USER_ID,
        daily_mantra: mantraText || null,
        updated_at: new Date().toISOString(),
      })
    } catch {}
  }

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
        style={{ borderColor: 'var(--mantine-color-gray-2)' }}
      >
        <Stack gap="sm">
          {/* Goal header */}
          <Group justify="space-between" align="flex-start">
            <Box
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => navigate(`/plan/goals/${goal.id}`)}
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
              </Group>
              {goal.affirmation && (
                <Text size="xs" c="dimmed" fs="italic" ml={18}>
                  {goal.affirmation}
                </Text>
              )}
              <Group gap="xs" mt={4} ml={18}>
                {ms.length > 0 && (
                  <Badge variant="light" color="teal" size="xs">
                    {msDone}/{ms.length} {STRINGS.MILESTONES}
                  </Badge>
                )}
                {taskCount > 0 && (
                  <Badge variant="light" color="blue" size="xs">
                    {taskCount} {STRINGS.TASKS}
                  </Badge>
                )}
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
                onClick={() => navigate(`/plan/goals/${goal.id}`)}
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
              bg="var(--mantine-color-gray-2)"
            />
          )}

          {/* Linked projects + roadmaps */}
          {(projList.length > 0 || rmList.length > 0) && (
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
                  onClick={() => navigate(`/plan/projects/${p.id}`)}
                >
                  🚀 {p.title}
                </Badge>
              ))}
              {rmList.map((r) => (
                <Badge
                  key={r.id}
                  variant="light"
                  color="orange"
                  size="sm"
                  style={{ cursor: 'pointer' }}
                  rightSection={
                    <X
                      size={10}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        store.updateRoadmap(r.id, { goal_id: null })
                        svc
                          .updatePlanRoadmap(r.id, { goal_id: null })
                          .catch(() => {})
                      }}
                    />
                  }
                  onClick={() => navigate(`/plan/roadmaps/${r.id}`)}
                >
                  🗺 {r.title}
                </Badge>
              ))}
            </Group>
          )}

          {/* Quick link buttons */}
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              color="violet"
              leftSection={<PlusIcon size={12} />}
              onClick={() => {
                setAddingProjectFor(goal.id)
                setAddingRoadmapFor(null)
                setNewName('')
              }}
            >
              {STRINGS.ADD_PROJECT}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              radius="xl"
              color="orange"
              leftSection={<PlusIcon size={12} />}
              onClick={() => {
                setAddingRoadmapFor(goal.id)
                setAddingProjectFor(null)
                setNewName('')
              }}
            >
              {STRINGS.ADD_ROADMAP}
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

          {/* Inline roadmap adder */}
          <Collapse in={isAddingRoadmap}>
            <Stack gap="xs">
              {unlinkedRoadmaps.length > 0 && (
                <Group gap="xs" wrap="wrap">
                  <Text size="xs" c="dimmed">
                    {STRINGS.LINK_EXISTING}
                  </Text>
                  {unlinkedRoadmaps.map((r) => (
                    <Badge
                      key={r.id}
                      variant="outline"
                      size="sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => quickLinkRoadmap(r.id, goal.id)}
                    >
                      {r.title}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap="xs">
                <TextInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') quickAddRoadmap(goal.id)
                    if (e.key === 'Escape') setAddingRoadmapFor(null)
                  }}
                  placeholder={STRINGS.NEW_ROADMAP_NAME}
                  size="xs"
                  radius="lg"
                  style={{ flex: 1 }}
                  autoFocus
                />
                <Button
                  size="xs"
                  radius="xl"
                  color="orange"
                  onClick={() => quickAddRoadmap(goal.id)}
                >
                  {STRINGS.CREATE}
                </Button>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setAddingRoadmapFor(null)}
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
        </Group>
      </Box>

      {/* Mantra */}
      <Paper p="lg" radius="xl" withBorder bg="var(--mantine-color-body)">
        {editingMantra ? (
          <Group gap="sm">
            <TextInput
              value={mantraText}
              onChange={(e) => setMantraText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveMantra()
                if (e.key === 'Escape') setEditingMantra(false)
              }}
              placeholder={STRINGS.MANTRA_PLACEHOLDER}
              style={{ flex: 1 }}
              radius="lg"
              autoFocus
            />
            <Button radius="xl" size="sm" onClick={saveMantra}>
              {STRINGS.SAVE}
            </Button>
            <ActionIcon
              variant="subtle"
              onClick={() => setEditingMantra(false)}
            >
              <X size={14} />
            </ActionIcon>
          </Group>
        ) : (
          <Group
            gap="md"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setMantraText(mantra ?? '')
              setEditingMantra(true)
            }}
          >
            <Text size="xl">🌟</Text>
            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={2}>
                {STRINGS.DAILY_MANTRA}
              </Text>
              <Text
                size="sm"
                c={mantra ? 'dark' : 'dimmed'}
                fs={mantra ? undefined : 'italic'}
              >
                {mantra || STRINGS.MANTRA_EMPTY}
              </Text>
            </Box>
            <ActionIcon variant="subtle" ml="auto" size="sm">
              <PencilIcon size={14} />
            </ActionIcon>
          </Group>
        )}
      </Paper>

      {/* Empty state */}
      {!active.length && !showAdd && (
        <EmptyState
          message={STRINGS.GOALS_EMPTY}
          sub={STRINGS.GOALS_EMPTY_SUB}
        />
      )}

      {/* Goal groups by area */}
      {grouped.map((group) => (
        <Stack key={group.key} gap="sm">
          <Group gap="xs" px={4}>
            <Box
              w={10}
              h={10}
              style={{
                borderRadius: '50%',
                backgroundColor: AREA_COLORS[group.key],
                flexShrink: 0,
              }}
            />
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {group.label}
            </Text>
            <Badge variant="light" color="gray" size="xs">
              {group.goals.length}
            </Badge>
          </Group>
          {group.goals.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </Stack>
      ))}

      {done.length > 0 && (
        <CollapsedGoals
          label={STRINGS.COMPLETED_GOALS}
          goals={done}
          color="green"
        />
      )}
      {dropped.length > 0 && (
        <CollapsedGoals
          label={STRINGS.DROPPED_GOALS}
          goals={dropped}
          color="gray"
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
    </Stack>
  )
}

function CollapsedGoals({
  label,
  goals,
  color,
}: {
  label: string
  goals: Goal[]
  color: string
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
                  style={{ flex: 1 }}
                >
                  {g.title}
                </Text>
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

  const accentColor = AREA_COLORS[area] ? 'teal' : 'teal'

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
