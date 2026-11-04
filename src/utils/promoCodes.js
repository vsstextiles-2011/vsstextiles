// Promo codes that the admin edits (Admin -> Coupons), stored in Firestore at
// siteContent/promoCodes and read live by the cart, checkout and order placement.
// Until the admin saves their own list, the built-in defaults in utils/promo.js
// (VSS10) are used, so the site never has "no codes" by accident.
//
// Stored shape: { codes: { VSS10: { type, value, minCartTotal, firstOrderOnly, active, expiresAt } } }
//  - type: 'percent' (value is a fraction, 0.1 = 10%) or 'flat' (value in rupees)
//  - expiresAt: 'YYYY-MM-DD' (last valid day) or ''
import { useEffect, useState } from 'react'
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useStaffAccess } from './catalogue.js'
import { PROMO_CODES } from './promo.js'
import { logActivity } from './activityLog.js'

const SITE_COLLECTION = 'siteContent'
const DOC_ID = 'promoCodes'
// Staff-only codes live in their OWN document, which firestore.rules lets only
// admins and company staff read - so customers can't even see these code names.
const STAFF_DOC_ID = 'staffPromoCodes'

function normalize(raw) {
  const out = {}
  Object.entries(raw || {}).forEach(([key, d]) => {
    const code = String(key).trim().toUpperCase()
    if (!code || !d) return
    const value = Number(d.value)
    if (!Number.isFinite(value) || value <= 0) return
    out[code] = {
      type: d.type === 'flat' ? 'flat' : 'percent',
      value,
      ...(Number(d.minCartTotal) > 0 ? { minCartTotal: Number(d.minCartTotal) } : {}),
      firstOrderOnly: !!d.firstOrderOnly,
      active: d.active !== false,
      expiresAt: typeof d.expiresAt === 'string' ? d.expiresAt : '',
      ...(d.staffOnly ? { staffOnly: true } : {}),
    }
  })
  return out
}

export const DEFAULT_PROMO_CODES = normalize(PROMO_CODES)

function fromSnap(snap) {
  if (!snap.exists()) return DEFAULT_PROMO_CODES
  const data = snap.data()
  return normalize(data?.codes)
}

// Local calendar day as YYYY-MM-DD.
function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// A code works when it is switched on and hasn't passed its last valid day.
export function isPromoActive(def) {
  if (!def || def.active === false) return false
  return !def.expiresAt || today() <= def.expiresAt
}

const staffFromSnap = (snap) => {
  const raw = snap.exists() ? snap.data()?.codes : {}
  const out = {}
  Object.entries(raw || {}).forEach(([k, v]) => { out[k] = { ...v, staffOnly: true } })
  return normalize(out)
}

export function usePromoCodes() {
  const { allowed: isStaff, checking } = useStaffAccess()
  const [publicCodes, setPublicCodes] = useState(DEFAULT_PROMO_CODES)
  const [staffCodes, setStaffCodes] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [staffLoaded, setStaffLoaded] = useState(false)
  useEffect(() => {
    return onSnapshot(
      doc(db, SITE_COLLECTION, DOC_ID),
      (snap) => {
        setPublicCodes(fromSnap(snap))
        setLoaded(true)
      },
      () => setLoaded(true)
    )
  }, [])
  useEffect(() => {
    if (!isStaff) { setStaffCodes({}); setStaffLoaded(true); return undefined }
    setStaffLoaded(false)
    return onSnapshot(
      doc(db, SITE_COLLECTION, STAFF_DOC_ID),
      (snap) => { setStaffCodes(staffFromSnap(snap)); setStaffLoaded(true) },
      () => { setStaffCodes({}); setStaffLoaded(true) }
    )
  }, [isStaff])
  return { codes: { ...publicCodes, ...staffCodes }, loaded: loaded && !checking && staffLoaded, isStaff }
}

// One-off read used when an order is placed (always the freshest list).
export async function fetchPromoCodes({ includeStaff = false } = {}) {
  let pub = DEFAULT_PROMO_CODES
  try { pub = fromSnap(await getDoc(doc(db, SITE_COLLECTION, DOC_ID))) } catch { /* keep defaults */ }
  if (!includeStaff) return pub
  try { return { ...pub, ...staffFromSnap(await getDoc(doc(db, SITE_COLLECTION, STAFF_DOC_ID))) } } catch { return pub }
}

export async function savePromoCodes(codes) {
  const next = normalize(codes)
  let before = {}
  try { before = await fetchPromoCodes({ includeStaff: true }) } catch { /* log without a diff */ }
  // Staff-only codes are saved in their own protected document, the rest in the public one.
  const pub = Object.fromEntries(Object.entries(next).filter(([, d]) => !d.staffOnly))
  const staff = Object.fromEntries(Object.entries(next).filter(([, d]) => d.staffOnly))
  await setDoc(doc(db, SITE_COLLECTION, DOC_ID), { codes: pub, updatedAt: serverTimestamp() })
  await setDoc(doc(db, SITE_COLLECTION, STAFF_DOC_ID), { codes: staff, updatedAt: serverTimestamp() })
  const parts = []
  Object.keys(next).forEach((c) => {
    if (!before[c]) parts.push(`added ${c} (${describePromo(next[c])})`)
    else if (JSON.stringify(before[c]) !== JSON.stringify(next[c])) parts.push(`changed ${c} (${describePromo(before[c])} \u2192 ${describePromo(next[c])}${before[c].active !== next[c].active ? `, ${next[c].active ? 'switched on' : 'switched off'}` : ''})`)
  })
  Object.keys(before).forEach((c) => { if (!next[c]) parts.push(`deleted ${c}`) })
  if (parts.length) logActivity({ action: 'coupon_change', targetType: 'coupon', summary: `Coupons: ${parts.join('; ')}` })
}

export function describePromo(def) {
  return def.type === 'percent' ? `${Math.round(def.value * 1000) / 10}% off` : `₹${def.value} off`
}
