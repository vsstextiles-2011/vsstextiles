import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { allProducts as baseProducts, toSlug } from '../data/products.js'

// Runs entirely client-side against the built-in catalog — no backend
// required.
//
// Admin (src/pages/Admin.jsx) is live at /admin. Every add/edit/delete made
// there is saved as a small OVERLAY on top of data/products.js, not as a
// full copy of the catalog — see `overrides` below. That's the important
// bit: because only the specific things you changed in Admin are stored,
// editing data/products.js directly in code always shows up straight away.
// Admin never "freezes" the catalog at some old snapshot and hides your
// code edits behind it.
//
// The overlay has three parts:
//   - edits: { [productId]: { ...changed fields only } } — for a product
//     that still exists in data/products.js, only the fields you actually
//     changed in Admin are stored; everything else keeps following
//     whatever data/products.js currently says for that product. So if you
//     edit a product's price in Admin, then later change its description
//     in code, the code's new description shows up — Admin only owns the
//     price for that product, nothing else.
//   - added: [...full product objects] — products that don't exist in
//     data/products.js at all, created entirely through Admin's "Add
//     Product" form.
//   - deletedIds: [...productId] — ids from data/products.js that were
//     deleted in Admin. If you later remove that product from the code
//     catalog too, this entry just becomes a no-op (nothing left to hide).
//
// This is all mirrored into localStorage (see saveOverrides below), so it
// survives a refresh on this device — but there's no shared backend, so
// Admin edits made in one browser won't show up for someone visiting the
// site elsewhere; the Admin page itself says this too. Use the "Reset
// catalog to defaults" button in Admin (or clear the vss-admin-overrides-v1
// key) to drop the overlay entirely and go back to exactly what's in code.
const ProductContext = createContext(null)

const STORAGE_KEY = 'vss-admin-overrides-v1'
// Very old builds stored the *entire* product list under this key — if
// that's still sitting in someone's browser we deliberately ignore it
// rather than trying to migrate it, since a full old snapshot is exactly
// the "shadows your code changes" behavior this rewrite removes.
const LEGACY_STORAGE_KEY = 'vss-admin-products-v1'

const emptyOverrides = { edits: {}, added: [], deletedIds: [] }

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyOverrides
    const parsed = JSON.parse(raw)
    return {
      edits: parsed?.edits && typeof parsed.edits === 'object' ? parsed.edits : {},
      added: Array.isArray(parsed?.added) ? parsed.added : [],
      deletedIds: Array.isArray(parsed?.deletedIds) ? parsed.deletedIds : [],
    }
  } catch {
    // Corrupt/unavailable storage (e.g. private browsing with it disabled) —
    // just start with no overlay; the site still runs on the code catalog.
    return emptyOverrides
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // Storage full or unavailable — Admin edits simply won't persist past
    // this page view; the rest of the app still works normally.
  }
}

function makeId(category, subCategory) {
  return `${category}-${subCategory}-${Date.now().toString(36)}`
}

