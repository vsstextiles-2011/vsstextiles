// Optional admin "click & key log": while it is switched ON (Admin -> Firestore
// Usage), every click and every key press made by the signed-in ADMIN in this
// browser becomes its own document in the Firestore "interactionLog"
// collection.
//
// Safety rules built in:
//  - OFF by default, admin-only. Customers/visitors are never recorded.
//  - What was typed is NEVER stored: a letter/number/symbol key is saved as
//    "character" (and anything in a password box as "hidden"); only named keys
//    such as Enter, Escape, Tab, Backspace or arrows keep their name. Field
//    values are never read, only the field's label.
//  - A daily cap (default 2,000 entries) protects the free Firestore quota
//    (20,000 writes/day) that the real site also needs.
//  - Entries are sent in small batches every couple of seconds so typing and
//    clicking never wait on the network.
import { useSyncExternalStore } from 'react'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

const LOG_COLLECTION = 'interactionLog'
const SETTINGS_KEY = 'vss-interaction-log-v1'
const FLUSH_MS = 2000
const FLUSH_AT = 20
const today = () => new Date().toISOString().slice(0, 10)

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    if (s) return { enabled: !!s.enabled, cap: Number(s.cap) > 0 ? Number(s.cap) : 2000, day: s.day === today() ? s.day : today(), sent: s.day === today() ? Number(s.sent) || 0 : 0 }
  } catch { /* ignore */ }
  return { enabled: false, cap: 2000, day: today(), sent: 0 }
}

let settings = loadSettings()
let status = { ...settings, queued: 0, error: '' }
const listeners = new Set()
const emit = () => {
  status = { ...settings, queued: queue.length, error: lastError }
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}
let queue = []
let lastError = ''

export function setInteractionLogging(patch) {
  settings = { ...settings, ...patch }
  if (patch.enabled === false) queue = []
  emit()
}
export const useInteractionLogStatus = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => status)

// ---- describing what was clicked, without reading anything typed ----------
const clip = (s, n = 60) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

function describeTarget(el) {
  if (!el || !el.closest) return 'page'
  const t = el.closest('button, a[href], input, select, textarea, [role="button"], [role="tab"], label, summary') || el
  const tag = t.tagName?.toLowerCase() || 'element'
  const isField = tag === 'input' || tag === 'textarea' || tag === 'select'
  const label =
    t.getAttribute?.('aria-label') ||
    t.getAttribute?.('title') ||
    (isField ? t.getAttribute('name') || t.getAttribute('placeholder') || t.id : clip(t.textContent)) ||
    t.id ||
    ''
  const type = tag === 'input' ? `input:${t.type || 'text'}` : tag
  const href = tag === 'a' ? ` → ${clip(t.getAttribute('href'), 80)}` : ''
  return `${type} "${clip(label, 50)}"${href}`
}

function describeKey(e) {
  const el = e.target
  const inPassword = el?.tagName === 'INPUT' && el.type === 'password'
  if (inPassword) return 'hidden'
  const named = e.key && e.key.length > 1 // Enter, Escape, Tab, Backspace, ArrowUp...
  return named ? e.key : 'character'
}

function push(type, summary) {
  if (!settings.enabled || !auth.currentUser) return
  if (settings.day !== today()) settings = { ...settings, day: today(), sent: 0 }
  if (settings.sent + queue.length >= settings.cap) {
    if (!lastError) { lastError = `Daily cap of ${settings.cap} entries reached - logging paused until tomorrow.`; emit() }
    return
  }
  queue.push({ type, summary: clip(summary, 280), page: clip(window.location.pathname + window.location.hash, 120), at: Date.now() })
  if (queue.length >= FLUSH_AT) flush()
  else scheduleFlush()
}

let timer = null
const scheduleFlush = () => { if (!timer) timer = setTimeout(flush, FLUSH_MS) }

async function flush() {
  clearTimeout(timer)
  timer = null
  const user = auth.currentUser
  if (!user || queue.length === 0) return
  const batch = queue.splice(0, 400)
  try {
    const wb = writeBatch(db)
    batch.forEach((ev) => {
      wb.set(doc(collection(db, LOG_COLLECTION)), {
        type: ev.type,
        summary: ev.summary,
        page: ev.page,
        clientTime: ev.at,
        actorUid: user.uid,
        actorEmail: user.email || '',
        createdAt: serverTimestamp(),
      })
    })
    await wb.commit()
    settings = { ...settings, sent: settings.sent + batch.length }
    lastError = ''
  } catch (err) {
    lastError = err?.code === 'permission-denied'
      ? 'Firestore rules do not allow "interactionLog" yet - publish firestore.rules (npm run firebase:rules).'
      : err?.message || 'Could not save click log'
    setInteractionLogging({ enabled: false }) // stop instead of retrying forever
    return
  }
  emit()
  if (queue.length) scheduleFlush()
}

let started = false
export function startInteractionLogger() {
  if (started || typeof document === 'undefined') return () => {}
  started = true
  const onClick = (e) => push('click', `Click ${describeTarget(e.target)}`)
  const onKey = (e) => {
    if (e.repeat) return
    push('key', `Key ${describeKey(e)} in ${describeTarget(e.target)}`)
  }
  const onHide = () => { if (document.visibilityState === 'hidden') flush() }
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('visibilitychange', onHide)
  return () => {
    started = false
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKey, true)
    document.removeEventListener('visibilitychange', onHide)
  }
}
