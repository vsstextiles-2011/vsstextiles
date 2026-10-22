// Stock helpers.
//
// A product can be counted in two ways (both optional):
//   - sizeStock: { M: 12, L: 4 }  units per size. When present this is the real
//     count, and stockQty is always the sum of it (kept in step by the admin
//     forms and by every order), so older code that reads stockQty still works.
//   - stockQty: a single total for products without sizes.
//   - variantStock: { "Red|M": 4 } units per COLOUR and size (a product with
//     several colours). When present it is the source of truth, and sizeStock /
//     stockQty / inStock are worked out from it (deriveFromVariants) so the rest
//     of the site keeps working. Products without sizes use "Red|".
// A size / colour left out is "not counted" (no limit). When nothing is
// counted, only the plain In stock / Out of stock flag applies.
export const LOW_STOCK_LIMIT = 5

const num = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null)

const vkey = (color, size) => `${color}|${size || ''}`
const colorName = (c) => (typeof c === 'string' ? c : c?.name)
export const variantKey = vkey

export function hasVariantStock(p) {
  return !!p?.variantStock && typeof p.variantStock === 'object' && Object.values(p.variantStock).some((v) => num(v) !== null)
}

// Units counted for one colour + size, or null when that combination isn't counted.
export function variantQty(p, color, size) {
  if (!hasVariantStock(p)) return null
  return num(p.variantStock[vkey(color, size)])
}

export function sumVariantStock(map) {
  return Object.values(map || {}).reduce((n, v) => n + (num(v) || 0), 0)
}

// Everything the rest of the site reads (sizeStock, stockQty, inStock) worked out
// from a colour x size map. A size only gets a sizeStock total when every colour
// is counted for it - otherwise that size is effectively uncounted.
export function deriveFromVariants(product, map) {
  const colors = (product.colors || []).map(colorName).filter(Boolean)
  const sizes = product.sizes?.length ? product.sizes : ['']
  const sizeStock = {}
  sizes.forEach((sz) => {
    if (!sz) return
    const vals = colors.map((c) => num(map[vkey(c, sz)]))
    if (vals.length && vals.every((v) => v !== null)) sizeStock[sz] = vals.reduce((n, v) => n + v, 0)
  })
  const total = sumVariantStock(map)
  const allCounted = colors.length > 0 && colors.every((c) => sizes.every((sz) => num(map[vkey(c, sz)]) !== null))
  return {
    variantStock: map,
    sizeStock: Object.keys(sizeStock).length ? sizeStock : null,
    stockQty: total,
    inStock: allCounted ? total > 0 : true,
  }
}

// True when every size of this colour is counted and at 0.
export function colorSoldOut(p, color) {
  if (!hasVariantStock(p)) return false
  const sizes = p.sizes?.length ? p.sizes : ['']
  return sizes.every((sz) => variantQty(p, color, sz) === 0)
}

export function hasSizeStock(p) {
  return !!p?.sizeStock && typeof p.sizeStock === 'object' && Object.values(p.sizeStock).some((v) => num(v) !== null)
}

export function hasStockCount(p) {
  return hasVariantStock(p) || hasSizeStock(p) || (p?.stockQty != null && Number.isFinite(Number(p.stockQty)))
}

// Units counted for one size, or null when that size isn't counted.
export function sizeQty(p, size) {
  if (!hasSizeStock(p)) return null
  return num(p.sizeStock[size])
}

export function sumSizeStock(map) {
  return Object.values(map || {}).reduce((n, v) => n + (num(v) || 0), 0)
}

// 'out' | 'low' | 'in'
export function stockLevel(p) {
  if (!p || p.inStock === false) return 'out'
  if (hasVariantStock(p)) {
    const counted = Object.values(p.variantStock).map(num).filter((v) => v !== null)
    const colors = (p.colors || []).map(colorName)
    const sizes = p.sizes?.length ? p.sizes : ['']
    const all = colors.every((c) => sizes.every((sz) => variantQty(p, c, sz) !== null))
    if (all && counted.every((v) => v <= 0)) return 'out'
    if (counted.some((v) => v <= LOW_STOCK_LIMIT)) return 'low'
    return 'in'
  }
  if (hasSizeStock(p)) {
    const counted = Object.values(p.sizeStock).map(num).filter((v) => v !== null)
    const everySizeCounted = (p.sizes || []).every((s) => num(p.sizeStock[s]) !== null)
    if (everySizeCounted && counted.every((v) => v <= 0)) return 'out'
    if (counted.some((v) => v <= LOW_STOCK_LIMIT)) return 'low'
    return 'in'
  }
  if (hasStockCount(p)) {
    if (p.stockQty <= 0) return 'out'
    if (p.stockQty <= LOW_STOCK_LIMIT) return 'low'
  }
  return 'in'
}

