// Optional MongoDB mirror.
//
// Firebase (Auth + Firestore) stays the live database the website runs on.
// When VITE_MONGO_API_URL is set in .env, the site ALSO copies products,
// orders and contact messages into MongoDB through the backend in /server,
// so you can run reports/search on MongoDB and keep a second copy of your data.
//
// Everything here is best-effort and silent: if the backend is down or the
// URL is not set, the website works exactly as before.
import { auth } from '../firebase.js'

const BASE = String(import.meta.env.VITE_MONGO_API_URL || '').replace(/\/$/, '')
export const mongoEnabled = Boolean(BASE)
export const mongoApiUrl = BASE

// Firestore Timestamps / Dates -> ISO strings, undefined dropped, so the data is plain JSON.
export function plain(value) {
  if (value === undefined || typeof value === 'function') return undefined
  if (value === null) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((v) => plain(v)).filter((v) => v !== undefined)
  if (typeof value === 'object') {
    const out = {}
    Object.entries(value).forEach(([k, v]) => {
      const pv = plain(v)
      if (pv !== undefined) out[k] = pv
    })
    return out
  }
  return value
}

async function request(method, path, body, { authed = true } = {}) {
  if (!mongoEnabled) throw new Error('MongoDB sync is off (VITE_MONGO_API_URL is not set)')
  const headers = { 'Content-Type': 'application/json' }
  if (authed) {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

// Fire-and-forget: never throws, never blocks the shopper/admin.
function quietly(promise) {
  promise.catch((err) => console.warn('[MongoDB sync]', err.message))
}

const productForMongo = ({ id, restorePoint, ...rest }) => ({ id, ...plain(rest) })
const orderForMongo = ({ id, ...rest }) => ({ id, ...plain(rest) })

// ---- queued product mirroring (admin edits come in bursts) ----
let upserts = new Map()
let removals = new Set()
let timer = null
function flushProducts() {
  timer = null
  const up = [...upserts.values()]
  const rm = [...removals]
  upserts = new Map()
  removals = new Set()
  if (up.length) quietly(request('POST', '/products/sync', { products: up }))
  rm.forEach((id) => quietly(request('DELETE', `/products/${encodeURIComponent(id)}`)))
}
export function mirrorProductChange(type, product) {
  if (!mongoEnabled) return
  if (type === 'removed') {
    upserts.delete(product.id)
    removals.add(product.id)
  } else {
    removals.delete(product.id)
    upserts.set(product.id, productForMongo(product))
  }
  if (!timer) timer = setTimeout(flushProducts, 800)
}

// Retry a few times so a change made while the server was restarting still arrives.
async function withRetry(fn, delays = [1500, 5000, 15000]) {
  for (let i = 0; ; i++) {
    try { return await fn() } catch (err) {
      if (i >= delays.length) throw err
      await new Promise((r) => setTimeout(r, delays[i]))
    }
  }
}

// Copy ONE order (new order, status change, edit) to MongoDB right away.
export function mirrorOrder(order) {
  if (!mongoEnabled || !order?.id) return
  const { id, ...rest } = orderForMongo(order)
  quietly(withRetry(() => request('PUT', `/orders/${encodeURIComponent(id)}`, rest)))
}

// Copy ONE order to MongoDB and tell the caller whether it worked (used by the admin
// "Save Status" button so it can say "MongoDB updated" or warn). One quick attempt is
// awaited; if it fails the copy keeps retrying in the background.
export async function saveOrderToMongo(order) {
  if (!mongoEnabled || !order?.id) return false
  const { id, ...rest } = orderForMongo(order)
  const send = () => request('PUT', `/orders/${encodeURIComponent(id)}`, rest)
  try {
    await send()
    return true
  } catch (err) {
    console.warn('[MongoDB sync]', err.message)
    quietly(withRetry(send))
    return false
  }
}

// Catch-up copy of every order (used once when the admin panel opens), so anything
// changed while the server was off is copied too. Admin only; silent on failure.
let orderCatchUpDone = false
export function mirrorAllOrdersOnce(orders) {
  if (!mongoEnabled || orderCatchUpDone || !orders?.length) return
  orderCatchUpDone = true
  const list = orders.map(orderForMongo)
  quietly(withRetry(async () => {
    for (let i = 0; i < list.length; i += 100) await request('POST', '/orders/sync', { orders: list.slice(i, i + 100) })
  }).catch((e) => { orderCatchUpDone = false; throw e }))
}

// Copy a customer's profile (name, email, phone, saved addresses) to the MongoDB "customers"
// collection. Called whenever the profile changes (see AuthContext). Skips if nothing changed.
const lastCustomerSent = new Map()
export function mirrorCustomer(uid, profile) {
  if (!mongoEnabled || !uid || !profile) return
  const body = plain({
    name: profile.name, email: profile.email, phone: profile.phone,
    addresses: profile.addresses, createdAt: profile.createdAt,
  })
  const key = JSON.stringify(body)
  if (lastCustomerSent.get(uid) === key) return
  lastCustomerSent.set(uid, key)
  quietly(withRetry(() => request('PUT', `/customers/${encodeURIComponent(uid)}`, body)).catch((e) => { lastCustomerSent.delete(uid); throw e }))
}

export function mirrorContactMessage(message) {
  if (!mongoEnabled) return
  quietly(request('POST', '/messages', message, { authed: false }))
}

// ---- used by Admin > MongoDB ----
async function inChunks(list, size, send) {
  let done = 0
  for (let i = 0; i < list.length; i += size) {
    await send(list.slice(i, i + size))
    done += Math.min(size, list.length - i)
  }
  return done
}

export const mongoAdmin = {
  health: () => request('GET', '/health', undefined, { authed: false }),
  adminCheck: () => request('GET', '/admin/check'),
  salesReport: () => request('GET', '/admin/reports/sales'),
  syncAllProducts: (products) =>
    inChunks(products.map(productForMongo), 100, (chunk) => request('POST', '/products/sync', { products: chunk })),
  listCustomers: (q = '') => request('GET', `/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  syncAllOrders: (orders) =>
    inChunks(orders.map(orderForMongo), 100, (chunk) => request('POST', '/orders/sync', { orders: chunk })),
}
