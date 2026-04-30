import { supabase } from '../../../lib/supabase'
import {
  Routine,
  RoutineSection,
  RoutineSession,
  RoutineStep,
} from '../../routines/types'
import {
  Goal,
  Milestone,
  Task,
  Project,
  PlanRoadmap,
  PlanRoadmapSection,
  PlanRoadmapItem,
  UserSettings,
} from '../types/plan.types'

// ── Goals ──
export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function insertGoal(
  g: Omit<Goal, 'id' | 'created_at'>,
): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert(g)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateGoal(id: string, u: Partial<Goal>): Promise<void> {
  const { error } = await supabase.from('goals').update(u).eq('id', id)
  if (error) throw error
}

// ── Milestones ──
export async function fetchMilestones(goalId?: string): Promise<Milestone[]> {
  let q = supabase.from('milestones').select('*').order('order_index')
  if (goalId) q = q.eq('goal_id', goalId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertMilestone(
  m: Omit<Milestone, 'id' | 'created_at'>,
): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .insert(m)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateMilestone(
  id: string,
  u: Partial<Milestone>,
): Promise<void> {
  const { error } = await supabase.from('milestones').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', id)
  if (error) throw error
}

// ── Tasks ──
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('order_index')
  if (error) throw error
  return data ?? []
}
export async function insertTask(
  t: Omit<Task, 'id' | 'created_at'>,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateTask(id: string, u: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Projects ──
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}
export async function insertProject(
  p: Omit<Project, 'id' | 'created_at'>,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updateProject(
  id: string,
  u: Partial<Project>,
): Promise<void> {
  const { error } = await supabase.from('projects').update(u).eq('id', id)
  if (error) throw error
}
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Roadmaps ──
export async function fetchPlanRoadmaps(): Promise<PlanRoadmap[]> {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}
export async function insertPlanRoadmap(
  r: Omit<PlanRoadmap, 'id' | 'created_at'>,
): Promise<PlanRoadmap> {
  const { data, error } = await supabase
    .from('roadmaps')
    .insert(r)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updatePlanRoadmap(
  id: string,
  u: Partial<PlanRoadmap>,
): Promise<void> {
  const { error } = await supabase.from('roadmaps').update(u).eq('id', id)
  if (error) throw error
}
export async function deletePlanRoadmap(id: string): Promise<void> {
  const { error } = await supabase.from('roadmaps').delete().eq('id', id)
  if (error) throw error
}

// ── Roadmap Sections ──
export async function fetchPlanSections(
  roadmapId?: string,
): Promise<PlanRoadmapSection[]> {
  let q = supabase.from('roadmap_sections').select('*').order('order_index')
  if (roadmapId) q = q.eq('roadmap_id', roadmapId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertPlanSection(
  s: Omit<PlanRoadmapSection, 'id' | 'created_at'>,
): Promise<PlanRoadmapSection> {
  const { data, error } = await supabase
    .from('roadmap_sections')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updatePlanSection(
  id: string,
  u: Partial<PlanRoadmapSection>,
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .update(u)
    .eq('id', id)
  if (error) throw error
}
export async function deletePlanSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('roadmap_sections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Roadmap Items ──
export async function fetchPlanItems(
  roadmapId?: string,
): Promise<PlanRoadmapItem[]> {
  let q = supabase.from('roadmap_items').select('*').order('order_index')
  if (roadmapId) q = q.eq('roadmap_id', roadmapId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
export async function insertPlanItem(
  i: Omit<PlanRoadmapItem, 'id' | 'created_at'>,
): Promise<PlanRoadmapItem> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .insert(i)
    .select()
    .single()
  if (error) throw error
  return data
}
export async function updatePlanItem(
  id: string,
  u: Partial<PlanRoadmapItem>,
): Promise<void> {
  const { error } = await supabase.from('roadmap_items').update(u).eq('id', id)
  if (error) throw error
}
export async function deletePlanItem(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', id)
  if (error) throw error
}

// ── User Settings ──
export async function fetchUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
export async function upsertUserSettings(s: UserSettings): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert(s)
  if (error) throw error
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function getRoutines(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select()
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function insertRoutine(
  r: Omit<Routine, 'id' | 'created_at'>,
): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .insert(r)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoutine(
  id: string,
  updates: Partial<Routine>,
): Promise<void> {
  const { error } = await supabase.from('routines').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', id)
  if (error) throw error
}
