import { Router } from 'express'
import { col, cleanKeys } from '../db.js'
import { HttpError, requireAdmin, wrap } from '../auth.js'

const router = Router()
const toJson = ({ _id, ...rest }) => ({ id: _id, ...rest })

// GET /api/products?category=men&type=T-Shirts&q=polo&inStock=true&minPrice=100&maxPrice=500&limit=50&skip=0
router.get('/', wrap(async (req, res) => {
  const { category, type, q, inStock, minPrice, maxPrice } = req.query
  const filter = {}
  if (category) filter.category = String(category)
  if (type) filter.type = String(type)
  if (inStock === 'true') filter.inStock = { $ne: false }
  if (inStock === 'false') filter.inStock = false
  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice) filter.price.$gte = Number(minPrice)
    if (maxPrice) filter.price.$lte = Number(maxPrice)
  }
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { type: rx }, { category: rx }, { fabric: rx }]
  }
  const limit = Math.min(Number(req.query.limit) || 100, 1000)
  const skip = Number(req.query.skip) || 0
  const [docs, total] = await Promise.all([
    col('products').find(filter).skip(skip).limit(limit).toArray(),
    col('products').countDocuments(filter),
  ])
  res.json({ total, count: docs.length, products: docs.map(toJson) })
}))

router.get('/:id', wrap(async (req, res) => {
  const doc = await col('products').findOne({ _id: req.params.id })
  if (!doc) throw new HttpError(404, 'Product not found')
  res.json(toJson(doc))
}))

// Mirror one product (full document). Admin only.
router.put('/:id', requireAdmin, wrap(async (req, res) => {
  const { id: _ignore, _id, ...data } = req.body || {}
  await col('products').replaceOne(
    { _id: req.params.id },
    { ...cleanKeys(data), syncedAt: new Date() },
    { upsert: true }
  )
  res.json({ id: req.params.id, saved: true })
}))

// Mirror a partial update: { set: {...}, unset: ['field', ...] }. Admin only.
router.patch('/:id', requireAdmin, wrap(async (req, res) => {
  const { set = {}, unset = [] } = req.body || {}
  const update = { $set: { ...cleanKeys(set), syncedAt: new Date() } }
  if (unset.length) update.$unset = Object.fromEntries(unset.map((k) => [k, '']))
  await col('products').updateOne({ _id: req.params.id }, update, { upsert: true })
  res.json({ id: req.params.id, saved: true })
}))

router.delete('/:id', requireAdmin, wrap(async (req, res) => {
  await col('products').deleteOne({ _id: req.params.id })
  res.json({ deleted: req.params.id })
}))

// Bulk mirror: { products: [ {id, ...}, ... ] }. Admin only.
router.post('/sync', requireAdmin, wrap(async (req, res) => {
  const list = Array.isArray(req.body?.products) ? req.body.products : []
  if (!list.length) return res.json({ synced: 0 })
  const ops = list.filter((p) => p?.id).map(({ id, _id, ...data }) => ({
    replaceOne: { filter: { _id: id }, replacement: { ...cleanKeys(data), syncedAt: new Date() }, upsert: true },
  }))
  const r = await col('products').bulkWrite(ops, { ordered: false })
  res.json({ synced: ops.length, inserted: r.upsertedCount, updated: r.modifiedCount })
}))

export default router
