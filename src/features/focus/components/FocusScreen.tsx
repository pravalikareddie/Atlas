import { useNavigate } from 'react-router-dom'
import { useTaskActions } from '../../tasks/hooks/useTaskActions'
import { useTaskData } from '../../tasks/hooks/useTaskData'
import { useTaskStore } from '../../tasks/store/taskStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isToday, parseISO } from 'date-fns'
import { TASK_STATUS, TYPE_COLOR } from '../../tasks/constants/taskConstants'
import { callClaude } from '../../../lib/anthropic'
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
import { STRINGS } from '../../tasks/constants/strings'
import { ROUTES } from '../../../app/routes'
import { COLORS, GRADIENTS, RADIUS_PILL } from '../../../shared/constants/styles'
import {
  CaretLeft,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from '@phosphor-icons/react'
import ReactPlayer from 'react-player'
type FocusPhase = 'pre' | 'running' | 'drifted' | 'finished' | 'result'

const TIMER_OPTIONS = [10, 25, 45, 60, 90] as const

export function FocusScreen() {
  useTaskData()
  const tasks = useTaskStore((s) => s.tasks)
  const { update } = useTaskActions()
  const navigate = useNavigate()
  // Persist timer state across reloads
  const STORAGE_KEY = 'atlas-focus-state'
  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as {
        selectedTaskId: string | null
        phase: FocusPhase
        secondsLeft: number
        totalSeconds: number
        driftCount: number
        minutes: number
        resumeAt?: number // timestamp when timer was last ticking
      }
    } catch { return null }
  }
  const persisted = loadPersistedState()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(persisted?.selectedTaskId ?? null)
  const [mediaUrl, setMediaUrl] = useState(
    'https://www.youtube.com/watch?v=cEWwJxEq9Lg&list=RDGMEMCMFH2exzjBeE_zAHHJOdxgVMcEWwJxEq9Lg&start_radio=1',
  )
  const [minutes, setMinutes] = useState(persisted?.minutes ?? 25)
  const [customMinutes, setCustomMinutes] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [phase, setPhase] = useState<FocusPhase>(() => {
    if (!persisted) return 'pre'
    if (persisted.phase === 'running' || persisted.phase === 'drifted') return persisted.phase
    return 'pre'
  })
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!persisted || (persisted.phase !== 'running' && persisted.phase !== 'drifted')) return 0
    if (persisted.phase === 'running' && persisted.resumeAt) {
      const elapsed = Math.floor((Date.now() - persisted.resumeAt) / 1000)
      return Math.max(0, persisted.secondsLeft - elapsed)
    }
    return persisted.secondsLeft
  })
  const [totalSeconds, setTotalSeconds] = useState(persisted?.totalSeconds ?? 0)
  const [driftCount, setDriftCount] = useState(persisted?.driftCount ?? 0)
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [finishChoice, setFinishChoice] = useState<
    'yes' | 'more' | 'away' | null
  >(null)
  const [musicPaused, setMusicPaused] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ytRef = useRef<HTMLIFrameElement | null>(null)

  // Persist focus state to localStorage
  useEffect(() => {
    if (phase === 'pre' || phase === 'finished' || phase === 'result') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    const state = {
      selectedTaskId,
      phase,
      secondsLeft,
      totalSeconds,
      driftCount,
      minutes,
      resumeAt: phase === 'running' ? Date.now() : undefined,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [phase, secondsLeft, totalSeconds, driftCount, selectedTaskId, minutes])

  // Build playable URL from YouTube Music or regular YouTube links
  const playerInfo = useMemo(() => {
    if (!mediaUrl) return null
    try {
      const u = new URL(mediaUrl)
      const isYTMusic = u.hostname === 'music.youtube.com'
      const isYT =
        u.hostname.includes('youtube.com') || u.hostname === 'youtu.be'
      if (isYTMusic || isYT) {
        const v = u.searchParams.get('v')
        const list = u.searchParams.get('list')
        let src = 'https://www.youtube.com/embed'
        if (v) src += `/${v}`
        const params = new URLSearchParams({
          autoplay: '1',
          enablejsapi: '1',
          origin: window.location.origin,
        })
        if (list) params.set('list', list)
        return { type: 'youtube' as const, src: `${src}?${params}` }
      }
    } catch {
      /* ignore */
    }
    if (!mediaUrl) return null
    return { type: 'other' as const, src: mediaUrl }
  }, [mediaUrl])

  const todayTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === TASK_STATUS.TODO &&
            !t.is_learning &&
            ((t.due_date && isToday(parseISO(t.due_date))) || t.do_today),
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
  const canStart = selectedTaskId !== null

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
      const prompt = `You are Atlas, a warm personal assistant. The user just finished a focus session. Be warm and specific. Max 2 sentences. Task: "${selectedTask?.title}" (${selectedTask?.type}). Drifted ${driftCount} time${driftCount !== 1 ? 's' : ''}. Due: ${selectedTask?.due_date ?? 'no date'}.`
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
      <Stack gap="lg" mx="auto">
        <Box
          p="xl"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-teal-6), var(--mantine-color-blue-5))',
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text fw={800} c="white" style={{ fontSize: 28 }}>
                🎯 {STRINGS.NAV_FOCUS}
              </Text>
              <Text size="sm" c="white" opacity={0.8} mt={4}>
                {STRINGS.FOCUS_SUBTITLE}
              </Text>
            </Box>
            <Button
              variant="white"
              c="teal"
              size="xs"
              radius="xl"
              onClick={() => navigate('/growth/tasks')}
            >
              View Tasks →
            </Button>
          </Group>
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
                      p="md"
                      style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        background:
                          selectedTaskId === t.id
                            ? 'var(--mantine-color-teal-light)'
                            : 'var(--mantine-color-dark-6)',
                        border:
                          selectedTaskId === t.id
                            ? '2px solid var(--mantine-color-teal-4)'
                            : '2px solid transparent',
                        boxShadow: 'var(--mantine-shadow-sm)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Group gap="sm">
                        <Box
                          w={4}
                          style={{
                            alignSelf: 'stretch',
                            borderRadius: RADIUS_PILL,
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
                      py="sm"
                      style={{
                        borderRadius: 'var(--mantine-radius-xl)',
                        background:
                          minutes === m && !showCustom
                            ? 'var(--mantine-color-teal-light)'
                            : 'var(--mantine-color-dark-6)',
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
                    py="sm"
                    style={{
                      background: showCustom
                        ? 'var(--mantine-color-teal-light)'
                        : 'var(--mantine-color-dark-6)',
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
          gradient={{ from: 'teal', to: 'cyan' }}
          radius="xl"
          size="lg"
          disabled={!canStart}
          onClick={() => start()}
          w="fit-content"
          px="xl"
          mx="auto"
          c="white"
          style={{
            height: 56,
            border: '1px solid var(--mantine-color-teal-4)',
          }}
        >
          {STRINGS.FOCUS_START}
        </Button>

        <Button
          variant="subtle"
          size="sm"
          onClick={() => navigate('/growth/tasks')}
          c="dimmed"
        >
          View all tasks →
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
          background: GRADIENTS.FOCUS_BG,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 40px',
          zIndex: 200,
        }}
      >
        {/* Player rendered inside disc area below */}

        {/* Header */}
        <Group justify="space-between" w="100%">
          <Button
            variant="transparent"
            c="white"
            size="sm"
            leftSection={<CaretLeft size={14} />}
            onClick={goBack}
            style={{ opacity: 0.4 }}
          >
            {STRINGS.BACK}
          </Button>
          {driftCount > 0 && (
            <Text size="xs" c="white" opacity={0.3}>
              {driftCount} {STRINGS.FOCUS_DRIFTS}
            </Text>
          )}
        </Group>

        {/* Music player */}
        {/* YouTube: hidden iframe + visible disc */}
        {playerInfo?.type === 'youtube' && (
          <>
            <iframe
              ref={ytRef}
              src={playerInfo.src}
              width="1"
              height="1"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
            <Box ta="center">
              <Box
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background:
                    `conic-gradient(from 0deg, ${COLORS.SPOTIFY_40}, ${COLORS.SPOTIFY_15}, ${COLORS.SPOTIFY_30}, ${COLORS.SPOTIFY_10}, ${COLORS.SPOTIFY_40})`,
                  border: `2px solid ${COLORS.SPOTIFY_40}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  animation:
                    phase === 'running' ? 'spin 4s linear infinite' : 'none',
                  boxShadow: `0 0 20px ${COLORS.SPOTIFY_20}`,
                }}
              >
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#0a0a1a',
                    border: `2px solid ${COLORS.SPOTIFY_30}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    w={8}
                    h={8}
                    style={{
                      borderRadius: '50%',
                      background: COLORS.SPOTIFY_80,
                    }}
                  />
                </Box>
              </Box>
              <Group gap="lg" justify="center" mt={10}>
                <UnstyledButton
                  onClick={() => {
                    ytRef.current?.contentWindow?.postMessage(
                      JSON.stringify({
                        event: 'command',
                        func: 'previousVideo',
                      }),
                      '*',
                    )
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: COLORS.WHITE_08,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipBack size={18} color="white" weight="fill" />
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => {
                    const func = musicPaused ? 'playVideo' : 'pauseVideo'
                    ytRef.current?.contentWindow?.postMessage(
                      JSON.stringify({ event: 'command', func }),
                      '*',
                    )
                    setMusicPaused((p) => !p)
                  }}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: COLORS.SPOTIFY_30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {musicPaused ? (
                    <Play size={20} color="white" weight="fill" />
                  ) : (
                    <Pause size={20} color="white" weight="fill" />
                  )}
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => {
                    ytRef.current?.contentWindow?.postMessage(
                      JSON.stringify({ event: 'command', func: 'nextVideo' }),
                      '*',
                    )
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: COLORS.WHITE_08,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SkipForward size={18} color="white" weight="fill" />
                </UnstyledButton>
              </Group>
            </Box>
          </>
        )}
        {playerInfo?.type === 'other' && (
          <Box w="100%" maw={400} mx="auto">
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${COLORS.SPOTIFY_30}`,
                boxShadow: `0 0 20px ${COLORS.SPOTIFY_15}`,
              }}
            >
              <ReactPlayer
                url={playerInfo.src}
                playing={phase === 'running'}
                loop
                volume={1}
                controls
                width="100%"
                height={220}
              />
            </Box>
          </Box>
        )}

        {/* Race track */}
        <Box
          style={{
            width: '100%',
            maxWidth: 640,
            position: 'relative',
            padding: '60px 24px 20px',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              bottom: 28,
              left: `calc(${Math.min(progressPct, 90)}% - 24px)`,
              transition: 'left 1s linear',
              fontSize: 44,
              transform: 'scaleX(-1)',
              animation:
                phase === 'running'
                  ? 'bounce 0.35s ease-in-out infinite alternate'
                  : 'none',
              filter:
                phase === 'drifted' ? 'grayscale(1) opacity(0.4)' : 'none',
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            🏃‍♀️
          </Box>

          <Box
            style={{
              height: 6,
              background: COLORS.WHITE_10,
              borderRadius: RADIUS_PILL,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progressPct}%`,
                background:
                  phase === 'drifted'
                    ? COLORS.WARNING_50
                    : 'linear-gradient(90deg, var(--mantine-color-teal-5), var(--mantine-color-blue-4))',
                borderRadius: RADIUS_PILL,
                transition: 'width 1s linear',
              }}
            />
          </Box>

          <Box
            style={{
              position: 'absolute',
              right: 16,
              bottom: 12,
              fontSize: 32,
            }}
          >
            🏁
          </Box>
          <Box
            style={{
              position: 'absolute',
              left: 16,
              bottom: 12,
              fontSize: 20,
              opacity: 0.3,
            }}
          >
            🚦
          </Box>
        </Box>

        {/* Timer */}
        <Box ta="center">
          <Text
            fw={800}
            c="white"
            ff="monospace"
            style={{
              fontSize: 88,
              letterSpacing: -4,
              lineHeight: 1,
              opacity: phase === 'drifted' ? 0.25 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {timeStr}
          </Text>
        </Box>

        {/* Bottom actions */}
        <Group justify="space-between" w="100%">
          {phase === 'running' ? (
            <Button
              variant="transparent"
              c="white"
              size="sm"
              onClick={drift}
              style={{ opacity: 0.3 }}
            >
              {STRINGS.FOCUS_DRIFTED}
            </Button>
          ) : (
            <Button
              variant="filled"
              color="yellow"
              radius="xl"
              size="sm"
              onClick={imBack}
            >
              {STRINGS.FOCUS_IM_BACK}
            </Button>
          )}
          <Button
            variant="gradient"
            gradient={{ from: 'teal', to: 'blue' }}
            radius="xl"
            size="md"
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
          background: GRADIENTS.FOCUS_BG,
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
        <Text size="sm" c="white" opacity={0.5} ta="center">
          {STRINGS.FOCUS_FINISHED_SUBTITLE}
        </Text>

        <Stack gap="sm" w="100%">
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
            ? GRADIENTS.RESULT_SUCCESS
            : GRADIENTS.FOCUS_BG,
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
              <Text size="md" c="white" opacity={0.8} ta="center" lh={1.8}>
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
            <Text size="sm" c="white" opacity={0.5} ta="center">
              {STRINGS.FOCUS_TRY_AGAIN_LATER}
            </Text>
            <Group gap="sm">
              <Button
                variant="light"
                color="blue"
                radius="xl"
                onClick={() => {
                  setPhase('pre')
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
