// Bras are tagged either "WSB" (White / Skin / Black basics) or "Colours"
// (the assorted-shade range). The tag drives the Shade filter on the Women's
// Innerwear > Bras shop page, the small tag on product cards, and the Shade
// dropdown in the Admin Add / Edit product forms.
//
// An explicit `shade` on the product (set from Admin, or on a catalog entry)
// always wins. Products that don't have one yet — every product already in
// Firestore, for instance — get it worked out from their colours: a bra that
// only comes in the WSB family (White, Skin, Black, plus Pink/Beige basics)
// is "WSB", anything else is "Colours". So nothing has to be re-imported.

export const SHADE_OPTIONS = ['WSB', 'Colours']

const WSB_FAMILY = new Set(['white', 'skin', 'black', 'pink', 'beige'])

function colourName(c) {
  return String(typeof c === 'string' ? c : c?.name || '').trim().toLowerCase()
}

export function deriveBraShade(colors) {
  const names = (Array.isArray(colors) ? colors : []).map(colourName).filter(Boolean)
  if (names.length === 0) return undefined
  return names.every((n) => WSB_FAMILY.has(n)) ? 'WSB' : 'Colours'
}

export function isBra(product) {
  return !!product && product.menuParent === 'Bras'
}

// The shade tag to show/filter on, or undefined for anything that isn't a bra.
export function getBraShade(product) {
  if (!isBra(product)) return undefined
  const explicit = String(product.shade || '').trim()
  const match = SHADE_OPTIONS.find((o) => o.toLowerCase() === explicit.toLowerCase())
  return match || deriveBraShade(product.colors)
}
