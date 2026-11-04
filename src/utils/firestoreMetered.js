// Drop-in replacement for 'firebase/firestore' (see the alias in vite.config.js).
// Every file keeps importing from 'firebase/firestore' as before, but reads,
// writes and deletes now pass through here first and are counted live, so the
// admin "Firestore Usage" tab can show them instantly (the Firebase console
// graph is several minutes behind).
//
// What counts as what (matches how Firestore bills):
//  - read:   each document returned by getDoc/getDocs, the documents in a
//            listener's first snapshot, then only the changed documents on
//            later snapshots. Answers served from the local cache or from a
//            not-yet-saved local write are free and are NOT counted.
//  - write:  setDoc / addDoc / updateDoc, and each set/update in a batch or
//            transaction.
//  - delete: deleteDoc, and each delete in a batch or transaction.
import * as real from '@firebase/firestore'
import { recordOp, manualLog } from './firestoreUsage.js'

export * from '@firebase/firestore'

// ---- automatic audit of admin changes -------------------------------------
// While an admin is signed in (App.jsx calls setAuditActor), every change they
// make to the site's data - content, reviews, messages, orders, categories...
// - gets its own entry in the Firestore "activityLog" (Admin -> Activity Log),
// even where a feature has no logging of its own. Product/coupon/order changes
// that already write a detailed entry are not logged twice. Only the NAMES of
// changed fields are stored, never their values.
let actor = null
const recentAudit = new Map()
export function setAuditActor(a) { actor = a }

// Not audited: the logs themselves, visitor traffic counters, and things a
// customer-side session owns (cart, wishlist, profile) or that already have
// their own detailed log (products).
const AUDIT_SKIP = new Set(['activityLog', 'interactionLog', 'productViews', 'carts', 'wishlists', 'users', 'products'])
const NOISE_KEYS = new Set(['updatedAt', 'createdAt', 'syncedAt', 'restorePoint'])
const TARGET_TYPE = { siteContent: 'content', reviews: 'review', contactMessages: 'message', orders: 'order', admins: 'admin', catalogueStaff: 'catalogue' }
const NOUN = { siteContent: 'website content', reviews: 'review', contactMessages: 'customer message', orders: 'order', admins: 'admin access', catalogueStaff: 'catalogue staff' }

function fieldNames(data, rest) {
  if (typeof data === 'string') { // updateDoc(ref, 'a.b', v, 'c', v2)
    const out = [data]
    for (let i = 1; i < rest.length; i += 2) if (typeof rest[i] === 'string') out.push(rest[i])
    return out
  }
  return data && typeof data === 'object' ? Object.keys(data).filter((k) => !NOISE_KEYS.has(k)) : []
}

function audit(verb, ref, data, rest = []) {
  try {
    if (!actor) return
    const path = pathOf(ref)
    const top = path.split('/')[0]
    if (AUDIT_SKIP.has(top)) return
    const at = Date.now()
    const fields = verb === 'delete' ? [] : fieldNames(data, rest)
    if (verb === 'update' && fields.length === 0) return // only timestamps changed
    const id = path.split('/').slice(1).join('/') || path
    const noun = NOUN[top] || top
    const what = verb === 'delete' ? 'Deleted' : verb === 'add' ? 'Added' : 'Changed'
    const summary = `${what} ${noun}: ${id}${fields.length ? ` (${fields.slice(0, 8).join(', ')}${fields.length > 8 ? ', ...' : ''})` : ''}`.slice(0, 400)
    // Wait a moment: a feature that logs its own entry does so right after its
    // write succeeds - if it did, skip ours.
    setTimeout(() => {
      if (manualLog.at >= at) return
      const a = actor
      if (!a) return
      // Repeated saves of the same thing (auto-save while typing) = one entry per 10s.
      const last = recentAudit.get(summary)
      if (last && Date.now() - last < 10000) return
      recentAudit.set(summary, Date.now())
      recordOp('write', 'activityLog', 1)
      real.addDoc(real.collection(a.db, 'activityLog'), {
        action: verb === 'delete' ? 'site_delete' : verb === 'add' ? 'site_add' : 'site_change',
        targetType: TARGET_TYPE[top] || 'content',
        targetId: id,
        targetName: noun,
        summary,
        actorUid: a.uid,
        actorName: a.name || undefined,
        actorEmail: a.email || undefined,
        createdAt: real.serverTimestamp(),
      }).catch((err) => console.warn('[audit]', err.message))
    }, 1500)
  } catch { /* auditing must never break a save */ }
}