// The most a shopper can order of this product in this size (Infinity when uncounted).
export function maxOrderable(p, size, color) {
  if (hasVariantStock(p)) {
    if (color === undefined && size === undefined) return Math.max(0, Math.floor(p.stockQty ?? sumVariantStock(p.variantStock)))
    const q = variantQty(p, color, size)
    return q !== null ? q : Infinity
  }
  if (hasSizeStock(p)) {
    const q = sizeQty(p, size)
    if (q !== null) return q
    if (size === undefined) return Math.max(0, Math.floor(p.stockQty ?? sumSizeStock(p.sizeStock)))
    return Infinity
  }
  return hasStockCount(p) ? Math.max(0, Math.floor(p.stockQty)) : Infinity
}

// How many units of the cart already count against this product's stock for `size`.
// Per-size counts only compare against lines of that size; a whole-product count
// is shared by every line of the product.
export function unitsInCart(items, product, size, color) {
  const sameProduct = (items || []).filter((i) => i.id === product.id)
  if (hasVariantStock(product) && variantQty(product, color, size) !== null) {
    return sameProduct.filter((i) => i.size === size && (i.color || '') === (color || '')).reduce((n, i) => n + (Number(i.qty) || 0), 0)
  }
  const perSize = hasSizeStock(product) && sizeQty(product, size) !== null
  return sameProduct.filter((i) => !perSize || i.size === size).reduce((n, i) => n + (Number(i.qty) || 0), 0)
}

// Value to store from an admin form box: '' -> null (not counted).
export function parseStockInput(text) {
  const t = String(text ?? '').trim()
  if (t === '') return null
  const n = Math.floor(Number(t))
  return Number.isFinite(n) ? Math.max(0, n) : null
}

// Admin form (strings) -> sizeStock map of numbers, only for the product's sizes
// that have a number typed. Returns null when nothing is counted.
export function parseSizeStockForm(formMap, sizes) {
  const out = {}
  ;(sizes || []).forEach((s) => {
    const n = parseStockInput(formMap?.[s])
    if (n !== null) out[s] = n
  })
  return Object.keys(out).length ? out : null
}

// Admin form (strings, keys "Colour|Size") -> map of numbers for the given
// colours x sizes that have a number typed. null when nothing is counted.
export function parseVariantStockForm(formMap, colors, sizes) {
  const out = {}
  const sz = sizes?.length ? sizes : ['']
  ;(colors || []).forEach((c) => {
    sz.forEach((s) => {
      const n = parseStockInput(formMap?.[vkey(c, s)])
      if (n !== null) out[vkey(c, s)] = n
    })
  })
  return Object.keys(out).length ? out : null
}

// ---- order stock movement (used when an order is placed / cancelled) ----

// Groups order lines by product id: { [id]: [{ size, qty }] }.
export function groupOrderLines(items) {
  const by = {}
  ;(items || []).forEach((it) => {
    const qty = Number(it.qty) || 0
    if (!it.id || qty <= 0) return
    ;(by[it.id] = by[it.id] || []).push({ size: it.size, color: it.color || '', qty, name: it.name })
  })
  return by
}

