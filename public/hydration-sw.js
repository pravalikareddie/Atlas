// ─── Hydration reminder service worker addon ──────────────────────────────────
// Injected into the workbox SW via vite-plugin-pwa injectManifest or importScripts

const HYDRATION_START_HOUR = 10
const HYDRATION_INTERVAL_HRS = 2
const HYDRATION_TOTAL_CUPS = 8
const DB_NAME = 'atlas-hydration'
const STORE_NAME = 'cups'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCups() {
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
}

async function checkAndNotify() {
  const now = new Date()
  const hour = now.getHours()
  if (hour < HYDRATION_START_HOUR) return

  const slotIndex = Math.floor((hour - HYDRATION_START_HOUR) / HYDRATION_INTERVAL_HRS)
  const expectedCups = Math.min(slotIndex + 1, HYDRATION_TOTAL_CUPS)
  const cups = await getCups()

  if (cups < expectedCups) {
    const remaining = HYDRATION_TOTAL_CUPS - cups
    self.registration.showNotification('💧 Hydration Check', {
      body: `Cup ${expectedCups} of ${HYDRATION_TOTAL_CUPS} — you've had ${cups} so far. ${remaining} to go!`,
      tag: 'hydration-reminder',
      renotify: true,
    })
  }
}

// Periodic Background Sync (Chrome/Edge on Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'hydration-check') {
    event.waitUntil(checkAndNotify())
  }
})

// Fallback: check on SW activation and every message
self.addEventListener('message', (event) => {
  if (event.data === 'hydration-check') {
    checkAndNotify()
  }
  if (event.data === 'hydration-test') {
    getCups().then((cups) => {
      const remaining = HYDRATION_TOTAL_CUPS - cups
      self.registration.showNotification('💧 Hydration Check (test)', {
        body: `You've had ${cups} cups so far. ${remaining} to go!`,
        tag: 'hydration-reminder',
        renotify: true,
      })
    })
  }
})
