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
