// Canonical display order for product "type" labels (T-Shirt, Shorts,
// Track Pant, Bras, ...). Used everywhere a list of types is shown to
// someone -- the header mega menu, the Shop page's Product Type filter,
// and the Admin "All Types" dropdown -- so the same style always lands in
// the same relative position no matter which of those three you're
// looking at, instead of each one sorting alphabetically on its own and
// drifting out of sync with the others.
//
// Anything not listed here (a brand-new type just added in Admin, for
// instance) simply falls in alphabetically after everything that IS
// listed, rather than needing this file edited every time a new type is
// added -- so nothing silently disappears from a menu just because it's
// unranked.
export const TYPE_ORDER = [
  // Tops
  'T-Shirt',
  'T-Shirts',
  'Crop Top',
  'Tops',
  // Bottoms
  'Shorts',
  'Track Pant',
  'Full Pant',
  '3/4th',
  '3/4th Set',
  // Sets / layered pieces
  'Co-Ords & Shorts Set',
  'Hoodie',
  'Nighty',
  // Innerwear
  'Premium Vest',
  'Trunks',
  'Bras',
  'Panties',
  'Slips',
  'Tights',
  'Drawer',
  'Jetty',
]

const priorityByLabel = new Map(TYPE_ORDER.map((label, i) => [label.toLowerCase(), i]))

export function typePriority(label) {
  const p = priorityByLabel.get(String(label || '').toLowerCase())
  return p === undefined ? TYPE_ORDER.length : p
}

// Sorts by the canonical order above; anything tied (both unlisted, or
// genuinely the same priority) falls back to alphabetical so the result
// is always fully deterministic rather than depending on input order.
export function sortByType(list, getLabel = (x) => x) {
  return [...list].sort((a, b) => {
    const diff = typePriority(getLabel(a)) - typePriority(getLabel(b))
    if (diff !== 0) return diff
    return String(getLabel(a)).localeCompare(String(getLabel(b)))
  })
}
