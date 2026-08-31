import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { allProducts as baseProducts, toSlug } from '../data/products.js'

// Runs entirely client-side against the built-in catalog — no backend
// required.
//
// NOTE: Admin (src/pages/Admin.jsx) is currently disabled (its route was
// removed from App.jsx), so there's no in-app way to add/edit products
// anymore — every product now comes straight from data/products.js. This
// context used to also check the browser's localStorage for an
// Admin-saved snapshot and use THAT instead of the live catalog if one was
// ever saved. That's what was causing edits made directly in
// data/products.js not to show up: once your browser had saved a snapshot
// (from any earlier Admin session), it would keep using that frozen copy
// forever, ignoring every subsequent code change, until the snapshot was
// manually cleared. Reading/writing that snapshot is switched off below so
// the storefront always reflects the current data/products.js. If Admin
// is ever turned back on, restore loadStoredProducts()/saveStoredProducts()
// in ProductProvider below (git history / earlier version has the exact
// lines) so Admin edits can persist across a refresh again.
const ProductContext = createContext(null)

const STORAGE_KEY = 'vss-admin-products-v1'

function loadStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    // Corrupt/unavailable storage (e.g. private browsing with it disabled) —
    // just fall back to the built-in catalog below.
    return null
  }
}

function saveStoredProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
    // Storage full or unavailable — edits simply won't persist past this
    // page view; the rest of the app still works normally.
  }
}

function makeId(category, subCategory) {
  return `${category}-${subCategory}-${Date.now().toString(36)}`
}

export function ProductProvider({ children }) {
  // Was: useState(() => loadStoredProducts() ?? baseProducts) — see the
  // note above for why that's disabled while Admin is off.
  const [products, setProducts] = useState(baseProducts)

  // Was: useEffect(() => saveStoredProducts(products), [products]) — no
  // longer saving snapshots while Admin is disabled (see note above).

  const addProduct = useCallback(async (input) => {
    const product = {
      id: makeId(input.category, input.subCategory || 'item'),
      inStock: true,
      rating: 0,
      ratingCount: 0,
      discount: 0,
      ...input,
      // Mirrors the static catalog's own groupSlug logic (see products.js
      // buildCategory) — without it, a product added here under an existing
      // group (e.g. "T-Shirts") would get no groupSlug at all, so Shop's
      // Product Type filter couldn't tell it apart from a brand-new group
      // and would show it as a second, duplicate "T-Shirts" row instead of
      // folding into the real one.
      groupSlug: input.menuParent ? toSlug(input.menuParent) : undefined,
    }
    setProducts((prev) => [product, ...prev])
    return product
  }, [])

  const updateProduct = useCallback(async (id, changes) => {
    let updated = null
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        // If menuParent is being changed, keep groupSlug in sync with it —
        // same reasoning as addProduct above.
        const nextChanges =
          'menuParent' in changes ? { ...changes, groupSlug: changes.menuParent ? toSlug(changes.menuParent) : undefined } : changes
        updated = { ...p, ...nextChanges }
        return updated
      })
    )
    return updated
  }, [])

  const deleteProduct = useCallback(async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const deleteProductsByType = useCallback(async (category, subCategory) => {
    let removedCount = 0
    setProducts((prev) =>
      prev.filter((p) => {
        // A "subcategory" shown in Admin can be either a real subCategory
        // slug (e.g. "trunks") OR a grouped menuParent slug (e.g.
        // "t-shirts", which fans out into per-product subCategory slugs
        // like "t-shirts-mtc-901"). Match on whichever applies so deleting
        // a grouped row actually removes its member products.
        const match =
          p.category === category &&
          (p.subCategory === subCategory || (p.menuParent && toSlug(p.menuParent) === subCategory))
        if (match) removedCount += 1
        return !match
      })
    )
    return removedCount
  }, [])

  // For a "grouped" nav row (products sharing a menuParent, e.g. every
  // product under "Premium Vest") — these don't share a single subCategory
  // slug of their own, so they can't be removed via deleteProductsByType.
  const deleteProductsByMenuParent = useCallback(async (category, menuParent) => {
    let removedCount = 0
    setProducts((prev) =>
      prev.filter((p) => {
        const match = p.category === category && p.menuParent === menuParent
        if (match) removedCount += 1
        return !match
      })
    )
    return removedCount
  }, [])

  const resetProducts = useCallback(async () => {
    setProducts(baseProducts)
    return baseProducts
  }, [])

  function getProductById(id) {
    return products.find((p) => p.id === id)
  }

  function getProductsByCategory(category) {
    if (!category || category === 'all') return products
    return products.filter((p) => p.category === category)
  }

  function getProductsBySubCategory(subCategory) {
    if (!subCategory) return products
    return products.filter((p) => p.subCategory === subCategory)
  }

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured && p.inStock !== false).slice(0, 8),
    [products]
  )
  const bestSellerProducts = useMemo(
    () => products.filter((p) => p.isBestSeller && p.inStock !== false).slice(0, 8),
    [products]
  )
  const newArrivalProducts = useMemo(
    () => products.filter((p) => p.isNew && p.inStock !== false).slice(0, 8),
    [products]
  )

  const value = {
    products,
    isLoading: false,
    apiError: null,
    reloadProducts: async () => products,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProductsByType,
    deleteProductsByMenuParent,
    resetProducts,
    getProductById,
    getProductsByCategory,
    getProductsBySubCategory,
    featuredProducts,
    bestSellerProducts,
    newArrivalProducts,
  }

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts must be used within a ProductProvider')
  return ctx
}