function pathOf(ref) {
  try {
    if (!ref) return 'unknown'
    if (typeof ref.path === 'string') return ref.path
    const c = ref._query?.path?.canonicalString?.()
    if (c) return c
    if (ref.type === 'collection' || ref.type === 'document') return ref.path
  } catch { /* fall through */ }
  return 'query'
}

// "orders/abc123" -> "orders"; "site/home/sections" stays readable.
const collectionOf = (ref) => {
  const p = pathOf(ref)
  return p.split('/').filter((_, i) => i % 2 === 0).join('/') || p
}

export async function getDoc(ref) {
  const snap = await real.getDoc(ref)
  if (!snap.metadata?.fromCache) recordOp('read', collectionOf(ref), 1)
  else recordOp('free', collectionOf(ref), 1)
  return snap
}

export async function getDocs(q) {
  const snap = await real.getDocs(q)
  if (!snap.metadata?.fromCache) recordOp('read', collectionOf(q), Math.max(1, snap.size))
  else recordOp('free', collectionOf(q), Math.max(1, snap.size))
  return snap
}

export function onSnapshot(ref, ...args) {
  const where = collectionOf(ref)
  let first = true
  const count = (snap) => {
    if (!snap) return
    if (snap.metadata?.fromCache || snap.metadata?.hasPendingWrites) {
      // Served from the device cache / our own unsaved change: not billed.
      recordOp('free', where, 'docs' in snap ? Math.max(1, snap.size) : 1)
      return
    }
    if ('docs' in snap) {
      const n = first ? snap.size : snap.docChanges().filter((c) => c.type !== 'removed').length
      recordOp('read', where, first ? Math.max(1, n) : n)
    } else {
      recordOp('read', where, 1)
    }
    first = false
  }
  const wrapNext = (fn) => (snap) => {
    try { count(snap) } catch { /* counting must never break the app */ }
    fn?.(snap)
  }
  // onSnapshot(ref, next, error) | (ref, options, next, error) | (ref, observer)
  const rest = [...args]
  const optsIdx = typeof rest[0] === 'object' && rest[0] && typeof rest[0].next !== 'function' && typeof rest[1] === 'function' ? 0 : -1
  const cbIdx = optsIdx === 0 ? 1 : 0
  if (typeof rest[cbIdx] === 'function') rest[cbIdx] = wrapNext(rest[cbIdx])
  else if (rest[cbIdx] && typeof rest[cbIdx].next === 'function') {
    const obs = rest[cbIdx]
    rest[cbIdx] = { ...obs, next: wrapNext((s) => obs.next(s)) }
  }
  return real.onSnapshot(ref, ...rest)
}

export function setDoc(ref, ...a) {
  recordOp('write', collectionOf(ref), 1)
  audit('change', ref, a[0])
  return real.setDoc(ref, ...a)
}
export function addDoc(ref, ...a) {
  recordOp('write', collectionOf(ref), 1)
  audit('add', ref, a[0])
  return real.addDoc(ref, ...a)
}
export function updateDoc(ref, ...a) {
  recordOp('write', collectionOf(ref), 1)
  audit('update', ref, a[0], a)
  return real.updateDoc(ref, ...a)
}
export function deleteDoc(ref) {
  recordOp('delete', collectionOf(ref), 1)
  audit('delete', ref)
  return real.deleteDoc(ref)
}

export function writeBatch(db) {
  const batch = real.writeBatch(db)
  const wrap = (name, kind, verb) => {
    const orig = batch[name].bind(batch)
    batch[name] = (ref, ...a) => {
      recordOp(kind, collectionOf(ref), 1)
      audit(verb, ref, a[0], a)
      return orig(ref, ...a)
    }
  }
  wrap('set', 'write', 'change')
  wrap('update', 'write', 'update')
  wrap('delete', 'delete', 'delete')
  return batch
}

export function runTransaction(db, fn, opts) {
  return real.runTransaction(
    db,
    (tx) => {
      const wrapped = Object.create(tx)
      wrapped.get = async (ref) => {
        const snap = await tx.get(ref)
        recordOp('read', collectionOf(ref), 1)
        return snap
      }
      wrapped.set = (ref, ...a) => { recordOp('write', collectionOf(ref), 1); audit('change', ref, a[0]); tx.set(ref, ...a); return wrapped }
      wrapped.update = (ref, ...a) => { recordOp('write', collectionOf(ref), 1); audit('update', ref, a[0], a); tx.update(ref, ...a); return wrapped }
      wrapped.delete = (ref) => { recordOp('delete', collectionOf(ref), 1); audit('delete', ref); tx.delete(ref); return wrapped }
      return fn(wrapped)
    },
    opts
  )
}
