// Every product-picking row shown on the storefront homepage — Trending
// Now's Best Seller / New Arrivals, and the Women's Innerwear Collections'
// Bras / Panties / Slips / Tights / Nighty / Tops. Both the Admin panel
// (one sidebar tab per section) and the actual homepage components
// (TrendingTabsShowcase.jsx / WomensInnerwearShowcase.jsx /
// NightyShowcase.jsx) import this SAME list, so a section can never go out
// of sync between "what admin can pick" and "what the site shows".
export const STOREFRONT_SECTIONS = [
  { id: 'best-seller', label: 'Best Seller', field: 'isBestSeller', scope: 'all' },
  { id: 'new-arrivals', label: 'New Arrivals', field: 'isNew', scope: 'all' },
  { id: 'bras', label: 'Bras', field: 'isFeatured', scope: 'women', menuParent: 'Bras' },
  { id: 'panties', label: 'Panties', field: 'isFeatured', scope: 'women', menuParent: 'Panties' },
  { id: 'slips', label: 'Slips', field: 'isFeatured', scope: 'women', menuParent: 'Slips' },
  { id: 'tights', label: 'Tights', field: 'isFeatured', scope: 'women', menuParent: 'Tights' },
  { id: 'nighty', label: 'Nighty', field: 'isFeatured', scope: 'women', menuParent: 'Nighty' },
  { id: 'tops', label: 'Tops', field: 'isFeatured', scope: 'women', menuParent: 'Tops' },
]

// Turns a section id ("best-seller") into the product field that stores its
// manual position ("orderBestSeller"). Every section gets its own order
// field — even Bras/Panties/Slips/Tights/Nighty/Tops, which all share the
// same on/off flag (isFeatured) — so reordering one row can never disturb
// another, and a product that happens to be flagged into two rows can hold
// a completely different position in each.
export function orderField(sectionId) {
  const camel = sectionId.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return `order${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

// Whether a product is even allowed to appear in this section at all
// (regardless of whether it's currently flagged on) — "all" sections
// (Best Seller/New Arrivals) accept any category; the Women's Collections
// rows only ever accept Women's products from that exact menuParent.
export function sectionEligible(section, p) {
  if (section.scope === 'women' && p.category !== 'women') return false
  if (section.menuParent && p.menuParent !== section.menuParent) return false
  return true
}

// The live, ordered list of products a section actually renders on the
// storefront: eligible + flagged on + in stock, sorted by that section's
// manual order field. Products with no order set yet (never manually
// moved) sort after every explicitly ordered one, but otherwise keep their
// original relative order (Array.sort is stable) so a freshly-flagged
// product doesn't jump around before an admin has touched ordering at all.
export function sectionProducts(section, products) {
  const field = orderField(section.id)
  return products
    .filter((p) => sectionEligible(section, p) && p[section.field] && p.inStock !== false)
    .sort((a, b) => {
      const ao = a[field]
      const bo = b[field]
      if (ao == null && bo == null) return 0
      if (ao == null) return 1
      if (bo == null) return -1
      return ao - bo
    })
}
