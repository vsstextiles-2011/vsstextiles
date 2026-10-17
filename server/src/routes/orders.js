import { Router } from 'express'
import { col, cleanKeys } from '../db.js'
import { HttpError, requireAdmin, requireAuth, wrap } from '../auth.js'

const router = Router()
const toJson = ({ _id, ...rest }) => ({ id: _id, ...rest })
const STATUSES = [
  'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered',
  'cancelled', 'return-requested', 'returned', 'refunded',
]

// Mirror a freshly placed (or re-synced) order. The caller must own it (or be admin).
router.put('/:id', requireAuth, wrap(async (req, res) => {
  const { id: _ignore, _id, ...data } = req.body || {}
  if (!req.isAdmin && data.userId !== req.user.uid) throw new HttpError(403, 'You can only save your own orders')
  const existing = await col('orders').findOne({ _id: req.params.id }, { projection: { userId: 1 } })
  if (existing && existing.userId !== data.userId) throw new HttpError(409, 'Order belongs to someone else')
  await col('orders').replaceOne(
    { _id: req.params.id },
    { ...cleanKeys(data), syncedAt: new Date() },
    { upsert: true }
  )
  res.json({ id: req.params.id, saved: true })
}))

// Mirror a status change: { status, at, cancelledBy? }. Admin, or the owner cancelling.
router.patch('/:id/status', requireAuth, wrap(async (req, res) => {
  const { status, at, cancelledBy } = req.body || {}
  if (!STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`)
  const order = await col('orders').findOne({ _id: req.params.id })
  if (!order) throw new HttpError(404, 'Order not found in MongoDB yet - run "Sync all" in Admin > MongoDB')
  const owner = order.userId === req.user.uid
  if (!req.isAdmin && !(owner && status === 'cancelled')) throw new HttpError(403, 'Not allowed')
  await col('orders').updateOne(
    { _id: req.params.id },
    {
      $set: { status, statusUpdatedAt: new Date(), ...(cancelledBy ? { cancelledBy } : {}) },
      $push: { statusHistory: { status, at: at || new Date().toISOString() } },
    }
  )
  res.json({ id: req.params.id, status })
}))

// Bulk mirror (admin): { orders: [ {id, ...}, ... ] }
router.post('/sync', requireAdmin, wrap(async (req, res) => {
  const list = Array.isArray(req.body?.orders) ? req.body.orders : []
  if (!list.length) return res.json({ synced: 0 })
  const ops = list.filter((o) => o?.id).map(({ id, _id, ...data }) => ({
    replaceOne: { filter: { _id: id }, replacement: { ...cleanKeys(data), syncedAt: new Date() }, upsert: true },
  }))
  await col('orders').bulkWrite(ops, { ordered: false })
  res.json({ synced: ops.length })
}))

// My orders (from MongoDB).
router.get('/mine', requireAuth, wrap(async (req, res) => {
  const docs = await col('orders').find({ userId: req.user.uid }).sort({ placedAt: -1 }).toArray()
  res.json({ count: docs.length, orders: docs.map(toJson) })
}))

// All orders (admin): ?status=shipped&limit=100
router.get('/', requireAdmin, wrap(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : {}
  const limit = Math.min(Number(req.query.limit) || 200, 1000)
  const docs = await col('orders').find(filter).sort({ placedAt: -1 }).limit(limit).toArray()
  res.json({ count: docs.length, orders: docs.map(toJson) })
}))

export default router
