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

// Catalogue staff (set from Admin -> Catalogue -> "Who can see the catalogue"):
// kept in their own "catalogueStaff" collection AND flagged on the matching
// customer document (role: 'staff', isStaff: true), so they stand out in MongoDB.
async function applyStaffRoles(emails) {
  const staff = await col('catalogueStaff').find(emails ? { _id: { $in: emails } } : {}).toArray()
  if (!staff.length) return 0
  await col('customers').updateMany(
    { email: { $in: staff.map((s) => s._id) } },
    { $set: { role: 'staff', isStaff: true } }
  )
  return staff.length
}

router.get('/staff', requireAdmin, wrap(async (_req, res) => {
  const docs = await col('catalogueStaff').find({}).sort({ name: 1 }).toArray()
  res.json({ count: docs.length, staff: docs.map(toJson) })
}))

router.put('/staff/:email', requireAdmin, wrap(async (req, res) => {
  const email = t(req.params.email, 200).toLowerCase()
  if (!email) throw new HttpError(400, 'Email is required')
  await col('catalogueStaff').updateOne(
    { _id: email },
    { $set: { email, name: t(req.body?.name, 100), phone: t(req.body?.phone, 20), role: 'staff', syncedAt: new Date() }, $setOnInsert: { addedAt: new Date() } },
    { upsert: true }
  )
  await applyStaffRoles([email])
  res.json({ email, staff: true })
}))

router.delete('/staff/:email', requireAdmin, wrap(async (req, res) => {
  const email = t(req.params.email, 200).toLowerCase()
  await col('catalogueStaff').deleteOne({ _id: email })
  await col('customers').updateMany({ email }, { $set: { role: 'customer', isStaff: false } })
  res.json({ email, staff: false })
}))

// Mirror a customer's profile (name, email, phone, saved addresses).
// The signed-in customer can only write their OWN profile (uid comes from the login token); admin can write any.
router.put('/:uid', requireAuth, wrap(async (req, res) => {
  if (!req.isAdmin && req.params.uid !== req.user.uid) throw new HttpError(403, 'You can only save your own profile')
  const data = cleanCustomer(req.body)
  // A customer's own sync never changes staff status: it follows the staff list.
  const isStaff = !!data.email && !!(await col('catalogueStaff').findOne({ _id: data.email }, { projection: { _id: 1 } }))
  data.role = isStaff ? 'staff' : 'customer'
  data.isStaff = isStaff
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
  await applyStaffRoles()
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
