// Stock quantity helpers. `stockQty` is optional on a product: when it is set
// the admin is counting units, and the product is "in stock" exactly when
// stockQty > 0 (the admin forms and bulk edit keep `inStock` in step with it).
// When it is missing, only the plain In stock / Out of stock flag applies.
export const LOW_STOCK_LIMIT = 5

export function hasStockCount(p) {
  return p?.stockQty != null && Number.isFinite(Number(p.stockQty))
}

// 'out' | 'low' | 'in'
export function stockLevel(p) {
  if (!p || p.inStock === false) return 'out'
  if (hasStockCount(p)) {
    if (p.stockQty <= 0) return 'out'
    if (p.stockQty <= LOW_STOCK_LIMIT) return 'low'
  }
  return 'in'
}

// The most a shopper can put in the cart for this product (Infinity when uncounted).
export function maxOrderable(p) {
  return hasStockCount(p) ? Math.max(0, Math.floor(p.stockQty)) : Infinity
}

// Value to store from the admin form box: '' -> null (not counted).
export function parseStockInput(text) {
  const t = String(text ?? '').trim()
  if (t === '') return null
  const n = Math.floor(Number(t))
  return Number.isFinite(n) ? Math.max(0, n) : null
}