// What to write to a product after selling `lines`. Returns
// { changes, shortage } - shortage is a message when there isn't enough stock,
// changes is null when the product isn't counted at all.
export function applySale(product, lines, { clamp = false } = {}) {
  // clamp: used when an order is taken off stock by hand after the fact - the
  // goods are already sold, so it never refuses, it just floors counts at 0.
  if (!clamp && product?.inStock === false) {
    return { changes: null, shortage: `${product.name} is out of stock.` }
  }
  if (hasVariantStock(product)) {
    const next = { ...product.variantStock }
    let touched = false
    const need = {}
    lines.forEach((l) => { need[vkey(l.color, l.size)] = (need[vkey(l.color, l.size)] || 0) + l.qty })
    for (const [key, n] of Object.entries(need)) {
      const have = num(next[key])
      if (have === null) continue
      if (!clamp && n > have) {
        const [color, size] = key.split('|')
        const label = `${product.name} (${[color, size].filter(Boolean).join(', ')})`
        return { changes: null, shortage: have === 0 ? `${label} just sold out.` : `Only ${have} of ${label} left.` }
      }
      next[key] = Math.max(0, have - n)
      touched = true
    }
    if (!touched) return { changes: null, shortage: '' }
    return { changes: deriveFromVariants(product, next), shortage: '' }
  }
  if (hasSizeStock(product)) {
    const next = { ...product.sizeStock }
    let touched = false
    // Lines of the same size (e.g. two colours) are added up before checking.
    const needBySize = {}
    lines.forEach((l) => { needBySize[l.size] = (needBySize[l.size] || 0) + l.qty })
    for (const [size, need] of Object.entries(needBySize)) {
      const have = num(next[size])
      if (have === null) continue
      if (!clamp && need > have) {
        return { changes: null, shortage: have === 0 ? `${product.name} (${size}) just sold out.` : `Only ${have} of ${product.name} (${size}) left.` }
      }
      next[size] = Math.max(0, have - need)
      touched = true
    }
    if (!touched) return { changes: null, shortage: '' }
    const total = sumSizeStock(next)
    const allCounted = (product.sizes || []).every((s) => num(next[s]) !== null)
    return { changes: { sizeStock: next, stockQty: total, inStock: allCounted ? total > 0 : product.inStock !== false }, shortage: '' }
  }
  if (hasStockCount(product)) {
    const need = lines.reduce((n, l) => n + l.qty, 0)
    const have = Math.max(0, Math.floor(product.stockQty))
    if (!clamp && need > have) return { changes: null, shortage: have === 0 ? `${product.name} just sold out.` : `Only ${have} of ${product.name} left.` }
    const left = Math.max(0, have - need)
    return { changes: { stockQty: left, inStock: left > 0 }, shortage: '' }
  }
  return { changes: null, shortage: '' }
}

// Opposite of applySale (cancelled / returned order): puts the units back.
export function applyReturn(product, lines) {
  if (hasVariantStock(product)) {
    const next = { ...product.variantStock }
    let touched = false
    lines.forEach((l) => {
      const key = vkey(l.color, l.size)
      const have = num(next[key])
      if (have === null) return
      next[key] = have + l.qty
      touched = true
    })
    return touched ? deriveFromVariants(product, next) : null
  }
  if (hasSizeStock(product)) {
    const next = { ...product.sizeStock }
    let touched = false
    lines.forEach((l) => {
      const have = num(next[l.size])
      if (have === null) return
      next[l.size] = have + l.qty
      touched = true
    })
    if (!touched) return null
    const total = sumSizeStock(next)
    return { sizeStock: next, stockQty: total, inStock: total > 0 }
  }
  if (hasStockCount(product)) {
    const q = Math.max(0, Math.floor(product.stockQty)) + lines.reduce((n, l) => n + l.qty, 0)
    return { stockQty: q, inStock: q > 0 }
  }
  return null
}

// Everything running low or gone, one row per product / size, for the Overview alert.
export function lowStockRows(products, limit = LOW_STOCK_LIMIT) {
  const rows = []
  ;(products || []).forEach((p) => {
    if (p.isVisible === false) return
    if (hasVariantStock(p)) {
      ;(p.colors || []).map(colorName).forEach((c) => {
        ;(p.sizes?.length ? p.sizes : ['']).forEach((s) => {
          const q = variantQty(p, c, s)
          if (q !== null && q <= limit) rows.push({ product: p, size: s || null, color: c, qty: q })
        })
      })
    } else if (hasSizeStock(p)) {
      ;(p.sizes?.length ? p.sizes : Object.keys(p.sizeStock)).forEach((s) => {
        const q = sizeQty(p, s)
        if (q !== null && q <= limit) rows.push({ product: p, size: s, qty: q })
      })
    } else if (hasStockCount(p) && p.stockQty <= limit) {
      rows.push({ product: p, size: null, qty: Math.max(0, Math.floor(p.stockQty)) })
    }
  })
  return rows.sort((a, b) => a.qty - b.qty || String(a.product.name).localeCompare(String(b.product.name)))
}
