// @ts-nocheck
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGrowthStore } from '../store/growthStore'
import * as routineSvc from '../../routines/services/routineService'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'
import {
  DATE_FORMAT,
  TASK_STATUS,
  TYPE_LABEL,
} from '../../tasks/constants/taskConstants'
import { STRINGS } from '../../tasks/constants/strings'
import {
  ArrowRight,
  DotsThree,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { ROUTES } from '../../../app/routes'
import { useRoutineData } from '../../routines/hooks/useRoutineData'
import { useRoutineStore } from '../../routines/hooks/useRoutineStore'
import {
  ROUTINE_GRADIENTS,
  ROUTINE_TYPE,
  ROUTINE_TYPE_EMOJI,
} from '../../routines/constants'
import { format, parseISO } from 'date-fns'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { BOOK_STATUS, GROWTH_STRINGS, YEARLY_BOOK_GOAL } from '../constants'
import { Routine } from '../../routines/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWinText(sessions: number, books: number): string {
  const parts: string[] = []
  if (sessions > 0) parts.push(`${sessions} ${STRINGS.SESSIONS_COMPLETED}`)
  if (books > 0)
    parts.push(
      `${books} ${books === 1 ? STRINGS.BOOK_IN_MIND : STRINGS.BOOKS_IN_MIND}`,
    )
  return parts.join(GROWTH_STRINGS.SESSIONS_AND_BOOKS_SEPARATOR)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WinBanner({ sessions, books }: { sessions: number; books: number }) {
  if (sessions === 0 && books === 0) return null
  return (
    <Paper p="md" radius="xl" withBorder>
      <Group gap="sm">
        <Text size="xl">{GROWTH_STRINGS.WIN_EMOJI}</Text>
        <Text fw={600} size="sm">
          {buildWinText(sessions, books)}
        </Text>
      </Group>
    </Paper>
  )
}

function LearningCard({
  routine,
  onNavigate,
  onEdit,
  onDelete,
}: {
  routine: Routine
  onNavigate: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const routineStore = useRoutineStore()
  const steps = routineStore.steps.filter((s) => s.routine_id === routine.id)
  const sessions = routineStore.sessions.filter(
    (s) => s.routine_id === routine.id,
  )
  const lastSession = sessions
    .filter((s) => s.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))[0]
  const totalRuns = sessions.filter((s) => s.completed_at).length
  const gradient = ROUTINE_GRADIENTS[routine.gradient ?? 0]

  return (
    <Box pos="relative">
      <UnstyledButton onClick={onNavigate} w="100%" display="block">
        <Box
          p="lg"
          style={{
            background: gradient,
            borderRadius: 'var(--mantine-radius-xl)',
            minHeight: 160,
          }}
        >
          <Stack gap="sm" h="100%">
            <Text fz={36}>{ROUTINE_TYPE_EMOJI[routine.type] ?? '📚'}</Text>
            <Text fw={700} c="white" size="md" lh={1.3}>
              {routine.title}
            </Text>
            {routine.outcome && (
              <Text size="xs" c="white" opacity={0.65} lineClamp={2}>
                {routine.outcome}
              </Text>
            )}
            <Box mt="auto">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="white" opacity={0.7}>
                  {steps.length} {STRINGS.ROUTINE_STEPS}
                </Text>
                <Text size="xs" c="white" opacity={0.5}>
                  {totalRuns > 0
                    ? `${totalRuns} ${STRINGS.RUNS}`
                    : STRINGS.NOT_STARTED}
                </Text>
              </Group>
              {lastSession?.completed_at && (
                <Text size="xs" c="white" opacity={0.5}>
                  {STRINGS.ROUTINE_LAST_DONE}{' '}
                  {format(
                    parseISO(lastSession.completed_at),
                    DATE_FORMAT.SHORT,
                  )}
                </Text>
              )}
            </Box>
          </Stack>
        </Box>
      </UnstyledButton>

      <Box pos="absolute" top={12} right={12}>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              variant="white"
              size="sm"
              radius="xl"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsThree size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<PencilSimple size={14} />}
              onClick={onEdit}
            >
              {STRINGS.EDIT}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<Trash size={14} />}
              color="red"
              onClick={onDelete}
            >
              {STRINGS.DELETE}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  )
}

function _AddRoadmapCard({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton onClick={onClick} w="100%">
      <Paper
        p="lg"
        radius="xl"
        withBorder
        style={{
          minHeight: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderStyle: 'dashed',
        }}
      >
        <Stack align="center" gap="xs">
          <Plus size={24} color="var(--mantine-color-teal-5)" />
          <Text size="sm" c="teal" fw={600}>
            {STRINGS.ADD_ROADMAP}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  )
}

