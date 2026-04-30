import { Box, Text, UnstyledButton } from '@mantine/core'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlanStore } from '../store/planStore'
import * as svc from '../services/planService'
import { Project } from '../types/plan.types'
import { Button } from '@mantine/core'
import { Modal } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { ProgressBar } from '../../../shared/components/ProgressBar'

export function ProjectsScreen() {
  const {
    projects,
    tasks,
    goals,
    milestones,
    roadmaps,
    items,
    loading,
    updateProject,
    removeProject,
  } = usePlanStore()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)

  if (loading) return <SkeletonRow count={6} />

  const active = projects.filter((p) => p.status === 'active')
  const paused = projects.filter((p) => p.status === 'paused')
  const done = projects.filter((p) => p.status === 'done')

  async function setStatus(id: string, status: string) {
    updateProject(id, { status: status as Project['status'] })
    try {
      await svc.updateProject(id, { status: status as Project['status'] })
    } catch {}
    setMenuId(null)
  }

  async function deleteProject(id: string) {
    removeProject(id)
    try {
      await svc.deleteProject(id)
    } catch {}
    setMenuId(null)
  }

  function ProjectCard({ project }: { project: Project }) {
    const pTasks = tasks.filter((t) => t.project_id === project.id)
    const doneCount = pTasks.filter((t) => t.status === 'done').length
    const ratio = pTasks.length > 0 ? doneCount / pTasks.length : 0
    const goal = project.goal_id
      ? goals.find((g) => g.id === project.goal_id)
      : null
    const milestone = project.milestone_id
      ? milestones.find((m) => m.id === project.milestone_id)
      : null
    const roadmap = project.roadmap_id
      ? roadmaps.find((r) => r.id === project.roadmap_id)
      : null
    const rmItem = project.roadmap_item_id
      ? items.find((i) => i.id === project.roadmap_item_id)
      : null
    const isMenu = menuId === project.id
    return (
      <Box>
        <Box>
          <Box onClick={() => navigate(`/plan/projects/${project.id}`)}>
            {project.title}
          </Box>
          <Box>
            <UnstyledButton
              onClick={() => {
                setEditId(project.id)
                setShowAdd(true)
              }}
            >
              ✏️
            </UnstyledButton>
            <Box>
              <UnstyledButton
                onClick={() => setMenuId(isMenu ? null : project.id)}
              >
                ⋮
              </UnstyledButton>
              {isMenu && (
                <>
                  <Box onClick={() => setMenuId(null)} />
                  <Box
                    style={{
                      background: '#1C1C1A',
                      border: '1px solid var(--mantine-color-dark-4)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    {project.status === 'active' && (
                      <MBtn
                        label="✓ mark done"
                        onClick={() => setStatus(project.id, 'done')}
                      />
                    )}
                    {project.status === 'active' && (
                      <MBtn
                        label="⏸ pause"
                        onClick={() => setStatus(project.id, 'paused')}
                      />
                    )}
                    {project.status === 'paused' && (
                      <MBtn
                        label="▶ resume"
                        onClick={() => setStatus(project.id, 'active')}
                      />
                    )}
                    <MBtn
                      label="🗑 delete"
                      onClick={() => deleteProject(project.id)}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Box>
        {project.description && <Box>{project.description}</Box>}
        <Box>
          {goal && <Text component="span">🎯 {goal.title}</Text>}
          {milestone && <Text component="span">◇ {milestone.title}</Text>}
          {roadmap && <Text component="span">🗺 {roadmap.title}</Text>}
          {rmItem && <Text component="span">· {rmItem.title}</Text>}
          {project.deadline && (
            <Text component="span">by {project.deadline}</Text>
          )}
          <Text component="span">{project.status}</Text>
        </Box>
        {pTasks.length > 0 && (
          <>
            <ProgressBar value={ratio} />
            <Box>
              {doneCount} of {pTasks.length} tasks
            </Box>
          </>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Box>
        <Box>active projects</Box>
        <Button
          onClick={() => {
            setEditId(null)
            setShowAdd(true)
          }}
        >
          + new project
        </Button>
      </Box>

      {!active.length && !showAdd && (
        <EmptyState
          message="No projects yet. Start something."
          sub="A project is a chunk of work with tasks you can check off."
        />
      )}

      <Box>
        {active.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Box>

      {paused.length > 0 && (
        <>
          <Box>paused</Box>
          <Box>
            {paused.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </Box>
        </>
      )}

      {done.length > 0 && (
        <>
          <Box>completed</Box>
          <Box>
            {done.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </Box>
        </>
      )}

      {showAdd && (
        <ProjectFormModal
          projectId={editId}
          onClose={() => {
            setShowAdd(false)
            setEditId(null)
          }}
        />
      )}
    </Box>
  )
}

function MBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <UnstyledButton onClick={onClick}>{label}</UnstyledButton>
}

function ProjectFormModal({
  projectId,
  onClose,
}: {
  projectId: string | null
  onClose: () => void
}) {
  const {
    projects,
    goals,
    milestones,
    roadmaps,
    items,
    addProject,
    updateProject,
  } = usePlanStore()
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

  const filteredMilestones = goalId
    ? milestones.filter((m) => m.goal_id === goalId)
    : []
  const filteredItems = roadmapId
    ? items.filter((i) => i.roadmap_id === roadmapId)
    : []

  async function save() {
    if (!title.trim()) {
      setErr(true)
      return
    }
    const data = {
      title,
      description: desc || null,
      deadline: deadline || null,
      goal_id: goalId || null,
      milestone_id: milestoneId || null,
      roadmap_id: roadmapId || null,
      roadmap_item_id: roadmapItemId || null,
    }
    if (existing) {
      updateProject(existing.id, data)
      try {
        await svc.updateProject(existing.id, data)
      } catch {}
    } else {
      const row = {
        user_id: '00000000-0000-0000-0000-000000000001',
        ...data,
        status: 'active' as const,
      }
      try {
        const r = await svc.insertProject(row)
        addProject(r)
      } catch {
        addProject({
          ...row,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
      }
    }
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose}>
      <Box>{existing ? 'Edit project' : 'New project'}</Box>
      <label>title</label>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setErr(false)
        }}
        placeholder="Ship Atlas v1, AWS cert prep..."
        autoFocus
      />
      {err && <Box>Required</Box>}
      <label>description (optional)</label>
      <input value={desc} onChange={(e) => setDesc(e.target.value)} />
      <label>linked goal</label>
      <select
        value={goalId}
        onChange={(e) => {
          setGoalId(e.target.value)
          setMilestoneId('')
        }}
      >
        <option value="">None</option>
        {goals
          .filter((g) => g.status === 'active')
          .map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
      </select>
      {goalId && filteredMilestones.length > 0 && (
        <>
          <label>linked milestone</label>
          <select
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
          >
            <option value="">None</option>
            {filteredMilestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </>
      )}
      <label>linked roadmap</label>
      <select
        value={roadmapId}
        onChange={(e) => {
          setRoadmapId(e.target.value)
          setRoadmapItemId('')
        }}
      >
        <option value="">None</option>
        {roadmaps.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </select>
      {roadmapId && filteredItems.length > 0 && (
        <>
          <label>linked roadmap item</label>
          <select
            value={roadmapItemId}
            onChange={(e) => setRoadmapItemId(e.target.value)}
          >
            <option value="">None</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
        </>
      )}
      <label>deadline (optional)</label>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <Box>
        <Button variant="secondary" onClick={onClose}>
          cancel
        </Button>
        <Button onClick={save}>save</Button>
      </Box>
    </Modal>
  )
}
