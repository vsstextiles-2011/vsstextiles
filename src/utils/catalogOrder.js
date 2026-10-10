import { allProducts as catalogProducts } from '../data/products.js'

// Firestore's onSnapshot doesn't guarantee it returns documents in any
// particular order, so anything built from the live `storeProducts` list
// needs to fall back to the static catalog's original order (the order
// products are defined in data/products.js) to stay deterministic --
// instead of drifting into whatever order Firestore happens to hand back,
// which tends to land close to alphabetical-by-id and scatters variants
// of the same style (e.g. the ten "Side Open Top" colors) away from each
// other instead of keeping them next to one another.
//
// Built once from the static catalog, not from live Firestore data.
export const catalogIndexById = new Map(catalogProducts.map((p, i) => [p.id, i]))

// A product's display position: its manually-set `sortOrder` (written by
// the Inventory tab's move up/down buttons in Admin.jsx) wins when present,
// otherwise it falls back to the product's original position in the static
// catalog, otherwise (a brand-new product that's neither been reordered nor
// exists in data/products.js) it sorts to the very end. Kept as one shared
// function so every place that displays products in "catalog order" --
// Admin's Inventory tab, Shop's default "Popular" sort, related/category
// picks on the product page, Daily Essentials -- moves together the moment
// an admin drags a product up or down, instead of the reorder only ever
// being visible inside the Admin panel.
export function displayOrder(p) {
  return p.sortOrder ?? catalogIndexById.get(p.id) ?? Infinity
}

// Returns a NEW array (does not mutate `list`) sorted into display order
// (see displayOrder above).
export function sortByCatalogOrder(list) {
  return [...list].sort((a, b) => displayOrder(a) - displayOrder(b))
}

// Keeps the shop list tidy in two levels: first every product of one TYPE
// (all the Tops, all the Nighty, ...) is pulled into one block, then inside
// that block every colour of one STYLE (e.g. all the "Mul Chanderi" tops) is
// pulled together. Each block sits where its first product sits in the
// normal order, and the existing order is kept otherwise. Without the type
// level, a one-colour style from another type (e.g. "Nighty Tulip") whose
// saved position happened to fall between two tops would show up in the
// middle of the Tops. Shared by the Shop's default order and the product
// page's Prev/Next so both step through products in exactly the same order.
export function groupByStyle(list) {
  const types = new Map()
  list.forEach((p) => {
    const typeKey = `${p.category}|${p.menuParent || p.subCategoryLabel || p.subCategory}`
    if (!types.has(typeKey)) types.set(typeKey, new Map())
    const styles = types.get(typeKey)
    const styleKey = p.subCategoryLabel || p.subCategory
    if (!styles.has(styleKey)) styles.set(styleKey, [])
    styles.get(styleKey).push(p)
  })
  return [...types.values()].flatMap((styles) => [...styles.values()].flat())
}
