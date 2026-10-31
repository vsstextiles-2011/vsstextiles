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
import { recordOp } from './firestoreUsage.js'

export * from '@firebase/firestore'

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
  return real.setDoc(ref, ...a)
}
export function addDoc(ref, ...a) {
  recordOp('write', collectionOf(ref), 1)
  return real.addDoc(ref, ...a)
}
export function updateDoc(ref, ...a) {
  recordOp('write', collectionOf(ref), 1)
  return real.updateDoc(ref, ...a)
}
export function deleteDoc(ref) {
  recordOp('delete', collectionOf(ref), 1)
  return real.deleteDoc(ref)
}

export function writeBatch(db) {
  const batch = real.writeBatch(db)
  const wrap = (name, kind) => {
    const orig = batch[name].bind(batch)
    batch[name] = (ref, ...a) => {
      recordOp(kind, collectionOf(ref), 1)
      return orig(ref, ...a)
    }
  }
  wrap('set', 'write')
  wrap('update', 'write')
  wrap('delete', 'delete')
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
      wrapped.set = (ref, ...a) => { recordOp('write', collectionOf(ref), 1); tx.set(ref, ...a); return wrapped }
      wrapped.update = (ref, ...a) => { recordOp('write', collectionOf(ref), 1); tx.update(ref, ...a); return wrapped }
      wrapped.delete = (ref) => { recordOp('delete', collectionOf(ref), 1); tx.delete(ref); return wrapped }
      return fn(wrapped)
    },
    opts
  )
}
