import { ROUTES } from '../../../app/routes'
import { Box, Text, UnstyledButton, Title , Button } from '@mantine/core'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlanStore } from '../store/planStore'
import { usePlanData } from '../hooks/usePlanData'
import * as svc from '../services/planService'
import { ProgressBar } from '../../../shared/components/ProgressBar'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import { STRINGS } from '../../tasks/constants/strings'
import { SortableList } from '../../../shared/components/SortableList'
import { persistOrder } from '../../../shared/utils/persistOrder'
import { USER_ID } from '../../tasks/constants/taskConstants'

export function ProjectDetail() {
  usePlanData()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const store = usePlanStore()
  const project = store.projects.find((p) => p.id === projectId)
  const [addingTask, setAddingTask] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [subText, setSubText] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskText, setEditTaskText] = useState('')

  if (store.loading)
    return (
      <Box>
        <SkeletonRow count={6} />
      </Box>
    )
  if (!project)
    return (
      <Box>
        <UnstyledButton onClick={() => navigate(ROUTES.PROJECTS)}>
          ← back
        </UnstyledButton>
        <EmptyState message="Project not found" />
      </Box>
    )

  const pid = project.id
  const pGoalId = project.goal_id
  const pStatus = project.status
  const goal = pGoalId ? store.goals.find((g) => g.id === pGoalId) : null
  const milestone = project.milestone_id
    ? store.milestones.find((m) => m.id === project.milestone_id)
    : null
  const roadmap = project.roadmap_id
    ? store.roadmaps.find((r) => r.id === project.roadmap_id)
    : null
  const rmItem = project.roadmap_item_id
    ? store.items.find((i) => i.id === project.roadmap_item_id)
    : null
  const pTasks = store.tasks
    .filter((t) => t.project_id === projectId && !t.parent_task_id)
    .sort((a, b) => a.order_index - b.order_index)
  const doneCount = pTasks.filter((t) => t.status === 'done').length
  const ratio = pTasks.length > 0 ? doneCount / pTasks.length : 0

  async function addTask() {
    if (!taskText.trim()) return
    const row = {
      user_id: USER_ID,
      title: taskText,
      notes: null,
      type: 'personal' as const,
      priority: null,
      is_must: false,
      status: 'todo' as const,
      due_date: null,
      completed_at: null,
      goal_id: pGoalId,
      milestone_id: null,
      project_id: pid,
      roadmap_item_id: null,
      parent_task_id: null,
      order_index: pTasks.length,
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
    setAddingTask(false)
  }

  async function toggleTask(id: string) {
    const t = store.tasks.find((x) => x.id === id)
    if (!t) return
    const updates =
      t.status === 'done'
        ? { status: 'todo' as const, completed_at: null }
        : { status: 'done' as const, completed_at: new Date().toISOString() }
    store.updateTask(id, updates)
    try {
      await svc.updateTask(id, updates)
    } catch {}
  }

  async function deleteTask(id: string) {
    store.removeTask(id)
    try {
      await svc.deleteTask(id)
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

  async function addSubtask(parentId: string) {
    if (!subText.trim()) return
    const row = {
      user_id: USER_ID,
      title: subText,
      notes: null,
      type: 'personal' as const,
      priority: null,
      is_must: false,
      status: 'todo' as const,
      due_date: null,
      completed_at: null,
      goal_id: pGoalId,
      milestone_id: null,
      project_id: pid,
      roadmap_item_id: null,
      parent_task_id: parentId,
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
    setSubText('')
  }

  async function markDone() {
    store.updateProject(pid, { status: 'done' })
    try {
      await svc.updateProject(pid, { status: 'done' })
    } catch {}
    navigate(ROUTES.PROJECTS)
  }

  async function pause() {
    const newStatus = pStatus === 'paused' ? 'active' : 'paused'
    store.updateProject(pid, { status: newStatus })
    try {
      await svc.updateProject(pid, { status: newStatus })
    } catch {}
  }

  return (
    <Box>
      <UnstyledButton onClick={() => navigate(ROUTES.PROJECTS)}>
        ← back to projects
      </UnstyledButton>

      <Box>
        <Title order={1}>{project.title}</Title>
        {project.description && <Box>{project.description}</Box>}
        {project.deadline && <Box>by {project.deadline}</Box>}
        <Text component="span">{pStatus}</Text>
      </Box>

      {/* Association strip */}
      <Box>
        {goal && (
          <Text
            component="span"
            onClick={() => navigate(ROUTES.GOAL_DETAIL(goal.id))}
          >
            🎯 {goal.title}
          </Text>
        )}
        {milestone && <Text component="span">◇ {milestone.title}</Text>}
        {roadmap && (
          <Text
            component="span"
            onClick={() => navigate(ROUTES.ROADMAP_DETAIL(roadmap.id))}
          >
            🗺 {roadmap.title}
          </Text>
        )}
        {rmItem && <Text component="span">· {rmItem.title}</Text>}
      </Box>

      {/* Progress */}
      {pTasks.length > 0 && (
        <Box>
          <Box>
            <ProgressBar value={ratio} />
          </Box>
          <Text component="span">
            {doneCount}/{pTasks.length}
          </Text>
        </Box>
      )}

      {/* Tasks */}
      <Box>
        <Box>tasks</Box>
        <Button variant="ghost" onClick={() => setAddingTask(true)}>
          + add task
        </Button>
      </Box>

      {!pTasks.length && !addingTask && (
        <EmptyState
          message={STRINGS.NO_TASKS_YET}
          sub="Break this project into actionable tasks."
        />
      )}

      <Box>
        <SortableList items={pTasks} onReorder={(reordered) => persistOrder(reordered, (id, d) => store.updateTask(id, d), (id, d) => svc.updateTask(id, d))} renderItem={(t) => {
          const subs = store.tasks.filter((s) => s.parent_task_id === t.id)
          const isExpanded = expandedTask === t.id
          return (
            <Box>
              <Box>
                <UnstyledButton
                  onClick={() => toggleTask(t.id)}
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {t.status === 'done' && '✓'}
                </UnstyledButton>
                {editingTaskId === t.id ? (
                  <input
                    value={editTaskText}
                    onChange={(e) => setEditTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditTask(t.id)
                      if (e.key === 'Escape') setEditingTaskId(null)
                    }}
                    autoFocus
                  />
                ) : (
                  <Text
                    component="span"
                    onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                  >
                    {t.title}
                  </Text>
                )}
                {t.priority && <Text component="span">{t.priority}</Text>}
                {subs.length > 0 && (
                  <Text component="span">
                    {subs.filter((s) => s.status === 'done').length}/
                    {subs.length}
                  </Text>
                )}
                <UnstyledButton
                  onClick={() => {
                    setEditingTaskId(t.id)
                    setEditTaskText(t.title)
                  }}
                >
                  ✏️
                </UnstyledButton>
                <UnstyledButton onClick={() => deleteTask(t.id)}>
                  🗑
                </UnstyledButton>
              </Box>
              {isExpanded && (
                <Box>
                  {subs.map((s) => (
                    <Box key={s.id}>
                      <UnstyledButton
                        onClick={() => toggleTask(s.id)}
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {s.status === 'done' && '✓'}
                      </UnstyledButton>
                      <Text component="span">{s.title}</Text>
                      <UnstyledButton
                        onClick={() => {
                          setEditingTaskId(s.id)
                          setEditTaskText(s.title)
                        }}
                      >
                        ✏️
                      </UnstyledButton>
                      <UnstyledButton onClick={() => deleteTask(s.id)}>
                        🗑
                      </UnstyledButton>
                    </Box>
                  ))}
                  <Box>
                    <input
                      value={subText}
                      onChange={(e) => setSubText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addSubtask(t.id)
                        if (e.key === 'Escape') setExpandedTask(null)
                      }}
                      placeholder={STRINGS.ADD_SUBTASK_PH}
                      autoFocus
                    />
                    <Button variant="ghost" onClick={() => addSubtask(t.id)}>
                      add
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )
        }} />
        {addingTask && (
          <Box>
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask()
                if (e.key === 'Escape') setAddingTask(false)
              }}
              placeholder="Task name..."
              autoFocus
            />
            <Button onClick={addTask}>add</Button>
          </Box>
        )}
      </Box>

      <Box>
        {pStatus === 'active' && (
          <Button onClick={markDone}>✓ mark done</Button>
        )}
        <Button variant="ghost" onClick={pause}>
          {pStatus === 'paused' ? 'resume' : 'pause'}
        </Button>
      </Box>
    </Box>
  )
}
