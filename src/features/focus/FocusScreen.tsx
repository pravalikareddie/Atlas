import { useNavigate } from 'react-router-dom'
import { useTaskActions } from '../tasks/hooks/useTaskActions'
import { useTaskData } from '../tasks/hooks/useTaskData'
import { useTaskStore } from '../tasks/store/taskStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TASK_STATUS, TYPE_COLOR } from '../tasks/constants/taskConstants'
import { callClaude } from '../../lib/anthropic'
import {

  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { STRINGS } from '../tasks/constants/strings'
import { ROUTES } from '../../app/routes'
import { CaretLeft } from '@phosphor-icons/react'
import ReactPlayer from 'react-player'
type FocusPhase = 'pre' | 'running' | 'drifted' | 'finished' | 'result'

const TIMER_OPTIONS = [10, 25, 45, 60, 90] as const

export function FocusScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { update } = useTaskActions()
  const navigate = useNavigate()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [commitment, setCommitment] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [minutes, setMinutes] = useState(25)
  const [customMinutes, setCustomMinutes] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [phase, setPhase] = useState<FocusPhase>('pre')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [driftCount, setDriftCount] = useState(0)
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [finishChoice, setFinishChoice] = useState<
    'yes' | 'more' | 'away' | null
  >(null)
  const [playing, setPlaying] = useState(true)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const todayTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === TASK_STATUS.TODO &&
            !t.parent_task_id &&
            !t.is_learning,
        )
        .sort((a, b) => {
          if (a.is_must && !b.is_must) return -1
          if (!a.is_must && b.is_must) return 1
          return 0
        }),
    [tasks],
  )

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)
  const actualMinutes = showCustom ? parseInt(customMinutes) || 25 : minutes
  const canStart = commitment.trim().length > 0 && selectedTaskId !== null

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setPhase('finished')
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase])

  function start(mins?: number) {
    const secs = (mins ?? actualMinutes) * 60
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setDriftCount(0)
    setPhase('running')
  }

  function goBack() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('pre')
  }

  function drift() {
    setDriftCount((d) => d + 1)
    setPhase('drifted')
  }

  function imBack() {
    setPhase('running')
  }

  async function handleFinish(choice: 'yes' | 'more' | 'away') {
    setFinishChoice(choice)
    if (choice === 'yes') {
      setPhase('result')
      setAiLoading(true)
      const prompt = `You are Atlas, a warm personal assistant. The user just finished a focus session. Be warm and specific. Max 2 sentences. Task: "${selectedTask?.title}" (${selectedTask?.type}). Commitment: "${commitment}". Drifted ${driftCount} time${driftCount !== 1 ? 's' : ''}. Due: ${selectedTask?.due_date ?? 'no date'}.`
      try {
        const msg = await callClaude(prompt, 100)
        setAiMessage(msg || 'Great work finishing what you committed to.')
      } catch {
        setAiMessage('Great work finishing what you committed to.')
      } finally {
        setAiLoading(false)
      }
      if (selectedTaskId) {
        update(selectedTaskId, {
          status: TASK_STATUS.DONE,
          completed_at: new Date().toISOString(),
        })
      }
    } else if (choice === 'more') {
      setPhase('pre')
    } else {
      setPhase('result')
    }
  }

  const progressPct =
    totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // ── PRE-START ──────────────────────────────────────────────────────────────
  if (phase === 'pre') {
    return (
      <Stack gap="lg" maw={560} mx="auto">
        <Box
          p="xl"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
            borderRadius: 'var(--mantine-radius-xl)',
          }}
        >
          <Text fw={800} c="white" style={{ fontSize: 28 }}>
            🎯 {STRINGS.NAV_FOCUS}
          </Text>
          <Text size="sm" c="white" opacity={0.8} mt={4}>
            {STRINGS.FOCUS_SUBTITLE}
          </Text>
        </Box>

        <Paper p="lg" radius="xl" withBorder>
          <Stack gap="lg">
            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                {STRINGS.FOCUS_TASK}
              </Text>
              <Stack gap="xs">
                {todayTasks.slice(0, 8).map((t) => (
                  <UnstyledButton
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    style={{ width: '100%' }}
                  >
                    <Box
                      p="sm"
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        background:
                          selectedTaskId === t.id
                            ? 'var(--mantine-color-teal-light)'
                            : 'var(--mantine-color-gray-0)',
                        border:
                          selectedTaskId === t.id
                            ? '2px solid var(--mantine-color-teal-4)'
                            : '2px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Group gap="sm">
                        <Box
                          w={4}
                          style={{
                            alignSelf: 'stretch',
                            borderRadius: 9999,
                            backgroundColor: `var(--mantine-color-${TYPE_COLOR[t.type] ?? 'teal'}-5)`,
                            minHeight: 16,
                            flexShrink: 0,
                          }}
                        />
                        <Text
                          size="sm"
                          fw={selectedTaskId === t.id ? 700 : 500}
                          c={
                            selectedTaskId === t.id
                              ? 'teal'
                              : 'var(--mantine-color-text)'
                          }
                          style={{ flex: 1 }}
                        >
                          {t.title}
                        </Text>
                        {t.is_must && (
                          <Badge variant="urgent" size="xs">
                            {STRINGS.MUST}
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  </UnstyledButton>
                ))}
              </Stack>
            </Box>

            <TextInput
              label={STRINGS.FOCUS_COMMITMENT_LABEL}
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder={STRINGS.FOCUS_COMMITMENT_PLACEHOLDER}
              radius="lg"
            />

            <TextInput
              label={STRINGS.FOCUS_MUSIC_LABEL}
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={STRINGS.FOCUS_MUSIC_PLACEHOLDER}
              radius="lg"
            />

            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                {STRINGS.FOCUS_DURATION}
              </Text>
              <Group gap="xs" wrap="wrap">
                {TIMER_OPTIONS.map((m) => (
                  <UnstyledButton
                    key={m}
                    onClick={() => {
                      setMinutes(m)
                      setShowCustom(false)
                    }}
                  >
                    <Box
                      px="md"
                      py="xs"
                      style={{
                        borderRadius: 'var(--mantine-radius-xl)',
                        background:
                          minutes === m && !showCustom
                            ? 'var(--mantine-color-teal-light)'
                            : 'var(--mantine-color-gray-0)',
                        border:
                          minutes === m && !showCustom
                            ? '2px solid var(--mantine-color-teal-4)'
                            : '2px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Text
                        size="sm"
                        fw={700}
                        c={minutes === m && !showCustom ? 'teal' : 'dimmed'}
                      >
                        {m}m
                      </Text>
                    </Box>
                  </UnstyledButton>
                ))}
                <UnstyledButton onClick={() => setShowCustom(true)}>
                  <Box
                    px="md"
                    py="xs"
                    style={{
                      borderRadius: 'var(--mantine-radius-xl)',
                      background: showCustom
                        ? 'var(--mantine-color-teal-light)'
                        : 'var(--mantine-color-gray-0)',
                      border: showCustom
                        ? '2px solid var(--mantine-color-teal-4)'
                        : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Text size="sm" fw={700} c={showCustom ? 'teal' : 'dimmed'}>
                      {STRINGS.FOCUS_CUSTOM}
                    </Text>
                  </Box>
                </UnstyledButton>
              </Group>
              {showCustom && (
                <TextInput
                  mt="xs"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder={STRINGS.FOCUS_CUSTOM_PLACEHOLDER}
                  type="number"
                  radius="lg"
                  w={120}
                />
              )}
            </Box>
          </Stack>
        </Paper>

        <Button
          variant="gradient"
          gradient={{ from: 'teal', to: 'blue' }}
          radius="xl"
          size="lg"
          disabled={!canStart}
          onClick={() => start()}
          style={{ height: 56 }}
        >
          {STRINGS.FOCUS_START}
        </Button>
      </Stack>
    )
  }

// ── RUNNING / DRIFTED ─────────────────────────────────────────────────────
if (phase === 'running' || phase === 'drifted') {
  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 40px',
        zIndex: 200,
      }}
    >
      {/* Hidden audio player */}
      {mediaUrl && ReactPlayer.canPlay(mediaUrl) && (
        <ReactPlayer
          url={mediaUrl}
          playing={playing && phase === 'running'}
          loop
          width={0}
          height={0}
          style={{ position: 'absolute', visibility: 'hidden' }}
        />
      )}

      {/* Header */}
      <Group justify="space-between" w="100%" maw={600}>
        <Button
          variant="transparent" c="white" size="sm"
          leftSection={<CaretLeft size={14} />}
          onClick={goBack} style={{ opacity: 0.4 }}
        >
          {STRINGS.BACK}
        </Button>
        {driftCount > 0 && (
          <Text size="xs" c="white" opacity={0.3}>
            {driftCount} {STRINGS.FOCUS_DRIFTS}
          </Text>
        )}
      </Group>

      {/* Commitment */}
      <Box ta="center" maw={500} px="md">
        <Text
          size="sm" c="white"
          fw={phase === 'drifted' ? 700 : 400}
          style={{
            opacity: phase === 'drifted' ? 1 : 0.5,
            transition: 'all 0.3s ease',
            animation: phase === 'drifted' ? 'pulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          {commitment}
        </Text>
      </Box>

      {/* Music disc */}
      {mediaUrl && ReactPlayer.canPlay(mediaUrl) && (
        <Box ta="center">
          <Box
            style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(29,185,84,0.4), rgba(29,185,84,0.15), rgba(29,185,84,0.3), rgba(29,185,84,0.1), rgba(29,185,84,0.4))',
              border: '2px solid rgba(29,185,84,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              animation: phase === 'running' && playing ? 'spin 4s linear infinite' : 'none',
              boxShadow: '0 0 20px rgba(29,185,84,0.2)',
            }}
          >
            <Box style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#0a0a1a',
              border: '2px solid rgba(29,185,84,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box w={8} h={8} style={{ borderRadius: '50%', background: 'rgba(29,185,84,0.8)' }} />
            </Box>
          </Box>

          <Group gap="xs" justify="center" mt={8}>
            <UnstyledButton
              onClick={() => setPlaying(p => !p)}
              w={34} h={34}
              style={{
                borderRadius: '50%', background: 'rgba(29,185,84,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>{playing ? '⏸' : '▶'}</Text>
            </UnstyledButton>
          </Group>
        </Box>
      )}

      {/* Race track */}
      <Box style={{ width: '100%', maxWidth: 640, position: 'relative', padding: '60px 24px 20px' }}>
        <Box
          style={{
            position: 'absolute',
            bottom: 28,
            left: `calc(${Math.min(progressPct, 90)}% - 24px)`,
            transition: 'left 1s linear',
            fontSize: 44,
            transform: 'scaleX(-1)',
            animation: phase === 'running' ? 'bounce 0.35s ease-in-out infinite alternate' : 'none',
            filter: phase === 'drifted' ? 'grayscale(1) opacity(0.4)' : 'none',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          🏃‍♀️
        </Box>

        <Box style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, position: 'relative', overflow: 'hidden' }}>
          <Box
            style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progressPct}%`,
              background: phase === 'drifted'
                ? 'rgba(255,200,0,0.5)'
                : 'linear-gradient(90deg, var(--mantine-color-teal-5), var(--mantine-color-blue-4))',
              borderRadius: 9999,
              transition: 'width 1s linear',
            }}
          />
        </Box>

        <Box style={{ position: 'absolute', right: 16, bottom: 12, fontSize: 32 }}>🏁</Box>
        <Box style={{ position: 'absolute', left: 16, bottom: 12, fontSize: 20, opacity: 0.3 }}>🚦</Box>
      </Box>

      {/* Timer */}
      <Box ta="center">
        <Text
          fw={800} c="white" ff="monospace"
          style={{
            fontSize: 88, letterSpacing: -4, lineHeight: 1,
            opacity: phase === 'drifted' ? 0.25 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          {timeStr}
        </Text>
      </Box>

      {/* Bottom actions */}
      <Group justify="space-between" w="100%" maw={500}>
        {phase === 'running' ? (
          <Button variant="transparent" c="white" size="sm" onClick={drift} style={{ opacity: 0.3 }}>
            {STRINGS.FOCUS_DRIFTED}
          </Button>
        ) : (
          <Button variant="filled" color="yellow" radius="xl" size="sm" onClick={imBack}>
            {STRINGS.FOCUS_IM_BACK}
          </Button>
        )}
        <Button
          variant="gradient" gradient={{ from: 'teal', to: 'blue' }}
          radius="xl" size="md"
          onClick={() => setPhase('finished')}
        >
          {STRINGS.FOCUS_DONE}
        </Button>
      </Group>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce { from { transform: scaleX(-1) translateY(0); } to { transform: scaleX(-1) translateY(-10px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Box>
  )
}

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <Box
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(180deg, #0a0a1a 0%, #0d1a2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: 40,
          zIndex: 200,
        }}
      >
        <Text style={{ fontSize: 72 }}>🏁</Text>
        <Text fw={800} c="white" style={{ fontSize: 28 }} ta="center">
          {STRINGS.FOCUS_FINISHED_TITLE}
        </Text>
        <Text size="sm" c="white" opacity={0.5} ta="center" maw={360}>
          {STRINGS.FOCUS_FINISHED_SUBTITLE}
        </Text>

        <Stack gap="sm" w="100%" maw={360}>
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            size="lg"
            onClick={() => handleFinish('yes')}
          >
            {STRINGS.FOCUS_YES_FINISHED}
          </Button>
          <Button
            variant="light"
            color="blue"
            radius="xl"
            size="md"
            onClick={() => handleFinish('more')}
          >
            {STRINGS.FOCUS_NEED_MORE_TIME}
          </Button>
          <Button
            variant="transparent"
            c="white"
            size="sm"
            onClick={() => handleFinish('away')}
            style={{ opacity: 0.4 }}
          >
            {STRINGS.FOCUS_GOT_PULLED_AWAY}
          </Button>
        </Stack>
      </Box>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const isSuccess = finishChoice === 'yes'
    return (
      <Box
        style={{
          position: 'fixed',
          inset: 0,
          background: isSuccess
            ? 'linear-gradient(135deg, #0d2e1a, #0a1f0d)'
            : 'linear-gradient(180deg, #0a0a1a, #0d1a2e)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 40,
          zIndex: 200,
        }}
      >
        {isSuccess ? (
          <>
            <Text style={{ fontSize: 80 }}>✨</Text>
            <Text fw={800} c="white" style={{ fontSize: 30 }} ta="center">
              {STRINGS.FOCUS_GREAT_WORK}
            </Text>
            {aiLoading ? (
              <Text size="sm" c="white" opacity={0.4}>
                {STRINGS.AI_EVALUATING}
              </Text>
            ) : (
              <Text
                size="md"
                c="white"
                opacity={0.8}
                ta="center"
                maw={400}
                lh={1.8}
              >
                {aiMessage}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={{ fontSize: 72 }}>💙</Text>
            <Text fw={700} c="white" style={{ fontSize: 26 }} ta="center">
              {STRINGS.FOCUS_NO_JUDGMENT}
            </Text>
            <Text size="sm" c="white" opacity={0.5} ta="center" maw={360}>
              {STRINGS.FOCUS_TRY_AGAIN_LATER}
            </Text>
            <Group gap="sm">
              <Button
                variant="light"
                color="blue"
                radius="xl"
                onClick={() => {
                  setPhase('pre')
                  setCommitment('')
                }}
              >
                {STRINGS.FOCUS_TRY_AGAIN}
              </Button>
              <Button
                variant="transparent"
                c="white"
                radius="xl"
                style={{ opacity: 0.5 }}
                onClick={() => {
                  if (selectedTaskId) {
                    update(selectedTaskId, {
                      status: TASK_STATUS.DONE,
                      completed_at: new Date().toISOString(),
                    })
                  }
                  navigate(ROUTES.TODAY)
                }}
              >
                {STRINGS.FOCUS_MARK_DONE_ANYWAY}
              </Button>
            </Group>
          </>
        )}

        <Button
          variant="transparent"
          c="white"
          radius="xl"
          mt="lg"
          style={{ opacity: 0.4 }}
          onClick={() => navigate(ROUTES.TODAY)}
        >
          {STRINGS.FOCUS_BACK_TO_TODAY}
        </Button>
      </Box>
    )
  }

  return null
}
