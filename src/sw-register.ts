if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

export function scheduleNotification(hour: number, minute: number, title: string, body: string) {
  if (!('Notification' in window)) return
  Notification.requestPermission().then((perm) => {
    if (perm !== 'granted') return
    const now = new Date()
    const target = new Date(now)
    target.setHours(hour, minute, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    setTimeout(() => new Notification(title, { body }), target.getTime() - now.getTime())
  })
}

// ─── Hydration: IndexedDB for SW-accessible cup count ─────────────────────────

const DB_NAME = 'atlas-hydration'
const STORE_NAME = 'cups'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function syncWaterCups(cups: number) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(
      { date: new Date().toISOString().split('T')[0], cups },
      'today',
    )
    // Poke the SW to check immediately after logging
    navigator.serviceWorker?.controller?.postMessage('hydration-check')
  } catch {}
}

export async function registerHydrationReminders() {
  if (!('Notification' in window)) return
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return

  // Try SW-based approach for production (background notifications)
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage('hydration-check')
    if ('periodicSync' in reg) {
      await (reg as any).periodicSync.register('hydration-check', {
        minInterval: 2 * 60 * 60 * 1000,
      })
    }
  } catch {}

  // In-app interval: works in dev and as fallback
  checkHydrationNow()
  setInterval(checkHydrationNow, 2 * 60 * 60 * 1000)
}

async function getCupsFromDB(): Promise<number> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get('today')
      req.onsuccess = () => {
        const val = req.result
        const today = new Date().toISOString().split('T')[0]
        resolve(val && val.date === today ? val.cups : 0)
      }
      req.onerror = () => resolve(0)
    })
  } catch { return 0 }
}

const HYDRATION_START_HOUR = 10
const HYDRATION_INTERVAL_HRS = 2
const HYDRATION_TOTAL_CUPS = 8

async function checkHydrationNow() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const hour = new Date().getHours()
  if (hour < HYDRATION_START_HOUR) return

  const slotIndex = Math.floor((hour - HYDRATION_START_HOUR) / HYDRATION_INTERVAL_HRS)
  const expectedCups = Math.min(slotIndex + 1, HYDRATION_TOTAL_CUPS)
  const cups = await getCupsFromDB()
  if (cups >= expectedCups) return

  const remaining = HYDRATION_TOTAL_CUPS - cups
  new Notification('💧 Hydration Check', {
    body: `Cup ${expectedCups} of ${HYDRATION_TOTAL_CUPS} — you've had ${cups} so far. ${remaining} to go!`,
    tag: 'hydration-reminder',
  })
}

// ─── Task reminders ───────────────────────────────────────────────────────────

const activeReminders = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleTaskReminder(taskId: string, title: string, dueDate: string, reminderTime: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  // Clear existing reminder for this task
  clearTaskReminder(taskId)

  const [h, m] = reminderTime.split(':').map(Number)
  const target = new Date(dueDate + 'T00:00:00')
  target.setHours(h, m, 0, 0)

  const delay = target.getTime() - Date.now()
  if (delay <= 0) return // already passed

  const timer = setTimeout(() => {
    new Notification('⏰ Reminder', { body: title, tag: `task-${taskId}` })
    activeReminders.delete(taskId)
  }, delay)

  activeReminders.set(taskId, timer)
}

export function clearTaskReminder(taskId: string) {
  const existing = activeReminders.get(taskId)
  if (existing) {
    clearTimeout(existing)
    activeReminders.delete(taskId)
  }
}

export function scheduleAllReminders(tasks: { id: string; title: string; due_date: string | null; reminder_time?: string | null; status: string }[]) {
  // Clear all existing
  activeReminders.forEach((timer) => clearTimeout(timer))
  activeReminders.clear()

  const today = new Date().toISOString().split('T')[0]
  tasks
    .filter((t) => t.status === 'todo' && t.due_date && t.reminder_time && t.due_date >= today)
    .forEach((t) => scheduleTaskReminder(t.id, t.title, t.due_date!, t.reminder_time!))
}
