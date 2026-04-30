import { Box, Text, UnstyledButton, Divider } from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { Modal } from '@mantine/core'
import { Button } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'

const GRAD_P = 'linear-gradient(135deg, #2E2510 0%, #1A1608 100%)'
const GRAD_E = 'linear-gradient(135deg, #3E1A1A 0%, #2E0D0D 100%)'

export function DoneScreen() {
  const {
    places,
    placeExps,
    experiences,
    updatePlace,
    updateExperience,
    loading,
  } = useLivingStore()
  const [view, setView] = useState<'grid' | 'list'>(
    () =>
      (localStorage.getItem('living-done-view') as 'grid' | 'list') || 'grid',
  )
  const [detail, setDetail] = useState<string | null>(null)
  const [expDetail, setExpDetail] = useState<string | null>(null)
  const [editMemory, setEditMemory] = useState('')

  const visited = places
    .filter((p) => p.status === 'visited')
    .sort((a, b) => (b.visited_date ?? '').localeCompare(a.visited_date ?? ''))
  const done = experiences
    .filter((e) => e.status === 'done')
    .sort((a, b) => (b.done_date ?? '').localeCompare(a.done_date ?? ''))

  function setViewPref(v: 'grid' | 'list') {
    setView(v)
    localStorage.setItem('living-done-view', v)
  }

  if (loading) return <SkeletonRow count={6} />
  if (!visited.length && !done.length)
    return (
      <EmptyState
        message="Your lived experiences will appear here"
        sub="Mark places as visited and experiences as done — collect your moments."
      />
    )

  const dp = detail ? places.find((p) => p.id === detail) : null
  const de = expDetail ? experiences.find((e) => e.id === expDetail) : null
  const dpPEs = detail
    ? placeExps.filter((pe) => pe.place_id === detail && pe.status === 'done')
    : []

  async function saveMemory(type: 'place' | 'exp', id: string) {
    if (type === 'place') {
      updatePlace(id, { memory: editMemory })
      try {
        await svc.updatePlace(id, { memory: editMemory })
      } catch {}
    } else {
      updateExperience(id, { memory: editMemory })
      try {
        await svc.updateExperience(id, { memory: editMemory })
      } catch {}
    }
    setEditMemory('')
  }

  function Card({
    name,
    date,
    img,
    grad,
    onClick,
  }: {
    name: string
    date: string | null
    img: string | null
    grad: string
    onClick: () => void
  }) {
    return (
      <UnstyledButton
        onClick={onClick}
        style={{ background: img ? `url(${img}) center/cover` : grad }}
      >
        <Box />
        <Box>
          <Box>{name}</Box>
          {date && <Box>{date}</Box>}
        </Box>
      </UnstyledButton>
    )
  }

  return (
    <Box>
      <Box>
        <Box>
          <UnstyledButton onClick={() => setViewPref('grid')}>
            🔲
          </UnstyledButton>
          <UnstyledButton onClick={() => setViewPref('list')}>
            ☰
          </UnstyledButton>
        </Box>
      </Box>

      {visited.length > 0 && (
        <>
          <Box>PLACES VISITED</Box>
          {view === 'grid' ? (
            <Box>
              {visited.map((p) => (
                <Card
                  key={p.id}
                  name={p.name}
                  date={p.visited_date}
                  img={p.done_image_url ?? p.image_url}
                  grad={GRAD_P}
                  onClick={() => {
                    setDetail(p.id)
                    setEditMemory(p.memory ?? '')
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box>
              {visited.map((p) => (
                <Box
                  key={p.id}
                  onClick={() => {
                    setDetail(p.id)
                    setEditMemory(p.memory ?? '')
                  }}
                >
                  <Box>{p.name}</Box>
                  <Box>
                    <Text component="span">{p.visited_date}</Text>
                    {p.memory && (
                      <Text component="span">{p.memory.slice(0, 40)}</Text>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {done.length > 0 && (
        <>
          <Box>EXPERIENCES HAD</Box>
          {view === 'grid' ? (
            <Box>
              {done.map((e) => (
                <Card
                  key={e.id}
                  name={e.name}
                  date={e.done_date}
                  img={e.done_image_url ?? e.image_url}
                  grad={GRAD_E}
                  onClick={() => {
                    setExpDetail(e.id)
                    setEditMemory(e.memory ?? '')
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box>
              {done.map((e) => (
                <Box
                  key={e.id}
                  onClick={() => {
                    setExpDetail(e.id)
                    setEditMemory(e.memory ?? '')
                  }}
                >
                  <Text component="span">✓</Text>
                  <Box>
                    <Box>{e.name}</Box>
                    {e.memory && <Box>{e.memory.slice(0, 50)}</Box>}
                  </Box>
                  <Text component="span">{e.done_date}</Text>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Place Detail */}
      <Modal open={!!dp} onClose={() => setDetail(null)}>
        {dp && (
          <>
            <Box
              style={{
                background:
                  (dp.done_image_url ?? dp.image_url)
                    ? `url(${dp.done_image_url ?? dp.image_url}) center/cover`
                    : GRAD_P,
              }}
            />
            <Box>{dp.name}</Box>
            <Box>Visited: {dp.visited_date}</Box>
            {dp.memory && <Box>{dp.memory}</Box>}
            <textarea
              value={editMemory}
              onChange={(e) => setEditMemory(e.target.value)}
              placeholder="add or edit memory..."
            />
            <Button variant="ghost" onClick={() => saveMemory('place', dp.id)}>
              save memory
            </Button>
            {dpPEs.length > 0 && (
              <>
                <Divider />
                <Box>THINGS YOU DID THERE</Box>
                {dpPEs.map((pe) => (
                  <Box key={pe.id}>✓ {pe.name}</Box>
                ))}
              </>
            )}
          </>
        )}
      </Modal>

      {/* Experience Detail */}
      <Modal open={!!de} onClose={() => setExpDetail(null)}>
        {de && (
          <>
            <Box
              style={{
                background:
                  (de.done_image_url ?? de.image_url)
                    ? `url(${de.done_image_url ?? de.image_url}) center/cover`
                    : GRAD_E,
              }}
            />
            <Box>{de.name}</Box>
            <Box>Done: {de.done_date}</Box>
            {de.memory ? <Box>{de.memory}</Box> : <Box>add a memory?</Box>}
            <textarea
              value={editMemory}
              onChange={(e) => setEditMemory(e.target.value)}
              placeholder="add or edit memory..."
            />
            <Button variant="ghost" onClick={() => saveMemory('exp', de.id)}>
              save memory
            </Button>
          </>
        )}
      </Modal>
    </Box>
  )
}
