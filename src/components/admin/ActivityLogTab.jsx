import { useMemo, useState } from 'react'
import { History, Search, Tag, Truck, Package, IndianRupee, Trash2, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useActivityLog } from '../../utils/activityLog.js'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'price', label: 'Prices' },
  { id: 'delete', label: 'Deletions' },
  { id: 'product', label: 'Products' },
  { id: 'order', label: 'Orders' },
  { id: 'coupon', label: 'Coupons' },
]

const ACTION_META = {
  price_change: { label: 'Price change', icon: IndianRupee, cls: 'bg-amber-100 text-amber-800' },
  product_edit: { label: 'Product edit', icon: Pencil, cls: 'bg-blue-100 text-blue-800' },
  product_add: { label: 'Product added', icon: Plus, cls: 'bg-green-100 text-green-800' },
  product_delete: { label: 'Deleted', icon: Trash2, cls: 'bg-red-100 text-red-700' },
  product_restore: { label: 'Restored', icon: RotateCcw, cls: 'bg-purple-100 text-purple-800' },
  catalog_reset: { label: 'Catalog reset', icon: Package, cls: 'bg-red-100 text-red-700' },
  stock_restore: { label: 'Stock back', icon: Package, cls: 'bg-teal-100 text-teal-800' },
  order_status: { label: 'Order status', icon: Truck, cls: 'bg-sky-100 text-sky-800' },
  coupon_change: { label: 'Coupon', icon: Tag, cls: 'bg-pink-100 text-pink-800' },
  catalogue_change: { label: 'Catalogue', icon: History, cls: 'bg-indigo-100 text-indigo-800' },
}

function matchesFilter(e, filter) {
  if (filter === 'all') return true
  if (filter === 'price') return e.action === 'price_change'
  if (filter === 'delete') return e.action === 'product_delete' || e.action === 'catalog_reset'
  if (filter === 'product') return e.targetType === 'product' || !e.targetType
  if (filter === 'order') return e.targetType === 'order'
  if (filter === 'coupon') return e.targetType === 'coupon'
  return true
}

const entryDate = (e) => (e.createdAt?.toDate ? e.createdAt.toDate() : null)

function formatWhen(d) {
  if (!d) return 'Just now'
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Admin -> Activity Log: who changed a price, deleted a product, moved an order, etc.
// Read-only on purpose - entries can't be edited or removed (see firestore.rules).
export default function ActivityLogTab() {
  const { entries, loading, error } = useActivityLog(300)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (!matchesFilter(e, filter)) return false
      if (!q) return true
      return [e.summary, e.targetName, e.targetId, e.actorName, e.actorEmail].some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [entries, filter, search])

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><History size={17} /></div>
        <div>
          <p className="text-sm font-semibold text-ink">Activity log</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            A record of who changed a price, added or deleted a product, updated an order or edited a coupon. Entries cannot be
            edited or deleted. Shows the latest 300.
          </p>
        </div>
      </div>

      <div className="card-base p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === f.id ? 'bg-brand text-white border-brand' : 'bg-white text-ink-soft border-thread hover:border-brand'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, person, order..."
              className="w-full border border-thread rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-ink-soft py-8 text-center">Loading activity...</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-ink-soft py-8 text-center">
            {entries.length ? 'Nothing matches that filter.' : 'No activity yet. Changes you make from now on will appear here.'}
          </p>
        ) : (
          <ul className="divide-y divide-thread/60">
            {shown.map((e) => {
              const meta = ACTION_META[e.action] || { label: 'Change', icon: History, cls: 'bg-gray-100 text-gray-700' }
              const Icon = meta.icon
              return (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${meta.cls}`}>
                    <Icon size={12} /> {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    {e.targetName && <p className="text-sm font-medium text-ink truncate">{e.targetName}</p>}
                    <p className="text-sm text-ink-soft break-words">{e.summary}</p>
                    <p className="text-xs text-ink-soft/80 mt-1">
                      {e.actorName || e.actorEmail || 'Unknown admin'}
                      {e.actorName && e.actorEmail ? ` (${e.actorEmail})` : ''} &middot; {formatWhen(entryDate(e))}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
