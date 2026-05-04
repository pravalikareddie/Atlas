// @ts-nocheck
// ─── RoutineEditView.tsx ───────────────────────────────────────────────────────

import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useRoutineData } from '../hooks/useRoutineData'
import { useEffect, useState, useMemo } from 'react'
import { useRoutineStore } from '../hooks/useRoutineStore'
import { Routine, RoutineCadence, RoutineSection, RoutineStep } from '../types/routine.types'
import {
  CADENCE_LABEL,
  DAYS_OF_WEEK,
  ROUTINE_CADENCE,
  ROUTINE_GRADIENTS,
  ROUTINE_TYPE,
  ROUTINE_TYPE_LABEL,
} from '../constants'
import { STRINGS } from '../../tasks/constants/strings'
import { USER_ID } from '../../tasks/constants/taskConstants'
import * as svc from '../services/routineService'
import { SortableList } from '../../../shared/components/SortableList'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import {
  Play,
  Plus,
  Trash,
  X,
  DotsSixVertical,
  CaretLeft,
  PencilSimple,
  ArrowsDownUp,
} from '@phosphor-icons/react'
import { ROUTES } from '../../../app/routes'
import { RoutineType } from './RoutinesScreen'

export function RoutineEditView() {
  useRoutineData()
  const { routineId } = useParams<{ routineId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const store = useRoutineStore()
  const isNew = routineId === 'new'

  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(
    isNew ? null : (routineId ?? null),
  )

  const resolvedId = currentRoutineId ?? (isNew ? null : (routineId ?? null))
  const routine = resolvedId
    ? store.routines.find((r) => r.id === resolvedId)
    : null

  const sections = store.sections
    .filter((s) => s.routine_id === resolvedId)
    .sort((a, b) => a.order_index - b.order_index)

  const generalSteps = store.steps
    .filter((s) => s.routine_id === resolvedId && !s.section_id)
    .sort((a, b) => a.order_index - b.order_index)

  const defaultType =
    (searchParams.get('type') as RoutineType) ?? ROUTINE_TYPE.HABIT

  const [routineType, setRoutineType] = useState<RoutineType>(
    routine?.type ?? defaultType,
  )

  const [title, setTitle] = useState(routine?.title ?? '')
  const [outcome, setOutcome] = useState(routine?.outcome ?? '')
  const [cadence, setCadence] = useState<RoutineCadence>(
    routine?.cadence ?? ROUTINE_CADENCE.DAILY,
  )
  const [gradient, setGradient] = useState(routine?.gradient ?? 0)
  const [scheduleDays, setScheduleDays] = useState<number[]>(() => {
    try {
      return JSON.parse(routine?.schedule ?? '{}').days ?? []
    } catch {
      return []
    }
  })
  const [addingSectionTitle, setAddingSectionTitle] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(
    null,
  )
  const [renameSectionText, setRenameSectionText] = useState('')
  const [addingStepForSection, setAddingStepForSection] = useState<
    string | null
  >(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editStepData, setEditStepData] = useState<{
    title: string
    description: string
    emoji: string
  }>({
    title: '',
    description: '',
    emoji: '',
  })
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null)

  useEffect(() => {
    if (routine) {
      setTitle(routine.title)
      setOutcome(routine.outcome ?? '')
      setRoutineType(routine.type ?? ROUTINE_TYPE.HABIT)
      setCadence(routine.cadence)
      setGradient(routine.gradient ?? 0)
      try {
        setScheduleDays(JSON.parse(routine.schedule ?? '{}').days ?? [])
      } catch {
        setScheduleDays([])
      }
    }
  }, [resolvedId])

  async function ensureRoutineExists(): Promise<string> {
    if (currentRoutineId) return currentRoutineId
    const row: Omit<Routine, 'id' | 'created_at'> = {
      user_id: USER_ID,
      title: title || 'New Routine',
      outcome: outcome || null,
      type: routineType,
      cadence,
      schedule: null,
      gradient: gradient ?? 0,
      is_active: true,
      order_index: store.routines.length,
      last_done: null,
    }
    try {
      const r = await svc.insertRoutine(row)
      store.addRoutine(r)
      setCurrentRoutineId(r.id)
      return r.id
    } catch {
      const id = crypto.randomUUID()
      store.addRoutine({ ...row, id, created_at: new Date().toISOString() })
      setCurrentRoutineId(id)
      return id
    }
  }

  async function saveRoutineFields() {
    const rid = await ensureRoutineExists()
    const data = {
      title: title || 'New Routine',
      outcome: outcome || null,
      type: routineType,
      cadence,
      gradient,
      schedule:
        cadence === ROUTINE_CADENCE.WEEKLY ||
        cadence === ROUTINE_CADENCE.BIWEEKLY
          ? JSON.stringify({ days: scheduleDays })
          : null,
    }
    store.updateRoutine(rid, data)
    try {
      await svc.updateRoutine(rid, data)
    } catch {}
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return
    const rid = await ensureRoutineExists()
    const row = {
      routine_id: rid,
      title: newSectionTitle.trim(),
      order_index: sections.length,
      user_id: USER_ID,
    }
    try {
      const r = await svc.insertRoutineSection({
        ...row,
        id: crypto.randomUUID(),
      })
      store.addSection(r)
    } catch {
      store.addSection({ ...row, id: crypto.randomUUID() } as RoutineSection)
    }
    setNewSectionTitle('')
    setAddingSectionTitle(false)
  }

  async function renameSection(id: string) {
    if (!renameSectionText.trim()) return
    store.updateSection(id, { title: renameSectionText.trim() })
    try {
      await svc.updateRoutineSection(id, { title: renameSectionText.trim() })
    } catch {}
    setRenamingSectionId(null)
  }

  async function deleteSection(id: string) {
    store.removeSection(id)
    store.steps
      .filter((s) => s.section_id === id)
      .forEach((s) => store.removeStep(s.id))
    try {
      await svc.deleteRoutineSection(id)
    } catch {}
    setDeleteSectionId(null)
  }

  function reorderSteps(reordered: RoutineStep[]) {
    reordered.forEach((step, i) => {
      store.updateStep(step.id, { order_index: i })
      svc.updateRoutineStep(step.id, { order_index: i }).catch(() => {})
    })
  }

  function reorderSections(reordered: RoutineSection[]) {
    reordered.forEach((sec, i) => {
      store.updateSection(sec.id, { order_index: i })
      svc.updateRoutineSection(sec.id, { order_index: i }).catch(() => {})
    })
  }

  async function moveStepToSection(stepId: string, newSectionId: string | null) {
    store.updateStep(stepId, { section_id: newSectionId })
    try {
      await svc.updateRoutineStep(stepId, { section_id: newSectionId })
    } catch {}
  }

  async function addStep(sectionId: string | null) {
    if (!newStepTitle.trim()) return
    const rid = await ensureRoutineExists()
    const sectionSteps = store.steps.filter((s) =>
      sectionId ? s.section_id === sectionId : !s.section_id,
    )
    const row = {
      user_id: USER_ID,
      routine_id: rid,
      section_id: sectionId,
      title: newStepTitle.trim(),
      description: null,
      emoji: null,
      order_index: sectionSteps.length,
    }
    try {
      const r = await svc.insertRoutineStep({ ...row, id: crypto.randomUUID() })
      store.addStep(r)
    } catch {
      store.addStep({ ...row, id: crypto.randomUUID() } as RoutineStep)
    }
    setNewStepTitle('')
  }

  async function saveStep(id: string) {
    store.updateStep(id, {
      title: editStepData.title,
      description: editStepData.description || null,
      emoji: editStepData.emoji || null,
    })
    try {
      await svc.updateRoutineStep(id, {
        title: editStepData.title,
        description: editStepData.description || null,
        emoji: editStepData.emoji || null,
      })
    } catch {}
    setEditingStepId(null)
  }

  async function deleteStep(id: string) {
    store.removeStep(id)
    try {
      await svc.deleteRoutineStep(id)
    } catch {}
  }

  async function moveStepToSection(stepId: string, newSectionId: string | null) {
    store.updateStep(stepId, { section_id: newSectionId })
    try {
      await svc.updateRoutineStep(stepId, { section_id: newSectionId })
    } catch {}
  }

  function renderStep(step: RoutineStep) {
    if (editingStepId === step.id) {
      return (
        <Paper p="sm" radius="lg" withBorder>
          <Stack gap="xs">
            <Group gap="sm">
              <TextInput
                value={editStepData.emoji}
                onChange={(e) =>
                  setEditStepData((s) => ({ ...s, emoji: e.target.value }))
                }
                placeholder="emoji"
                w={60}
                size="xs"
                radius="lg"
              />
              <TextInput
                value={editStepData.title}
                onChange={(e) =>
                  setEditStepData((s) => ({ ...s, title: e.target.value }))
                }
                placeholder={STRINGS.STEP_TITLE}
                style={{ flex: 1 }}
                size="xs"
                radius="lg"
              />
            </Group>
            <TextInput
              value={editStepData.description}
              onChange={(e) =>
                setEditStepData((s) => ({ ...s, description: e.target.value }))
              }
              placeholder={STRINGS.DESCRIPTION_OPTIONAL}
              size="xs"
              radius="lg"
            />
            <Group gap="xs">
              <Button
                size="xs"
                radius="xl"
                color="teal"
                onClick={() => saveStep(step.id)}
              >
                {STRINGS.SAVE}
              </Button>
              <Button
                size="xs"
                radius="xl"
                variant="default"
                onClick={() => setEditingStepId(null)}
              >
                {STRINGS.CANCEL}
              </Button>
            </Group>
          </Stack>
        </Paper>
      )
    }

    return (
      <Group
        gap="sm"
        p="xs"
        style={{ borderRadius: 'var(--mantine-radius-lg)' }}
      >
        {step.emoji && <Text size="sm">{step.emoji}</Text>}
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={600}>
            {step.title}
          </Text>
          {step.description && (
            <Text size="xs" c="dimmed">
              {step.description}
            </Text>
          )}
        </Box>
        <ActionIcon
          variant="subtle"
          size="xs"
          onClick={() => {
            setEditingStepId(step.id)
            setEditStepData({
              title: step.title,
              description: step.description ?? '',
              emoji: step.emoji ?? '',
            })
          }}
        >
          <PencilSimple size={12} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="red"
          size="xs"
          onClick={() => deleteStep(step.id)}
        >
          <Trash size={12} />
        </ActionIcon>
      </Group>
    )
  }

  function AddStepInput({ sectionId }: { sectionId: string | null }) {
    const key = sectionId ?? '__none__'
    if (addingStepForSection === key) {
      return (
        <Group gap="xs">
          <TextInput
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addStep(sectionId)
              if (e.key === 'Escape') {
                setAddingStepForSection(null)
                setNewStepTitle('')
              }
            }}
            placeholder={STRINGS.ROUTINE_STEP_TITLE_PLACEHOLDER}
            size="xs"
            radius="lg"
            style={{ flex: 1 }}
            autoFocus
          />
          <Button
            size="xs"
            radius="xl"
            color="teal"
            onClick={() => addStep(sectionId)}
          >
            {STRINGS.ADD}
          </Button>
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => {
              setAddingStepForSection(null)
              setNewStepTitle('')
            }}
          >
            <X size={12} />
          </ActionIcon>
        </Group>
      )
    }

    return (
      <Button
        variant="subtle"
        color="teal"
        size="xs"
        radius="xl"
        leftSection={<Plus size={12} />}
        w="fit-content"
        onClick={() => {
          setAddingStepForSection(key)
          setNewStepTitle('')
        }}
      >
        {STRINGS.ROUTINE_ADD_STEP}
      </Button>
    )
  }

  return (
    <Stack gap="lg" p="md">
      {/* Header */}
      <Group justify="space-between">
        <Button
          variant="subtle"
          size="sm"
          leftSection={<CaretLeft size={14} />}
          onClick={async () => {
            await saveRoutineFields()
            navigate(-1)
          }}
        >
          {STRINGS.BACK_TO_ROUTINES}
        </Button>
        {resolvedId && (
          <Button
            variant="light"
            color="teal"
            radius="xl"
            size="sm"
            leftSection={<Play size={14} />}
            onClick={() => navigate(ROUTES.ROUTINE_RUN(resolvedId))}
          >
            {STRINGS.ROUTINE_RUN}
          </Button>
        )}
      </Group>

      {/* Routine name */}
      <TextInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveRoutineFields}
        placeholder={STRINGS.ROUTINE_NAME_PLACEHOLDER}
        variant="unstyled"
        fw={800}
        styles={{ input: { fontSize: 26, color: 'var(--mantine-color-text)' } }}
      />

      {/* Settings */}
      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="md">
          <TextInput
            label={STRINGS.ROUTINE_OUTCOME_LABEL}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            onBlur={saveRoutineFields}
            placeholder={STRINGS.ROUTINE_OUTCOME_PLACEHOLDER}
            radius="lg"
          />

          <Group grow>
            <Select
              label={STRINGS.TYPE}
              value={routineType}
              onChange={(v) => {
                if (v) {
                  setRoutineType(v as RoutineType)
                  saveRoutineFields()
                }
              }}
              data={Object.entries(ROUTINE_TYPE_LABEL).map(([k, v]) => ({
                value: k,
                label: v as string,
              }))}
              radius="lg"
            />
            <Select
              label={STRINGS.CADENCE}
              value={cadence}
              onChange={(v) => {
                if (v) {
                  setCadence(v as RoutineCadence)
                  saveRoutineFields()
                }
              }}
              data={Object.entries(CADENCE_LABEL).map(([k, v]) => ({
                value: k,
                label: v as string,
              }))}
              radius="lg"
            />
          </Group>

          {(cadence === ROUTINE_CADENCE.WEEKLY ||
            cadence === ROUTINE_CADENCE.BIWEEKLY) && (
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">
                {STRINGS.DAYS}
              </Text>
              <Group gap="xs">
                {DAYS_OF_WEEK.map((day, i) => (
                  <Badge
                    key={day}
                    variant={scheduleDays.includes(i) ? 'filled' : 'outline'}
                    color="teal"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const updated = scheduleDays.includes(i)
                        ? scheduleDays.filter((d) => d !== i)
                        : [...scheduleDays, i]
                      setScheduleDays(updated)
                      saveRoutineFields()
                    }}
                  >
                    {day}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          <Box>
            <Text size="xs" fw={600} c="dimmed" mb="xs">
              {STRINGS.THEME}
            </Text>
            <Group gap="sm">
              {ROUTINE_GRADIENTS.map((g, i) => (
                <Box
                  key={i}
                  w={32}
                  h={32}
                  style={{
                    borderRadius: '50%',
                    background: g,
                    cursor: 'pointer',
                    border:
                      gradient === i
                        ? '3px solid var(--mantine-color-teal-5)'
                        : '3px solid transparent',
                    transition: 'border 0.15s ease',
                  }}
                  onClick={() => {
                    setGradient(i)
                    saveRoutineFields()
                  }}
                />
              ))}
            </Group>
          </Box>
        </Stack>
      </Paper>

      {/* Steps editor */}
      <Paper p="lg" radius="xl" withBorder>
        <Stack gap="lg">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.ROUTINE_STEPS}
          </Text>

          <StepsEditor
            generalSteps={generalSteps}
            sections={sections}
            allSteps={store.steps.filter((s) => s.routine_id === resolvedId)}
            store={store}
            svc={svc}
            editingStepId={editingStepId}
            renderStep={renderStep}
            addingStepForSection={addingStepForSection}
            renamingSectionId={renamingSectionId}
            renameSectionText={renameSectionText}
            setRenameSectionText={setRenameSectionText}
            renameSection={renameSection}
            setRenamingSectionId={setRenamingSectionId}
            setDeleteSectionId={setDeleteSectionId}
            moveStepToSection={moveStepToSection}
          >
            {(sectionId: string | null) => <AddStepInput sectionId={sectionId} />}
          </StepsEditor>

          {addingStepForSection !== '__none__' && generalSteps.length === 0 && (
            <AddStepInput sectionId={null} />
          )}

          {addingSectionTitle ? (
            <Group gap="xs">
              <TextInput
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSection()
                  if (e.key === 'Escape') {
                    setAddingSectionTitle(false)
                    setNewSectionTitle('')
                  }
                }}
                placeholder={STRINGS.ROUTINE_SECTION_NAME_PLACEHOLDER}
                size="sm"
                radius="lg"
                style={{ flex: 1 }}
                autoFocus
              />
              <Button size="sm" radius="xl" color="teal" onClick={addSection}>
                {STRINGS.ADD}
              </Button>
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  setAddingSectionTitle(false)
                  setNewSectionTitle('')
                }}
              >
                <X size={14} />
              </ActionIcon>
            </Group>
          ) : (
            <Button
              variant="light"
              color="teal"
              radius="xl"
              size="sm"
              leftSection={<Plus size={14} />}
              w="fit-content"
              onClick={() => setAddingSectionTitle(true)}
            >
              {STRINGS.ROUTINE_ADD_SECTION}
            </Button>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={!!deleteSectionId}
        onClose={() => setDeleteSectionId(null)}
        title={STRINGS.DELETE}
        radius="xl"
        size="sm"
      >
        <Text size="sm" mb="lg">
          {STRINGS.ROUTINE_DELETE_SECTION_CONFIRM(
            sections.find((s) => s.id === deleteSectionId)?.title ?? '',
          )}
        </Text>
        <Group justify="flex-end">
          <Button
            variant="default"
            radius="xl"
            onClick={() => setDeleteSectionId(null)}
          >
            {STRINGS.CANCEL}
          </Button>
          <Button
            color="red"
            radius="xl"
            onClick={() => deleteSectionId && deleteSection(deleteSectionId)}
          >
            {STRINGS.DELETE}
          </Button>
        </Group>
      </Modal>
    </Stack>
  )
}

