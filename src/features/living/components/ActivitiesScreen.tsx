import { Box, Text, UnstyledButton } from '@mantine/core'
import { useState } from 'react'
import { useLivingStore } from '../store/livingStore'
import * as svc from '../services/livingService'
import { Button } from '@mantine/core'
import { Modal } from '@mantine/core'
import { EmptyState } from '../../../shared/components/EmptyState'
import { SkeletonRow } from '../../../shared/components/SkeletonRow'

const GRAD = 'linear-gradient(135deg, #1A2E1A 0%, #0D1F0D 100%)'

export function ActivitiesScreen() {
  const { activities, addActivity, removeActivity, loading } = useLivingStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', image_url: '' })
  const [detail, setDetail] = useState<string | null>(null)

  if (loading) return <SkeletonRow count={6} />

  async function save() {
    if (!form.name.trim()) return
    const row = {
      user_id: '00000000-0000-0000-0000-000000000001',
      name: form.name,
      image_url: form.image_url || null,
    }
    try {
      const r = await svc.insertActivity(row)
      addActivity(r)
    } catch {
      addActivity({
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
    }
    setShowAdd(false)
    setForm({ name: '', image_url: '' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this activity?')) return
    removeActivity(id)
    setDetail(null)
    try {
      await svc.deleteActivity(id)
    } catch {}
  }

  const act = detail ? activities.find((a) => a.id === detail) : null

  if (!activities.length)
    return (
      <Box>
        <EmptyState
          message="What makes you come alive?"
          sub="Add activities that are part of who you are."
        />
        <Box>
          <Button onClick={() => setShowAdd(true)}>+ add activity</Button>
        </Box>
        <Modal opened={showAdd} onClose={() => setShowAdd(false)}>
          <Box>Add an activity</Box>
          <label>name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Trekking, Beach days, Long drives..."
          />
          <label>image url (optional)</label>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <Box>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              cancel
            </Button>
            <Button onClick={save} disabled={!form.name.trim()}>
              save
            </Button>
          </Box>
        </Modal>
      </Box>
    )

  return (
    <Box>
      <Box>
        {activities.map((a) => (
          <UnstyledButton
            key={a.id}
            onClick={() => setDetail(a.id)}
            style={{
              background: a.image_url
                ? `url(${a.image_url}) center/cover`
                : GRAD,
            }}
          >
            <Box />
            <Box>
              <Box>{a.name}</Box>
            </Box>
          </UnstyledButton>
        ))}
        <UnstyledButton
          onClick={() => setShowAdd(true)}
          style={{ border: '0.5px dashed rgba(124,111,224,0.2)' }}
        >
          <Text component="span">+ add activity</Text>
        </UnstyledButton>
      </Box>

      <Modal opened={showAdd} onClose={() => setShowAdd(false)}>
        <Box>Add an activity</Box>
        <label>name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Trekking, Beach days, Long drives..."
        />
        <label>image url (optional)</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <Box>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            cancel
          </Button>
          <Button onClick={save} disabled={!form.name.trim()}>
            save
          </Button>
        </Box>
      </Modal>

      <Modal opened={!!act} onClose={() => setDetail(null)}>
        {act && (
          <>
            <Box
              style={{
                background: act.image_url
                  ? `url(${act.image_url}) center/cover`
                  : GRAD,
              }}
            />
            <Box>{act.name}</Box>
            <Button variant="ghost" onClick={() => handleDelete(act.id)}>
              delete
            </Button>
          </>
        )}
      </Modal>
    </Box>
  )
}
