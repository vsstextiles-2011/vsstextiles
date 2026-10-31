import { Router } from 'express'
import { col } from '../db.js'
import { requireAdmin, wrap } from '../auth.js'

const router = Router()
const NON_REVENUE = ['cancelled', 'refunded'] // same rule as the Admin Sales tab

const bump = (map, key, revenue, orders = 1, extra = {}) => {
  const cur = map.get(key) || { revenue: 0, orders: 0, ...extra }
  cur.revenue += revenue
  cur.orders += orders
  map.set(key, cur)
}

// GET /api/admin/reports/sales
// Computed in code from the stored orders (a shop-sized collection), so it behaves the
// same on any MongoDB version.
router.get('/sales', requireAdmin, wrap(async (_req, res) => {
  const orders = await col('orders')
    .find({}, { projection: { status: 1, placedAt: 1, 'totals.total': 1, 'address.state': 1, 'items.id': 1, 'items.name': 1, 'items.price': 1, 'items.quantity': 1 } })
    .limit(50000)
    .toArray()

  let revenue = 0
  let revenueOrders = 0
  const byStatus = new Map()
  const byMonth = new Map()
  const byState = new Map()
  const products = new Map()

  for (const o of orders) {
    byStatus.set(o.status || 'unknown', (byStatus.get(o.status || 'unknown') || 0) + 1)
    if (NON_REVENUE.includes(o.status)) continue
    const total = Number(o.totals?.total) || 0
    revenue += total
    revenueOrders += 1
    bump(byMonth, String(o.placedAt || '').slice(0, 7) || 'unknown', total)
    bump(byState, o.address?.state || 'Unknown', total)
    for (const it of o.items || []) {
      const qty = Number(it.quantity) || 1
      const cur = products.get(it.id) || { id: it.id, name: it.name, units: 0, revenue: 0 }
      cur.units += qty
      cur.revenue += (Number(it.price) || 0) * qty
      products.set(it.id, cur)
    }
  }

  const [productCount, orderCount, messageCount, customerCount] = await Promise.all([
    col('products').countDocuments(),
    col('orders').countDocuments(),
    col('messages').countDocuments(),
    col('customers').countDocuments(),
  ])

  res.json({
    revenue,
    orders: revenueOrders,
    stored: { products: productCount, orders: orderCount, messages: messageCount, customers: customerCount },
    byStatus: [...byStatus].map(([status, n]) => ({ status, orders: n })).sort((a, b) => b.orders - a.orders),
    byMonth: [...byMonth].map(([month, v]) => ({ month, revenue: v.revenue, orders: v.orders })).sort((a, b) => a.month.localeCompare(b.month)),
    byState: [...byState].map(([state, v]) => ({ state, revenue: v.revenue, orders: v.orders })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    topProducts: [...products.values()].sort((a, b) => b.units - a.units).slice(0, 10),
  })
}))

export default router