// ─── StepsEditor: single DndContext for cross-section drag ────────────────────

function SortableStepItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <Group gap={0} wrap="nowrap">
        <Box {...attributes} {...listeners} style={{ cursor: 'grab', padding: 4 }}>
          <DotsSixVertical size={14} color="var(--mantine-color-dimmed)" />
        </Box>
        <Box style={{ flex: 1 }}>{children}</Box>
      </Group>
    </Box>
  )
}

function SortableSectionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { type: 'section' } })
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      {typeof children === 'function' ? (children as any)({ dragHandleProps: { ...attributes, ...listeners } }) : children}
    </Box>
  )
}

interface StepsEditorProps {
  generalSteps: RoutineStep[]
  sections: RoutineSection[]
  allSteps: RoutineStep[]
  store: ReturnType<typeof useRoutineStore>
  svc: typeof import('../services/routineService')
  editingStepId: string | null
  renderStep: (step: RoutineStep) => React.ReactNode
  addingStepForSection: string | null
  renamingSectionId: string | null
  renameSectionText: string
  setRenameSectionText: (v: string) => void
  renameSection: (id: string) => void
  setRenamingSectionId: (id: string | null) => void
  setDeleteSectionId: (id: string | null) => void
  moveStepToSection: (stepId: string, sectionId: string | null) => void
  children: (sectionId: string | null) => React.ReactNode
}

