import { useState } from 'react'
import { X } from 'lucide-react'

// Bulk edit for the ticked products in Admin -> Inventory. One action at a time
// is applied to every selected product in a single batch.
//
// Stock quantity rule used everywhere: when a quantity is set, the product is
// "in stock" exactly when quantity > 0 (so the old In/Out flag keeps working
// across the whole site).
const ACTIONS = [
  { id: 'price-pct', label: 'Change price by %', input: 'percent', hint: 'e.g. 10 raises prices 10%, -10 lowers them 10%' },
  { id: 'price-set', label: 'Set price to ₹', input: 'rupees', hint: 'Not applied to products that have a different price per size' },
  { id: 'discount-set', label: 'Set discount %', input: 'discount', hint: 'Keeps the original price and lowers the selling price. Not applied to per-size-price products' },
  { id: 'qty-set', label: 'Set stock quantity', input: 'qty', hint: '0 marks the products Out of Stock' },
  { id: 'qty-add', label: 'Add to stock quantity', input: 'qty', hint: 'Restock: adds this many to the current quantity' },
  { id: 'in', label: 'Mark In Stock' },
  { id: 'out', label: 'Mark Out of Stock' },
  { id: 'show', label: 'Show on website' },
  { id: 'hide', label: 'Hide from website' },
]

const discountOf = (price, oldPrice) => (oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0)

// Returns { updates: [{id, changes}], skipped } for the chosen action.
export function buildBulkUpdates(actionId, rawValue, products) {
  const n = parseFloat(rawValue)
  const updates = []
  let skipped = 0
  products.forEach((p) => {
    const hasSizePrices = p.sizePricing && Object.keys(p.sizePricing).length > 0
    const price = Number(p.price) || 0
    const oldPrice = Number(p.oldPrice) || price
    let changes = null
    switch (actionId) {
      case 'price-pct': {
        const f = 1 + n / 100
        const next = Math.max(1, Math.round(price * f))
        changes = { price: next, discount: discountOf(next, oldPrice) }
        if (hasSizePrices) {
          changes.sizePricing = Object.fromEntries(
            Object.entries(p.sizePricing).map(([size, v]) => {
              const sp = Math.max(1, Math.round((Number(v.price) || price) * f))
              const so = Number(v.oldPrice) || sp
              return [size, { ...v, price: sp, oldPrice: so, discount: discountOf(sp, so) }]
            })
          )
        }
        break
      }
      case 'price-set': {
        if (hasSizePrices) { skipped += 1; return }
        const next = Math.max(1, Math.round(n))
        changes = { price: next, discount: discountOf(next, oldPrice) }
        break
      }
      case 'discount-set': {
        if (hasSizePrices) { skipped += 1; return }
        const base = Math.max(oldPrice, price)
        const next = Math.max(1, Math.round(base * (1 - n / 100)))
        changes = { price: next, oldPrice: base, discount: discountOf(next, base) }
        break
      }
      case 'qty-set': {
        const q = Math.max(0, Math.floor(n))
        changes = { stockQty: q, inStock: q > 0 }
        break
      }
      case 'qty-add': {
        const q = Math.max(0, Math.floor((Number(p.stockQty) || 0) + n))
        changes = { stockQty: q, inStock: q > 0 }
        break
      }
      case 'in':
        // A tracked quantity of 0 would contradict "in stock", so tracking is cleared.
        changes = { inStock: true, ...(p.stockQty === 0 ? { stockQty: null } : {}) }
        break
      case 'out':
        changes = { inStock: false, ...(p.stockQty != null ? { stockQty: 0 } : {}) }
        break
      case 'show':
        changes = { isVisible: true }
        break
      case 'hide':
        changes = { isVisible: false }
        break
      default:
        return
    }
    const replaceFields = []
    if (changes && 'stockQty' in changes && changes.stockQty === null) replaceFields.push('stockQty')
    updates.push({ id: p.id, changes, ...(replaceFields.length ? { replaceFields } : {}) })
  })
  return { updates, skipped }
}

export default function BulkEditBar({ selected, onApply, onClear }) {
  const [actionId, setActionId] = useState('price-pct')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const action = ACTIONS.find((a) => a.id === actionId)
  const needsValue = !!action.input

  function validate() {
    if (!needsValue) return ''
    const n = parseFloat(value)
    if (!Number.isFinite(n)) return 'Enter a number.'
    if (action.input === 'percent' && (n <= -90 || n > 500)) return 'Percent change must be between -90 and 500.'
    if (action.input === 'rupees' && n < 1) return 'Enter a price of at least ₹1.'
    if (action.input === 'discount' && (n < 0 || n > 90)) return 'Discount must be between 0 and 90%.'
    if (action.input === 'qty' && (n < 0 || n > 100000)) return 'Enter a quantity of 0 or more.'
    return ''
  }

  async function apply() {
    const msg = validate()
    if (msg) return setError(msg)
    const { updates, skipped } = buildBulkUpdates(actionId, value, selected)
    if (updates.length === 0) return setError('None of the selected products can take this change.')
    const label = needsValue ? `${action.label} ${value}` : action.label
    if (!window.confirm(`${label} — apply to ${updates.length} product${updates.length === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}?`)) return
    setError('')
    setBusy(true)
    try {
      await onApply(updates, skipped)
      setValue('')
    } catch (e) {
      setError(e?.message || 'Could not apply the change.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sticky top-2 z-20 mb-4 rounded-xl border border-brand/40 bg-white shadow-md p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-ink">{selected.length} selected</span>
        <select
          value={actionId}
          onChange={(e) => { setActionId(e.target.value); setValue(''); setError('') }}
          className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        {needsValue && (
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value.replace(/[^0-9.\-]/g, '')); setError('') }}
            inputMode="decimal"
            placeholder="Value"
            className="w-28 text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        )}
        <button type="button" onClick={apply} disabled={busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {busy ? 'Applying…' : 'Apply to selected'}
        </button>
        <button type="button" onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-xs text-ink-soft hover:text-brand">
          <X size={14} /> Clear selection
        </button>
      </div>
      {action.hint && <p className="text-xs text-ink-soft mt-2">{action.hint}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
