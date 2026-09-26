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
// (Best Seller/New Arrivals) accept any category; a section scoped to one
// category (e.g. 'women', or one of the OFFER_SECTIONS below) only ever
// accepts products from that exact category; the Women's Collections rows
// additionally narrow down to one exact menuParent.
export function sectionEligible(section, p) {
  if (section.scope && section.scope !== 'all' && p.category !== section.scope) return false
  if (section.menuParent && p.menuParent !== section.menuParent) return false
  return true
}

// The live, ordered list of products a section actually renders on the
// storefront: eligible + flagged on + in stock, sorted by that section's
// manual order field. Products with no order set yet (never manually
// moved) sort after every explicitly ordered one, but otherwise keep their
// original relative order (Array.sort is stable) so a freshly-flagged
// product doesn't jump around before an admin has touched ordering at all.
// The Special Offers page (src/pages/Offers.jsx) — one section per
// top-level category, all sharing the same on/off flag (isOffer). A
// product's category already pins it to exactly one of these four scopes,
// so sharing one flag across all four (the way Bras/Panties/Slips/...
// share isFeatured above) can never let a product leak into the wrong
// category's list. Each still gets its own manual order field via
// orderField() (offersMen/offersWomen/offersBoys/offersGirls), so
// reordering one category's offers never disturbs another's.
export const OFFER_SECTIONS = [
  { id: 'offers-men', label: 'Men', field: 'isOffer', scope: 'men' },
  { id: 'offers-women', label: "Women's", field: 'isOffer', scope: 'women' },
  { id: 'offers-boys', label: 'Boys', field: 'isOffer', scope: 'boys' },
  { id: 'offers-girls', label: 'Girls', field: 'isOffer', scope: 'girls' },
]

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