export function ProductProvider({ children }) {
  const [overrides, setOverrides] = useState(loadOverrides)

  useEffect(() => {
    saveOverrides(overrides)
  }, [overrides])

  // One-time cleanup: drop the old full-snapshot key so it can't come back
  // if this key is ever cleared — it has no useful data under the new
  // overlay model anyway.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const baseIndex = useMemo(() => new Map(baseProducts.map((p) => [p.id, p])), [])

  // The live product list: start from whatever data/products.js says RIGHT
  // NOW, drop anything deleted in Admin, layer each product's Admin edits
  // (if any) on top of its current code fields, then add whatever was
  // created entirely through Admin. Every render re-reads baseProducts, so
  // a code change to an existing product is reflected immediately — Admin
  // only ever overrides the specific fields it actually changed.
  const products = useMemo(() => {
    const deleted = new Set(overrides.deletedIds)
    const fromCode = baseProducts
      .filter((p) => !deleted.has(p.id))
      .map((p) => (overrides.edits[p.id] ? { ...p, ...overrides.edits[p.id] } : p))
    const fromAdmin = overrides.added.filter((p) => !deleted.has(p.id))
    return [...fromAdmin, ...fromCode]
  }, [overrides])

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
    setOverrides((prev) => ({ ...prev, added: [product, ...prev.added] }))
    return product
  }, [])

  const updateProduct = useCallback(
    async (id, changes) => {
      // menuParent changing means groupSlug needs to move with it — same
      // reasoning as addProduct above.
      const nextChanges =
        'menuParent' in changes ? { ...changes, groupSlug: changes.menuParent ? toSlug(changes.menuParent) : undefined } : changes

      let updated = null
      setOverrides((prev) => {
        // A product created in Admin (not in data/products.js) has no
        // "code version" to defer to — its full record just lives in
        // `added`, so edits merge straight into it there.
        const addedIndex = prev.added.findIndex((p) => p.id === id)
        if (addedIndex !== -1) {
          const nextAdded = [...prev.added]
          updated = { ...nextAdded[addedIndex], ...nextChanges }
          nextAdded[addedIndex] = updated
          return { ...prev, added: nextAdded }
        }
        // A product that exists in code: only the changed fields are
        // stored, layered onto whatever's already been edited for it, so a
        // field left untouched here keeps following data/products.js.
        const basePart = baseIndex.get(id)
        const mergedEdit = { ...(prev.edits[id] || {}), ...nextChanges }
        updated = basePart ? { ...basePart, ...mergedEdit } : { id, ...mergedEdit }
        return { ...prev, edits: { ...prev.edits, [id]: mergedEdit } }
      })
      return updated
    },
    [baseIndex]
  )

  const deleteProduct = useCallback(async (id) => {
    setOverrides((prev) => {
      // Deleting something created in Admin just removes it — there's no
      // code entry underneath it that needs hiding.
      if (prev.added.some((p) => p.id === id)) {
        return { ...prev, added: prev.added.filter((p) => p.id !== id) }
      }
      // Deleting a code product marks its id as deleted and drops any
      // pending edit for it (nothing left to edit).
      const { [id]: _dropped, ...restEdits } = prev.edits
      return { ...prev, edits: restEdits, deletedIds: [...new Set([...prev.deletedIds, id])] }
    })
  }, [])

  const deleteProductsByType = useCallback(
    async (category, subCategory) => {
      // A "subcategory" shown in Admin can be either a real subCategory
      // slug (e.g. "trunks") OR a grouped menuParent slug (e.g.
      // "t-shirts", which fans out into per-product subCategory slugs like
      // "t-shirts-mtc-901"). Match on whichever applies so deleting a
      // grouped row actually removes its member products.
      const matches = (p) =>
        p.category === category && (p.subCategory === subCategory || (p.menuParent && toSlug(p.menuParent) === subCategory))
      let removedCount = 0
      setOverrides((prev) => {
        const deleted = new Set(prev.deletedIds)
        const stillLive = [...baseProducts.filter((p) => !deleted.has(p.id)), ...prev.added]
        const toRemove = stillLive.filter(matches)
        removedCount = toRemove.length
        const removeIds = new Set(toRemove.map((p) => p.id))
        const nextEdits = { ...prev.edits }
        removeIds.forEach((id) => delete nextEdits[id])
        return {
          added: prev.added.filter((p) => !removeIds.has(p.id)),
          edits: nextEdits,
          deletedIds: [...new Set([...prev.deletedIds, ...toRemove.filter((p) => baseIndex.has(p.id)).map((p) => p.id)])],
        }
      })
      return removedCount
    },
    [baseIndex]
  )

  // For a "grouped" nav row (products sharing a menuParent, e.g. every
  // product under "Premium Vest") — these don't share a single subCategory
  // slug of their own, so they can't be removed via deleteProductsByType.
  const deleteProductsByMenuParent = useCallback(
    async (category, menuParent) => {
      const matches = (p) => p.category === category && p.menuParent === menuParent
      let removedCount = 0
      setOverrides((prev) => {
        const deleted = new Set(prev.deletedIds)
        const stillLive = [...baseProducts.filter((p) => !deleted.has(p.id)), ...prev.added]
        const toRemove = stillLive.filter(matches)
        removedCount = toRemove.length
        const removeIds = new Set(toRemove.map((p) => p.id))
        const nextEdits = { ...prev.edits }
        removeIds.forEach((id) => delete nextEdits[id])
        return {
          added: prev.added.filter((p) => !removeIds.has(p.id)),
          edits: nextEdits,
          deletedIds: [...new Set([...prev.deletedIds, ...toRemove.filter((p) => baseIndex.has(p.id)).map((p) => p.id)])],
        }
      })
      return removedCount
    },
    [baseIndex]
  )

  const resetProducts = useCallback(async () => {
    setOverrides(emptyOverrides)
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