function StepsEditor({
  generalSteps, sections, allSteps, store, svc,
  editingStepId, renderStep, addingStepForSection,
  renamingSectionId, renameSectionText, setRenameSectionText,
  renameSection, setRenamingSectionId, setDeleteSectionId,
  moveStepToSection, children: renderAddStep,
}: StepsEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Container IDs: '__general__' for unsectioned, section.id for each section, 'sections-list' for section ordering
  const GENERAL_CONTAINER = '__general__'

  const stepsByContainer = useMemo(() => {
    const map: Record<string, RoutineStep[]> = { [GENERAL_CONTAINER]: generalSteps }
    sections.forEach((sec) => {
      map[sec.id] = allSteps
        .filter((s) => s.section_id === sec.id)
        .sort((a, b) => a.order_index - b.order_index)
    })
    return map
  }, [generalSteps, sections, allSteps])

  function findContainer(id: string): string | null {
    // Is it a section id?
    if (id === GENERAL_CONTAINER || sections.some((s) => s.id === id)) return id
    // Is it a step? Find which container it's in
    for (const [containerId, steps] of Object.entries(stepsByContainer)) {
      if (steps.some((s) => s.id === id)) return containerId
    }
    return null
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id as string)
    const overContainer = findContainer(over.id as string)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    // Moving a step to a different container
    const newSectionId = overContainer === GENERAL_CONTAINER ? null : overContainer
    moveStepToSection(active.id as string, newSectionId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Check if we're reordering sections
    const isSectionDrag = sections.some((s) => s.id === active.id) && sections.some((s) => s.id === over.id)
    if (isSectionDrag) {
      const oldIdx = sections.findIndex((s) => s.id === active.id)
      const newIdx = sections.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(sections, oldIdx, newIdx)
      reordered.forEach((sec, i) => {
        store.updateSection(sec.id, { order_index: i })
        svc.updateRoutineSection(sec.id, { order_index: i }).catch(() => {})
      })
      return
    }

    // Reordering steps within same container
    const container = findContainer(active.id as string)
    if (!container) return
    const steps = stepsByContainer[container] ?? []
    const oldIdx = steps.findIndex((s) => s.id === active.id)
    const newIdx = steps.findIndex((s) => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(steps, oldIdx, newIdx)
    reordered.forEach((step, i) => {
      store.updateStep(step.id, { order_index: i })
      svc.updateRoutineStep(step.id, { order_index: i }).catch(() => {})
    })
  }

  const sectionIds = sections.map((s) => s.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* General (unsectioned) steps */}
      {(generalSteps.length > 0 || addingStepForSection === '__general__' || addingStepForSection === '__none__') && (
        <Stack gap="sm">
          <Text size="xs" fw={600} c="dimmed">General</Text>
          <SortableContext items={generalSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {generalSteps.map((step) => (
              <SortableStepItem key={step.id} id={step.id}>
                {renderStep(step)}
              </SortableStepItem>
            ))}
          </SortableContext>
          {renderAddStep(null)}
        </Stack>
      )}

      {/* Sections — sortable among themselves */}
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {sections.map((sec) => {
          const secSteps = stepsByContainer[sec.id] ?? []
          return (
            <SortableSectionItem key={sec.id} id={sec.id}>
              {({ dragHandleProps }: { dragHandleProps: Record<string, any> }) => (
              <Stack gap="sm">
                <Group gap="xs">
                  <Box {...dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: 2 }}>
                    <DotsSixVertical size={14} color="var(--mantine-color-dimmed)" />
                  </Box>
                  <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-default-border)' }} />
                  {renamingSectionId === sec.id ? (
                    <TextInput
                      value={renameSectionText}
                      onChange={(e) => setRenameSectionText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') renameSection(sec.id); if (e.key === 'Escape') setRenamingSectionId(null) }}
                      onBlur={() => renameSection(sec.id)}
                      size="xs"
                      autoFocus
                    />
                  ) : (
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">{sec.title}</Text>
                  )}
                  <ActionIcon variant="subtle" size="xs" onClick={() => { setRenamingSectionId(sec.id); setRenameSectionText(sec.title) }}>
                    <PencilSimple size={10} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="xs" onClick={() => setDeleteSectionId(sec.id)}>
                    <Trash size={10} />
                  </ActionIcon>
                  <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-default-border)' }} />
                </Group>
                {/* Steps within this section */}
                <SortableContext items={secSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {secSteps.map((step) => (
                    <SortableStepItem key={step.id} id={step.id}>
                      {renderStep(step)}
                    </SortableStepItem>
                  ))}
                </SortableContext>
                {renderAddStep(sec.id)}
              </Stack>
              )}
            </SortableSectionItem>
          )
        })}
      </SortableContext>
    </DndContext>
  )
}
