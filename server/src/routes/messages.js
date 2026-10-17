import { Router } from 'express'
import { col } from '../db.js'
import { requireAdmin, wrap, HttpError } from '../auth.js'

const router = Router()
const t = (v, n) => String(v ?? '').trim().slice(0, n)

// Mirror a contact-form message (public, same limits as firestore.rules).
router.post('/', wrap(async (req, res) => {
  const b = req.body || {}
  const doc = { name: t(b.name, 100), email: t(b.email, 200), subject: t(b.subject, 200), message: t(b.message, 3000) }
  if (!doc.name || !doc.email || !doc.subject || !doc.message) throw new HttpError(400, 'name, email, subject and message are required')
  const r = await col('messages').insertOne({ ...doc, status: 'new', createdAt: new Date() })
  res.status(201).json({ id: r.insertedId })
}))

router.get('/', requireAdmin, wrap(async (_req, res) => {
  const docs = await col('messages').find().sort({ createdAt: -1 }).limit(500).toArray()
  res.json({ count: docs.length, messages: docs.map(({ _id, ...m }) => ({ id: _id, ...m })) })
}))

export default router
