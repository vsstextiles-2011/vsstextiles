import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDb, ping } from './db.js'
import { LOCAL_MODE, errorHandler, notFound, requireAdmin, wrap } from './auth.js'
import products from './routes/products.js'
import orders from './routes/orders.js'
import messages from './routes/messages.js'
import customers from './routes/customers.js'
import reports from './routes/reports.js'

const app = express()
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
// Allow the listed origins, plus the site on ANY localhost port (Vite moves to 5175, 5176... when a port is busy).
const isLocalhost = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || '')
app.use(cors({ origin: (origin, cb) => cb(null, !origin || !origins.length || origins.includes(origin) || isLocalhost(origin)) }))
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', wrap(async (_req, res) => {
  let mongo = false
  try { mongo = await ping() } catch { mongo = false }
  res.json({ status: 'ok', service: 'vss-textiles-server', mongo, time: new Date().toISOString() })
}))
// Used by the Admin > MongoDB tab to confirm the admin login works against this server.
app.get('/api/admin/check', requireAdmin, (req, res) => res.json({ admin: true, uid: req.user.uid }))

app.use('/api/products', products)
app.use('/api/orders', orders)
app.use('/api/messages', messages)
app.use('/api/customers', customers)
app.use('/api/admin/reports', reports)
app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
connectDb()
  .then(() => app.listen(port, '127.0.0.1', () => console.log(`VSS Textiles API on localhost:${port}/api/health  (MongoDB connected, ${LOCAL_MODE ? 'local mode' : 'Firebase admin check'})`)))
  .catch((err) => {
    console.error(`\n[server] Could not connect to MongoDB: ${err.message}`)
    console.error('[server] Check MONGODB_URI in server/.env (Atlas string, or a local MongoDB running).\n')
    process.exit(1)
  })
