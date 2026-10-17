import { Router } from 'express'
import { col, cleanKeys } from '../db.js'
import { HttpError, requireAdmin, requireAuth, wrap } from '../auth.js'

const router = Router()
const toJson = ({ _id, ...rest }) => ({ id: _id, ...rest })
const t = (v, n) => String(v ?? '').trim().slice(0, n)

// Only the profile fields we want in MongoDB (never passwords - Firebase keeps those).
function cleanCustomer(b = {}) {
  const addresses = (Array.isArray(b.addresses) ? b.addresses : []).slice(0, 50).map((a) => ({
    id: t(a?.id, 60),
    label: t(a?.label, 40),
    fullName: t(a?.fullName, 100),
    phone: t(a?.phone, 20),
    pincode: t(a?.pincode, 10),
    line1: t(a?.line1, 300),
    area: t(a?.area, 200),
    city: t(a?.city, 100),
    state: t(a?.state, 60),
    isDefault: Boolean(a?.isDefault),
  }))
  return {
    name: t(b.name, 100),
    email: t(b.email, 200).toLowerCase(),
    phone: t(b.phone, 20),
    addresses,
    role: 'customer',
    createdAt: b.createdAt || null,
  }
}

// Mirror a customer's profile (name, email, phone, saved addresses).
// The signed-in customer can only write their OWN profile (uid comes from the login token); admin can write any.
router.put('/:uid', requireAuth, wrap(async (req, res) => {
  if (!req.isAdmin && req.params.uid !== req.user.uid) throw new HttpError(403, 'You can only save your own profile')
  const data = cleanCustomer(req.body)
  await col('customers').updateOne(
    { _id: req.params.uid },
    { $set: { ...cleanKeys(data), syncedAt: new Date() } },
    { upsert: true }
  )
  res.json({ id: req.params.uid, saved: true })
}))

// Bulk mirror (admin): { customers: [ {id, ...}, ... ] }
router.post('/sync', requireAdmin, wrap(async (req, res) => {
  const list = Array.isArray(req.body?.customers) ? req.body.customers : []
  const ops = list.filter((c) => c?.id).map((c) => ({
    updateOne: { filter: { _id: c.id }, update: { $set: { ...cleanKeys(cleanCustomer(c)), syncedAt: new Date() } }, upsert: true },
  }))
  if (ops.length) await col('customers').bulkWrite(ops, { ordered: false })
  res.json({ synced: ops.length })
}))

// All customers (admin): ?q=search text (name, email, phone, city, pincode), ?limit=
router.get('/', requireAdmin, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim()
  const rx = q && { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  const filter = rx
    ? { $or: [{ name: rx }, { email: rx }, { phone: rx }, { 'addresses.city': rx }, { 'addresses.pincode': rx }, { 'addresses.phone': rx }] }
    : {}
  const limit = Math.min(Number(req.query.limit) || 500, 2000)
  const docs = await col('customers').find(filter).sort({ createdAt: -1 }).limit(limit).toArray()
  res.json({ count: docs.length, customers: docs.map(toJson) })
}))

router.get('/:uid', requireAdmin, wrap(async (req, res) => {
  const doc = await col('customers').findOne({ _id: req.params.uid })
  if (!doc) throw new HttpError(404, 'Customer not found')
  res.json(toJson(doc))
}))

export default router
