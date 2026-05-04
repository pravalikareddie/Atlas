// ─── RoutineRunView.tsx ────────────────────────────────────────────────────────

import { useNavigate, useParams } from 'react-router-dom'
import { useRoutineData } from '../hooks/useRoutineData'
import { useRoutineStore } from '../hooks/useRoutineStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RoutineSession } from '../types/routine.types'
import { ROUTINE_GRADIENTS, ROUTINE_TYPE } from '../constants'
import {
  Box,

  Group,
  ScrollArea,
  Stack,
  Text,
  Transition,
  UnstyledButton,
} from '@mantine/core'
import { format } from 'date-fns'
import { STRINGS } from '../../tasks/constants/strings'
import {
  ArrowLeft,
  CaretLeft,
  Check,
  SkipForward,
} from '@phosphor-icons/react'
import { DATE_FORMAT } from '../../tasks/constants/taskConstants'
import * as svc from '../services/routineService'
import { COLORS, RADIUS_PILL } from '../../../shared/constants/styles'

const S = {
  root: (gradient: string) => ({
    margin: 'calc(-1 * var(--mantine-spacing-xl))',
    minHeight: '100vh',
    background: gradient,
  }),
  overlay: (gradient: string) => ({
    position: 'fixed' as const,
    inset: 0,
    background: gradient,
    filter: 'brightness(1.15)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  }),
  content: {
    paddingTop: 64,
    paddingBottom: 40,
  },
  progressTrack: {
    borderRadius: RADIUS_PILL,
    background: COLORS.WHITE_15,
    overflow: 'hidden',
  },
  progressFill: (pct: number) => ({
    borderRadius: RADIUS_PILL,
    background: COLORS.WHITE_75,
    width: `${pct}%`,
    transition: 'width 0.5s ease',
  }),
  stepCard: (isCurrent: boolean, isDone: boolean) => ({
    padding: '14px 16px',
    borderRadius: 16,
    border: `1px solid ${isCurrent ? COLORS.WHITE_25 : COLORS.WHITE_08}`,
    background: isCurrent
      ? COLORS.WHITE_12
      : isDone
        ? COLORS.WHITE_05
        : COLORS.WHITE_04,
    transition: 'all 0.3s ease',
  }),
  stepCardUpcoming: {
    opacity: 0.45,
  },
  stepEmoji: (hasEmoji: boolean, isDone: boolean) => ({
    fontSize: hasEmoji ? 22 : 16,
    lineHeight: 1,
    marginTop: 2,
    flexShrink: 0,
    opacity: isDone ? 0.5 : 1,
  }),
  stepTitle: (isDone: boolean) => ({
    fontSize: 15,
    opacity: isDone ? 0.55 : 1,
    lineHeight: 1.3,
  }),
  btnDone: {
    background: COLORS.WHITE_90,
    borderRadius: RADIUS_PILL,
    padding: '5px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  btnSkip: {
    background: COLORS.WHITE_08,
    border: `1px solid ${COLORS.WHITE_20}`,
    borderRadius: RADIUS_PILL,
    padding: '5px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btnBack: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.WHITE_08,
    border: `1px solid ${COLORS.WHITE_15}`,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    background: COLORS.WHITE_15,
  },
  outcomeBorder: {
    borderTop: `1px solid ${COLORS.WHITE_10}`,
    paddingTop: 20,
  },
}

export function RoutineRunView() {
  useRoutineData()
  const { routineId } = useParams<{ routineId: string }>()
  const navigate = useNavigate()
  const store = useRoutineStore()

  const routine = store.routines.find((r) => r.id === routineId)
  const sections = store.sections
    .filter((s) => s.routine_id === routineId)
    .sort((a, b) => a.order_index - b.order_index)
  const allSteps = store.steps
    .filter((s) => s.routine_id === routineId)
    .sort((a, b) => a.order_index - b.order_index)

  const [session, setSession] = useState<RoutineSession | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (completeTimerRef.current) clearTimeout(completeTimerRef.current) }
  }, [])

  const orderedSteps = useMemo(
    () => [
      ...allSteps.filter((s) => !s.section_id),
      ...sections.flatMap((sec) =>
        allSteps.filter((s) => s.section_id === sec.id),
      ),
    ],
    [sections, allSteps],
  )

  const stepsDone = session?.steps_done ?? []
  const stepsSkipped = session?.steps_skipped ?? []
  const completedIds = new Set([...stepsDone, ...stepsSkipped])
  const currentStep = orderedSteps.find((s) => !completedIds.has(s.id))
  const currentIndex = currentStep
    ? orderedSteps.indexOf(currentStep)
    : orderedSteps.length
  const totalSteps = orderedSteps.length
  const progressPct = totalSteps > 0 ? (currentIndex / totalSteps) * 100 : 0

  useEffect(() => {
    if (!routineId) return
    const today = format(new Date(), DATE_FORMAT.API)
    const existing = store.sessions.find(
      (s) =>
        s.routine_id === routineId &&
        s.started_at.startsWith(today) &&
        !s.completed_at,
    )
    if (existing) {
      setSession(existing)
    } else {
      const s: RoutineSession = {
        id: crypto.randomUUID(),
        routine_id: routineId,
        started_at: new Date().toISOString(),
        completed_at: null,
        steps_done: [],
        steps_skipped: [],
      }
      setSession(s)
      store.upsertSession(s)
      svc.insertRoutineSession(s).catch(() => {})
    }
  }, [routineId])

  async function updateSession(updates: Partial<RoutineSession>) {
    if (!session) return
    const updated = { ...session, ...updates }
    setSession(updated)
    store.upsertSession(updated)
    try {
      await svc.updateRoutineSession(session.id, updates)
    } catch {}
  }

  async function checkAndComplete(done: string[], skipped: string[]) {
    if (orderedSteps.every((s) => new Set([...done, ...skipped]).has(s.id)))
      await completeRoutine()
  }

  async function markDone(stepId: string) {
    if (!session) return
    const newDone = [...session.steps_done, stepId]
    await updateSession({ steps_done: newDone })
    await checkAndComplete(newDone, session.steps_skipped)
  }

  async function markSkip(stepId: string) {
    if (!session) return
    const newSkipped = [...session.steps_skipped, stepId]
    await updateSession({ steps_skipped: newSkipped })
    await checkAndComplete(session.steps_done, newSkipped)
  }

  async function goBack() {
    if (!session || currentIndex === 0) return
    const prev = orderedSteps[currentIndex - 1]
    if (!prev) return
    await updateSession({
      steps_done: session.steps_done.filter((id) => id !== prev.id),
      steps_skipped: session.steps_skipped.filter((id) => id !== prev.id),
    })
  }

  async function completeRoutine() {
    const now = new Date().toISOString()
    const today = format(new Date(), DATE_FORMAT.API)
    await updateSession({ completed_at: now })
    store.updateRoutine(routineId!, { last_done: today })
    try {
      await svc.updateRoutine(routineId!, { last_done: today })
    } catch {}
    setShowComplete(true)
    completeTimerRef.current = setTimeout(() => navigate(-1), 2500)
  }

  if (!routine) return null
  const gradient = ROUTINE_GRADIENTS[routine.gradient ?? 0]

  return (
    <Box style={S.root(gradient)}>
      <Transition mounted={showComplete} transition="fade" duration={500}>
        {(styles) => (
          <Box style={{ ...styles, ...S.overlay(gradient) }}>
            <Text style={{ fontSize: 56 }}>✨</Text>
            <Text
              fw={800}
              c="white"
              ta="center"
              style={{ fontSize: 28, letterSpacing: '-0.3px' }}
            >
              {STRINGS.ROUTINE_COMPLETE_TITLE}
            </Text>
            {routine.outcome && (
              <Text
                c="white"
                ta="center"
                lh={1.7}
                size="md"
                style={{ opacity: 0.8, maxWidth: 300 }}
              >
                {routine.outcome}
              </Text>
            )}
          </Box>
        )}
      </Transition>

      <ScrollArea h="100vh">
        <Box maw={620} mx="auto" px="xl" style={S.content}>
          <Group justify="space-between" mb={4}>
            <Text fw={700} c="white" style={{ fontSize: 20 }}>
              {routine.title}
            </Text>
            <UnstyledButton
              onClick={() =>
                navigate(
                  routine.type === ROUTINE_TYPE.LEARNING
                    ? '/growth/learning'
                    : '/growth/routines',
                )
              }
            >
              <Group gap={5}>
                <CaretLeft
                  size={14}
                  color={COLORS.WHITE_60}
                  weight="bold"
                />
                <Text size="sm" c="white" style={{ opacity: 0.6 }}>
                  {STRINGS.BACK_TO_ROUTINES}
                </Text>
              </Group>
            </UnstyledButton>
          </Group>

          <Text size="sm" c="white" mb="sm" style={{ opacity: 0.45 }}>
            {currentIndex} of {totalSteps} steps
          </Text>

          <Box mb="xl" h={2} style={S.progressTrack}>
            <Box h={2} style={S.progressFill(progressPct)} />
          </Box>

          <Stack gap={0}>
            {orderedSteps.map((step, idx) => {
              const isDone = stepsDone.includes(step.id)
              const isSkipped = stepsSkipped.includes(step.id)
              const isCurrent = step.id === currentStep?.id
              const isUpcoming = !isDone && !isCurrent && !isSkipped
              const sec = step.section_id
                ? sections.find((s) => s.id === step.section_id)
                : null
              const prevSec =
                idx > 0 && orderedSteps[idx - 1].section_id
                  ? sections.find(
                      (s) => s.id === orderedSteps[idx - 1].section_id,
                    )
                  : null
              const showSection = sec && sec.id !== prevSec?.id

              return (
                <Box key={step.id}>
                  {showSection && sec && (
                    <Group gap="sm" my="md">
                      <Box style={S.sectionLine} />
                      <Text
                        size="xs"
                        fw={700}
                        tt="uppercase"
                        lts="1.5px"
                        c="white"
                        style={{ opacity: 0.4 }}
                      >
                        {sec.title}
                      </Text>
                      <Box style={S.sectionLine} />
                    </Group>
                  )}

                  <Box
                    mb="sm"
                    style={{
                      ...S.stepCard(isCurrent, isDone),
                      ...(isUpcoming ? S.stepCardUpcoming : {}),
                    }}
                  >
                    <Group gap={12} align="flex-start" wrap="nowrap">
                      <Text style={S.stepEmoji(!!step.emoji, isDone)}>
                        {isDone ? '✓' : isSkipped ? '⤭' : step.emoji || '·'}
                      </Text>
                      <Box style={{ flex: 1 }}>
                        <Text
                          fw={isCurrent ? 700 : 500}
                          c="white"
                          td={isSkipped ? 'line-through' : undefined}
                          style={S.stepTitle(isDone)}
                        >
                          {step.title}
                        </Text>
                        {step.description && (
                          <Text
                            size="sm"
                            c="white"
                            lh={1.5}
                            mt={3}
                            style={{ opacity: 0.5 }}
                          >
                            {step.description}
                          </Text>
                        )}
                        {isCurrent && (
                          <Group gap={8} mt={12}>
                            <UnstyledButton
                              onClick={() => markDone(step.id)}
                              style={S.btnDone}
                            >
                              <Check
                                size={11}
                                weight="bold"
                                color={COLORS.DARK_TEXT_70}
                              />
                              <Text
                                size="xs"
                                fw={700}
                                style={{ color: COLORS.DARK_TEXT_75 }}
                              >
                                {STRINGS.ROUTINE_DONE}
                              </Text>
                            </UnstyledButton>
                            <UnstyledButton
                              onClick={() => markSkip(step.id)}
                              style={S.btnSkip}
                            >
                              <SkipForward
                                size={11}
                                color={COLORS.WHITE_60}
                              />
                              <Text
                                size="xs"
                                fw={600}
                                c="white"
                                style={{ opacity: 0.7 }}
                              >
                                {STRINGS.ROUTINE_SKIP}
                              </Text>
                            </UnstyledButton>
                            {currentIndex > 0 && (
                              <UnstyledButton
                                onClick={goBack}
                                style={S.btnBack}
                              >
                                <ArrowLeft
                                  size={12}
                                  color={COLORS.WHITE_70}
                                />
                              </UnstyledButton>
                            )}
                          </Group>
                        )}
                      </Box>
                    </Group>
                  </Box>
                </Box>
              )
            })}
          </Stack>

          {routine.outcome && (
            <Box mt="xl" style={S.outcomeBorder}>
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                lts="1px"
                c="white"
                mb={8}
                style={{ opacity: 0.35 }}
              >
                {STRINGS.WHEN_THIS_IS_DONE}
              </Text>
              <Text size="sm" c="white" lh={1.7} style={{ opacity: 0.7 }}>
                {routine.outcome}
              </Text>
            </Box>
          )}
        </Box>
      </ScrollArea>
    </Box>
  )
}
