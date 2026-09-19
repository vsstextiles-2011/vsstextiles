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

// Returns a NEW array (does not mutate `list`) sorted into that same
// catalog order. Anything not found in the static catalog (e.g. a
// brand-new product added only in Admin/Firestore) sorts to the end
// rather than breaking the sort.
export function sortByCatalogOrder(list) {
  return [...list].sort(
    (a, b) => (catalogIndexById.get(a.id) ?? Infinity) - (catalogIndexById.get(b.id) ?? Infinity)
  )
}
