// Admin activity log: a short, tamper-proof record of who changed what.
//
// Every admin action that matters (price edits, product add/delete, stock and
// visibility changes, order status changes, coupon changes) writes one small
// document to the Firestore "activityLog" collection. firestore.rules lets an
// admin ADD entries (stamped with their own uid) and READ them, but nobody can
// edit or delete an entry afterwards - so it can be trusted when something
// goes wrong. It is shown in Admin -> Activity Log.
//
// Logging is best-effort: a failure here never blocks or undoes the real change.
import { useEffect, useState } from 'react'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { stripUndefined } from './stripUndefined.js'
import { formatPrice } from './formatPrice.js'

const LOG_COLLECTION = 'activityLog'

// Product fields that are bookkeeping, not an admin decision - never logged.
const NOISY_FIELDS = new Set(['syncedAt', 'restorePoint', 'updatedAt', 'createdAt', 'groupSlug', 'lastOrderId'])
const isNoisy = (field) => NOISY_FIELDS.has(field) || /^order[A-Z]/.test(field) // homepage ordering numbers

const FIELD_LABELS = {
  price: 'Price',
  oldPrice: 'Old price',
  discount: 'Discount',
  sizePricing: 'Per-size prices',
  inStock: 'Stock status',
  stockQty: 'Stock quantity',
  sizeStock: 'Stock by size',
  variantStock: 'Stock by colour & size',
  isVisible: 'Visibility',
  name: 'Name',
  image: 'Photo',
}
const PRICE_FIELDS = new Set(['price', 'oldPrice', 'sizePricing'])
const label = (f) => FIELD_LABELS[f] || f

function show(field, value) {
  if (value === undefined || value === null || value === '') return '(none)'
  if (field === 'price' || field === 'oldPrice') return formatPrice(value)
  if (field === 'inStock') return value === false ? 'Out of stock' : 'In stock'
  if (field === 'isVisible') return value === false ? 'Hidden' : 'Visible'
  if ((field === 'sizeStock' || field === 'variantStock') && value && typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${k.replace('|', ' ').trim()} ${v}`).join(', ') || '(none)'
  }
  if (typeof value === 'object') return 'changed'
  const s = String(value)
  return s.length > 60 ? `${s.slice(0, 57)}...` : s
}

const same = (a, b) => {
  try { return JSON.stringify(a ?? null) === JSON.stringify(b ?? null) } catch { return a === b }
}

// Compares a product's saved values with the incoming changes and returns the
// list of real differences: [{ field, from, to }]. `only` limits it to some fields.
export function diffProduct(before, changes, only) {
  const out = []
  Object.keys(changes || {}).forEach((field) => {
    if (isNoisy(field)) return
    if (only && !only.includes(field)) return
    const from = before?.[field]
    const to = changes[field]
    if (same(from, to)) return
    // Treat "missing" and "false/none" for flags the same way the storefront does.
    if (field === 'inStock' && (from !== false) === (to !== false)) return
    if (field === 'isVisible' && (from !== false) === (to !== false)) return
    out.push({ field, from: show(field, from), to: show(field, to) })
  })
  return out
}

const describeChanges = (changes) =>
  changes.slice(0, 4).map((c) => `${label(c.field)}: ${c.from} \u2192 ${c.to}`).join(', ') +
  (changes.length > 4 ? ` (+${changes.length - 4} more)` : '')

// Writes one entry. Never throws.
export function logActivity({ action, targetType = 'product', targetId, targetName, summary, changes }) {
  try {
    const user = auth.currentUser
    if (!user || user.isAnonymous) return
    const entry = stripUndefined({
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      targetName: targetName ? String(targetName).slice(0, 150) : undefined,
      summary: String(summary || action).slice(0, 400),
      changes: changes?.length ? changes.slice(0, 20) : undefined,
      actorUid: user.uid,
      actorName: user.displayName || undefined,
      actorEmail: user.email || undefined,
      createdAt: serverTimestamp(),
    })
    addDoc(collection(db, LOG_COLLECTION), entry).catch((err) => console.warn('[activity log]', err.message))
  } catch (err) {
    console.warn('[activity log]', err.message)
  }
}

// ---- helpers used by ProductContext ----

// One product edited (Edit form, stock toggle, hide/show, quick price edit...).
export function logProductEdit(before, changes) {
  const diff = diffProduct(before, changes)
  if (!diff.length) return
  const priceChanged = diff.some((d) => PRICE_FIELDS.has(d.field))
  logActivity({
    action: priceChanged ? 'price_change' : 'product_edit',
    targetId: before?.id,
    targetName: before?.name,
    summary: describeChanges(diff),
    changes: diff,
  })
}

// Several products at once (bulk edit, section price editor). Only the fields an
// owner cares about are logged, so reordering a homepage row doesn't flood the log.
const BULK_FIELDS = ['price', 'oldPrice', 'discount', 'sizePricing', 'inStock', 'isVisible', 'stockQty', 'sizeStock', 'variantStock']
export function logBulkProductEdits(updates, findProduct) {
  updates.forEach(({ id, changes }) => {
    const before = findProduct(id)
    const diff = diffProduct(before, changes || {}, BULK_FIELDS)
    if (!diff.length) return
    logActivity({
      action: diff.some((d) => PRICE_FIELDS.has(d.field)) ? 'price_change' : 'product_edit',
      targetId: id,
      targetName: before?.name,
      summary: describeChanges(diff),
      changes: diff,
    })
  })
}

// ---- reading the log (Admin only) ----
export function useActivityLog(max = 300) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const q = query(collection(db, LOG_COLLECTION), orderBy('createdAt', 'desc'), limit(max))
    return onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError('')
      },
      (err) => {
        setLoading(false)
        setError(
          err?.code === 'permission-denied'
            ? 'Firestore blocked reading the activity log. Publish the updated firestore.rules in Firebase Console.'
            : err.message || 'Could not load the activity log.'
        )
      }
    )
  }, [max])
  return { entries, loading, error }
}
