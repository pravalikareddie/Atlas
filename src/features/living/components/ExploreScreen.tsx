import { Box, Text, UnstyledButton, Divider } from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { Button } from '@mantine/core'
import { Modal } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'

const GRAD_PLACE = 'linear-gradient(135deg, #1A2E4A 0%, #0D1F35 100%)'
const GRAD_EXP = 'linear-gradient(135deg, #2A1A3E 0%, #1A0D2E 100%)'

export function ExploreScreen() {
  const {
    places,
    placeExps,
    experiences,
    todos,
    addPlace,
    addExperience,
    addPlaceExp,
    updatePlaceExp,
    updatePlace,
    removePlace,
    updateExperience,
    removeExperience,
    addTodo,
    updateTodo,
    loading,
  } = useLivingStore()
  const [view, setView] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('living-view') as 'grid' | 'list') || 'grid',
  )
  const [addType, setAddType] = useState<null | 'place' | 'experience'>(null)
  const [form, setForm] = useState({
    name: '',
    note: '',
    image_url: '',
    place_id: '',
  })
  const [detail, setDetail] = useState<string | null>(null)
  const [expDetail, setExpDetail] = useState<string | null>(null)
  const [newPE, setNewPE] = useState('')
  const [markVisited, setMarkVisited] = useState<string | null>(null)
  const [markDone, setMarkDone] = useState<string | null>(null)
  const [visitForm, setVisitForm] = useState({
    date: '',
    memory: '',
    image: '',
  })
  const [doneForm, setDoneForm] = useState({ date: '', memory: '', image: '' })
  const [newTodo, setNewTodo] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)

  const wantPlaces = places.filter((p) => p.status === 'want')
  const wantExps = experiences.filter((e) => e.status === 'want')
  const openTodos = todos.filter((t) => t.status === 'todo')
  const doneCount =
    places.filter((p) => p.status === 'visited').length +
    experiences.filter((e) => e.status === 'done').length

  function setViewPref(v: 'grid' | 'list') {
    setView(v)
    localStorage.setItem('living-view', v)
  }

  if (loading) return <SkeletonRow count={6} />

  async function savePlace() {
    if (!form.name.trim()) return
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      name: form.name,
      note: form.note || null,
      image_url: form.image_url || null,
      status: 'want' as const,
      visited_date: null,
      memory: null,
      done_image_url: null,
    }
    try {
      const r = await svc.insertPlace(row)
      addPlace(r)
    } catch {
      addPlace({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setAddType(null)
    setForm({ name: '', note: '', image_url: '', place_id: '' })
  }

  async function saveExp() {
    if (!form.name.trim()) return
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      name: form.name,
      image_url: form.image_url || null,
      place_id: form.place_id || null,
      status: 'want' as const,
      done_date: null,
      memory: null,
      done_image_url: null,
    }
    try {
      const r = await svc.insertExperience(row)
      addExperience(r)
    } catch {
      addExperience({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setAddType(null)
    setForm({ name: '', note: '', image_url: '', place_id: '' })
  }

  async function addPE(placeId: string) {
    if (!newPE.trim()) return
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      place_id: placeId,
      name: newPE,
      status: 'want' as const,
      done_date: null,
    }
    try {
      const r = await svc.insertPlaceExperience(row)
      addPlaceExp(r)
    } catch {
      addPlaceExp({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewPE('')
  }

  async function markPEDone(id: string) {
    const u = {
      status: 'done' as const,
      done_date: new Date().toISOString().slice(0, 7),
    }
    updatePlaceExp(id, u)
    try {
      await svc.updatePlaceExperience(id, u)
    } catch {}
  }

  async function handleMarkVisited() {
    if (!markVisited) return
    const u = {
      status: 'visited' as const,
      visited_date: visitForm.date || null,
      memory: visitForm.memory || null,
      done_image_url: visitForm.image || null,
    }
    updatePlace(markVisited, u)
    try {
      await svc.updatePlace(markVisited, u)
    } catch {}
    setMarkVisited(null)
    setDetail(null)
    setVisitForm({ date: '', memory: '', image: '' })
  }

  async function handleMarkExpDone() {
    if (!markDone) return
    const u = {
      status: 'done' as const,
      done_date: doneForm.date || null,
      memory: doneForm.memory || null,
      done_image_url: doneForm.image || null,
    }
    updateExperience(markDone, u)
    try {
      await svc.updateExperience(markDone, u)
    } catch {}
    setMarkDone(null)
    setExpDetail(null)
    setDoneForm({ date: '', memory: '', image: '' })
  }

  async function handleDeletePlace(id: string) {
    if (!confirm('Remove this place from your list?')) return
    removePlace(id)
    setDetail(null)
    try {
      await svc.deletePlace(id)
    } catch {}
  }

  async function handleDeleteExp(id: string) {
    if (!confirm('Remove this experience?')) return
    removeExperience(id)
    setExpDetail(null)
    try {
      await svc.deleteExperience(id)
    } catch {}
  }

  async function submitTodo() {
    if (!newTodo.trim()) return
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      description: newTodo,
      status: 'todo' as const,
      completed_at: null,
    }
    try {
      const r = await svc.insertLivingTodo(row)
      addTodo(r)
    } catch {
      addTodo({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setNewTodo('')
    setAddingTodo(false)
  }

  async function completeTodo(id: string) {
    const u = {
      status: 'done' as const,
      completed_at: new Date().toISOString(),
    }
    updateTodo(id, u)
    try {
      await svc.updateLivingTodo(id, u)
    } catch {}
  }

  const detailPlace = detail ? places.find((p) => p.id === detail) : null
  const detailExp = expDetail
    ? experiences.find((e) => e.id === expDetail)
    : null
  const detailPEs = detail
    ? placeExps.filter((pe) => pe.place_id === detail)
    : []

  if (!wantPlaces.length && !wantExps.length && !loading) {
    return (
      <Box>
        <Box>
          <Box />
          <Button onClick={() => setAddType('place')}>+ add</Button>
        </Box>
        <EmptyState
          message="The world is waiting for you"
          sub="Add places you want to go and things you want to experience."
        />
        <AddModal />
      </Box>
    )
  }

  function ImageCard({
    name,
    sub,
    img,
    grad,
    onClick,
  }: {
    name: string
    sub?: string
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
          {sub && <Box>{sub}</Box>}
        </Box>
      </UnstyledButton>
    )
  }

  function AddModal() {
    return (
      <>
        <Modal open={addType === 'place'} onClose={() => setAddType(null)}>
          <Box>Add a place</Box>
          <label>name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tokyo, Patagonia, Amalfi..."
          />
          <label>what draws you there? (optional)</label>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="the food, the mountains, the quiet..."
          />
          <label>image url (optional)</label>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
          />
          <Box>
            <Button variant="secondary" onClick={() => setAddType(null)}>
              cancel
            </Button>
            <Button onClick={savePlace} disabled={!form.name.trim()}>
              save
            </Button>
          </Box>
        </Modal>
        <Modal open={addType === 'experience'} onClose={() => setAddType(null)}>
          <Box>Add an experience</Box>
          <label>name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Watch a sunrise alone, Learn to surf..."
          />
          <label>linked to a place (optional)</label>
          <select
            value={form.place_id}
            onChange={(e) => setForm({ ...form, place_id: e.target.value })}
          >
            <option value="">None</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label>image url (optional)</label>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
          />
          <Box>
            <Button variant="secondary" onClick={() => setAddType(null)}>
              cancel
            </Button>
            <Button onClick={saveExp} disabled={!form.name.trim()}>
              save
            </Button>
          </Box>
        </Modal>
      </>
    )
  }

  return (
    <Box>
      {/* Win banner */}
      {doneCount > 0 && (
        <Box>
          <Text component="span">🌟</Text>
          <Box>
            {doneCount} experience{doneCount !== 1 ? 's' : ''} lived. Keep
            collecting moments.
          </Box>
        </Box>
      )}

      <Box>
        <Box>
          <UnstyledButton onClick={() => setViewPref('grid')}>
            🔲
          </UnstyledButton>
          <UnstyledButton onClick={() => setViewPref('list')}>
            ☰
          </UnstyledButton>
        </Box>
        <Box>
          <Button variant="ghost" onClick={() => setAddType('place')}>
            📍 place
          </Button>
          <Button variant="ghost" onClick={() => setAddType('experience')}>
            ✨ experience
          </Button>
        </Box>
      </Box>

      {/* Places */}
      {wantPlaces.length > 0 && (
        <>
          <Box>places to go</Box>
          {view === 'grid' ? (
            <Box>
              {wantPlaces.map((p) => {
                const peCount = placeExps.filter(
                  (pe) => pe.place_id === p.id && pe.status === 'want',
                ).length
                return (
                  <ImageCard
                    key={p.id}
                    name={p.name}
                    sub={
                      peCount > 0 ? `${peCount} things to do` : 'no plans yet'
                    }
                    img={p.image_url}
                    grad={GRAD_PLACE}
                    onClick={() => setDetail(p.id)}
                  />
                )
              })}
            </Box>
          ) : (
            <Box>
              {wantPlaces.map((p) => {
                const peCount = placeExps.filter(
                  (pe) => pe.place_id === p.id && pe.status === 'want',
                ).length
                return (
                  <Box key={p.id} onClick={() => setDetail(p.id)}>
                    <Box>
                      <Box>{p.name}</Box>
                      <Box>
                        {peCount > 0
                          ? `${peCount} things to do there`
                          : 'no specific plans yet'}
                      </Box>
                    </Box>
                    <Text component="span">→</Text>
                  </Box>
                )
              })}
            </Box>
          )}
        </>
      )}

      {/* Experiences */}
      {wantExps.length > 0 && (
        <>
          <Box>things to experience</Box>
          {view === 'grid' ? (
            <Box>
              {wantExps.map((e) => (
                <ImageCard
                  key={e.id}
                  name={e.name}
                  img={e.image_url}
                  grad={GRAD_EXP}
                  onClick={() => setExpDetail(e.id)}
                />
              ))}
            </Box>
          ) : (
            <Box>
              {wantExps.map((e) => {
                const place = e.place_id
                  ? places.find((p) => p.id === e.place_id)
                  : null
                return (
                  <Box key={e.id} onClick={() => setExpDetail(e.id)}>
                    <Text component="span">○</Text>
                    <Text component="span">{e.name}</Text>
                    {place && <Text component="span">· {place.name}</Text>}
                  </Box>
                )
              })}
            </Box>
          )}
        </>
      )}

      {/* Todos */}
      <Divider />
      <Box>
        <Box>things to research</Box>
        <Button variant="ghost" onClick={() => setAddingTodo(true)}>
          + add
        </Button>
      </Box>
      {!openTodos.length ? (
        <EmptyState
          message="Nothing to look up right now"
          sub="Add research or planning tasks here."
        />
      ) : (
        <Box>
          {openTodos.map((t) => (
            <Box key={t.id}>
              <UnstyledButton
                onClick={() => completeTodo(t.id)}
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              />
              <Text component="span">{t.description}</Text>
            </Box>
          ))}
        </Box>
      )}
      {addingTodo && (
        <Box>
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTodo()
              if (e.key === 'Escape') setAddingTodo(false)
            }}
            placeholder="research, find, look up..."
            autoFocus
          />
          <Button onClick={submitTodo}>add</Button>
        </Box>
      )}

      <AddModal />

      {/* Place Detail */}
      <Modal open={!!detailPlace} onClose={() => setDetail(null)}>
        {detailPlace && (
          <>
            <Box
              style={{
                background: detailPlace.image_url
                  ? `url(${detailPlace.image_url}) center/cover`
                  : GRAD_PLACE,
              }}
            />
            <Box>{detailPlace.name}</Box>
            {detailPlace.note && <Box>{detailPlace.note}</Box>}
            <Divider />
            <Box>things to do there</Box>
            {detailPEs.map((pe) => (
              <Box key={pe.id}>
                <UnstyledButton
                  onClick={() => pe.status === 'want' && markPEDone(pe.id)}
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {pe.status === 'done' && '✓'}
                </UnstyledButton>
                <Text component="span">{pe.name}</Text>
              </Box>
            ))}
            <Box>
              <input
                value={newPE}
                onChange={(e) => setNewPE(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPE(detailPlace.id)}
                placeholder="add thing to do..."
              />
              <Button variant="ghost" onClick={() => addPE(detailPlace.id)}>
                +
              </Button>
            </Box>
            <Divider />
            <Box>
              <Button onClick={() => setMarkVisited(detailPlace.id)}>
                ✓ mark as visited
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDeletePlace(detailPlace.id)}
              >
                delete
              </Button>
            </Box>
          </>
        )}
      </Modal>

      {/* Experience Detail */}
      <Modal open={!!detailExp} onClose={() => setExpDetail(null)}>
        {detailExp && (
          <>
            <Box
              style={{
                background: detailExp.image_url
                  ? `url(${detailExp.image_url}) center/cover`
                  : GRAD_EXP,
              }}
            />
            <Box>{detailExp.name}</Box>
            {detailExp.place_id && (
              <Box>
                · {places.find((p) => p.id === detailExp.place_id)?.name}
              </Box>
            )}
            <Divider />
            <Box>
              <Button onClick={() => setMarkDone(detailExp.id)}>
                ✓ mark as done
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDeleteExp(detailExp.id)}
              >
                delete
              </Button>
            </Box>
          </>
        )}
      </Modal>

      {/* Mark Visited Modal */}
      <Modal open={!!markVisited} onClose={() => setMarkVisited(null)}>
        <Box>You went! 🎉</Box>
        <label>when</label>
        <input
          value={visitForm.date}
          onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
          placeholder="Apr 2026"
        />
        <label>what stays with you? (optional)</label>
        <textarea
          value={visitForm.memory}
          onChange={(e) =>
            setVisitForm({ ...visitForm, memory: e.target.value })
          }
          placeholder="the sounds, the light, the feeling..."
        />
        <label>photo url (optional)</label>
        <input
          value={visitForm.image}
          onChange={(e) =>
            setVisitForm({ ...visitForm, image: e.target.value })
          }
        />
        <Box>
          <Button variant="secondary" onClick={() => setMarkVisited(null)}>
            cancel
          </Button>
          <Button onClick={handleMarkVisited}>save</Button>
        </Box>
      </Modal>

      {/* Mark Done Modal */}
      <Modal open={!!markDone} onClose={() => setMarkDone(null)}>
        <Box>You did it! ✨</Box>
        <label>when</label>
        <input
          value={doneForm.date}
          onChange={(e) => setDoneForm({ ...doneForm, date: e.target.value })}
          placeholder="Apr 2026"
        />
        <label>what stays with you? (optional)</label>
        <textarea
          value={doneForm.memory}
          onChange={(e) => setDoneForm({ ...doneForm, memory: e.target.value })}
          placeholder="the sounds, the light, the feeling..."
        />
        <label>photo url (optional)</label>
        <input
          value={doneForm.image}
          onChange={(e) => setDoneForm({ ...doneForm, image: e.target.value })}
        />
        <Box>
          <Button variant="secondary" onClick={() => setMarkDone(null)}>
            cancel
          </Button>
          <Button onClick={handleMarkExpDone}>save</Button>
        </Box>
      </Modal>
    </Box>
  )
}
