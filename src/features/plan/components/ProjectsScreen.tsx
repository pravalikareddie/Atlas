import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  Progress,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  UnstyledButton,
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { Project } from '../types/plan.types'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { STRINGS } from '../../tasks/constants/strings'
import { USER_ID } from '../../tasks/constants/taskConstants'
import { ROUTES } from '../../../app/routes'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import {
  CaretRight,
  Check,
  DotsThree,
  Pause,
  PencilSimple,
  Play,
  Plus,
  Trash,
} from '@phosphor-icons/react'

const STATUS_COLOR: Record<string, string> = {
  active: 'teal',
  paused: 'amber',
  done: 'green',
  dropped: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  dropped: 'Dropped',
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onOpen,
  onEdit,
  onStatus,
  onDelete,
}: {
  project: Project
  onOpen: () => void
  onEdit: () => void
  onStatus: (status: string) => void
  onDelete: () => void
}) {
  const { tasks, goals } = usePlanStore()
  const pTasks = tasks.filter((t) => t.project_id === project.id)
  const doneCount = pTasks.filter((t) => t.status === 'done').length
  const ratio = pTasks.length > 0 ? (doneCount / pTasks.length) * 100 : 0
  const goal = project.goal_id ? goals.find((g) => g.id === project.goal_id) : null

  return (
    <UnstyledButton onClick={onOpen} w="100%">
      <Paper p="lg" radius="xl" withBorder style={{ transition: 'all 0.15s ease' }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" mb={4}>
              <Text fw={700} size="sm" truncate>
                {project.title}
              </Text>
              <Badge size="xs" variant="light" color={STATUS_COLOR[project.status]}>
                {STATUS_LABEL[project.status]}
              </Badge>
            </Group>
            {project.description && (
              <Text size="xs" c="dimmed" lineClamp={2} mb="xs">
                {project.description}
              </Text>
            )}
            <Group gap="xs">
              {goal && (
                <Badge size="xs" variant="light" color="blue">
                  🎯 {goal.title}
                </Badge>
              )}
              {project.deadline && (
                <Text size="xs" c="dimmed">
                  by {project.deadline}
                </Text>
              )}
            </Group>
            {pTasks.length > 0 && (
              <Box mt="sm">
                <Progress value={ratio} color="teal" radius="xl" size="sm" />
                <Text size="xs" c="dimmed" mt={4}>
                  {doneCount}/{pTasks.length} tasks
                </Text>
              </Box>
            )}
          </Box>

          <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <DotsThree size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<PencilSimple size={14} />} onClick={onEdit}>
                  {STRINGS.EDIT}
                </Menu.Item>
                {project.status === 'active' && (
                  <>
                    <Menu.Item leftSection={<Check size={14} />} onClick={() => onStatus('done')}>
                      Mark done
                    </Menu.Item>
                    <Menu.Item leftSection={<Pause size={14} />} onClick={() => onStatus('paused')}>
                      Pause
                    </Menu.Item>
                  </>
                )}
                {project.status === 'paused' && (
                  <Menu.Item leftSection={<Play size={14} />} onClick={() => onStatus('active')}>
                    Resume
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item leftSection={<Trash size={14} />} color="red" onClick={onDelete}>
                  {STRINGS.DELETE}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <CaretRight size={14} color="var(--mantine-color-dimmed)" />
          </Group>
        </Group>
      </Paper>
    </UnstyledButton>
  )
}

// ─── Project Section ──────────────────────────────────────────────────────────

function ProjectSection({
  label,
  projects,
  badge,
  children,
}: {
  label: string
  projects: Project[]
  badge?: number
  children: React.ReactNode
}) {
  if (!projects.length) return null
  return (
    <Stack gap="sm">
      <Group gap="xs">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {label}
        </Text>
        {badge !== undefined && (
          <Badge variant="light" color="gray" size="xs">
            {badge}
          </Badge>
        )}
      </Group>
      {children}
    </Stack>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function ProjectFormModal({
  projectId,
  onClose,
}: {
  projectId: string | null
  onClose: () => void
}) {
  const { projects, goals, milestones, roadmaps, items, addProject, updateProject } = usePlanStore()
  const existing = projectId ? projects.find((p) => p.id === projectId) : null
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [goalId, setGoalId] = useState('')
  const [milestoneId, setMilestoneId] = useState('')
  const [roadmapId, setRoadmapId] = useState('')
  const [roadmapItemId, setRoadmapItemId] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    setTitle(existing?.title ?? '')
    setDesc(existing?.description ?? '')
    setDeadline(existing?.deadline ?? '')
    setGoalId(existing?.goal_id ?? '')
    setMilestoneId(existing?.milestone_id ?? '')
    setRoadmapId(existing?.roadmap_id ?? '')
    setRoadmapItemId(existing?.roadmap_item_id ?? '')
    setErr(false)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredMilestones = goalId ? milestones.filter((m) => m.goal_id === goalId) : []
  const filteredItems = roadmapId ? items.filter((i) => i.roadmap_id === roadmapId) : []

  async function save() {
    if (!title.trim()) { setErr(true); return }
    const data = {
      title: title.trim(),
      description: desc || null,
      deadline: deadline || null,
      goal_id: goalId || null,
      milestone_id: milestoneId || null,
      roadmap_id: roadmapId || null,
      roadmap_item_id: roadmapItemId || null,
    }
    if (existing) {
      updateProject(existing.id, data)
      try { await svc.updateProject(existing.id, data) } catch {}
    } else {
      const row = { user_id: USER_ID, ...data, status: 'active' as const }
      try {
        const r = await svc.insertProject(row)
        addProject(r)
      } catch {
        addProject({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() })
      }
    }
    onClose()
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={existing ? 'Edit Project' : 'New Project'}
      radius="xl"
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErr(false) }}
          placeholder="Ship Atlas v1, AWS cert prep..."
          error={err ? STRINGS.REQUIRED : undefined}
          autoFocus
          radius="lg"
        />
        <Textarea
          label="Description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          radius="lg"
          rows={2}
        />
        <Select
          label="Linked goal"
          value={goalId || null}
          onChange={(v) => { setGoalId(v ?? ''); setMilestoneId('') }}
          data={[
            { value: '', label: 'None' },
            ...goals.filter((g) => g.status === 'active').map((g) => ({ value: g.id, label: g.title })),
          ]}
          clearable
          radius="lg"
        />
        {goalId && filteredMilestones.length > 0 && (
          <Select
            label="Linked milestone"
            value={milestoneId || null}
            onChange={(v) => setMilestoneId(v ?? '')}
            data={[
              { value: '', label: 'None' },
              ...filteredMilestones.map((m) => ({ value: m.id, label: m.title })),
            ]}
            clearable
            radius="lg"
          />
        )}
        <Select
          label="Linked roadmap"
          value={roadmapId || null}
          onChange={(v) => { setRoadmapId(v ?? ''); setRoadmapItemId('') }}
          data={[
            { value: '', label: 'None' },
            ...roadmaps.map((r) => ({ value: r.id, label: r.title })),
          ]}
          clearable
          radius="lg"
        />
        {roadmapId && filteredItems.length > 0 && (
          <Select
            label="Linked roadmap item"
            value={roadmapItemId || null}
            onChange={(v) => setRoadmapItemId(v ?? '')}
            data={[
              { value: '', label: 'None' },
              ...filteredItems.map((i) => ({ value: i.id, label: i.title })),
            ]}
            clearable
            radius="lg"
          />
        )}
        <TextInput
          label="Deadline (optional)"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          radius="lg"
        />
        <Divider />
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>
            {STRINGS.CANCEL}
          </Button>
          <Button
            radius="xl"
            variant="gradient"
            gradient={{ from: 'blue', to: 'teal' }}
            onClick={save}
          >
            {STRINGS.SAVE}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ProjectsScreen() {
  const { projects, loading, updateProject, removeProject } = usePlanStore()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  if (loading) return <SkeletonRow count={6} />

  const active = projects.filter((p) => p.status === 'active')
  const paused = projects.filter((p) => p.status === 'paused')
  const done = projects.filter((p) => p.status === 'done')

  async function handleStatus(id: string, status: string) {
    updateProject(id, { status: status as Project['status'] })
    try { await svc.updateProject(id, { status: status as Project['status'] }) } catch {}
  }

  async function handleDelete(id: string) {
    removeProject(id)
    try { await svc.deleteProject(id) } catch {}
  }

  function renderCard(p: Project) {
    return (
      <ProjectCard
        key={p.id}
        project={p}
        onOpen={() => navigate(ROUTES.PROJECT_DETAIL(p.id))}
        onEdit={() => { setEditId(p.id); setShowAdd(true) }}
        onStatus={(s) => handleStatus(p.id, s)}
        onDelete={() => handleDelete(p.id)}
      />
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Active Projects
        </Text>
        <Button
          variant="light"
          color="blue"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => { setEditId(null); setShowAdd(true) }}
        >
          New Project
        </Button>
      </Group>

      {!active.length && !paused.length && !done.length && (
        <EmptyState
          message={STRINGS.NO_PROJECTS}
          sub="A project is a chunk of work with tasks you can check off."
        />
      )}

      <SortableList items={active} onReorder={(r) => persistOrder(r, (id, d) => updateProject(id, d), (id, d) => svc.updateProject(id, d))} renderItem={renderCard} />

      <ProjectSection label="Paused" projects={paused} badge={paused.length}>
        <Stack gap="sm">{paused.map(renderCard)}</Stack>
      </ProjectSection>

      <ProjectSection label="Completed" projects={done} badge={done.length}>
        <Stack gap="sm">{done.map(renderCard)}</Stack>
      </ProjectSection>

      {showAdd && (
        <ProjectFormModal
          projectId={editId}
          onClose={() => { setShowAdd(false); setEditId(null) }}
        />
      )}
    </Stack>
  )
}
