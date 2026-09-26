import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { allProducts as seedProducts, toSlug } from '../data/products.js'
import { stripUndefined } from '../utils/stripUndefined.js'
import { isWomenTopsProduct, hasSidePhoto, stripColorSidePhotos } from '../utils/sidePhotos.js'

// Products now live in Firestore (collection: "products"), not in
// localStorage. `data/products.js` still exists as the SEED catalog -- the
// starting data you import into Firestore once via the Admin panel -- and
// as an offline/first-load fallback. After importing, Firestore is the
// single source of truth: every browser (and every visitor) sees the same
// catalog, and admin edits sync live everywhere via onSnapshot.
//
// Firestore security rules (see firestore.rules) already allow:
//   - anyone to read the "products" collection
//   - only a signed-in admin (admins/{uid} with role="admin", active=true)
//     to create/update/delete documents in it
// so writes below will fail with "permission-denied" for non-admins --
// that's expected and surfaced via apiError.

const ProductContext = createContext(null)

const PRODUCTS_COLLECTION = 'products'
// Where the last real Firestore catalog gets mirrored in this browser (see
// loadCachedProducts/cacheProducts below).
const PRODUCTS_CACHE_KEY = 'vss_products_cache_v1'

// The built-in `seedProducts` catalog and the real, live one in Firestore
// drift apart over time (products added/edited/removed in Admin) -- that's
// expected, not a bug. The problem was in how the very first paint on every
// page load/refresh picked between them: it always started from the
// (possibly outdated) seed catalog, then swapped to the real one once
// Firestore responded. When the two differed, that swap was visible --
// a product count changing, or a Back/Side photo appearing or disappearing
// a moment (sometimes several seconds, on a slow connection) after the
// page first painted.
//
// The fix is to stop always starting from the static seed file. Every time
// a real snapshot arrives from Firestore, it's mirrored into localStorage
// here. On the next page load/refresh, the FIRST paint reads from that
// cache instead of the seed file -- so it already shows last known-good,
// real data (including any Back/Side photos added in Admin since), and the
// Firestore listener's response typically matches exactly, so there's
// nothing to visibly swap. The static seed file is now only ever seen on a
// visitor's very first-ever visit to the site (no cache yet), before
// anything has been imported into Firestore, or if the cache fails to
// parse -- the original "don't show a blank storefront" fallback it was
// always meant to be.
function loadCachedProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    return null
  }
}

function cacheProducts(list) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list))
  } catch {
    // Quota exceeded, storage disabled (private browsing), etc. -- caching
    // is purely a nice-to-have for a smoother next load, never required,
    // so just skip it silently.
  }
}
// Firestore batched writes cap out at 500 operations; stay comfortably
// under that when importing/resetting the whole catalog at once.
const BATCH_CHUNK_SIZE = 400