function BookProgressCard({
  doneBooks,
  year,
  onViewAll,
}: {
  doneBooks: number
  year: number
  onViewAll: () => void
}) {
  return (
    <Paper p="lg" radius="xl" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {STRINGS.BOOKS} · {year}
          </Text>
          <Badge variant="light" color="teal" size="xs">
            {doneBooks}/{YEARLY_BOOK_GOAL}
          </Badge>
        </Group>
        <Button
          variant="subtle"
          color="teal"
          size="xs"
          radius="xl"
          rightSection={<ArrowRight size={12} />}
          onClick={onViewAll}
        >
          {STRINGS.VIEW_ALL}
        </Button>
      </Group>
      <Progress
        value={(doneBooks / YEARLY_BOOK_GOAL) * 100}
        color="teal"
        radius="xl"
        size="sm"
        styles={{ root: { backgroundColor: 'rgba(255,255,255,0.1)' } }}
      />
      <Text size="xs" c="dimmed" mt={6}>
        {YEARLY_BOOK_GOAL - doneBooks} {STRINGS.BOOKS_REMAINING}
      </Text>
    </Paper>
  )
}

function TodayLearningCard({
  tasks,
  onViewAll,
}: {
  tasks: { id: string; title: string; type: string }[]
  onViewAll: () => void
}) {
  if (!tasks.length) return null
  return (
    <Paper p="lg" radius="xl" withBorder>
      <Group justify="space-between" mb="sm">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {STRINGS.LEARNING_TODAY}
        </Text>
        <Button
          variant="subtle"
          color="teal"
          size="xs"
          radius="xl"
          rightSection={<ArrowRight size={12} />}
          onClick={onViewAll}
        >
          {STRINGS.VIEW_ALL}
        </Button>
      </Group>
      <Stack gap="xs">
        {tasks.map((t) => (
          <Group
            key={t.id}
            gap="sm"
            p="xs"
            style={{
              borderRadius: 'var(--mantine-radius-lg)',
              background: 'var(--mantine-color-dark-6)',
            }}
          >
            <Box
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                background: 'var(--mantine-color-teal-5)',
                flexShrink: 0,
              }}
            />
            <Text size="sm" fw={600} style={{ flex: 1 }}>
              {t.title}
            </Text>
            <Badge variant="light" color="teal" size="xs">
              {TYPE_LABEL[t.type as keyof typeof TYPE_LABEL] ?? t.type}
            </Badge>
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GrowthOverview() {
  useRoutineData()
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const routineStore = useRoutineStore()
  const { books, loading: booksLoading } = useGrowthStore()
  const navigate = useNavigate()

  const learningRoutines = useMemo(
    () =>
      routineStore.routines
        .filter((r) => r.type === ROUTINE_TYPE.LEARNING && r.is_active)
        .sort((a, b) => a.order_index - b.order_index),
    [routineStore.routines],
  )

  const year = new Date().getFullYear()
  const doneBooks = books.filter(
    (b) => b.year === year && b.status === BOOK_STATUS.DONE,
  ).length

  const totalStepsDone = useMemo(() => {
    const learningIds = new Set(learningRoutines.map((r) => r.id))
    return routineStore.sessions.filter(
      (s) => learningIds.has(s.routine_id) && s.completed_at,
    ).length
  }, [learningRoutines, routineStore.sessions])

  const todayLearning = useMemo(() => {
    const todayStr = format(new Date(), DATE_FORMAT.API)
    return tasks.filter(
      (t) =>
        t.is_learning &&
        t.due_date === todayStr &&
        t.status === TASK_STATUS.TODO,
    )
  }, [tasks])

  if (routineStore.loading || booksLoading) return <SkeletonRow count={6} />

  return (
    <Stack gap="lg">
      <WinBanner sessions={totalStepsDone} books={doneBooks} />

      {/* Learning roadmaps */}
      <Group justify="space-between" align="center">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {STRINGS.LEARNING_AREAS}
        </Text>
        <Button
          variant="light"
          color="teal"
          radius="xl"
          size="sm"
          leftSection={<Plus size={14} />}
          onClick={() => navigate(ROUTES.ROUTINE_NEW_EDIT)}
        >
          {STRINGS.NEW_ROADMAP}
        </Button>
      </Group>

      <SimpleGrid cols={2} spacing="md">
        {learningRoutines.map((r) => (
          <LearningCard
            key={r.id}
            routine={r}
            onNavigate={() => navigate(ROUTES.ROUTINE_RUN(r.id))}
            onEdit={() => navigate(ROUTES.ROUTINE_EDIT(r.id))}
            onDelete={async () => {
              routineStore.removeRoutine(r.id)
              try {
                await routineSvc.deleteRoutine(r.id)
              } catch {}
            }}
          />
        ))}
      </SimpleGrid>

      <BookProgressCard
        doneBooks={doneBooks}
        year={year}
        onViewAll={() => navigate(ROUTES.GROWTH_BOOKS)}
      />

      <TodayLearningCard
        tasks={todayLearning}
        onViewAll={() => navigate(ROUTES.GROWTH_CALENDAR)}
      />
    </Stack>
  )
}
