// Live counter behind the admin "Firestore Usage" tab. Fed by
// utils/firestoreMetered.js. Counts only what THIS browser does (visitors'
// browsers count their own); the Firebase console remains the full total.
import { useSyncExternalStore } from 'react'

const KEY = 'vss-firestore-usage-v1'
const MAX_LOG = 60

// Firestore free-tier daily quota (Spark plan).
export const DAILY_LIMITS = { read: 50000, write: 20000, delete: 20000 }

const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ day: today(), read: 0, write: 0, delete: 0, free: 0, byCollection: {} })

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && saved.day === today()) return saved
  } catch { /* ignore */ }
  return blank()
}

let day = load()
let session = { read: 0, write: 0, delete: 0, free: 0, since: Date.now() }
let log = []
let snapshot = { day, session, log }
const listeners = new Set()

// Saved immediately on every single operation (no delay), so nothing is lost
// on a quick refresh, and re-read first, so two open admin tabs add to the
// same total instead of overwriting each other.
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(day)) } catch { /* ignore */ }
}

function emit() {
  snapshot = { day: { ...day }, session: { ...session }, log: log.slice() }
  listeners.forEach((l) => l())
}

export function recordOp(kind, collection, n = 1) {
  if (!n) return
  day = load() // pick up what other tabs counted meanwhile (also rolls over at midnight)
  day[kind] = (day[kind] || 0) + n
  session[kind] = (session[kind] || 0) + n
  if (kind !== 'free') {
    const c = (day.byCollection[collection] ||= { read: 0, write: 0, delete: 0 })
    c[kind] += n
  }
  log.unshift({ t: Date.now(), kind, collection, n })
  if (log.length > MAX_LOG) log.length = MAX_LOG
  persist()
  emit()
}

export function resetUsage() {
  day = blank()
  session = { read: 0, write: 0, delete: 0, free: 0, since: Date.now() }
  log = []
  persist()
  emit()
}

// Another tab counted something: show the shared total here too.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    day = load()
    emit()
  })
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useFirestoreUsage = () => useSyncExternalStore(subscribe, () => snapshot)