function makeId(category, subCategory) {
  return `${category}-${subCategory}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// Firestore rejects any `undefined` value, anywhere in the document —
// including nested inside objects/arrays — with "Unsupported field value:
// undefined". The catalog in data/products.js leaves lots of optional
// fields (details, menuParent, image overrides, etc.) as `undefined`
// rather than omitting them, which is fine for plain JS but not for
// Firestore. stripUndefined (utils/stripUndefined.js) recursively drops
// any key whose value is `undefined` before a write.

async function writeInChunks(items, writeFn) {
  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BATCH_CHUNK_SIZE)
    const batch = writeBatch(db)
    chunk.forEach((item) => writeFn(batch, item))
    await batch.commit()
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => loadCachedProducts() || seedProducts)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  // True once we've heard back from Firestore at least once and it had 0
  // documents -- i.e. the catalog has never been imported yet. Admin uses
  // this to show the "Import catalog to Firestore" prompt.
  const [needsSeed, setNeedsSeed] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        setApiError(null)
        setIsLoading(false)
        if (snapshot.empty) {
          // Not imported yet -- keep showing the built-in seed catalog so
          // the storefront isn't blank, but flag it so Admin can prompt
          // for the one-time import.
          setNeedsSeed(true)
          setProducts(seedProducts)
        } else {
          setNeedsSeed(false)
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          setProducts(live)
          // Mirror it so the *next* page load/refresh can paint this real
          // data immediately instead of the static seed catalog -- see
          // loadCachedProducts above.
          cacheProducts(live)
        }
      },
      (error) => {
        console.error('Firestore products listener failed:', error)
        setIsLoading(false)
        setApiError(
          error?.code === 'permission-denied'
            ? 'Firestore blocked reading the "products" collection. Publish the included firestore.rules in Firebase Console.'
            : 'Lost the live connection to the product database -- you are viewing the last data that loaded successfully. Your saved changes are safe; refresh once you are back online to resync.'
        )
        // IMPORTANT: do NOT reset `products` back to the built-in seed
        // catalog here. This used to unconditionally call
        // setProducts(seedProducts) on every listener error -- including a
        // brief, transient reconnect blip (tab backgrounded, laptop woke
        // from sleep, a VPN hiccup, too many onSnapshot listeners open
        // across tabs/dev servers at once). If that happened AFTER the
        // real Firestore data had already loaded, it silently wiped every
        // admin edit off the screen and replaced it with the old hardcoded
        // demo catalog -- exactly like your changes had "reverted", even
        // though nothing was actually lost in Firestore. The seed catalog
        // is only appropriate before we've ever heard from Firestore
        // successfully; once real data is showing, keep showing it (even
        // if stale) rather than regressing to fake data.
        setProducts((current) => (current === seedProducts ? seedProducts : current))
      }
    )
    return unsubscribe
  }, [])

  const addProduct = useCallback(async (input) => {
    const id = makeId(input.category, input.subCategory || 'item')
    const product = {
      inStock: true,
      isVisible: true,
      rating: 0,
      ratingCount: 0,
      discount: 0,
      ...input,
      // Mirrors the static catalog's own groupSlug logic -- without it, a
      // product added here under an existing group (e.g. "T-Shirts") would
      // get no groupSlug, so Shop's Product Type filter would show it as a
      // duplicate "T-Shirts" row instead of folding into the real one.
      groupSlug: input.menuParent ? toSlug(input.menuParent) : undefined,
    }
    try {
      // stripUndefined runs on the plain data only -- serverTimestamp()
      // returns a special Firestore sentinel object, and running it
      // through the recursive stripper would corrupt it, so it's added
      // back in afterward rather than stripped along with everything else.
      await setDoc(doc(db, PRODUCTS_COLLECTION, id), { ...stripUndefined(product), createdAt: serverTimestamp() })
      setApiError(null)
      return { id, ...product }
    } catch (error) {
      console.error('addProduct failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
  }, [])

  // `options.replaceFields` lists top-level fields that must end up EXACTLY as
  // passed in `changes` -- not deep-merged with whatever is already stored.
  // A field listed here whose value is `undefined` is DELETED from the doc.
  //
  // Why this exists: a plain `setDoc(..., { merge: true })` deep-merges maps
  // and silently drops `undefined` values, so "removing" something from a map
  // field (e.g. taking one color's back photo out of `colorImages`, or
  // clearing the product's `imageBack`) never actually removed it from
  // Firestore -- the old value stayed and reappeared on the storefront.
  //
  // When replaceFields is used, EVERY top-level key in `changes` is written
  // as-is (replace, not deep-merge), so only pass it a complete set of
  // values (like the Edit Product form does).
  const updateProduct = useCallback(async (id, changes, options = {}) => {
    const { replaceFields = [] } = options
    // menuParent changing means groupSlug needs to move with it -- same
    // reasoning as addProduct above.
    const nextChanges =
      'menuParent' in changes ? { ...changes, groupSlug: changes.menuParent ? toSlug(changes.menuParent) : undefined } : changes
    try {
      const data = stripUndefined(nextChanges)
      // deleteField() is a Firestore sentinel, so it's added AFTER
      // stripUndefined (which would corrupt it -- see utils/stripUndefined.js).
      replaceFields.forEach((field) => {
        if (field in nextChanges && nextChanges[field] === undefined) data[field] = deleteField()
      })
      // merge:true (via setDoc) rather than updateDoc so this still works
      // even for a product that hasn't been imported into Firestore yet
      // individually -- it creates the doc instead of throwing "not-found".
      await setDoc(
        doc(db, PRODUCTS_COLLECTION, id),
        data,
        replaceFields.length ? { mergeFields: Object.keys(data) } : { merge: true }
      )
      setApiError(null)
      return { id, ...nextChanges }
    } catch (error) {
      console.error('updateProduct failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
  }, [])

  // Writes several products' changes in one Firestore batch instead of one
  // updateProduct call per product -- used when reordering a homepage
  // section, where moving one item means renumbering everyone else in that
  // row too. A single batch keeps that renumbering atomic (either every
  // product's new position lands together, or none do) instead of the
  // homepage briefly showing a half-reordered row if a call in the middle
  // failed.
  const updateProducts = useCallback(async (updates) => {
    try {
      await writeInChunks(updates, (batch, { id, changes }) =>
        batch.set(doc(db, PRODUCTS_COLLECTION, id), stripUndefined(changes), { merge: true })
      )
      setApiError(null)
    } catch (error) {
      console.error('updateProducts failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
  }, [])

  const deleteProduct = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id))
      setApiError(null)
    } catch (error) {
      console.error('deleteProduct failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
  }, [])

  const deleteProductsByType = useCallback(
    async (category, subCategory) => {
      const matches = (p) =>
        p.category === category && (p.subCategory === subCategory || (p.menuParent && toSlug(p.menuParent) === subCategory))
      const toRemove = products.filter(matches)
      try {
        await writeInChunks(toRemove, (batch, p) => batch.delete(doc(db, PRODUCTS_COLLECTION, p.id)))
        setApiError(null)
      } catch (error) {
        console.error('deleteProductsByType failed:', error)
        setApiError(friendlyWriteError(error))
        throw error
      }
      return toRemove.length
    },
    [products]
  )

  const deleteProductsByMenuParent = useCallback(
    async (category, menuParent) => {
      const matches = (p) => p.category === category && p.menuParent === menuParent
      const toRemove = products.filter(matches)
      try {
        await writeInChunks(toRemove, (batch, p) => batch.delete(doc(db, PRODUCTS_COLLECTION, p.id)))
        setApiError(null)
      } catch (error) {
        console.error('deleteProductsByMenuParent failed:', error)
        setApiError(friendlyWriteError(error))
        throw error
      }
      return toRemove.length
    },
    [products]
  )

  // One-time (or "start over") import: pushes the built-in seed catalog
  // into Firestore, using the SAME ids the catalog already generates --
  // so any links that already point at /product/:id keep working. Admin
  // calls this both for the first import and for "Reset catalog to
  // defaults".
  const seedFromCatalog = useCallback(async () => {
    try {
      // Clear whatever is currently in Firestore first so a "reset" fully
      // reverts admin-added/edited products, not just re-adds the seed.
      await writeInChunks(products, (batch, p) => batch.delete(doc(db, PRODUCTS_COLLECTION, p.id)))
      await writeInChunks(seedProducts, (batch, p) => {
        const { id, ...rest } = p
        batch.set(doc(db, PRODUCTS_COLLECTION, id), { ...stripUndefined(rest), createdAt: serverTimestamp() })
      })
      setApiError(null)
    } catch (error) {
      console.error('seedFromCatalog failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
    return seedProducts
  }, [products])

  // Restores ONE product back to its original values from the built-in
  // code catalog (data/products.js) -- e.g. an image or price got changed
  // in Admin and the admin wants that single product back to how it
  // started. This replaces the old "Reset catalog to defaults" button,
  // which used to wipe and re-seed EVERY product in Firestore at once --
  // safe for undoing one mistake, but it also threw away every other
  // admin edit made since the last import, which was a nasty surprise to
  // redo. This version only ever touches the one product doc requested.
  const resetProductToDefault = useCallback(
    async (id) => {
      const original = seedProducts.find((p) => p.id === id)
      if (!original) {
        throw new Error(
          "This product isn't part of the built-in catalog, so there's no original version to restore it to."
        )
      }
      try {
        const { id: _seedId, ...rest } = original
        // merge:false -- a real reset should also clear any extra fields
        // (a color added only in Admin, say) that aren't part of the
        // original, not just overwrite the ones that match.
        await setDoc(doc(db, PRODUCTS_COLLECTION, id), stripUndefined(rest), { merge: false })
        setApiError(null)
      } catch (error) {
        console.error('resetProductToDefault failed:', error)
        setApiError(friendlyWriteError(error))
        throw error
      }
      return original
    },
    [seedProducts]
  )

  // Catalog entries (from data/products.js) whose id isn't in Firestore
  // yet -- e.g. a product someone uncommented/added in the code after the
  // one-time import already happened. `seedFromCatalog` would bring these
  // in too, but only by wiping and replacing every existing Firestore doc
  // first, which throws away any admin edits (price tweaks, stock/visibility
  // flags, images set through Admin, products added only in Admin, etc.).
  // This is the additive version: it only ADDS the ones genuinely missing
  // and never deletes or overwrites anything already in Firestore.
  const missingCatalogProducts = useMemo(() => {
    const existingIds = new Set(products.map((p) => p.id))
    return seedProducts.filter((p) => !existingIds.has(p.id))
  }, [products])

  const importMissingProducts = useCallback(async () => {
    try {
      await writeInChunks(missingCatalogProducts, (batch, p) => {
        const { id, ...rest } = p
        // create() semantics via set(..., { merge: false }) would still
        // clobber a doc that appeared moments ago from another tab; plain
        // set with no merge option is fine here since these ids are, by
        // definition (see missingCatalogProducts above), not present in
        // `products` as of the last snapshot.
        batch.set(doc(db, PRODUCTS_COLLECTION, id), { ...stripUndefined(rest), createdAt: serverTimestamp() })
      })
      setApiError(null)
    } catch (error) {
      console.error('importMissingProducts failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
    return missingCatalogProducts.length
  }, [missingCatalogProducts])

  // Products whose Firestore doc predates a catalog change to their
  // `menuParent` -- most commonly, a Women's Tops product that was
  // imported before Side View photos existed, so its doc was written
  // without `menuParent: 'Tops'` (or with an older group name). Until it's
  // repaired, `isWomenTopsProduct`/Admin's `isWomenTops` check reads the
  // live Firestore value and comes back false, so the Edit Product modal
  // silently has no Side View field for a product that should have one --
  // even though data/products.js and Admin.jsx both already support it.
  // "Add missing products" doesn't fix this (the doc already exists);
  // "Reset catalog to defaults" would (but also wipes every other admin
  // edit). This is the narrow, non-destructive fix: only touch the one
  // field (plus the groupSlug it derives) on products whose id still
  // matches a seed entry.
  const seedMenuParentById = useMemo(() => {
    const map = new Map()
    seedProducts.forEach((p) => map.set(p.id, p.menuParent))
    return map
  }, [])

  const staleMenuParentProducts = useMemo(
    () =>
      products.filter((p) => seedMenuParentById.has(p.id) && seedMenuParentById.get(p.id) !== p.menuParent),
    [products, seedMenuParentById]
  )

  const repairMenuParent = useCallback(async () => {
    const targets = staleMenuParentProducts
    try {
      await writeInChunks(targets, (batch, p) => {
        const menuParent = seedMenuParentById.get(p.id)
        const data = stripUndefined({ menuParent, groupSlug: menuParent ? toSlug(menuParent) : undefined })
        // menuParent (unlike groupSlug) can legitimately go from a real
        // value back to none, so a stripped-out menuParent needs an
        // explicit delete rather than just being left out of the merge.
        if (menuParent === undefined) data.menuParent = deleteField()
        batch.set(doc(db, PRODUCTS_COLLECTION, p.id), data, { mergeFields: Object.keys(data) })
      })
      setApiError(null)
    } catch (error) {
      console.error('repairMenuParent failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
    return targets.length
  }, [staleMenuParentProducts, seedMenuParentById])

  // Side View photos belong only to Women's Tops. Any other product in
  // Firestore that still carries one (e.g. left over from an older catalog
  // import) is listed here so Admin can offer a one-click cleanup. The
  // storefront already ignores these; removing them just deletes the dead data.
  const straySidePhotoProducts = useMemo(
    () => products.filter((p) => !isWomenTopsProduct(p) && hasSidePhoto(p)),
    [products]
  )

  const removeStraySidePhotos = useCallback(async () => {
    const targets = straySidePhotoProducts
    try {
      await writeInChunks(targets, (batch, p) => {
        const data = {}
        if (p.imageSide) data.imageSide = deleteField()
        const stripped = stripColorSidePhotos(p.colorImages)
        // Same as an Admin Edit save: rewrite colorImages without the side
        // photos (or delete the field if nothing else is left in it).
        if (stripped.changed) data.colorImages = stripped.colorImages === undefined ? deleteField() : stripped.colorImages
        batch.set(doc(db, PRODUCTS_COLLECTION, p.id), data, { mergeFields: Object.keys(data) })
      })
      setApiError(null)
    } catch (error) {
      console.error('removeStraySidePhotos failed:', error)
      setApiError(friendlyWriteError(error))
      throw error
    }
    return targets.length
  }, [straySidePhotoProducts])

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

  // Products with `isVisible: false` are completely unshown on the
  // storefront -- unlike `inStock: false` (which still shows the product,
  // just marked unavailable), a hidden product is dropped from every
  // customer-facing list, search, menu, and its own detail page, as if it
  // didn't exist. Admin's own Inventory list still uses the raw `products`
  // array above so a hidden product can be found again and un-hidden.
  // Missing/undefined `isVisible` counts as visible, same convention as
  // `inStock`.
  const storeProducts = useMemo(() => products.filter((p) => p.isVisible !== false), [products])

  const featuredProducts = useMemo(
    () => storeProducts.filter((p) => p.isFeatured && p.inStock !== false).slice(0, 8),
    [storeProducts]
  )
  const bestSellerProducts = useMemo(
    () => storeProducts.filter((p) => p.isBestSeller && p.inStock !== false).slice(0, 8),
    [storeProducts]
  )
  const newArrivalProducts = useMemo(
    () => storeProducts.filter((p) => p.isNew && p.inStock !== false).slice(0, 8),
    [storeProducts]
  )

  function getVisibleProductById(id) {
    return storeProducts.find((p) => p.id === id)
  }

  const value = {
    products,
    storeProducts,
    isLoading,
    apiError,
    needsSeed,
    seedFromCatalog,
    missingCatalogProducts,
    importMissingProducts,
    straySidePhotoProducts,
    removeStraySidePhotos,
    staleMenuParentProducts,
    repairMenuParent,
    reloadProducts: async () => products,
    addProduct,
    updateProduct,
    updateProducts,
    deleteProduct,
    deleteProductsByType,
    deleteProductsByMenuParent,
    resetProductToDefault,
    getProductById,
    getVisibleProductById,
    getProductsByCategory,
    getProductsBySubCategory,
    featuredProducts,
    bestSellerProducts,
    newArrivalProducts,
  }

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

function friendlyWriteError(error) {
  if (error?.code === 'permission-denied') {
    return 'Firestore rejected that change -- you must be signed in as an active admin (admins/{uid} with role="admin", active=true), and firestore.rules must be published.'
  }
  return error?.message || 'Something went wrong saving to Firestore.'
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts must be used within a ProductProvider')
  return ctx
}
