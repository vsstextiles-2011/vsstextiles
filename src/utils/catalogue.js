// Product catalogues: ready-made PDFs (one per product, e.g. "Side Open Top"
// with a page for every colour / pattern) that the marketing team downloads
// from /catalogue. Admin -> Catalogue adds, replaces, hides and removes them.
//
// Stored in Firestore at siteContent/catalogue (anyone can read, only an admin
// can write - same rule as the other site content). The PDF files themselves
// live in public/catalogues (uploaded through the dev server, like product
// photos and videos) or can be any https link, e.g. Google Drive.
import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

const SITE_COLLECTION = 'siteContent'
const DOC_ID = 'catalogue'

// Shown until an admin saves their own list.
const DEFAULT_ITEMS = [
  {
    id: 'side-open-top',
    title: 'Side Open Top',
    subtitle: 'Ladies Outer Wear | Rayon | XS - 5XL | 20 colours & prints',
    pdf: '/catalogues/Side%20Open%20Top.pdf',
    cover: '/catalogues/covers/side-open-top.jpg',
    productType: '',
    active: true,
    updatedAt: '',
  },
]

const str = (v, d = '') => (typeof v === 'string' ? v : d)
const makeId = () => `cat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function normalizeItem(i) {
  return {
    id: str(i?.id) || makeId(),
    title: str(i?.title).trim(),
    subtitle: str(i?.subtitle).trim(),
    pdf: str(i?.pdf).trim(),
    cover: str(i?.cover).trim(),
    productType: str(i?.productType).trim(),
    active: i?.active !== false,
    updatedAt: str(i?.updatedAt),
  }
}

export const newCatalogueItem = () => normalizeItem({ id: makeId(), title: '', pdf: '' })

export function normalizeCatalogue(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    enabled: r.enabled !== false,
    requireSignIn: r.requireSignIn === true,
    title: str(r.title, 'Product Catalogues').trim() || 'Product Catalogues',
    intro: str(r.intro, 'Download the latest catalogue for each product - every colour and print in one PDF, ready to share.'),
    items: (Array.isArray(r.items) ? r.items : DEFAULT_ITEMS).map(normalizeItem),
  }
}

// `enabled` = false skips the Firestore listener (used for visitors who are not
// allowed to see the catalogue; the rules would refuse them anyway).
export function useCatalogueSettings(enabled = true) {
  const [settings, setSettings] = useState(() => normalizeCatalogue(null))
  const [loaded, setLoaded] = useState(false)
  useEffect(
    () => {
      if (!enabled) return undefined
      return onSnapshot(
        doc(db, SITE_COLLECTION, DOC_ID),
        (snap) => {
          setSettings(normalizeCatalogue(snap.exists() ? snap.data() : null))
          setLoaded(true)
        },
        (err) => {
          console.error('Firestore catalogue listener failed:', err)
          setLoaded(true)
        }
      )
    },
    [enabled]
  )
  return { settings, loaded: enabled ? loaded : true }
}

export function saveCatalogueSettings(next) {
  const clean = normalizeCatalogue(next)
  clean.items = clean.items.filter((i) => i.title || i.pdf)
  return setDoc(doc(db, SITE_COLLECTION, DOC_ID), { ...clean, updatedAt: serverTimestamp() })
}

// Only these can be opened by customers.
export const isLiveItem = (i) => i.active && !!i.pdf

// Plain-English summary of what an admin changed, for the Activity Log.
export function describeCatalogueChange(before, after) {
  const parts = []
  const old = new Map(before.items.map((i) => [i.id, i]))
  const now = new Map(after.items.map((i) => [i.id, i]))
  after.items.forEach((i) => {
    const o = old.get(i.id)
    if (!o) parts.push(`added "${i.title || 'Untitled'}"`)
    else {
      if (o.pdf !== i.pdf) parts.push(`replaced PDF of "${i.title || 'Untitled'}"`)
      if (o.active !== i.active) parts.push(`${i.active ? 'showed' : 'hid'} "${i.title || 'Untitled'}"`)
      if (o.title !== i.title) parts.push(`renamed "${o.title}" to "${i.title}"`)
    }
  })
  before.items.forEach((i) => {
    if (!now.has(i.id)) parts.push(`removed "${i.title || 'Untitled'}"`)
  })
  if (before.enabled !== after.enabled) parts.push(after.enabled ? 'switched the page on' : 'switched the page off')
  if (before.requireSignIn !== after.requireSignIn) parts.push(after.requireSignIn ? 'sign-in now required' : 'sign-in no longer required')
  return parts.length ? `Catalogue: ${parts.join('; ')}` : 'Catalogue: page text updated'
}

export const catalogueFileName = (item) =>
  `${(item.title || 'catalogue').replace(/[^a-z0-9]+/gi, ' ').trim() || 'catalogue'}.pdf`

export const formatUpdated = (iso) => {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

// Uploads a PDF through the dev server (see vite.config.js). Resolves to { path, name }.
export async function uploadCataloguePdf(file) {
  if (!file) throw new Error('No file chosen')
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('Please choose a PDF file')
  const res = await fetch('/api/upload-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf', 'X-File-Name': encodeURIComponent(file.name.replace(/\.pdf$/i, '') + '.pdf') },
    body: file,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function uploadCatalogueCover(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please choose an image file')
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
    body: file,
  })
  if (!res.ok) throw new Error('Upload failed')
  return (await res.json()).path
}

// ---------------------------------------------------------------------------
// Who may see the catalogue
// ---------------------------------------------------------------------------
// Only admins and the staff an admin lists in Admin -> Catalogue -> "Who can see
// the catalogue". Each staff member is one Firestore document
// catalogueStaff/<their email in lower case> = { name, email, phone }. They get
// in only when they are signed in with that email AND the phone number saved in
// their profile (My Profile -> My Details) is the same 10 digits. The very same
// check is enforced by firestore.rules, which also hides the catalogue data
// (siteContent/catalogue) from everyone else.
const STAFF_COLLECTION = 'catalogueStaff'
export const staffKey = (email) => String(email || '').trim().toLowerCase()
export const staffPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10)

const accessCache = new Map() // uid|email -> boolean (for this browser session)

// Is this signed-in account company staff (or an admin)? Cached per browser session.
// Also keeps users/<uid>.isStaff and catalogueStaff/<email>.uid up to date.
export async function checkStaff(user, isAdmin = false) {
  if (isAdmin) return true
  if (!user || user.isAnonymous || !user.email) return false
  const key = `${user.uid}|${staffKey(user.email)}`
  if (accessCache.has(key)) return accessCache.get(key)
  let ok = false
  try {
    const staffRef = doc(db, STAFF_COLLECTION, staffKey(user.email))
    const userRef = doc(db, 'users', user.uid)
    const [snap, u] = await Promise.all([getDoc(staffRef), getDoc(userRef)])
    const profile = u.data() || {}
    if (snap.exists()) {
      const need = staffPhone(snap.data().phone)
      ok = !need || staffPhone(profile.phone) === need
    }
    accessCache.set(key, ok)
    // Identify the account as staff in Firebase: users/<uid>.isStaff follows the
    // staff list (firestore.rules only lets it be true for real staff), and the
    // staff entry remembers which account signed in (shown in Admin).
    if (u.exists() && (profile.isStaff === true) !== ok) updateDoc(userRef, { isStaff: ok }).catch(() => {})
    if (ok && snap.exists() && snap.data().uid !== user.uid) {
      updateDoc(staffRef, { uid: user.uid, linkedAt: serverTimestamp() }).catch(() => {})
    }
  } catch {
    ok = false
  }
  return ok
}

export function useCatalogueAccess() {
  const { user, isAdmin, loading } = useAuth()
  const [state, setState] = useState({ allowed: false, checking: true })
  useEffect(() => {
    if (loading) return undefined
    let cancelled = false
    setState((s) => ({ ...s, checking: true }))
    checkStaff(user, isAdmin).then((ok) => { if (!cancelled) setState({ allowed: ok, checking: false }) })
    return () => { cancelled = true }
  }, [loading, isAdmin, user?.uid, user?.email])
  return state
}

// Same check under a clearer name for non-catalogue features (staff-only coupons).
export const useStaffAccess = useCatalogueAccess

// Admin only: live list of the staff allowed to see the catalogue.
export function useCatalogueStaff() {
  const [staff, setStaff] = useState([])
  const [error, setError] = useState('')
  useEffect(
    () =>
      onSnapshot(
        collection(db, STAFF_COLLECTION),
        (snap) => {
          setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email))))
          setError('')
        },
        (err) => setError(err?.code === 'permission-denied' ? 'Publish the updated firestore.rules in Firebase Console, then reload.' : err?.message || 'Could not load the staff list')
      ),
    []
  )
  return { staff, error }
}

export function addCatalogueStaff({ name, email, phone }) {
  const key = staffKey(email)
  return setDoc(doc(db, STAFF_COLLECTION, key), {
    name: String(name || '').trim().slice(0, 80),
    email: key,
    phone: staffPhone(phone),
    addedAt: serverTimestamp(),
  })
}

export function removeCatalogueStaff(email) {
  return deleteDoc(doc(db, STAFF_COLLECTION, staffKey(email)))
}
