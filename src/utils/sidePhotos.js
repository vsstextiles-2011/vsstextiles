// Side View photos belong to ONE part of the catalog: Women's Tops. Every
// other product only has Front + Back photos. These helpers are the single
// definition of that rule, shared by the storefront catalog builder
// (data/products.js), the Firestore context, and Admin, so a side photo that
// somehow gets attached to any other product is dropped instead of kept.

// The only products that have a Side View: category "women" AND filed under
// the "Tops" group in the mega menu.
export function isWomenTopsProduct(product) {
  return product?.category === 'women' && product?.menuParent === 'Tops'
}

// True when a product carries a side photo anywhere -- on the product itself
// or inside any per-color photo set (`colorImages`).
export function hasSidePhoto(product) {
  if (product?.imageSide) return true
  return Object.values(product?.colorImages || {}).some((entry) => !!entry?.imageSide)
}

// Returns a copy of a `colorImages` map with every color's `imageSide`
// removed, plus whether anything was actually removed. Colors left with no
// photos at all are dropped, and an empty result comes back as `undefined`
// (same convention as Admin's toColorImages).
export function stripColorSidePhotos(colorImages) {
  if (!colorImages) return { colorImages, changed: false }
  let changed = false
  const result = {}
  Object.entries(colorImages).forEach(([name, entry]) => {
    const { imageSide, ...rest } = entry || {}
    if (imageSide !== undefined) changed = true
    if (Object.keys(rest).length) result[name] = rest
  })
  return { colorImages: Object.keys(result).length ? result : undefined, changed }
}
