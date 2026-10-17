// Shared by the About page and Admin -> About Us Page so both group the
// catalogue into the exact same "product types".
import { toSlug } from '../data/products.js'

const MERGE = { 'T-Shirt': 'T-Shirts', '3/4th': '3/4th Sets', '3/4th Set': '3/4th Sets', Nighty: 'Nighties', Bras: 'Bras' }

export const aboutTypeLabel = (p) => {
  const raw = p.menuParent || p.subCategoryLabel || p.baseName || 'Other'
  return MERGE[raw] || raw
}

// [{ label, count, image }] sorted like the About page (most styles first).
export function aboutProductTypes(products) {
  const map = new Map()
  products.forEach((p) => {
    const key = aboutTypeLabel(p)
    const e = map.get(key) || { label: key, count: 0, image: '' }
    e.count += 1
    if (!e.image && p.image) e.image = p.image
    map.set(key, e)
  })
  return [...map.values()].filter((t) => t.image).sort((a, b) => b.count - a.count)
}

// URL slug for a product type's dedicated page, e.g. "Co-Ords & Shorts Set" -> "co-ords-and-shorts-set".
export const aboutTypeSlug = (label) => toSlug(String(label))

// Link to a product type's dedicated page.
export const aboutTypePath = (label) => `/types/${aboutTypeSlug(label)}`
