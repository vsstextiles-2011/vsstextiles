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
import { PROMO_CODES } from './promo.js'

const SITE_COLLECTION = 'siteContent'
const DOC_ID = 'promoCodes'

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

export function usePromoCodes() {
  const [codes, setCodes] = useState(DEFAULT_PROMO_CODES)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    return onSnapshot(
      doc(db, SITE_COLLECTION, DOC_ID),
      (snap) => {
        setCodes(fromSnap(snap))
        setLoaded(true)
      },
      () => setLoaded(true)
    )
  }, [])
  return { codes, loaded }
}

// One-off read used when an order is placed (always the freshest list).
export async function fetchPromoCodes() {
  try {
    return fromSnap(await getDoc(doc(db, SITE_COLLECTION, DOC_ID)))
  } catch {
    return DEFAULT_PROMO_CODES
  }
}

export function savePromoCodes(codes) {
  return setDoc(doc(db, SITE_COLLECTION, DOC_ID), { codes: normalize(codes), updatedAt: serverTimestamp() })
}

export function describePromo(def) {
  return def.type === 'percent' ? `${Math.round(def.value * 1000) / 10}% off` : `₹${def.value} off`
}
