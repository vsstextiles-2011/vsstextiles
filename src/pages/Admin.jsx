import { SHADE_OPTIONS, deriveBraShade } from '../utils/braShade.js'
import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import {
  Package,
  PackageX,
  ShoppingCart,
  Users,
  IndianRupee,
  Search,
  Plus,
  ImagePlus,
  Upload,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  RefreshCw,
  LayoutDashboard,
  Boxes,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  ListOrdered,
  LogOut,
  Truck,
  Eye,
  EyeOff,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Calendar,
  Tag,
  Images,
  Film,
  Mail,
  MailOpen,
  SlidersHorizontal,
  Info,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProducts } from '../context/ProductContext.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { useContactMessages, messageDate } from '../utils/contactMessages.js'
import { formatPrice } from '../utils/formatPrice.js'
import { buildMegaMenu } from '../utils/menu.js'
import { aboutProductTypes } from '../utils/aboutTypes.js'
import { fallbackSrc, onImgError } from '../utils/imgFallback.js'
import { colorHex, allProducts as seedCatalogProducts } from '../data/products.js'
import { sortByType } from '../utils/typeOrder.js'
import { sortByCatalogOrder, catalogIndexById, displayOrder } from '../utils/catalogOrder.js'
import { ORDER_STATUS_OPTIONS, NON_REVENUE_STATUSES, statusLabel } from '../utils/orderTracking.js'
import AdminOrderModal from '../components/admin/AdminOrderModal.jsx'
import { STOREFRONT_SECTIONS, OFFER_SECTIONS, orderField, sectionEligible } from '../utils/storefrontSections.js'

const categoryOptions = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
]

const categoryLabelMap = Object.fromEntries(categoryOptions.map((c) => [c.value, c.label]))

// The "type" a product is filed under for the Types dropdown — a grouped
// product (e.g. every RN/RNS variant under "Premium Vest") answers to its
// menuParent group label; anything else answers to its own subcategory
// label. This mirrors exactly how utils/menu.js groups products for the
// nav/mega-menu, so the Types list here always matches what shoppers see.
function productType(p) {
  return p.menuParent || p.subCategoryLabel || p.subCategory || 'Other'
}

// The "section" a product sits in inside its type -- e.g. under the type
// "Tops" the sections are "Vertican Open Top", "Side Open Top", "Anarkali"...
// Every colour of one style shares the same section, so a whole section can
// be moved up/down as one block in the Inventory tab.
function sectionKey(p) {
  return p.subCategoryLabel || p.subCategory || 'Other'
}

// Takes a list that is already sorted by type + display order and pulls each
// section's products together (within each type run), keeping sections in
// the order of their first/lowest-ranked product. Sections that were
// scattered by earlier single-product moves end up contiguous.
function clusterBySection(list) {
  const out = []
  let i = 0
  while (i < list.length) {
    const type = productType(list[i])
    let j = i
    while (j < list.length && productType(list[j]) === type) j++
    const groups = new Map()
    list.slice(i, j).forEach((p) => {
      const k = `${p.category}|${sectionKey(p)}`
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(p)
    })
    groups.forEach((g) => out.push(...g))
    i = j
  }
  return out
}

// Sections (in current display order) for one type within one category,
// each as { key, items }. Built from the FULL product list so moving a
// section never depends on which search/stock filter is active.
function buildSections(allProducts, type, category) {
  const run = clusterBySection(
    sortByCatalogOrder(allProducts.filter((p) => productType(p) === type && p.category === category))
  )
  const groups = []
  run.forEach((p) => {
    const k = sectionKey(p)
    const last = groups[groups.length - 1]
    if (last && last.key === k) last.items.push(p)
    else groups.push({ key: k, items: [p] })
  })
  return groups
}

// Every menuHeading is "<Category> Innerwear" / "<Category> Outerwear"
// (e.g. "Men Innerwear", "Girls Outerwear") — the Wear dropdown doesn't
// need the gendered detail since the Category pills already cover that,
// so this collapses any heading down to just its generic Innerwear /
// Outerwear half.
function wearType(heading) {
  if (!heading) return null
  if (heading.endsWith('Innerwear')) return 'Innerwear'
  if (heading.endsWith('Outerwear')) return 'Outerwear'
  return heading
}

export default function Admin() {
  const {
    products,
    deleteProduct,
    deleteProductsByType,
    deleteProductsByMenuParent,
    resetProductToDefault,
    saveRestorePoint,
    updateProduct,
    updateProducts,
    apiError,
    needsSeed,
    seedFromCatalog,
    missingCatalogProducts,
    deletedCatalogProducts,
    restoreCatalogProducts,
    dismissCatalogProducts,
    importMissingProducts,
    straySidePhotoProducts,
    removeStraySidePhotos,
    staleMenuParentProducts,
    repairMenuParent,
  } = useProducts()
  const [seeding, setSeeding] = useState(false)
  const [importingMissing, setImportingMissing] = useState(false)
  const [removingSides, setRemovingSides] = useState(false)
  const [repairingMenuParent, setRepairingMenuParent] = useState(false)
  // id of the product currently being restored to its built-in default via
  // the per-product "Restore original" action (see handleResetProduct) --
  // tracked per-row so only that one row shows a busy state.
  const [resettingProductId, setResettingProductId] = useState(null)
  const { user, isAdmin, loading, logout } = useAuth()
  const { adminOrders, adminOrdersLoading, updateOrderStatus } = useOrders()
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [wearFilter, setWearFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  // Position of editingProduct within `filtered` (the Inventory tab's
  // current sorted/filtered list) at the moment Edit was clicked -- lets
  // the modal offer Previous/Next so an admin can work through a run of
  // products without closing and reopening the modal each time.
  const [editingIndex, setEditingIndex] = useState(null)
  const [toast, setToast] = useState('')
  // id of the product currently being moved up/down in the Inventory
  // table, so its two arrow buttons (and its swap partner's) can disable
  // while the write is in flight -- prevents a double-click from firing a
  // second swap before the first one's Firestore write has landed.
  const [movingProductId, setMovingProductId] = useState(null)
  // Opens the "Reorder sections" panel (drag whole sub-categories around)
  const [sectionOrderOpen, setSectionOrderOpen] = useState(false)
  // { type, category, key } of the section whose price & sizes are being edited for all colours
  const [sectionPriceEdit, setSectionPriceEdit] = useState(null)
  // Collapsible icon-rail mode for the sidebar — as more storefront section
  // tabs get added over time the nav list only grows, so this keeps the
  // panel scalable: collapse it down to icons-with-tooltips to reclaim
  // width for the content, or leave it expanded with full labels. Persisted
  // per-browser so an admin's choice sticks across visits.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem('vss-admin-sidebar-collapsed') === '1'
  )
  useEffect(() => {
    window.localStorage.setItem('vss-admin-sidebar-collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])
  // The "Homepage Sections" group (Best Seller, New Arrivals, Bras,
  // Panties, ...) is the part of the sidebar most likely to keep growing as
  // more storefront rows are added — collapsed by default so the far more
  // frequently used Overview/Orders/Inventory/Add Product tabs are never
  // pushed below the fold by a long list of section tabs.
  const [sectionsGroupOpen, setSectionsGroupOpen] = useState(false)
  // Expanded by default (unlike Homepage Sections, which starts collapsed)
  // since Special Offers is a newly added group and shouldn't require
  // knowing to click the heading first just to find it.
  const [offersGroupOpen, setOffersGroupOpen] = useState(true)
  // Quick jump-to-inventory search, pinned in the top bar so it's reachable
  // from any tab instead of only from inside the Inventory tab itself.
  const [quickSearch, setQuickSearch] = useState('')
  // Order search typed into the pinned quick-access bar gets handed off to
  // the Orders tab's own search box (see the form's onSubmit below) rather
  // than the Inventory one, so it needs to live up here where both the
  // quick-access bar and <OrdersAdminTab> can reach it.
  const [ordersQuery, setOrdersQuery] = useState('')
  // Which section of the admin panel is showing. The whole page used to be
  // one long scroll (stats → out-of-stock → add-product form → manage
  // categories → inventory table, one after another); it's split into tabs
  // instead so each job — checking stock, adding a product, tidying
  // categories, browsing inventory — has its own uncluttered screen instead
  // of a mile of scrolling to reach it.
  const [activeTab, setActiveTab] = useState(() => {
    // Lets shortcuts such as /admin?tab=about open straight on that tab.
    try {
      return new URLSearchParams(window.location.search).get('tab') || 'overview'
    } catch {
      return 'overview'
    }
  })

  // Category pill counts stay against the full catalog EXCEPT for whichever
  // Wear is currently selected — so picking "Inner Wear" immediately shows
  // how many innerwear products each category (Men/Women/Boys/Girls) has,
  // instead of leaving the old, unfiltered totals on the pills. They're
  // deliberately NOT scoped to the active category pill itself, since a
  // pill needs to keep showing its own count regardless of which one is
  // currently selected.
  const categoryCounts = useMemo(() => {
    const matchesWear = (p) => wearFilter === 'all' || wearType(p.menuHeading) === wearFilter
    const counts = { all: products.filter(matchesWear).length }
    categoryOptions.forEach((c) => {
      counts[c.value] = products.filter((p) => p.category === c.value && matchesWear(p)).length
    })
    return counts
  }, [products, wearFilter])

  // Wear options are just the two generic buckets — Inner Wear / Outer Wear
  // — scoped to whichever category pill is active (picking "All Categories"
  // counts across everyone). Each option carries its own count so the
  // dropdown reads like "Inner Wear (3)", the same way the category pills
  // do. A bucket is omitted if the active category has zero products in it.
  const wearOptions = useMemo(() => {
    const counts = { Innerwear: 0, Outerwear: 0 }
    products.forEach((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return
      const w = wearType(p.menuHeading)
      if (w === 'Innerwear' || w === 'Outerwear') counts[w] += 1
    })
    return [
      { value: 'Innerwear', label: 'Inner Wear', count: counts.Innerwear },
      { value: 'Outerwear', label: 'Outer Wear', count: counts.Outerwear },
    ].filter((o) => o.count > 0)
  }, [products, categoryFilter])

  // Type options (T-Shirts, Slips, Bras, Nighty, ...) scoped to both the
  // active category AND the active wear bucket.
  const typeOptions = useMemo(() => {
    const seen = new Set()
    products.forEach((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return
      if (wearFilter !== 'all' && wearType(p.menuHeading) !== wearFilter) return
      seen.add(productType(p))
    })
    return sortByType([...seen])
  }, [products, categoryFilter, wearFilter])

  // Reset the dependent filter whenever its parent narrows, so Types never
  // gets stuck on a value that no longer exists under the new Category/Wear.
  function handleCategoryFilter(value) {
    setCategoryFilter(value)
    setWearFilter('all')
    setTypeFilter('all')
  }
  function handleWearFilter(value) {
    setWearFilter(value)
    setTypeFilter('all')
  }

  // Sorted by the same canonical type order the "All Types" dropdown
  // uses (typeOrder.js), not alphabetically -- so the inventory table's
  // row order always lines up with that dropdown's ordering instead of
  // drifting into whatever order the data happens to come back in.
  // Within a type, products follow the catalog's own order (the order
  // they're defined in data/products.js -- the same order every other
  // Men/Women/Boys/Girls, inner- and outerwear listing on the site
  // uses) rather than alphabetically: sortByType's alphabetical
  // tie-break only kicks in when two PRODUCTS land on the exact same
  // type label, and Array.sort is stable, so running sortByCatalogOrder
  // first fixes that starting order for every category/wear combo, not
  // just one.
  const filtered = clusterBySection(sortByType(
    sortByCatalogOrder(
      products
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .filter((p) => {
          if (stockFilter === 'in') return p.inStock !== false
          if (stockFilter === 'out') return p.inStock === false
          return true
        })
        .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
        .filter((p) => wearFilter === 'all' || wearType(p.menuHeading) === wearFilter)
        .filter((p) => typeFilter === 'all' || productType(p) === typeFilter)
    ),
    productType,
  ))

  // Category → heading → subcategory structure, derived live from whatever
  // products currently exist, with a product count per subcategory/group
  // computed by buildMegaMenu itself (see utils/menu.js) — this is the same
  // data the nav/shop filters use, so deleting the last product in a
  // subcategory here also makes it disappear from the site automatically,
  // and the counts shown can never drift out of sync with what's on the
  // page since they come from the same pass that built the rows.
  const megaMenu = useMemo(() => buildMegaMenu(products), [products])

  async function handleDeleteSubCategory(category, item) {
    const count = item.count || 0
    if (
      !window.confirm(
        `Delete "${item.label}" from ${categoryLabelMap[category]}? This removes all ${count} product(s) in it and takes it off the site — this can't be undone.`
      )
    )
      return
    try {
      // Grouped rows (e.g. "Premium Vest") don't have their own subCategory
      // — their products are linked via menuParent instead — so they need
      // a different lookup than a plain subcategory row.
      const removedCount = item.isGroup
        ? await deleteProductsByMenuParent(category, item.label)
        : await deleteProductsByType(category, item.slug)
      showToast(`Deleted "${item.label}" (${removedCount} product${removedCount === 1 ? '' : 's'})`)
    } catch (err) {
      showToast(err.message || 'Could not delete category')
    }
  }

  const outOfStockProducts = useMemo(() => products.filter((p) => p.inStock === false), [products])
  // ids that exist in the built-in code catalog -- only these have an
  // original version to restore via the per-product "Restore original"
  // action (a product added entirely through Admin has nothing to revert to).
  const seedCatalogIds = useMemo(() => new Set(seedCatalogProducts.map((p) => p.id)), [])
  // One count per storefront section (Best Seller, New Arrivals, Bras, ...)
  // — how many eligible products are currently flagged into that section's
  // row. Used for each section's own sidebar tab badge and its Overview
  // quick-action card, computed once here so every section tab doesn't
  // re-filter the whole catalog on its own.
  const { allHeroSlides } = useSiteContent()
  const heroSlideCount = allHeroSlides.filter((s) => s.active && s.image).length
  const { homeVideos: liveHomeVideos } = useSiteContent()
  const homeVideoCount = liveHomeVideos.length
  // Contact-page messages from customers (Admin -> Messages).
  const { messages: contactMessages, loading: messagesLoading, error: messagesError, unreadCount: unreadMessages, setRead: setMessageRead, remove: removeMessage } = useContactMessages(Boolean(isAdmin))
  const sectionCounts = useMemo(() => {
    const counts = {}
    ;[...STOREFRONT_SECTIONS, ...OFFER_SECTIONS].forEach((s) => {
      counts[s.id] = products.filter(
        (p) => sectionEligible(s, p) && !!p[s.field] && p.inStock !== false && p.isVisible !== false
      ).length
    })
    return counts
  }, [products])

  // Total Sales / Customers, computed live from Firestore's orders
  // collection (adminOrders, from OrderContext's onSnapshot listener) the
  // same way Orders/Products/Out of Stock above already are, instead of
  // the placeholder numbers baseStats used to hold. A cancelled order
  // never actually brought in revenue, so it's excluded from Total Sales
  // (its items still count toward the Orders card above, same as the
  // order list itself). There's no separate customers/users collection
  // in Firestore to query here, so Customers counts the distinct people
  // who have placed at least one order — identified by account (userId)
  // where present, falling back to their delivery phone number for the
  // rare order missing one — rather than every registered account.
  const { totalSales, customerCount } = useMemo(() => {
    const customerKeys = new Set()
    let sales = 0
    adminOrders.forEach((o) => {
      const key = o.userId || o.address?.phone
      if (key) customerKeys.add(key)
      if (!NON_REVENUE_STATUSES.includes(o.status)) sales += o.totals?.total || 0
    })
    return { totalSales: sales, customerCount: customerKeys.size }
  }, [adminOrders])

  const stats = [
    { icon: IndianRupee, label: 'Total Sales', value: formatPrice(totalSales), goTo: 'sales' },
    { icon: ShoppingCart, label: 'Orders', value: adminOrders.length, goTo: 'orders' },
    { icon: Package, label: 'Products', value: products.length, goTo: 'inventory' },
    { icon: PackageX, label: 'Out of Stock', value: outOfStockProducts.length, alert: outOfStockProducts.length > 0, goTo: 'overview' },
    { icon: Users, label: 'Customers', value: customerCount, goTo: 'customers' },
  ]

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? If it's in the code catalog you can bring it back from Deleted products.`)) return
    try {
      await deleteProduct(product.id)
      showToast('Product deleted')
    } catch (err) {
      showToast(err.message || 'Could not delete product')
    }
  }

  async function handleToggleStock(product) {
    const nextInStock = !(product.inStock !== false)
    try {
      await updateProduct(product.id, { inStock: nextInStock })
      showToast(nextInStock ? `"${product.name}" marked In Stock` : `"${product.name}" marked Out of Stock`)
    } catch (err) {
      showToast(err.message || 'Could not update stock status')
    }
  }

  // Lets someone click the product's own thumbnail right there in the
  // Inventory list and swap its main photo on the spot — no need to open
  // "Edit Product" and scroll down to the photo box first. Uploads the
  // same way ImageUploadField does, then saves straight to Firestore.
  async function handleQuickReplaceImage(product, savedPath, uploadErr) {
    if (uploadErr || !savedPath) {
      showToast('Could not upload that photo — make sure "npm run dev" is running, then try again.')
      return
    }
    try {
      await updateProduct(product.id, { image: savedPath })
      showToast(`Photo updated for "${product.name}"`)
    } catch (err) {
      showToast(err.message || 'Could not save the new photo')
    }
  }

  // Fully hides/unhides a product from the storefront — unlike "Out of
  // Stock" (which still shows the product, just marked unavailable), a
  // hidden product disappears completely: every listing/menu/search and
  // even its own direct product-page URL, as if it were never in the
  // catalog. It still sits right here in Inventory so it can be switched
  // back on later.
  async function handleToggleVisibility(product) {
    const nextVisible = product.isVisible === false
    try {
      await updateProduct(product.id, { isVisible: nextVisible })
      showToast(nextVisible ? `"${product.name}" is visible on the website again` : `"${product.name}" is now hidden from the website`)
    } catch (err) {
      showToast(err.message || 'Could not update visibility')
    }
  }

  // Toggles whichever storefront flag a section uses (isBestSeller / isNew /
  // isFeatured) on a single product — shared by every section's own tab in
  // the Admin sidebar (Best Seller, New Arrivals, Bras, Panties, ...).
  // Turning a product OFF also clears its manual position for this section
  // (that section's own orderXxx field) so re-adding it later starts fresh
  // at the bottom instead of silently reappearing wherever it used to sit.
  async function handleToggleSectionFlag(product, field, sectionLabel, sectionId, extra) {
    const next = !product[field]
    const changes = { [field]: next }
    if (!next && sectionId) changes[orderField(sectionId)] = null
    // Special Offers: the colour chosen to lead the offer card goes with the
    // product being added, and is cleared when it comes off the page.
    if (field === 'isOffer') changes.offerColor = next && extra?.offerColor ? extra.offerColor : null
    try {
      await updateProduct(product.id, changes)
      showToast(next ? `"${product.name}" added to ${sectionLabel}` : `"${product.name}" removed from ${sectionLabel}`)
    } catch (err) {
      showToast(err.message || 'Could not update homepage status')
    }
  }

  // Special Offers: quick price / sizes edit. Writes to the SAME product
  // record the shop, product page and homepage read, so a change made on an
  // offer row shows up everywhere straight away.
  // Inventory: change price / sizes for EVERY colour in one section at once.
  async function handleSaveSectionPriceSizes(items, changes) {
    try {
      await updateProducts(
        items.map((it) => ({ id: it.id, changes, replaceFields: ['sizePricing'] }))
      )
      showToast(`Price & sizes updated for all ${items.length} colours`)
      return true
    } catch (err) {
      showToast(err.message || 'Could not save price & sizes')
      return false
    }
  }

  async function handleSaveOfferPriceSizes(product, changes) {
    try {
      await updateProduct(product.id, changes, { replaceFields: ['sizePricing'] })
      showToast(`"${product.name}" price & sizes updated everywhere`)
      return true
    } catch (err) {
      showToast(err.message || 'Could not save price & sizes')
      return false
    }
  }

  // Special Offers: changes which colour of a product leads its offer card
  // (and opens first on the product page). '' = the product's default colour.
  async function handleSetOfferColor(product, colorName) {
    try {
      await updateProduct(product.id, { offerColor: colorName || null })
      showToast(colorName ? `"${product.name}" will show in ${colorName} on the Offers page` : `"${product.name}" will show in its default colour`)
    } catch (err) {
      showToast(err.message || 'Could not change the offer colour')
    }
  }

  // Persists a full reorder of one section's "on this row" list — called
  // with every member of that row re-numbered 0..n-1 in its new order, so
  // the whole row's position is rewritten atomically in a single batch
  // rather than product-by-product.
  async function handleReorderSection(updates) {
    try {
      await updateProducts(updates)
    } catch (err) {
      showToast(err.message || 'Could not reorder that section')
    }
  }

  // Moves one product up/down in the Inventory tab's list (and, since
  // Shop's default "Popular" sort and the product page's related/category
  // picks all read the same `sortOrder` field via displayOrder() in
  // catalogOrder.js, on the storefront too). `list` is the exact `filtered`
  // array the table is rendering, so the swap always matches what's on
  // screen regardless of which category/wear/type/search filters are
  // active. Only swaps within the same product type -- crossing into the
  // next type's cluster would silently reorder two unrelated groups
  // relative to each other, which the table gives no visual cue for.
  //
  // Only the two swapped products are written (their sortOrder values are
  // exchanged), not the whole list -- cheap even when hundreds of products
  // are in view unfiltered. A product that has never been moved has no
  // sortOrder yet, so its current catalog position (catalogIndexById) is
  // used as the starting value being swapped away from.
  async function handleMoveInventoryProduct(list, index, direction) {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const a = list[index]
    const b = list[target]
    if (productType(a) !== productType(b) || sectionKey(a) !== sectionKey(b) || a.category !== b.category) return // stay inside the same section; use the section Up/Down buttons to move a whole block

    const aOrder = a.sortOrder ?? catalogIndexById.get(a.id) ?? index
    const bOrder = b.sortOrder ?? catalogIndexById.get(b.id) ?? target

    setMovingProductId(a.id)
    try {
      await updateProducts([
        { id: a.id, changes: { sortOrder: bOrder } },
        { id: b.id, changes: { sortOrder: aOrder } },
      ])
    } catch (err) {
      showToast(err.message || 'Could not reorder that product')
    } finally {
      setMovingProductId(null)
    }
  }

  // Sends ONE product to the very top / bottom of its own section (all the
  // colours of one style). Works on the full section, so it doesn't matter
  // which search/stock filter is active. The section's existing sortOrder
  // slots are re-dealt, so nothing outside the section shifts.
  async function handleMoveProductTo(product, where) {
    const sec = buildSections(products, productType(product), product.category).find(
      (g) => g.key === sectionKey(product),
    )
    if (!sec || sec.items.length < 2) return
    const rest = sec.items.filter((x) => x.id !== product.id)
    const newSeq = where === 'top' ? [product, ...rest] : [...rest, product]
    if (newSeq.every((x, i) => x.id === sec.items[i].id)) return

    let pool = sec.items.map(displayOrder).sort((a, b) => a - b)
    const maxFinite = [...pool].reverse().find(Number.isFinite) ?? 0
    pool = pool.map((v, i) => (Number.isFinite(v) ? v : maxFinite + i + 1))
    for (let i = 1; i < pool.length; i++) if (pool[i] <= pool[i - 1]) pool[i] = pool[i - 1] + 0.001

    const updates = newSeq
      .map((x, i) => ({ x, order: pool[i] }))
      .filter(({ x, order }) => displayOrder(x) !== order)
      .map(({ x, order }) => ({ id: x.id, changes: { sortOrder: order } }))

    setMovingProductId(product.id)
    try {
      if (updates.length) await updateProducts(updates)
    } catch (err) {
      showToast(err.message || 'Could not reorder that product')
    } finally {
      setMovingProductId(null)
    }
  }

  // Re-orders the SECTIONS (sub-categories, e.g. "Vertican Open Top",
  // "Side Open Top") of one type/category. `orderedKeys` is the desired
  // section order. All colours of a section stay together and travel with
  // it. The run's existing sortOrder slots are re-dealt to the products in
  // their new order, so nothing outside that type/category shifts, and the
  // storefront (which reads the same sortOrder) follows.
  async function handleReorderSections(type, category, orderedKeys, message) {
    const groups = buildSections(products, type, category)
    const byKey = new Map(groups.map((g) => [g.key, g]))
    const seq = orderedKeys.map((k) => byKey.get(k)).filter(Boolean)
    groups.forEach((g) => { if (!orderedKeys.includes(g.key)) seq.push(g) })
    const run = groups.flatMap((g) => g.items)
    const newSeq = seq.flatMap((g) => g.items)

    let pool = run.map(displayOrder).sort((a, b) => a - b)
    const maxFinite = [...pool].reverse().find(Number.isFinite) ?? 0
    pool = pool.map((v, i) => (Number.isFinite(v) ? v : maxFinite + i + 1))
    for (let i = 1; i < pool.length; i++) if (pool[i] <= pool[i - 1]) pool[i] = pool[i - 1] + 0.001

    const updates = newSeq
      .map((p, i) => ({ p, order: pool[i] }))
      .filter(({ p, order }) => displayOrder(p) !== order)
      .map(({ p, order }) => ({ id: p.id, changes: { sortOrder: order } }))
    if (!updates.length) return

    setMovingProductId(`sections:${type}|${category}`)
    try {
      await updateProducts(updates)
      if (message) showToast(message)
    } catch (err) {
      showToast(err.message || 'Could not reorder those sections')
    } finally {
      setMovingProductId(null)
    }
  }

  // Convenience for the section header buttons: move one section by
  // 'up' | 'down' (one step) or 'top' | 'bottom' (all the way).
  async function handleMoveSection(type, category, key, where) {
    const keys = buildSections(products, type, category).map((g) => g.key)
    const from = keys.indexOf(key)
    if (from < 0) return
    const to =
      where === 'top' ? 0 : where === 'bottom' ? keys.length - 1 : from + (where === 'up' ? -1 : 1)
    if (to < 0 || to >= keys.length || to === from) return
    keys.splice(to, 0, keys.splice(from, 1)[0])
    await handleReorderSections(type, category, keys, `Moved "${key}" ${where === 'top' ? 'to the top' : where === 'bottom' ? 'to the bottom' : where}`)
  }

  async function handleSeed() {
    setSeeding(true)
    try {
      await seedFromCatalog()
      showToast('Catalog imported into Firestore')
    } catch (err) {
      showToast(err.message || 'Could not import catalog')
    } finally {
      setSeeding(false)
    }
  }

  async function handleRemoveStraySides() {
    setRemovingSides(true)
    try {
      const count = await removeStraySidePhotos()
      showToast(`Removed side photos from ${count} product${count === 1 ? '' : 's'}`)
    } catch (err) {
      showToast(err.message || 'Could not remove the side photos')
    } finally {
      setRemovingSides(false)
    }
  }

  async function handleRepairMenuParent() {
    setRepairingMenuParent(true)
    try {
      const count = await repairMenuParent()
      showToast(`Fixed grouping on ${count} product${count === 1 ? '' : 's'} — reopen Edit Product to see the Side View field`)
    } catch (err) {
      showToast(err.message || 'Could not fix product grouping')
    } finally {
      setRepairingMenuParent(false)
    }
  }

  async function handleImportMissing() {
    setImportingMissing(true)
    try {
      const count = await importMissingProducts()
      showToast(`Added ${count} new product${count === 1 ? '' : 's'} from the code catalog`)
    } catch (err) {
      showToast(err.message || 'Could not add the new products')
    } finally {
      setImportingMissing(false)
    }
  }

  // Restores just ONE product back to its built-in default (name, price,
  // images, everything) -- e.g. undoing an image swap that didn't work
  // out. Unlike the old whole-catalog reset, every other product's edits
  // are left completely untouched, so there's nothing to redo afterwards.
  async function handleResetProduct(product) {
    // Added in Admin before restore points existed: nothing to go back to yet,
    // so offer to save today's details as the restore point instead.
    if (!seedCatalogIds.has(product.id) && !product.restorePoint) {
      if (
        window.confirm(
          `"${product.name}" has no restore point yet. Save its current details as the restore point? (Restore will then bring it back to exactly this.)`
        )
      ) {
        try {
          await saveRestorePoint(product.id)
          showToast(`Restore point saved for "${product.name}"`)
        } catch (err) {
          showToast(err.message || 'Could not save the restore point')
        }
      }
      return
    }
    if (
      !window.confirm(
        `Restore "${product.name}" back to its original built-in details? Any edits you've made to this product (image, price, description, etc.) will be lost. Other products are not affected.`
      )
    )
      return
    setResettingProductId(product.id)
    try {
      await resetProductToDefault(product.id)
      showToast(`"${product.name}" restored to its original details`)
    } catch (err) {
      showToast(err.message || 'Could not restore this product')
    } finally {
      setResettingProductId(null)
    }
  }

  // Nav items for the sidebar/tab bar. `badge` is an optional small count
  // shown next to the label — Inventory always shows the live product
  // total, Overview lights up red with the out-of-stock count so a problem
  // is visible without having to click in.
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: outOfStockProducts.length || null, badgeAlert: true, group: 'main' },
    { id: 'orders', label: 'Orders', icon: Truck, badge: adminOrders.length || null, group: 'main' },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessages || null, badgeAlert: true, group: 'main' },
    { id: 'sales', label: 'Sales', icon: IndianRupee, group: 'main' },
    { id: 'customers', label: 'Customers', icon: Users, badge: customerCount || null, group: 'main' },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: products.length, group: 'main' },
    // Each storefront row gets its own tab — Best Seller, New Arrivals,
    // Bras, Panties, Slips, Tights, Nighty, Tops — instead of all of them
    // being tucked inside one combined "Homepage" tab. Every tab shows the
    // same manual product picker, scoped to just that one row, grouped
    // together under their own "Homepage Sections" heading in the sidebar.
    // The big banner slider at the very top of the homepage — photos,
    // order, links and on/off are all edited in the Hero Slider tab.
    { id: 'hero', label: 'Hero Slider', icon: Images, badge: heroSlideCount || null, group: 'site' },
    // The "See How We Make It" factory & product video section.
    { id: 'videos', label: 'Videos', icon: Film, badge: homeVideoCount || null, group: 'site' },
    // The About Us page (src/pages/About.jsx): text, photos, steps, numbers.
    { id: 'about', label: 'About Us Page', icon: Info, group: 'site' },
    ...STOREFRONT_SECTIONS.map((s) => ({
      id: `section-${s.id}`,                                                                   
      label: s.label,
      icon: Star,
      badge: sectionCounts[s.id] || null,
      group: 'sections',
    })),
    // The Special Offers page (src/pages/Offers.jsx) gets its own group of
    // tabs, one per top-level category, same manual picker pattern as the
    // Homepage Sections above but backed by OFFER_SECTIONS/isOffer instead
    // of STOREFRONT_SECTIONS — see storefrontSections.js.
    ...OFFER_SECTIONS.map((s) => ({
      id: `section-${s.id}`,
      label: s.label,
      icon: Tag,
      badge: sectionCounts[s.id] || null,
      group: 'offers',
    })),
    { id: 'add', label: 'Add Product', icon: Plus, group: 'manage' },
    // Products deleted by mistake that still exist in data/products.js can be put back from here.
    { id: 'deleted', label: 'Deleted products', icon: Trash2, badge: deletedCatalogProducts.length || null, group: 'manage' },
    { id: 'categories', label: 'Categories', icon: Boxes, group: 'manage' },
  ]

  const activeSection = [...STOREFRONT_SECTIONS, ...OFFER_SECTIONS].find((s) => activeTab === `section-${s.id}`)

  // Defense-in-depth: /admin is already wrapped in <AdminRoute>, but keeping
  // this guard here prevents the dashboard UI from rendering if Admin is ever
  // mounted directly somewhere else.
  if (loading) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app">
          <div className="card-base p-8 text-center">
            <p className="text-sm text-ink-soft">Checking admin access...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!user || !isAdmin) {
    return (
      <section className="section-py bg-cream-dark min-h-[70vh]">
        <div className="container-app max-w-md">
          <div className="card-base p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-2">Admin access required</h2>
            <p className="text-sm text-ink-soft mb-4">
              You are not authorized to view the admin dashboard.
            </p>
            {user && (
              <>
                <p className="text-xs text-ink-soft mb-4">Signed in as {user.email}</p>
                <button type="button" onClick={() => logout()} className="btn-primary px-5 py-2">
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-py bg-cream-dark min-h-[70vh]">
      <div className="container-app">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">Admin Dashboard</h1>
            {user && <p className="text-xs text-ink-soft mt-0.5">Signed in as {user.email}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-red-600 transition-colors"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </div>
        <p className="text-sm text-ink-soft mb-4 max-w-3xl">
          Add, edit, and delete products below — changes are saved to Firestore, so they show up for every visitor on any device, not just this browser.
        </p>

        {/* Pinned quick-access bar — always visible above the tabs no matter
            which section is open, so the handful of things an admin reaches
            for constantly (jumping into Inventory, filing a new product,
            checking Orders) never require leaving the current tab first. */}
        <div className="sticky top-16 z-30 -mx-1 px-1 py-2.5 mb-5 bg-cream-dark/95 backdrop-blur-sm">
          <div className="card-base p-2.5 flex items-center gap-2.5 flex-wrap shadow-sm">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-ink-soft/60 uppercase tracking-wider pl-1.5 pr-1 shrink-0">
              <Zap size={13} /> Quick access
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // Order numbers look like "VSSDPUP2SY00" (see generateOrderId
                // in OrderContext) and people often type/paste them with a
                // leading "#". Route those straight to the Orders tab's own
                // search instead of Inventory's, which would never match an
                // order id against a product name.
                const trimmed = quickSearch.trim()
                const strippedHash = trimmed.replace(/^#/, '')
                if (/^vss/i.test(strippedHash)) {
                  setOrdersQuery(strippedHash)
                  setActiveTab('orders')
                } else {
                  setQuery(quickSearch)
                  setActiveTab('inventory')
                }
              }}
              className="relative flex-1 min-w-[160px]"
            >
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search products or order #, then press Enter…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            </form>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 shrink-0"
            >
              <Plus size={14} /> Add Product
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-thread text-ink-soft hover:border-brand hover:text-brand transition-colors shrink-0"
            >
              <Truck size={14} /> Orders
              {adminOrders.length > 0 && (
                <span className="text-[10px] font-semibold bg-brand-light text-brand px-1.5 py-0.5 rounded-full">
                  {adminOrders.length}
                </span>
              )}
            </button>
            {outOfStockProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <PackageX size={14} /> Out of Stock
                <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">
                  {outOfStockProducts.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {apiError && (
          <div className="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-900 text-sm px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <span className="font-medium">⚠ {apiError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-400 text-amber-900 hover:bg-amber-100 transition-colors"
            >
              Reload
            </button>
          </div>
        )}

        {needsSeed && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Firestore has no products yet</p>
              <p className="text-blue-800/80">
                You're currently viewing the built-in catalog from the code, not live data. Import it into Firestore once so it becomes the real, shared product database.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="btn-primary whitespace-nowrap text-sm px-4 py-2 disabled:opacity-60"
            >
              {seeding ? 'Importing…' : 'Import catalog to Firestore'}
            </button>
          </div>
        )}

        {/* Firestore has already been seeded once, but the code catalog now
            has product(s) — e.g. something just uncommented in
            data/products.js — that don't exist in Firestore yet. Unlike
            "Restore original" on a single product (which only touches that
            one doc), this only ADDS the missing ones, so it's safe to click
            even with lots of admin-made edits already live. */}
        {!needsSeed && missingCatalogProducts.length > 0 && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {missingCatalogProducts.length} new product{missingCatalogProducts.length === 1 ? '' : 's'} in the code catalog
              </p>
              <p className="text-blue-800/80">
                These exist in data/products.js but haven't been added to Firestore yet, so they're not showing on the site or in Inventory. Add them without touching anything else already live.
              </p>
            </div>
            <button
              onClick={handleImportMissing}
              disabled={importingMissing}
              className="btn-primary whitespace-nowrap text-sm px-4 py-2 disabled:opacity-60"
            >
              {importingMissing ? 'Adding…' : `Add ${missingCatalogProducts.length} to Firestore`}
            </button>
            <button
              onClick={async () => {
                try {
                  await dismissCatalogProducts(missingCatalogProducts.map((p) => p.id))
                  showToast('Hidden -- you can still add them later from Deleted products')
                } catch (err) {
                  showToast(err.message || 'Could not hide those products')
                }
              }}
              className="whitespace-nowrap text-sm px-4 py-2 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-100"
            >
              Don't add
            </button>
          </div>
        )}

        {staleMenuParentProducts.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {staleMenuParentProducts.length} product{staleMenuParentProducts.length === 1 ? '' : 's'} imported before the Side View feature
              </p>
              <p className="text-amber-800/80">
                These were added to Firestore before their product group (e.g. Women → Tops) was set correctly, so
                Edit Product doesn't know to show a Side View field for them yet — "Add new products" only creates
                products that don't exist yet, it doesn't fix ones already there. This just corrects their grouping;
                nothing else about them changes.
              </p>
            </div>
            <button
              onClick={handleRepairMenuParent}
              disabled={repairingMenuParent}
              className="btn-primary whitespace-nowrap text-sm px-4 py-2 disabled:opacity-60"
            >
              {repairingMenuParent ? 'Fixing…' : `Fix ${staleMenuParentProducts.length} product${staleMenuParentProducts.length === 1 ? '' : 's'}`}
            </button>
          </div>
        )}

        {straySidePhotoProducts.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold mb-0.5">
                {straySidePhotoProducts.length} product{straySidePhotoProducts.length === 1 ? ' has' : 's have'} a side photo but aren't Women's Tops
              </p>
              <p className="text-amber-800/80">
                Only Women's Tops have a Side View. These side photos aren't shown on the site; removing them just cleans up the leftover data. Nothing else on these products changes.
              </p>
            </div>
            <button
              onClick={handleRemoveStraySides}
              disabled={removingSides}
              className="btn-primary whitespace-nowrap text-sm px-4 py-2 disabled:opacity-60"
            >
              {removingSides ? 'Removing…' : `Remove from ${straySidePhotoProducts.length}`}
            </button>
          </div>
        )}

        {toast && (
          <div className="fixed top-24 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
            <CheckCircle2 size={15} className="text-green-400" /> {toast}
          </div>
        )}

        {/* Condensed stat strip — always visible above the tabs so the
            headline numbers stay in view no matter which section is open. */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.map(({ icon: Icon, label, value, alert, goTo }) => {
            const Wrapper = goTo ? 'button' : 'div'
            return (
              <Wrapper
                key={label}
                type={goTo ? 'button' : undefined}
                onClick={goTo ? () => setActiveTab(goTo) : undefined}
                className={`card-base p-4 flex items-center gap-3 text-left w-full ${
                  goTo ? 'hover:border-brand/50 hover:shadow-sm transition-shadow cursor-pointer' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    alert ? 'bg-red-50 text-red-500' : 'bg-brand-light text-brand'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p className={`text-base font-bold leading-tight ${alert ? 'text-red-500' : 'text-ink'}`}>{value}</p>
                  <p className="text-xs text-ink-soft">{label}</p>
                </div>
              </Wrapper>
            )
          })}
        </div>

        {/* Sidebar + content shell — one section on screen at a time
            instead of one long scroll through everything. */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <nav className={`w-full ${sidebarCollapsed ? 'lg:w-14' : 'lg:w-56'} shrink-0 lg:sticky lg:top-24 transition-[width] duration-150`}>
            {/* Collapse toggle — icon-rail mode reclaims width for the
                content pane once the sidebar's tab list grows (more
                storefront sections get their own tab over time), without
                losing one-click access to any tab: collapsed buttons keep
                working, just icon + tooltip instead of icon + label. */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden lg:flex items-center gap-2 w-full px-3 py-2 mb-2 rounded-xl text-xs font-medium text-ink-soft/60 hover:bg-white hover:text-ink-soft transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
              {tabs.map((tab, i) => {
                const isActive = activeTab === tab.id
                const prevGroup = tabs[i - 1]?.group
                const groupLabel =
                  tab.group !== prevGroup
                    ? { site: 'Website Content', sections: 'Homepage Sections', offers: 'Special Offers', manage: 'Manage' }[tab.group]
                    : null
                // Which group's own open/closed state applies here, if any
                // — Homepage Sections and Special Offers each collapse
                // independently (see sectionsGroupOpen/offersGroupOpen).
                const collapsibleGroups = {
                  sections: [sectionsGroupOpen, setSectionsGroupOpen],
                  offers: [offersGroupOpen, setOffersGroupOpen],
                }
                const groupState = collapsibleGroups[tab.group]
                // Both the Homepage Sections and Special Offers groups are
                // collapsed by default since they're the ones most likely to
                // grow long — their own tabs are hidden until the admin
                // expands that group's heading, keeping the far more-used
                // tabs above them (Overview/Orders/Inventory) reachable
                // without scrolling. The heading itself always renders
                // (it's the only way to expand the group back open); only
                // the individual tab buttons inside it are skipped while
                // collapsed.
                const hideTabButton = !!groupState && !groupState[0] && !isActive
                return (
                  <Fragment key={tab.id}>
                    {groupLabel && groupState ? (
                      <button
                        type="button"
                        onClick={() => groupState[1]((v) => !v)}
                        className="hidden lg:flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-wider text-ink-soft/50 hover:text-ink-soft px-3 pt-3 pb-1 first:pt-0 transition-colors"
                      >
                        {groupLabel}
                        {groupState[0] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    ) : (
                      groupLabel && (
                        <p className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-ink-soft/50 px-3 pt-3 pb-1 first:pt-0">
                          {groupLabel}
                        </p>
                      )
                    )}
                    {/* On mobile the tab bar is one continuous scrollable
                        row with no group headings shown at all (see the
                        `hidden lg:...` classes above), so the sections
                        collapse only ever applies at the lg breakpoint —
                        `lg:hidden` here, never a bare `hidden`, keeps every
                        section tab reachable on mobile regardless of
                        sectionsGroupOpen. */}
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      title={sidebarCollapsed ? tab.label : undefined}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                        hideTabButton ? 'lg:hidden' : ''
                      } ${sidebarCollapsed ? 'lg:px-0 lg:justify-center lg:w-10 lg:mx-auto' : ''} ${
                        isActive ? 'bg-brand text-white shadow-sm' : 'bg-white text-ink-soft hover:bg-brand-light/60'
                      }`}
                    >
                      <tab.icon size={16} className="shrink-0" />
                      <span className={`flex-1 text-left ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{tab.label}</span>
                      {tab.badge != null && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            sidebarCollapsed ? 'lg:hidden' : ''
                          } ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : tab.badgeAlert
                                ? 'bg-red-50 text-red-500'
                                : 'bg-brand-light text-brand'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        className={`hidden lg:block shrink-0 ${sidebarCollapsed ? 'lg:hidden' : ''} ${isActive ? 'opacity-80' : 'opacity-0'}`}
                      />
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </nav>

          <div className="flex-1 min-w-0 w-full space-y-6">
            {activeTab === 'overview' && (
              <>
                {outOfStockProducts.length > 0 ? (
                  <div className="card-base p-5 sm:p-6 border border-red-100">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                      <h3 className="font-semibold text-ink flex items-center gap-2">
                        <PackageX size={17} className="text-red-500" />
                        Out of Stock ({outOfStockProducts.length})
                      </h3>
                    </div>
                    <p className="text-sm text-ink-soft mb-4">
                      These products are hidden from the storefront's featured/best-seller/new-arrival rails until
                      restocked. Click "Mark In Stock" to bring one back.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {outOfStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 border border-thread rounded-xl p-3 bg-red-50/30"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            onError={onImgError(p.fallbackSeed || p.id, 100, 100)}
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink line-clamp-1">{p.name}</p>
                            <p className="text-xs text-ink-soft capitalize">
                              {p.category} · {formatPrice(p.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleStock(p)}
                            title="Mark In Stock"
                            className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark shrink-0 px-2 py-1.5 rounded-lg hover:bg-brand-light transition-colors"
                          >
                            <RefreshCw size={13} /> Restock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card-base p-5 sm:p-6 flex items-center gap-3 border border-green-100 bg-green-50/40">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">Everything's in stock</p>
                      <p className="text-xs text-ink-soft">No products currently need restocking.</p>
                    </div>
                  </div>
                )}

                <div className="card-base p-5 sm:p-6">
                  <h3 className="font-semibold text-ink mb-4">Quick actions</h3>
                  <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { id: 'orders', icon: Truck, title: 'Manage Orders', desc: `${adminOrders.length} order${adminOrders.length === 1 ? '' : 's'} placed by customers` },
                      { id: 'add', icon: Plus, title: 'Add a Product', desc: 'File a new item into the catalog' },
                      { id: 'inventory', icon: Package, title: 'Browse Inventory', desc: `${products.length} products across every category` },
                      { id: 'categories', icon: Boxes, title: 'Manage Categories', desc: 'Add or remove subcategories' },
                      { id: 'hero', icon: Images, title: 'Hero Slider', desc: `${heroSlideCount} slide${heroSlideCount === 1 ? '' : 's'} live on the homepage banner` },
                      ...STOREFRONT_SECTIONS.map((s) => ({
                        id: `section-${s.id}`,
                        icon: Star,
                        title: s.label,
                        desc: `${sectionCounts[s.id] || 0} product${sectionCounts[s.id] === 1 ? '' : 's'} on this row`,
                      })),
                      ...OFFER_SECTIONS.map((s) => ({
                        id: `section-${s.id}`,
                        icon: Tag,
                        title: `Offers — ${s.label}`,
                        desc: `${sectionCounts[s.id] || 0} product${sectionCounts[s.id] === 1 ? '' : 's'} on offer`,
                      })),
                    ].map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setActiveTab(action.id)}
                        className="text-left border border-thread rounded-xl p-4 hover:border-brand/50 hover:bg-brand-light/30 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center mb-3">
                          <action.icon size={16} />
                        </div>
                        <p className="text-sm font-semibold text-ink mb-0.5">{action.title}</p>
                        <p className="text-xs text-ink-soft">{action.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <OrdersAdminTab
                orders={adminOrders}
                loading={adminOrdersLoading}
                query={ordersQuery}
                onQueryChange={setOrdersQuery}
                onUpdateStatus={async (orderId, status) => {
                  await updateOrderStatus(orderId, status)
                  showToast(`Order ${orderId} marked ${statusLabel(status)}`)
                }}
              />
            )}

            {activeTab === 'sales' && <SalesAdminTab orders={adminOrders} loading={adminOrdersLoading} />}

            {activeTab === 'customers' && (
              <CustomersAdminTab
                orders={adminOrders}
                loading={adminOrdersLoading}
                onUpdateStatus={async (orderId, status) => {
                  await updateOrderStatus(orderId, status)
                  showToast(`Order ${orderId} marked ${statusLabel(status)}`)
                }}
              />
            )}

            {activeTab === 'add' && <AddProductForm onSuccess={() => showToast('Product added')} />}

            {activeTab === 'deleted' && (
              <DeletedProductsTab
                deleted={deletedCatalogProducts}
                fresh={missingCatalogProducts}
                onRestore={async (ids) => {
                  try {
                    const n = await restoreCatalogProducts(ids)
                    showToast(`Restored ${n} product${n === 1 ? '' : 's'} to Firestore`)
                  } catch (err) {
                    showToast(err.message || 'Could not restore')
                  }
                }}
              />
            )}

            {activeTab === 'categories' && (
              <div className="card-base p-5 sm:p-6">
                <h3 className="font-semibold text-ink mb-1">Manage Categories</h3>
                <p className="text-sm text-ink-soft mb-5">
                  Don't want a subcategory anymore (e.g. Nighty under Women)? Delete it here — it removes every
                  product in it and takes it off the nav and shop filters immediately. Changed your mind? Add a
                  product from the Add Product tab and type that same subcategory name back in — it'll reappear.
                </p>

                <AddCategoryForm onSuccess={(label) => showToast(`Category "${label}" added`)} />

                <div className="grid sm:grid-cols-2 gap-5 mt-6">
                  {categoryOptions.map((cat) => {
                    const columns = megaMenu[cat.value] || []
                    return (
                      <div key={cat.value} className="border border-thread rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-ink mb-3">{cat.label}</h4>
                        {columns.length === 0 && <p className="text-xs text-ink-soft/60">No products yet.</p>}
                        <div className="space-y-4">
                          {columns.map((col) => (
                            <div key={col.heading}>
                              <p className="text-[10px] font-semibold text-ink-soft/60 tracking-[0.1em] uppercase mb-1.5">
                                {col.heading}
                              </p>
                              <ul className="space-y-1">
                                {col.items.map((item) => (
                                  <li
                                    key={item.slug}
                                    className="flex items-center justify-between gap-2 text-sm text-ink-soft px-2.5 py-1.5 rounded-lg hover:bg-cream-dark"
                                  >
                                    <span>
                                      {item.label}{' '}
                                      <span className="text-ink-soft/60 text-xs">
                                        ({item.count || 0})
                                      </span>
                                    </span>
                                    <button
                                      onClick={() => handleDeleteSubCategory(cat.value, item)}
                                      aria-label={`Delete ${item.label} from ${cat.label}`}
                                      title={`Delete ${item.label}`}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-soft/60 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="card-base p-5 sm:p-6">
                {/* Deliberately stacked (title on its own line, filters on
                    the next) rather than one flex row that *tries* to fit
                    the title and every filter side by side and only wraps
                    when it runs out of room. That "wrap only if needed"
                    layout is at the mercy of a few stray pixels — a
                    scrollbar toggling on/off, one extra digit in the count
                    — so the exact same panel could render as a single
                    packed row for one category and two tidy rows for
                    another (e.g. Men vs Boys), even though nothing about
                    the panel itself changed. Always stacking removes that
                    per-category coin flip: every category — Men, Women,
                    Boys, Girls, All — gets the same two-row shape every
                    time. */}
                <div className="mb-4">
                  <h3 className="font-semibold text-ink mb-3">Product Inventory ({filtered.length})</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={wearFilter}
                      onChange={(e) => handleWearFilter(e.target.value)}
                      className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft"
                    >
                      <option value="all">All Wear</option>
                      {wearOptions.map((w) => (
                        <option key={w.value} value={w.value}>{w.label} ({w.count})</option>
                      ))}
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft"
                    >
                      <option value="all">All Types</option>
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft"
                    >
                      <option value="all">All Stock</option>
                      <option value="in">In Stock</option>
                      <option value="out">Out of Stock</option>
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products..."
                        className="pl-9 pr-4 py-2 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSectionOrderOpen(true)}
                      className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg bg-brand text-white hover:opacity-90 transition-opacity"
                      title="Drag whole sub-categories (all their colours) above or below each other"
                    >
                      <ListOrdered size={15} /> Reorder sections
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-5">
                  <button
                    type="button"
                    onClick={() => handleCategoryFilter('all')}
                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                      categoryFilter === 'all' ? 'bg-brand text-white' : 'bg-brand-light/60 text-ink-soft hover:bg-brand-light'
                    }`}
                  >
                    All Categories
                  </button>
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryFilter(cat.value)}
                      className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                        categoryFilter === cat.value ? 'bg-brand text-white' : 'bg-brand-light/60 text-ink-soft hover:bg-brand-light'
                      }`}
                    >
                      {cat.label} ({categoryCounts[cat.value] || 0})
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink-soft border-b border-thread">
                        <th className="pb-3 pr-4">Product</th>
                        <th className="pb-3 pr-4">Category</th>
                        <th className="pb-3 pr-4">Price</th>
                        <th className="pb-3 pr-4">Rating</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4 text-center">Reorder</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // buildSections sorts a whole type, so build it once per
                        // type/category per render instead of once per row.
                        const secCache = new Map()
                        const getSecs = (type, category) => {
                          const ck = `${type}|${category}`
                          if (!secCache.has(ck)) secCache.set(ck, buildSections(products, type, category))
                          return secCache.get(ck)
                        }
                        return filtered.map((p, i) => {
                        const prev = filtered[i - 1]
                        const startsSection =
                          !prev ||
                          productType(prev) !== productType(p) ||
                          prev.category !== p.category ||
                          sectionKey(prev) !== sectionKey(p)
                        const secs = getSecs(productType(p), p.category)
                        const idx = secs.findIndex((g) => g.key === sectionKey(p))
                        const sec = secs[idx]
                        const busy = movingProductId != null
                        // A section with just ONE colour doesn't need its own big
                        // header bar: its row's own Up/Down arrows move that
                        // section instead (see the Reorder cell below).
                        const oneColour = !!sec && sec.items.length === 1
                        const singleColour = oneColour && secs.length > 1
                        // No separate header "box" any more: the style name shows as a
                        // small tag on the first row of each multi-colour section, and
                        // that row also carries the whole-section buttons (below).
                        const showSectionTools = startsSection && !oneColour && secs.length > 1
                        const showSectionPrice = startsSection && !oneColour && !!sec && sec.items.length > 1
                        const iconBtn =
                          'w-7 h-7 rounded-md flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                        const sectionBtn =
                          'w-6 h-6 rounded flex items-center justify-center bg-brand-light/70 text-brand hover:bg-brand hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                        const firstInSection = !!sec && sec.items[0]?.id === p.id
                        const lastInSection = !!sec && sec.items[sec.items.length - 1]?.id === p.id
                        return (
                        <Fragment key={p.id}>
                        <tr className={`border-b border-thread/60 last:border-0 ${startsSection && i > 0 ? 'border-t-2 border-t-thread' : ''} ${p.isVisible === false ? 'opacity-50' : ''}`}>
                          <td className="py-3 pr-4 flex items-center gap-3">
                            <InventoryThumb
                              product={p}
                              onReplace={(savedPath, err) => handleQuickReplaceImage(p, savedPath, err)}
                            />
                            <div className="min-w-0">
                              {startsSection && !oneColour && (
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand leading-tight">
                                  {sectionKey(p)} · {sec ? sec.items.length : 0} colours
                                </p>
                              )}
                              <span className="text-ink line-clamp-1 max-w-[180px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 capitalize text-ink-soft">{p.category}</td>
                          <td className="py-3 pr-4 text-ink font-medium">{formatPrice(p.price)}</td>
                          <td className="py-3 pr-4 text-ink-soft">{p.rating || 0} ★</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col items-start gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleStock(p)}
                                title="Click to toggle stock status"
                                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                                  p.inStock !== false
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                                }`}
                              >
                                {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                              </button>
                              {p.isVisible === false && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                                  <EyeOff size={11} /> Hidden
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col items-center gap-1">
                              {/* This product: Top / Up / Down / Bottom inside its own section
                                  (for a one-colour style these move the style itself). */}
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    singleColour
                                      ? handleMoveSection(productType(p), p.category, sectionKey(p), 'top')
                                      : handleMoveProductTo(p, 'top')
                                  }
                                  disabled={singleColour ? idx <= 0 || busy : firstInSection || oneColour || busy}
                                  aria-label="Send to top"
                                  title="Send to the very top"
                                  className={iconBtn}
                                >
                                  <ChevronsUp size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    singleColour
                                      ? handleMoveSection(productType(p), p.category, sectionKey(p), 'up')
                                      : handleMoveInventoryProduct(filtered, i, -1)
                                  }
                                  disabled={
                                    singleColour
                                      ? idx <= 0 || busy
                                      : i === 0 ||
                                        productType(filtered[i - 1]) !== productType(p) ||
                                        sectionKey(filtered[i - 1]) !== sectionKey(p) ||
                                        filtered[i - 1].category !== p.category ||
                                        busy
                                  }
                                  aria-label="Move up"
                                  title="Move up"
                                  className={iconBtn}
                                >
                                  <ChevronUp size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    singleColour
                                      ? handleMoveSection(productType(p), p.category, sectionKey(p), 'down')
                                      : handleMoveInventoryProduct(filtered, i, 1)
                                  }
                                  disabled={
                                    singleColour
                                      ? idx === secs.length - 1 || busy
                                      : i === filtered.length - 1 ||
                                        productType(filtered[i + 1]) !== productType(p) ||
                                        sectionKey(filtered[i + 1]) !== sectionKey(p) ||
                                        filtered[i + 1].category !== p.category ||
                                        busy
                                  }
                                  aria-label="Move down"
                                  title="Move down"
                                  className={iconBtn}
                                >
                                  <ChevronDown size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    singleColour
                                      ? handleMoveSection(productType(p), p.category, sectionKey(p), 'bottom')
                                      : handleMoveProductTo(p, 'bottom')
                                  }
                                  disabled={singleColour ? idx === secs.length - 1 || busy : lastInSection || oneColour || busy}
                                  aria-label="Send to bottom"
                                  title="Send to the very bottom"
                                  className={iconBtn}
                                >
                                  <ChevronsDown size={15} />
                                </button>
                              </div>
                              {/* First row of a multi-colour style: the same four buttons, but
                                  for the WHOLE style (all its colours) -- replaces the old
                                  separate header bar. */}
                              {showSectionTools && (
                                <div className="flex items-center gap-1" title={`Move the whole "${sectionKey(p)}" section`}>
                                  <span className="text-[10px] font-semibold uppercase text-brand mr-0.5">Section</span>
                                  {[
                                    { where: 'top', Icon: ChevronsUp, disabled: idx <= 0, title: 'Send this whole section to the very top' },
                                    { where: 'up', Icon: ChevronUp, disabled: idx <= 0, title: 'Move this whole section up one place' },
                                    { where: 'down', Icon: ChevronDown, disabled: idx === secs.length - 1, title: 'Move this whole section down one place' },
                                    { where: 'bottom', Icon: ChevronsDown, disabled: idx === secs.length - 1, title: 'Send this whole section to the very bottom' },
                                  ].map(({ where, Icon, disabled, title }) => (
                                    <button
                                      key={where}
                                      type="button"
                                      onClick={() => handleMoveSection(productType(p), p.category, sectionKey(p), where)}
                                      disabled={disabled || busy}
                                      aria-label={`${title}: ${sectionKey(p)}`}
                                      title={title}
                                      className={sectionBtn}
                                    >
                                      <Icon size={13} />
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showSectionPrice && (
                                <button
                                  type="button"
                                  onClick={() => setSectionPriceEdit({ type: productType(p), category: p.category, key: sectionKey(p) })}
                                  title={`Change price & sizes for all ${sec.items.length} colours of "${sectionKey(p)}" at once`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-light/70 text-brand text-[10px] font-semibold uppercase hover:bg-brand hover:text-white transition-colors"
                                >
                                  <IndianRupee size={11} /> Price &amp; sizes · all colours
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleVisibility(p)}
                                aria-label={p.isVisible === false ? 'Unhide product' : 'Hide product from website'}
                                title={p.isVisible === false ? 'Unhide — show on website again' : 'Hide — totally remove from website'}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  p.isVisible === false
                                    ? 'text-gray-400 hover:bg-brand-light hover:text-brand'
                                    : 'text-ink-soft hover:bg-gray-100 hover:text-gray-700'
                                }`}
                              >
                                {p.isVisible === false ? <Eye size={15} /> : <EyeOff size={15} />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(p)
                                  setEditingIndex(i)
                                }}
                                aria-label="Edit product"
                                title="Edit"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              {(
                                <button
                                  onClick={() => handleResetProduct(p)}
                                  disabled={resettingProductId === p.id}
                                  aria-label="Restore this product to its original details"
                                  title="Restore this product's original details (image, price, etc.) — other products are unaffected"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors disabled:opacity-40"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(p)}
                                aria-label="Delete product"
                                title="Delete"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        </Fragment>
                        )
                        })
                      })()}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-ink-soft/60">
                            <p>{query ? `No products match "${query}"` : 'No products match this filter'}</p>
                            {/* Only worth showing when a filter is actually narrowing
                                things — an empty catalog with every filter already at
                                its default wouldn't have anything left to clear. */}
                            {(query || stockFilter !== 'all' || categoryFilter !== 'all' || wearFilter !== 'all' || typeFilter !== 'all') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuery('')
                                  setStockFilter('all')
                                  setCategoryFilter('all')
                                  setWearFilter('all')
                                  setTypeFilter('all')
                                }}
                                className="mt-2 text-sm font-medium text-brand hover:underline"
                              >
                                Clear all filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'hero' && <HeroSlidesAdminTab onToast={showToast} />}

            {activeTab === 'videos' && <HomeVideosAdminTab onToast={showToast} />}

            {activeTab === 'about' && <AboutUsAdminTab onToast={showToast} />}

            {activeTab === 'messages' && (
              <MessagesAdminTab
                messages={contactMessages}
                loading={messagesLoading}
                error={messagesError}
                setRead={setMessageRead}
                remove={removeMessage}
                onToast={showToast}
              />
            )}

            {activeSection && (
              <SectionAdminTab
                key={activeSection.id}
                section={activeSection}
                products={products}
                onToggleFlag={handleToggleSectionFlag}
                onReorder={handleReorderSection}
                onSetOfferColor={handleSetOfferColor}
                onSavePriceSizes={handleSaveOfferPriceSizes}
                onEdit={(product) => {
                  // Opens the same Edit Product modal as the Inventory tab.
                  // No Previous/Next here (those walk the Inventory list).
                  setEditingProduct(product)
                  setEditingIndex(null)
                }}
              />
            )}
          </div>
        </div>
      </div>

      {sectionPriceEdit && (() => {
        const sec = buildSections(products, sectionPriceEdit.type, sectionPriceEdit.category).find((g) => g.key === sectionPriceEdit.key)
        if (!sec) return null
        return (
          <SectionPriceSizeModal
            key={`${sectionPriceEdit.type}|${sectionPriceEdit.category}|${sectionPriceEdit.key}`}
            sectionName={sectionPriceEdit.key}
            items={sec.items}
            onSave={handleSaveSectionPriceSizes}
            onClose={() => setSectionPriceEdit(null)}
          />
        )
      })()}

      {sectionOrderOpen && (
        <SectionOrderModal
          products={products}
          initialType={typeFilter !== 'all' ? typeFilter : null}
          initialCategory={categoryFilter !== 'all' ? categoryFilter : null}
          busy={movingProductId != null}
          onApply={handleReorderSections}
          onClose={() => setSectionOrderOpen(false)}
        />
      )}

      {editingProduct && (
        <EditProductModal
          // Re-mounts the modal (resetting its internal form state) whenever
          // the product being edited changes, so Previous/Next always shows
          // fresh data instead of the previous product's fields lingering.
          key={editingProduct.id}
          product={editingProduct}
          position={editingIndex != null ? { index: editingIndex, total: filtered.length } : null}
          hasPrev={editingIndex != null && editingIndex > 0}
          hasNext={editingIndex != null && editingIndex < filtered.length - 1}
          onClose={() => {
            setEditingProduct(null)
            setEditingIndex(null)
          }}
          onSaved={() => {
            setEditingProduct(null)
            setEditingIndex(null)
            showToast('Product updated')
          }}
          onNavigate={(direction) => {
            const nextIndex = editingIndex + (direction === 'next' ? 1 : -1)
            const nextProduct = filtered[nextIndex]
            if (!nextProduct) return
            setEditingIndex(nextIndex)
            setEditingProduct(nextProduct)
            showToast(direction === 'next' ? 'Saved — showing next product' : 'Saved — showing previous product')
          }}
        />
      )}
    </section>
  )
}

const STATUS_BADGE_CLASS = {
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  packed: 'bg-cyan-50 text-cyan-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  'out-for-delivery': 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  'return-requested': 'bg-orange-50 text-orange-700',
  returned: 'bg-stone-100 text-stone-700',
  refunded: 'bg-teal-50 text-teal-700',
}

// Reads back whatever offer(s) got applied to an order at checkout (see
// the `totals` object built in Checkout.jsx's handlePlaceOrder) as a list
// of short labels an admin can scan at a glance. An order can carry both
// a promo code AND the automatic bulk-order discount at once, since
// Checkout stacks rather than replaces them -- so this can return more
// than one badge.
// "Reorder sections" panel: every sub-category of one type (e.g. Tops) shows
// up as a single compact row -- no matter how many colours it has -- so a
// whole block can be dragged, or sent Top/Bottom, in one go instead of
// nudging 10-15 colours one arrow at a time.
function SectionOrderModal({ products, initialType, initialCategory, busy, onApply, onClose }) {
  // Categories (Men / Women / Boys / Girls) that actually have products, in
  // the same order as the pills on the Inventory tab.
  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category))
    const ordered = categoryOptions.map((c) => c.value).filter((v) => present.has(v))
    present.forEach((v) => { if (!ordered.includes(v)) ordered.push(v) })
    return ordered
  }, [products])

  const [category, setCategory] = useState(initialCategory)
  const activeCategory = categories.includes(category) ? category : categories[0]

  // Types are limited to the chosen category, so e.g. Men never lists
  // Women-only types like "Tops".
  const types = useMemo(() => {
    const seen = new Set()
    products.forEach((p) => { if (p.category === activeCategory) seen.add(productType(p)) })
    return sortByType([...seen])
  }, [products, activeCategory])

  const [type, setType] = useState(initialType)
  const activeType = types.includes(type) ? type : types[0] || ''

  const sections = useMemo(
    () => (activeType && activeCategory ? buildSections(products, activeType, activeCategory) : []),
    [products, activeType, activeCategory],
  )

  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)

  function apply(keys, message) {
    onApply(activeType, activeCategory, keys, message)
  }
  function moveKey(key, to) {
    const keys = sections.map((g) => g.key)
    const from = keys.indexOf(key)
    if (from < 0 || to < 0 || to >= keys.length || to === from) return
    keys.splice(to, 0, keys.splice(from, 1)[0])
    apply(keys, `Moved "${key}"`)
  }
  function handleDrop(targetKey) {
    const keys = sections.map((g) => g.key)
    const from = keys.indexOf(dragKey)
    const to = keys.indexOf(targetKey)
    setDragKey(null)
    setOverKey(null)
    if (from < 0 || to < 0 || from === to) return
    moveKey(dragKey, to)
  }

  const btn = 'w-8 h-8 rounded-lg flex items-center justify-center border border-thread bg-white text-ink-soft hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-thread">
          <div>
            <h3 className="font-semibold text-ink">Reorder sections</h3>
            <p className="text-xs text-ink-soft mt-1">
              Drag a row (or use the arrows) to move a whole sub-category, with all its colours, above or below another. The website follows this order.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-brand-light">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap px-5 pt-4">
          <select
            value={activeCategory}
            onChange={(e) => { setCategory(e.target.value); setType(null) }}
            className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft capitalize"
          >
            {categories.map((c) => <option key={c} value={c}>{categoryLabelMap[c] || c}</option>)}
          </select>
          <select
            value={activeType}
            onChange={(e) => setType(e.target.value)}
            className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft"
          >
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="p-5 overflow-y-auto space-y-2">
          {sections.length === 0 && <p className="text-sm text-ink-soft">No sections found.</p>}
          {sections.map((g, i) => (
            <div
              key={g.key}
              draggable={!busy}
              onDragStart={() => setDragKey(g.key)}
              onDragOver={(e) => { e.preventDefault(); if (overKey !== g.key) setOverKey(g.key) }}
              onDragLeave={() => setOverKey((k) => (k === g.key ? null : k))}
              onDrop={() => handleDrop(g.key)}
              onDragEnd={() => { setDragKey(null); setOverKey(null) }}
              className={`flex items-center gap-3 rounded-xl border p-2.5 bg-white transition-colors ${
                overKey === g.key && dragKey && dragKey !== g.key ? 'border-brand bg-brand-light/40' : 'border-thread'
              } ${dragKey === g.key ? 'opacity-40' : ''}`}
            >
              <GripVertical size={16} className="text-ink-soft/60 cursor-grab shrink-0" />
              <span className="w-6 text-xs text-ink-soft text-center shrink-0">{i + 1}</span>
              {g.items[0]?.image && (
                <img src={g.items[0].image} alt="" className="w-9 h-11 rounded object-cover bg-gray-50 shrink-0" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{g.key}</p>
                <p className="text-xs text-ink-soft">{g.items.length} colour{g.items.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" className={btn} disabled={busy || i === 0} onClick={() => moveKey(g.key, 0)} title="Send to the very top" aria-label="Send to top"><ChevronsUp size={15} /></button>
                <button type="button" className={btn} disabled={busy || i === 0} onClick={() => moveKey(g.key, i - 1)} title="Move up" aria-label="Move up"><ChevronUp size={15} /></button>
                <button type="button" className={btn} disabled={busy || i === sections.length - 1} onClick={() => moveKey(g.key, i + 1)} title="Move down" aria-label="Move down"><ChevronDown size={15} /></button>
                <button type="button" className={btn} disabled={busy || i === sections.length - 1} onClick={() => moveKey(g.key, sections.length - 1)} title="Send to the very bottom" aria-label="Send to bottom"><ChevronsDown size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getOrderOfferBadges(order) {
  const t = order?.totals || {}
  const badges = []
  if (t.promoCode) badges.push(`Promo ${t.promoCode}`)
  if (t.bigOrderDiscount > 0) badges.push('Bulk order 12% off')
  return badges
}

// One manual picker per storefront row — Best Seller, New Arrivals, Bras,
// Panties, Slips, Tights, Nighty, Tops — each living in its own Admin
// sidebar tab instead of being tucked inside one combined "Homepage" tab.
// This is distinct from the Inventory tab (which manages the whole catalog)
// and from the per-product checkboxes buried in the Add/Edit Product form.
// Every toggle/reorder here writes straight to Firestore, and the homepage
// components (TrendingTabsShowcase.jsx / WomensInnerwearShowcase.jsx /
// NightyShowcase.jsx) read those same flags + order fields live — no
// code-array editing needed anywhere anymore. STOREFRONT_SECTIONS itself
// now lives in utils/storefrontSections.js, shared with those components,
// so Admin and the storefront can never disagree on what's eligible.

// Renders the manual product picker for exactly ONE storefront row. Which
// section it shows is decided entirely by which sidebar tab is active
// (Admin passes the matching entry from STOREFRONT_SECTIONS in) — this
// component has no section-switcher of its own anymore.
//
// Split into two clearly separate parts: an ordered "On this row" list —
// exactly the order it'll render on the homepage, with Up/Down to move a
// product and a Remove to take it off — and a search-and-check "Add
// products" picker below it for bringing more products onto the row.
// Products that are in data/products.js but not in Firestore because an
// admin deleted them. Nothing is added automatically -- pick what to put
// back. Restoring re-creates the product from its code definition.
function DeletedProductsTab({ deleted, fresh, onRestore }) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const q = query.trim().toLowerCase()
  const shown = deleted.filter((p) => !q || p.name.toLowerCase().includes(q))

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  async function restore(ids) {
    setBusy(true)
    try {
      await onRestore(ids)
      setPicked(new Set())
    } finally {
      setBusy(false)
    }
  }
  const chosen = [...picked].filter((id) => deleted.some((p) => p.id === id))

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 border border-brand/20 bg-brand-light/20">
        <p className="text-sm font-semibold text-ink">Deleted products</p>
        <p className="text-xs text-ink-soft mt-1 max-w-2xl">
          Products you deleted that still exist in the code catalog (data/products.js). Tick the ones you want back and
          press Restore — they return to Firestore and the website with their original details. Anything you edited in
          Admin before deleting (price, photos, stock) is not kept. Products that were created only in Admin can't be
          listed here.
        </p>
      </div>

      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="font-semibold text-ink">{deleted.length} deleted</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deleted..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            </div>
            <button
              type="button"
              disabled={busy || chosen.length === 0}
              onClick={() => restore(chosen)}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {busy ? 'Restoring…' : `Restore ${chosen.length || ''} selected`}
            </button>
            <button
              type="button"
              disabled={busy || shown.length === 0}
              onClick={() => restore(shown.map((p) => p.id))}
              className="text-sm px-4 py-2 rounded-lg border border-thread text-ink-soft hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Restore all{q ? ' shown' : ''}
            </button>
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft/60">
            {deleted.length === 0 ? 'Nothing deleted — products you delete will appear here.' : `No deleted products match "${query}"`}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 border border-thread hover:border-brand/40 rounded-xl p-3 cursor-pointer transition-colors"
              >
                <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} className="accent-brand w-4 h-4 shrink-0" />
                <img src={p.image} alt="" onError={onImgError(p.fallbackSeed || p.id, 100, 100)} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink line-clamp-1">{p.name}</p>
                  <p className="text-xs text-ink-soft capitalize">{p.category} · {formatPrice(p.price)}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {fresh.length > 0 && (
        <p className="text-xs text-ink-soft">
          {fresh.length} other code-catalog product{fresh.length === 1 ? '' : 's'} haven't been added to Firestore yet —
          see the blue box on the Overview page.
        </p>
      )}
    </div>
  )
}

// Inventory -> one section (all colours of a style): edit price, original
// price, sizes and per-size prices ONCE and apply them to every colour.
function SectionPriceSizeModal({ sectionName, items, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <OfferPriceSizeEditor
          product={items[0]}
          title={<>Price &amp; sizes — {sectionName} · all {items.length} colours</>}
          note={`Whatever you save here is applied to every colour in "${sectionName}" (${items.length} products). The boxes start from the first colour's current values.`}
          saveLabel={`Save for all ${items.length} colours`}
          onSave={(_p, changes) => onSave(items, changes)}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

// Inline "Price & sizes" editor for a product on a Special Offers row. It
// saves to the product itself (price, original price, sizes, per-size
// prices), so the change is reflected in the main product everywhere.
function OfferPriceSizeEditor({ product, onSave, onClose, title, note, saveLabel }) {
  const [form, setForm] = useState(() => ({
    price: product.price != null ? String(product.price) : '',
    oldPrice: product.oldPrice != null && product.oldPrice !== product.price ? String(product.oldPrice) : '',
    sizes: (product.sizes || []).join(', '),
    perSizePrice: !!product.sizePricing && Object.keys(product.sizePricing).length > 0,
    sizePriceRows: Object.fromEntries(
      Object.entries(product.sizePricing || {}).map(([size, v]) => [size, { price: v.price ?? '', oldPrice: v.oldPrice ?? '' }])
    ),
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const sizeList = fromCsv(form.sizes)

  async function save() {
    setError('')
    if (sizeList.length === 0) { setError('Keep at least one size.'); return }
    const sizePricing = makeSizePricing(sizeList, form.perSizePrice, form.sizePriceRows, form.price, form.oldPrice, sizeGroupMode(product.category, product.menuParent))
    const start = sizePricing ? lowestSizePrice(sizePricing) : null
    const price = start ? start.price : Number(form.price) || 0
    if (!(price > 0)) { setError('Enter a price greater than 0.'); return }
    const oldPrice = start ? start.oldPrice : Number(form.oldPrice) || price
    setSaving(true)
    const ok = await onSave(product, { price, oldPrice, sizes: sizeList, sizePricing: sizePricing || undefined })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="mt-1.5 rounded-xl border border-brand/30 bg-brand-light/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{title || <>Price &amp; sizes — {product.name}</>}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft/60 hover:text-brand"><X size={16} /></button>
      </div>
      <p className="text-xs text-ink-soft">
        {note || 'This changes the main product itself — the shop, the product page and the homepage all show the new price and sizes.'}
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Price (₹)">
          <input type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} className="input-base" />
        </Field>
        <Field label="Original price (₹) — for % off">
          <input type="number" min="0" value={form.oldPrice} onChange={(e) => update('oldPrice', e.target.value)} placeholder="optional" className="input-base" />
        </Field>
        <Field label="Sizes (comma separated)">
          <input type="text" value={form.sizes} onChange={(e) => update('sizes', e.target.value)} placeholder="S, M, L, XL" className="input-base" />
        </Field>
      </div>
      <SizePriceFields
        grouped={sizeGroupMode(product.category, product.menuParent)}
        sizes={sizeList}
        enabled={form.perSizePrice}
        onEnabledChange={(v) => update('perSizePrice', v)}
        rows={form.sizePriceRows}
        onRowChange={(size, key, value) =>
          setForm((prev) => ({ ...prev, sizePriceRows: { ...prev.sizePriceRows, [size]: { ...prev.sizePriceRows[size], [key]: value } } }))
        }
        onFillAll={(value) =>
          setForm((prev) => ({ ...prev, sizePriceRows: Object.fromEntries(fromCsv(prev.sizes).map((sz) => [sz, { ...prev.sizePriceRows[sz], price: value }])) }))
        }
        basePrice={form.price}
        baseOldPrice={form.oldPrice}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-60">
          {saving ? 'Saving…' : saveLabel || 'Save price & sizes'}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-thread text-sm font-semibold text-ink-soft hover:text-brand">
          Cancel
        </button>
      </div>
    </div>
  )
}

// "Show colour" picker for the Special Offers tabs: choose which colour of a
// multi-colour product (e.g. a T-shirt that comes in 8 colours) leads its card
// on the Offers page. The card shows that colour's photo and the product page
// opens with that colour selected. Single-colour products show nothing.
function OfferColorSelect({ product, value, onChange }) {
  const colors = product.colors || []
  if (colors.length < 2) return null
  const current = colors.some((c) => c.name === value) ? value : ''
  const hex = colors.find((c) => c.name === current)?.hex
  return (
    <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span
        className="w-3.5 h-3.5 rounded-full border border-thread shrink-0"
        style={{ background: hex || 'conic-gradient(#e5e7eb, #9ca3af, #e5e7eb)' }}
      />
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        title="Colour shown on the Offers page"
        className="text-xs rounded-md border border-thread bg-white px-1.5 py-1 text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand max-w-[11rem]"
      >
        <option value="">Colour: default ({colors.length} colours)</option>
        {colors.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

// The "type" shown in the Special Offers Filter -- same grouping the
// storefront Filter uses (a Tops style is its own entry, a grouped product
// answers to its menuParent, anything else to its own subcategory label).
function offerTypeLabel(p) {
  if (p.menuParent === 'Tops') return p.subCategoryLabel || 'Tops'
  return p.menuParent || p.subCategoryLabel || p.subCategory || 'Other'
}

// Filter button + dropdown panel (type checkboxes with live counts) used in
// "Add products to this row" on the Special Offers tabs, in place of the old
// free-text search box. Mirrors the Filter on the shop pages.
function AddProductsFilter({ options, selected, onChange, resultCount }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function toggle(label) {
    const next = new Set(selected)
    next.has(label) ? next.delete(label) : next.add(label)
    onChange(next)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
          open || selected.size > 0
            ? 'border-brand text-brand bg-brand-light'
            : 'border-thread text-ink hover:border-brand'
        }`}
      >
        <SlidersHorizontal size={15} /> Filter
        {selected.size > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[11px] flex items-center justify-center">
            {selected.size}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-72 max-w-[85vw] max-h-[70vh] flex flex-col bg-white rounded-2xl shadow-xl border border-thread">
          <div className="flex items-center justify-between px-5 py-4 border-b border-thread">
            <h4 className="font-semibold text-ink">Filter</h4>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close filter" className="text-ink-soft/60 hover:text-brand">
              <X size={16} />
            </button>
          </div>
          <div className="px-3 py-2 overflow-y-auto flex-1">
            {options.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-soft/60">Nothing to filter yet.</p>
            ) : (
              options.map((o) => (
                <label
                  key={o.label}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-brand-light/50 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(o.label)}
                    onChange={() => toggle(o.label)}
                    className="accent-brand w-4 h-4 shrink-0"
                  />
                  <span className="flex-1 min-w-0 truncate">{o.label}</span>
                  <span className="text-xs text-ink-soft/70">{o.count}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-thread">
            <button
              type="button"
              onClick={() => onChange(new Set())}
              disabled={selected.size === 0}
              className="text-xs font-semibold text-ink-soft hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold"
            >
              Show {resultCount} product{resultCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionAdminTab({ section, products, onToggleFlag, onReorder, onEdit, onSetOfferColor, onSavePriceSizes }) {
  // Every section tab uses a type Filter (checkboxes) instead of a search box
  const [typeFilter, setTypeFilter] = useState(() => new Set())
  const isOfferTab = section.id.startsWith('offers-')
  // Colour picked for a product BEFORE it is added to an offer row
  const [addColors, setAddColors] = useState({})
  // Product whose inline Price & sizes editor is open on the offer row
  const [quickEditId, setQuickEditId] = useState(null)
  // Search inside the "on this row" list (separate from the add-products search below)
  const [rowQuery, setRowQuery] = useState('')
  const [reordering, setReordering] = useState(false)
  // One unified list: every style is a single row (all its colours travel
  // together). Click a style's arrow to open it and fine-tune its colours.
  const [openGroups, setOpenGroups] = useState(() => new Set())
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  // A fresh search whenever the admin switches to a different section's
  // tab, so a leftover search term from "Bras" doesn't silently carry over
  // and hide everything when they click into "Panties" next.
  useEffect(() => {
    setRowQuery('')
    setTypeFilter(new Set())
    setAddColors({})
    setQuickEditId(null)
  }, [section.id])

  const field = orderField(section.id)

  // "all" sections (Best Seller / New Arrivals) can pull from every
  // category; the Women's Collections rows (Bras, Panties, ...) only ever
  // pull from women's products in that exact menuParent — matching what
  // WomensInnerwearShowcase.jsx / NightyShowcase.jsx actually render, so an
  // admin never checks a box here that has no visible effect on the site.
  // Out-of-stock and hidden products are excluded too, for the same
  // reason: sectionProducts() already drops out-of-stock items before the
  // homepage renders a row, and storeProducts (context/ProductContext.jsx)
  // drops hidden ones before any homepage component ever sees them — so a
  // product in either state would show up checked/pickable here but never
  // actually appear live, which is confusing. If one of these states
  // changes on a product that's already flagged into a row, it silently
  // drops off "On this row" here too (matching what the homepage already
  // does) rather than lingering as a flagged product nobody can see.
  const eligible = products.filter(
    (p) => sectionEligible(section, p) && p.inStock !== false && p.isVisible !== false
  )

  // The row exactly as it will render on the homepage: on this section,
  // sorted by its manual order (unordered products trail behind, keeping
  // their catalog order, same tie-break as sectionProducts()).
  const onRow = eligible
    .filter((p) => !!p[section.field])
    .sort((a, b) => {
      const ao = a[field]
      const bo = b[field]
      if (ao == null && bo == null) return 0
      if (ao == null) return 1
      if (bo == null) return -1
      return ao - bo
    })

  const notOnRow = eligible.filter((p) => !p[section.field])

  // Filter options (type + live count), used by EVERY section tab (Best
  // Seller, New Arrivals, Bras ... Tops, and Special Offers). A row pinned to
  // one menuParent (Bras, Panties, ...) would only ever show a single type, so
  // there the Filter lists its styles (subcategories) instead.
  const filterLabel = (p) => (section.menuParent ? sectionKey(p) : offerTypeLabel(p))
  const filterOptions = []
  notOnRow.forEach((p) => {
    const label = filterLabel(p)
    const o = filterOptions.find((x) => x.label === label)
    if (o) o.count += 1
    else filterOptions.push({ label, count: 1 })
  })

  const addable = notOnRow.filter((p) => typeFilter.size === 0 || typeFilter.has(filterLabel(p)))

  // Rewrites every product's position in this row at once (0..n-1) and
  // saves it as a single batch, so a swap is always atomic — see
  // handleReorderSection in Admin() / updateProducts in ProductContext.
  async function persistOrder(nextRow) {
    setReordering(true)
    try {
      await onReorder(nextRow.map((p, i) => ({ id: p.id, changes: { [field]: i } })))
    } finally {
      setReordering(false)
    }
  }

  // Every style (e.g. "Vertican Open Top") on the row becomes
  // ONE entry holding all its colours, in the order of its first colour.
  // Moving a style re-writes the row with that style's colours kept
  // together, so a whole block moves in one click.
  const styleGroups = []
  onRow.forEach((p) => {
    const key = `${p.category}|${sectionKey(p)}`
    let g = styleGroups.find((x) => x.key === key)
    if (!g) {
      g = { key, label: sectionKey(p), items: [] }
      styleGroups.push(g)
    }
    g.items.push(p)
  })

  function moveStyleTo(from, target) {
    if (target < 0 || target >= styleGroups.length || target === from) return
    const next = [...styleGroups]
    next.splice(target, 0, next.splice(from, 1)[0])
    persistOrder(next.flatMap((g) => g.items))
  }

  function dropOn(list, moveFn, targetId, idOf) {
    const from = list.findIndex((x) => idOf(x) === dragId)
    const to = list.findIndex((x) => idOf(x) === targetId)
    setDragId(null)
    setOverId(null)
    if (from >= 0 && to >= 0) moveFn(from, to)
  }

  const arrowBtn =
    'w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

  // Reorders the colours inside one style, keeping the style where it is.
  function moveInGroup(group, from, to) {
    if (to < 0 || to >= group.items.length || to === from) return
    const items = [...group.items]
    items.splice(to, 0, items.splice(from, 1)[0])
    persistOrder(styleGroups.flatMap((g) => (g.key === group.key ? items : g.items)))
  }

  // One product line with drag handle, number, thumbnail, move buttons, edit
  // and remove. Used for single products, for colours inside an opened
  // style, and for search results.
  function renderProductRow({ p, num, index, count, locked, dragKey, moveFn, list, idOf }) {
    const rowEl = (
      <div
        draggable={!locked}
        onDragStart={() => setDragId(dragKey)}
        onDragOver={(e) => { e.preventDefault(); if (overId !== p.id) setOverId(p.id) }}
        onDragLeave={() => setOverId((k) => (k === p.id ? null : k))}
        onDrop={() => {
          const from = list.findIndex((x) => idOf(x) === dragId)
          const to = index
          setDragId(null)
          setOverId(null)
          if (from >= 0 && to >= 0) moveFn(from, to)
        }}
        onDragEnd={() => { setDragId(null); setOverId(null) }}
        className={`flex items-center gap-3 border rounded-xl p-2.5 transition-colors bg-white ${
          overId === p.id && dragId && dragId !== dragKey ? 'border-brand bg-brand-light/50' : 'border-brand/30'
        } ${dragId === dragKey ? 'opacity-40' : ''}`}
      >
        <GripVertical size={16} className="text-ink-soft/60 cursor-grab shrink-0" />
        <span className="w-6 text-center text-xs font-mono font-semibold text-ink-soft shrink-0">{num}</span>
        <img
          src={(isOfferTab && p.colorImages?.[p.offerColor]?.image) || p.image}
          alt={p.name}
          onError={onImgError(p.fallbackSeed || p.id, 100, 100)}
          className="w-11 h-11 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink line-clamp-1">{p.name}</p>
          <p className="text-xs text-ink-soft capitalize">
            {p.category} · {formatPrice(p.price)}
            {isOfferTab && p.sizes?.length > 0 && <span className="normal-case"> · Sizes: {p.sizes.join(', ')}</span>}
          </p>
          {isOfferTab && (
            <OfferColorSelect product={p} value={p.offerColor || ''} onChange={(c) => onSetOfferColor && onSetOfferColor(p, c)} />
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => moveFn(index, 0)} disabled={index === 0 || locked} title="Send to the very top" className={arrowBtn}><ChevronsUp size={16} /></button>
          <button type="button" onClick={() => moveFn(index, index - 1)} disabled={index === 0 || locked} title="Move up" className={arrowBtn}><ChevronUp size={16} /></button>
          <button type="button" onClick={() => moveFn(index, index + 1)} disabled={index === count - 1 || locked} title="Move down" className={arrowBtn}><ChevronDown size={16} /></button>
          <button type="button" onClick={() => moveFn(index, count - 1)} disabled={index === count - 1 || locked} title="Send to the very bottom" className={arrowBtn}><ChevronsDown size={16} /></button>
          {isOfferTab && (
            <button
              type="button"
              onClick={() => setQuickEditId((id) => (id === p.id ? null : p.id))}
              title="Change price & sizes"
              aria-label="Change price and sizes"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                quickEditId === p.id ? 'text-brand bg-white' : 'text-ink-soft hover:text-brand hover:bg-white'
              }`}
            >
              <IndianRupee size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit && onEdit(p)}
            title="Edit product"
            aria-label="Edit product"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-white transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onToggleFlag(p, section.field, section.label, section.id)}
            title="Remove from this row"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
    return (
      <div key={p.id}>
        {rowEl}
        {isOfferTab && quickEditId === p.id && (
          <OfferPriceSizeEditor
            key={`${p.id}-${p.price}-${(p.sizes || []).join('|')}`}
            product={p}
            onSave={onSavePriceSizes}
            onClose={() => setQuickEditId(null)}
          />
        )}
      </div>
    )
  }

  // Searching the row matches product name, style and category. While a
  // search is active the list shows single products (so each one can be
  // edited) and the move arrows / drag are switched off -- positions only
  // make sense when the whole row is visible, so nothing can be reordered
  // by accident against hidden neighbours. Clear the search to reorder.
  const rowSearch = rowQuery.trim().toLowerCase()
  const searching = rowSearch.length > 0
  const matchesRow = (p) =>
    `${p.name} ${sectionKey(p)} ${p.category}`.toLowerCase().includes(rowSearch)
  const shownCount = searching ? onRow.filter(matchesRow).length : onRow.length

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          {section.id.startsWith('offers-') ? <Tag size={17} /> : <Star size={17} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{section.label}</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            {section.id.startsWith('offers-')
              ? `This is the ${section.label} section of the Special Offers page (/offers). Only ${section.label} products can appear here.`
              : section.scope === 'women'
                ? `This is the Women's Innerwear Collections' ${section.label} row on the storefront homepage. Only Women's ${section.menuParent} products can appear here.`
                : `This is the Trending Now → ${section.label} row on the storefront homepage. Any in-stock product from any category can appear here.`}{' '}
            Reorder or add/remove products below — changes go live immediately, in this exact order. Shoppers can
            only view these products and choose a color/size on the product page — they can't add straight to cart
            from the homepage grid.
          </p>
        </div>
      </div>

      {/* On this row — the live, ordered lineup. Top of the list = left/
          first card on the homepage. */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <h3 className="font-semibold text-ink">
            {section.label} — {onRow.length} on this row
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={rowQuery}
              onChange={(e) => setRowQuery(e.target.value)}
              placeholder="Search this row..."
              className="pl-9 pr-8 py-1.5 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
            {rowQuery && (
              <button
                type="button"
                onClick={() => setRowQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft/60 hover:text-brand"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {!searching && styleGroups.some((g) => g.items.length > 1) && (
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) =>
                  prev.size > 0 ? new Set() : new Set(styleGroups.filter((g) => g.items.length > 1).map((g) => g.key))
                )
              }
              className="px-3 py-1.5 rounded-lg border border-thread bg-white text-xs font-semibold text-ink-soft hover:text-brand transition-colors"
            >
              {openGroups.size > 0 ? 'Collapse all' : 'Expand all'}
            </button>
          )}
          </div>
        </div>
        <p className="text-xs text-ink-soft mb-4">
          This is the exact order shoppers will see on the homepage. Drag a row, or use the Top / Up / Down / Bottom
          buttons.{' '}
          {searching
            ? `Showing ${shownCount} of ${onRow.length} — clear the search to reorder.`
            : 'A style with several colours moves as one block — click its arrow to open it and reorder the colours inside.'}
        </p>

        {onRow.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft/60">
            Nothing on this row yet — add a product from the list below.
          </p>
        ) : searching && shownCount === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft/60">No products on this row match "{rowQuery}"</p>
        ) : searching ? (
          <div className="space-y-2">
            {onRow.filter(matchesRow).map((p) => renderProductRow({
              p, num: onRow.indexOf(p) + 1, index: 0, count: 1, locked: true,
              dragKey: p.id, moveFn: () => {}, list: [], idOf: (x) => x.id,
            }))}
          </div>
        ) : (
          <div className="space-y-2">
            {styleGroups.map((g, i) => {
              // A style with one colour is just a normal product row.
              if (g.items.length === 1) {
                return renderProductRow({
                  p: g.items[0], num: i + 1, index: i, count: styleGroups.length, locked: reordering,
                  dragKey: g.key, moveFn: moveStyleTo, list: styleGroups, idOf: (x) => x.key,
                })
              }
              const open = openGroups.has(g.key)
              return (
                <div key={g.key} className="space-y-1.5">
                  <div
                    draggable={!reordering}
                    onDragStart={() => setDragId(g.key)}
                    onDragOver={(e) => { e.preventDefault(); if (overId !== g.key) setOverId(g.key) }}
                    onDragLeave={() => setOverId((k) => (k === g.key ? null : k))}
                    onDrop={() => dropOn(styleGroups, moveStyleTo, g.key, (x) => x.key)}
                    onDragEnd={() => { setDragId(null); setOverId(null) }}
                    className={`flex items-center gap-3 border rounded-xl p-2.5 transition-colors ${
                      overId === g.key && dragId && dragId !== g.key ? 'border-brand bg-brand-light/50' : 'border-brand/30 bg-brand-light/20'
                    } ${dragId === g.key ? 'opacity-40' : ''}`}
                  >
                    <GripVertical size={16} className="text-ink-soft/60 cursor-grab shrink-0" />
                    <span className="w-6 text-center text-xs font-mono font-semibold text-ink-soft shrink-0">{i + 1}</span>
                    <div className="flex -space-x-3 shrink-0">
                      {g.items.slice(0, 3).map((p) => (
                        <img key={p.id} src={p.image} alt="" onError={onImgError(p.fallbackSeed || p.id, 100, 100)} className="w-10 h-10 rounded-lg object-cover border-2 border-white" />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenGroups((prev) => { const n = new Set(prev); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n })}
                      className="flex-1 min-w-0 text-left"
                      title={open ? 'Hide colours' : 'Show colours'}
                    >
                      <p className="text-sm font-medium text-ink line-clamp-1">{g.label}</p>
                      <p className="text-xs text-ink-soft capitalize">
                        {g.items.length} colours · {g.items[0].category}
                      </p>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveStyleTo(i, 0)} disabled={i === 0 || reordering} title="Send whole style to the very top" className={arrowBtn}><ChevronsUp size={16} /></button>
                      <button type="button" onClick={() => moveStyleTo(i, i - 1)} disabled={i === 0 || reordering} title="Move whole style up" className={arrowBtn}><ChevronUp size={16} /></button>
                      <button type="button" onClick={() => moveStyleTo(i, i + 1)} disabled={i === styleGroups.length - 1 || reordering} title="Move whole style down" className={arrowBtn}><ChevronDown size={16} /></button>
                      <button type="button" onClick={() => moveStyleTo(i, styleGroups.length - 1)} disabled={i === styleGroups.length - 1 || reordering} title="Send whole style to the very bottom" className={arrowBtn}><ChevronsDown size={16} /></button>
                      <button
                        type="button"
                        onClick={() => setOpenGroups((prev) => { const n = new Set(prev); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n })}
                        title={open ? 'Hide colours' : 'Show colours'}
                        aria-label={open ? 'Hide colours' : 'Show colours'}
                        className={`${arrowBtn} border border-thread ml-1`}
                      >
                        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="ml-6 sm:ml-10 pl-3 border-l-2 border-brand/20 space-y-1.5">
                      {g.items.map((p, ci) => renderProductRow({
                        p, num: ci + 1, index: ci, count: g.items.length, locked: reordering,
                        dragKey: p.id, moveFn: (from, to) => moveInGroup(g, from, to), list: g.items, idOf: (x) => x.id,
                      }))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add products — search the eligible pool that isn't on the row
          yet; checking one appends it to the bottom of the ordered list
          above (drag it up with the arrows once it's added). */}
      <div className="card-base p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-ink">Add products to this row</h3>
          <AddProductsFilter
            options={filterOptions}
            selected={typeFilter}
            onChange={setTypeFilter}
            resultCount={addable.length}
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {addable.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 border border-thread hover:border-brand/40 rounded-xl p-3 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() =>
                  onToggleFlag(
                    p, section.field, section.label, section.id,
                    isOfferTab && addColors[p.id] ? { offerColor: addColors[p.id] } : undefined
                  )
                }
                className="accent-brand w-4 h-4 shrink-0"
              />
              <img
                src={(isOfferTab && p.colorImages?.[addColors[p.id]]?.image) || p.image}
                alt={p.name}
                onError={onImgError(p.fallbackSeed || p.id, 100, 100)}
                className="w-11 h-11 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink line-clamp-1">{p.name}</p>
                <p className="text-xs text-ink-soft capitalize">
                  {p.category} · {formatPrice(p.price)}
                </p>
                {isOfferTab && (
                  <OfferColorSelect
                    product={p}
                    value={addColors[p.id] || ''}
                    onChange={(c) => setAddColors((prev) => ({ ...prev, [p.id]: c }))}
                  />
                )}
              </div>
            </label>
          ))}
          {addable.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-ink-soft/60">
              {typeFilter.size > 0
                ? 'No products match this filter'
                : eligible.length === 0
                  ? `No eligible products for ${section.label} yet — add some under this Type first.`
                  : 'Every eligible product is already on this row.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}



// Every order placed by every customer, with a status an admin can move
// forward (or cancel). Backed live by Firestore's orders collection via
// OrderContext's adminOrders listener -- see the comment there and in
// firestore.rules for how that's scoped to admins only.
function OrdersAdminTab({ orders, loading, onUpdateStatus, query, onQueryChange }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  // Order ids (e.g. "VSSDPUP2SY00") never actually contain a "#" -- it's
  // just how people naturally write/copy an order number -- so strip a
  // leading one before matching rather than requiring an exact-looking id.
  const normalizedQuery = query.trim().replace(/^#/, '').toLowerCase()

  const filtered = orders.filter((o) => {
    const matchesQuery =
      !normalizedQuery ||
      o.id.toLowerCase().includes(normalizedQuery) ||
      o.address?.fullName?.toLowerCase().includes(normalizedQuery) ||
      o.address?.phone?.includes(normalizedQuery)
    const matchesStatus = statusFilter === 'all' || (o.status || 'confirmed') === statusFilter
    return matchesQuery && matchesStatus
  })

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null

  return (
    <div className="card-base p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-semibold text-ink">Customer Orders ({filtered.length})</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg border border-thread px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand text-ink-soft"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search order #, name, phone..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft text-center py-10">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft text-center py-10">
          {orders.length === 0 ? 'No orders have been placed yet.' : `No orders match "${query}"`}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wide border-b border-thread">
                <th className="py-2 px-2">Order</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Placed</th>
                <th className="py-2 px-2">Items</th>
                <th className="py-2 px-2">Offer</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-thread/60 hover:bg-cream-dark/40">
                  <td className="py-3 px-2 font-medium text-ink whitespace-nowrap">{order.id}</td>
                  <td className="py-3 px-2 text-ink-soft">
                    <p className="text-ink">{order.address?.fullName || '—'}</p>
                    <p className="text-xs">{order.address?.phone}</p>
                  </td>
                  <td className="py-3 px-2 text-ink-soft whitespace-nowrap">
                    {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-2 text-ink-soft">{order.items?.length || 0}</td>
                  <td className="py-3 px-2">
                    {getOrderOfferBadges(order).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {getOrderOfferBadges(order).map((label) => (
                          <span key={label} className="inline-block w-fit text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand whitespace-nowrap">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-ink-soft/60">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 font-medium text-ink whitespace-nowrap">{formatPrice(order.totals?.total || 0)}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE_CLASS[order.status] || 'bg-gray-50 text-gray-600'}`}>
                      {statusLabel(order.status || 'confirmed')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark ml-auto"
                    >
                      <Eye size={13} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <AdminOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  )
}

// A stable YYYY-MM-DD key built from an order's own local calendar date
// (not the UTC date an ISO string slice would give) -- two orders placed
// the same local day always land in the same row here, and the keys still
// sort correctly as plain strings since the parts are zero-padded.
function dayKey(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Day-by-day sales, live off the exact same adminOrders feed the Overview
// stat cards and the Orders tab already use -- so a new order (or a status
// change to/from Cancelled) shows up here the moment Firestore pushes it,
// no refresh needed. "Orders" counts everything placed that day; "Sales"
// only counts what wasn't cancelled, same distinction as the Total
// Sales/Orders stat cards on Overview, so the two views never disagree.
function SalesAdminTab({ orders, loading }) {
  const days = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      const key = dayKey(o.placedAt)
      const entry = map.get(key) || { key, date: o.placedAt, orderCount: 0, sales: 0 }
      entry.orderCount += 1
      if (!NON_REVENUE_STATUSES.includes(o.status)) entry.sales += o.totals?.total || 0
      // Keep whichever placedAt is earliest in the day for a stable display
      // date (doesn't actually matter which order of that day, just needs
      // to fall on the same calendar day for formatting).
      map.set(key, entry)
    })
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
  }, [orders])

  const totalSales = days.reduce((sum, d) => sum + d.sales, 0)

  return (
    <div className="card-base p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-ink">Sales by Day ({days.length} {days.length === 1 ? 'day' : 'days'})</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Updates live as orders come in — {formatPrice(totalSales)} total, excluding cancelled and refunded orders.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft text-center py-10">Loading sales…</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-ink-soft text-center py-10">No orders have been placed yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wide border-b border-thread">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Orders</th>
                <th className="py-2 px-2">Sales</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key} className="border-b border-thread/60 hover:bg-cream-dark/40">
                  <td className="py-3 px-2 font-medium text-ink whitespace-nowrap flex items-center gap-2">
                    <Calendar size={14} className="text-ink-soft/60 shrink-0" />
                    {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-2 text-ink-soft">{d.orderCount}</td>
                  <td className="py-3 px-2 font-medium text-ink whitespace-nowrap">{formatPrice(d.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Who's actually ordering, live off the same adminOrders feed as
// SalesAdminTab above. There's no separate customers/users collection in
// Firestore to read from (see the comment above totalSales/customerCount
// in Admin() itself), so "a customer" here means one distinct account
// (falling back to their delivery phone number for the rare order with no
// signed-in userId) that has placed at least one order -- grouped from
// the orders themselves rather than looked up from a customer record.
function CustomersAdminTab({ orders, loading, onUpdateStatus }) {
  const [query, setQuery] = useState('')
  const [expandedKey, setExpandedKey] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const customers = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      const key = o.userId || o.address?.phone
      if (!key) return
      const entry = map.get(key) || {
        key,
        name: o.address?.fullName || '—',
        phone: o.address?.phone || '—',
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: o.placedAt,
        orders: [],
      }
      entry.orderCount += 1
      if (!NON_REVENUE_STATUSES.includes(o.status)) entry.totalSpent += o.totals?.total || 0
      entry.orders.push(o)
      // Always keep the name/phone from whichever order is most recent —
      // a shopper's saved address can change between orders, so the
      // latest one is the most likely to still be current.
      if (new Date(o.placedAt) > new Date(entry.lastOrderAt)) {
        entry.lastOrderAt = o.placedAt
        entry.name = o.address?.fullName || entry.name
        entry.phone = o.address?.phone || entry.phone
      }
      map.set(key, entry)
    })
    // Newest order first within each customer's own history.
    map.forEach((entry) => {
      entry.orders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
    })
    return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent)
  }, [orders])

  const filtered = customers.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  )

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null

  return (
    <div className="card-base p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-ink">Customers ({filtered.length})</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Updates live as new orders come in, sorted by total spent. Click a customer to see their full order history.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone..."
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-thread focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-soft text-center py-10">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft text-center py-10">
          {customers.length === 0 ? 'No customers yet.' : `No customers match "${query}"`}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-soft uppercase tracking-wide border-b border-thread">
                <th className="py-2 px-2"></th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Phone</th>
                <th className="py-2 px-2">Orders</th>
                <th className="py-2 px-2">Total Spent</th>
                <th className="py-2 px-2">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isOpen = expandedKey === c.key
                return (
                  <Fragment key={c.key}>
                    <tr
                      className="border-b border-thread/60 hover:bg-cream-dark/40 cursor-pointer"
                      onClick={() => setExpandedKey(isOpen ? null : c.key)}
                    >
                      <td className="py-3 px-2 text-ink-soft w-6">
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </td>
                      <td className="py-3 px-2 font-medium text-ink whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-2 text-ink-soft whitespace-nowrap">{c.phone}</td>
                      <td className="py-3 px-2 text-ink-soft">{c.orderCount}</td>
                      <td className="py-3 px-2 font-medium text-ink whitespace-nowrap">{formatPrice(c.totalSpent)}</td>
                      <td className="py-3 px-2 text-ink-soft whitespace-nowrap">
                        {new Date(c.lastOrderAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-thread/60 bg-cream-dark/30">
                        <td colSpan={6} className="px-2 sm:px-4 py-3">
                          <div className="overflow-x-auto rounded-lg border border-thread bg-white">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-[11px] font-semibold text-ink-soft uppercase tracking-wide border-b border-thread">
                                  <th className="py-2 px-3">Order</th>
                                  <th className="py-2 px-3">Placed</th>
                                  <th className="py-2 px-3">Items</th>
                                  <th className="py-2 px-3">Offer</th>
                                  <th className="py-2 px-3">Total</th>
                                  <th className="py-2 px-3">Status</th>
                                  <th className="py-2 px-3"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.orders.map((order) => (
                                  <tr key={order.id} className="border-b border-thread/40 last:border-b-0 hover:bg-cream-dark/40">
                                    <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">{order.id}</td>
                                    <td className="py-2.5 px-3 text-ink-soft whitespace-nowrap">
                                      {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-2.5 px-3 text-ink-soft">{order.items?.length || 0}</td>
                                    <td className="py-2.5 px-3">
                                      {getOrderOfferBadges(order).length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                          {getOrderOfferBadges(order).map((label) => (
                                            <span key={label} className="inline-block w-fit text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand whitespace-nowrap">
                                              {label}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-ink-soft/60">—</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">{formatPrice(order.totals?.total || 0)}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE_CLASS[order.status] || 'bg-gray-50 text-gray-600'}`}>
                                        {statusLabel(order.status || 'confirmed')}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedOrderId(order.id)
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark ml-auto"
                                      >
                                        <Eye size={13} /> View
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <AdminOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  )
}

// Turns a typed label like "Cropped Tees" into a stable slug like
// "cropped-tees", matching the format used by the existing subcategory
// slugs in data/categories.js.
function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toCsv(arr) {
  return (arr || []).map((c) => (typeof c === 'string' ? c : c.name)).join(', ')
}

function fromCsv(str) {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// The storefront (ProductCard, Product page) expects colors as
// { name, hex } objects so it can render the little swatch dots. The admin
// form only collects plain comma-separated names, so we need to attach a
// hex value to each one before saving — otherwise the swatches silently
// break (no color, no dot) the next time a product is edited.
// `stockMap` carries the per-color "In stock" checkbox state; a color is
// only marked inStock: false when its checkbox was explicitly unchecked —
// omitting the field for everyone else keeps old saved products (which
// never had this field) reading as in-stock, matching the `!== false`
// convention already used for the whole-product inStock flag.
function toColorObjects(names, stockMap = {}) {
  return names.map((name) => ({
    name,
    hex: colorHex[name] || '#CBD5E1',
    ...(stockMap[name] === false ? { inStock: false } : {}),
  }))
}

// Clamp whatever was typed into a valid star rating (0-5, one decimal),
// so a typo can't save "7 stars".
function cleanRating(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(5, Math.round(n * 10) / 10)
}

// Clickable 5-star picker + number box, shared by the Add and
// Edit product forms. Clicking a star sets a whole-star rating; the number
// box allows decimals like 4.5. Click the same star again (or type 0) to clear.
// Fabric names already used across the catalog -- offered as suggestions in
// the Fabric box (you can still type anything that isn't listed).
const FABRIC_SUGGESTIONS = [
  'Rayon', 'Cotton', 'Cotton Hosiery', 'Cotton Cloth', 'Hosiery Cloth', 'Fancy', 'Georgette',
   'Vertican', 'Tencil', 'Cotton Lycra', 'Polyester', 'Cotton Blend', 'Alfine',
  'Jacquard', 'Cotton-Spandex Blend',
]

// Fabric input shared by the Add Product and Edit Product forms. Leaving it
// empty is fine: the product page then falls back to a default for its type.
function FabricField({ value, onChange, placeholder = 'e.g. Cotton, Rayon, Georgette', className = '' }) {
  return (
    <Field label="Fabric (shown on the product page)" className={className}>
      <input
        type="text"
        list="vss-fabric-options"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base"
      />
      <datalist id="vss-fabric-options">
        {FABRIC_SUGGESTIONS.map((f) => <option key={f} value={f} />)}
      </datalist>
    </Field>
  )
}

// Bras only: the "WSB" / "Colours" tag that the shop's Bras filter and the
// product cards use. "Auto" (empty) works it out from the colours typed in the
// form — only White/Skin/Black/Pink/Beige => WSB, anything else => Colours.
function ShadeField({ value, onChange, colorsCsv, className = '' }) {
  const auto = deriveBraShade(fromCsv(colorsCsv || ''))
  return (
    <Field label="Bra tag (WSB / Colours)" className={className}>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="input-base">
        <option value="">Auto{auto ? ` (${auto})` : ''}</option>
        {SHADE_OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  )
}

// Turns the "price per size" table into the { [size]: { price, oldPrice,
// discount } } map the storefront reads (see Product.jsx). Returns null when
// per-size pricing is off, which makes every size use the one normal price.
// Men's sizes are priced in pairs -- (S-M) (L-XL) (XXL-3XL): every two
// neighbouring sizes share one price. With `grouped` off each size is its own
// group. Returns e.g. [['S','M'],['L','XL'],['XXL','3XL']].
function sizeGroups(sizeList, grouped) {
  // Kids' numeric sizes 45-85: (45-55) (60-70) (75) (80) (85) -- used for any
  // product that carries the full 45,50,...,85 run, in any category.
  const full = [45, 50, 55, 60, 65, 70, 75, 80, 85]
  if (full.every((n) => sizeList.includes(String(n)))) {
    const out = []
    let lastKey = null
    sizeList.forEach((sz) => {
      const n = Number(sz)
      const key = Number.isFinite(n) && n <= 55 ? 'a' : Number.isFinite(n) && n <= 70 ? 'b' : `own-${sz}`
      if (key === lastKey) out[out.length - 1].push(sz)
      else out.push([sz])
      lastKey = key
    })
    return out
  }
  if (!grouped) return sizeList.map((sz) => [sz])
  // Women's Panties and Bras: chest sizes are priced in three bands --
  // (75-90) (95-100) (105-110). 75/80/85/90 share one price, 95/100 share one,
  // 105/110 share one. Any other size stays on its own row.
  if (grouped === 'bands') {
    const out = []
    let lastKey = null
    sizeList.forEach((sz) => {
      const n = Number(sz)
      const key = Number.isFinite(n) && n >= 75 && n <= 90 ? 'b1' : Number.isFinite(n) && n >= 95 && n <= 100 ? 'b2' : Number.isFinite(n) && n >= 105 && n <= 110 ? 'b3' : `own-${sz}`
      if (key === lastKey) out[out.length - 1].push(sz)
      else out.push([sz])
      lastKey = key
    })
    return out
  }
  const out = []
  for (let i = 0; i < sizeList.length; i += 2) out.push(sizeList.slice(i, i + 2))
  return out
}
// How a product's sizes are grouped when pricing: men = pairs, women's
// panties = the three chest bands, everything else = one price per size.
const sizeGroupMode = (category, menuParent) => (category === 'men' ? true : category === 'women' && (menuParent === 'Panties' || menuParent === 'Bras') ? 'bands' : false)
const groupLabel = (g) => (g.length > 1 ? `${g[0]}-${g[g.length - 1]}` : g[0])

function makeSizePricing(sizeList, enabled, rows, basePrice, baseOldPrice, grouped = false) {
  if (!enabled || sizeList.length === 0) return null
  const out = {}
  const leader = {}
  sizeGroups(sizeList, grouped).forEach((g) => g.forEach((sz) => { leader[sz] = g[0] }))
  sizeList.forEach((size) => {
    const row = rows?.[leader[size] || size] || {}
    const price = Number(row.price) || Number(basePrice) || 0
    let oldPrice = Number(row.oldPrice) || Number(baseOldPrice) || price
    if (oldPrice < price) oldPrice = price
    const discount = oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0
    out[size] = { price, oldPrice, discount }
  })
  return out
}

// The cheapest size -- used as the "starting price" shown on product cards.
function lowestSizePrice(pricing) {
  return Object.values(pricing).reduce((min, v) => (v.price < min.price ? v : min))
}

// "Different price for each size" editor, shared by Add and Edit Product.
// Off: one price for every size (the Price box above). On: one row per size
// from the Sizes box, each with its own selling price and optional original
// price (for the % off badge).
function SizePriceFields({ grouped = false, sizes, enabled, onEnabledChange, rows, onRowChange, onFillAll, basePrice, baseOldPrice, className = '' }) {
  const [bulk, setBulk] = useState('')
  return (
    <div className={`rounded-xl border border-thread p-4 ${className}`}>
      <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="accent-brand w-4 h-4"
        />
        Different price for each size
      </label>
      <p className="text-xs text-ink-soft/70 mt-1">
        {enabled
          ? (sizeGroups(sizes, grouped).some((g) => g.length > 1)
            ? (grouped === 'bands' ? 'Sizes are priced in bands — (75-90) (95-100) (105-110): one price covers every size in a band.' : 'Sizes are priced in groups — (S-M) (L-XL) (XXL-3XL): one price covers every size in a group.') + ' Product cards show the lowest price. A blank box uses the Price above.'
            : 'Shoppers see the price of the size they pick. Product cards show the lowest size price. A blank box uses the Price above.')
          : 'Tick this if some sizes cost more than others (for example bigger sizes). Otherwise every size uses the Price above.'}
      </p>

      {enabled && (
        sizes.length === 0 ? (
          <p className="text-xs text-ink-soft mt-3">Add some sizes in the Sizes box first.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <input
                type="number"
                min="0"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder="Price for all"
                className="input-base !w-32 !py-1.5"
              />
              <button
                type="button"
                onClick={() => { if (bulk !== '') { onFillAll(bulk); setBulk('') } }}
                className="px-3 py-1.5 rounded-lg border border-thread text-xs font-semibold text-ink-soft hover:text-brand transition-colors"
              >
                Set all sizes
              </button>
            </div>
            <div className="grid grid-cols-[4rem_1fr_1fr] sm:grid-cols-[5rem_12rem_12rem] gap-x-3 gap-y-2 mt-3 items-center">
              <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Size</span>
              <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Price (₹)</span>
              <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Original (₹)</span>
              {sizeGroups(sizes, grouped).map((group) => {
                const lead = group[0]
                const setAll = (key, value) => group.forEach((sz) => onRowChange(sz, key, value))
                return (
                <Fragment key={group.join('|')}>
                  <span className="text-sm font-medium text-ink">{groupLabel(group)}</span>
                  <input
                    type="number"
                    min="0"
                    value={rows?.[lead]?.price ?? ''}
                    onChange={(e) => setAll('price', e.target.value)}
                    placeholder={basePrice !== '' && basePrice != null ? String(basePrice) : ''}
                    className="input-base !py-1.5"
                  />
                  <input
                    type="number"
                    min="0"
                    value={rows?.[lead]?.oldPrice ?? ''}
                    onChange={(e) => setAll('oldPrice', e.target.value)}
                    placeholder={baseOldPrice !== '' && baseOldPrice != null ? String(baseOldPrice) : 'optional'}
                    className="input-base !py-1.5"
                  />
                </Fragment>
                )
              })}
            </div>
          </>
        )
      )}
    </div>
  )
}

function RatingFields({ rating, onRatingChange }) {
  const current = cleanRating(rating)
  return (
    <div>
      <Field label="Star Rating (0 – 5)">
        <div className="flex items-center gap-3">
          <div className="flex items-center" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onRatingChange(current === n ? 0 : n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  size={22}
                  className={n <= Math.round(current) ? 'fill-gold text-gold' : 'fill-thread text-thread'}
                />
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => onRatingChange(e.target.value)}
            placeholder="e.g. 4.5"
            className="input-base w-24"
          />
        </div>
      </Field>
    </div>
  )
}

const emptyForm = {
  fabric: '',
  shade: '',
  perSizePrice: false,
  sizePriceRows: {},
  name: '',
  category: 'men',
  subCategoryName: '',
  menuHeading: '',
  price: '',
  oldPrice: '',
  rating: '',
  description: '',
  colors: '',
  colorImageUrls: {},
  colorBackImageUrls: {},
  colorSideImageUrls: {},
  colorStock: {},
  imageFront: '',
  imageBack: '',
  imageSide: '',
  sizes: 'S, M, L, XL',
  inStock: true,
  isFeatured: false,
  isBestSeller: false,
  isNew: false,
}

// Turns { [name]: url } (+ an optional { [name]: url } of back photos) into
// the { [name]: { image, imageBack } } shape products.js / the Product page
// expect, dropping any color that was left blank. A color can have just a
// front photo, just a back photo (rare, but harmless), or both — imageBack
// is only included when something was actually uploaded/pasted for it, so
// Product.jsx's colorImg.imageBack lookup stays undefined (and the Back
// View thumbnail stays hidden) for colors nobody added one for.
//
// `sideUrlMap` does the same for each color's Side photo. The Add/Edit forms
// pass the form's side photos for Women's Tops (the only products with a Side
// View) -- an empty entry removes that color's side photo, and Product.jsx
// then shows the "coming soon" placeholder instead -- and an empty `{}` for
// every other product, which strips any leftover side photo from it. Only
// when it's left null (not passed) is a color's existing `imageSide` carried
// over untouched.
//
// `existing` is the product's current colorImages map. The Edit form only
// exposes each color's Front + Back photo, but an entry can carry other keys
// too (e.g. `imageSide` from the seed catalog). Since Edit now overwrites the
// whole colorImages map (see updateProduct's replaceFields), those extra keys
// are carried over untouched -- only `image` / `imageBack` follow the form.
// The result is `undefined` when nothing is left, which Edit turns into
// "delete colorImages from the product".
function toColorImages(colorNames, urlMap, backUrlMap = {}, existing = {}, sideUrlMap = null) {
  const result = {}
  colorNames.forEach((name) => {
    const url = (urlMap[name] || '').trim()
    const backUrl = (backUrlMap[name] || '').trim()
    const sideUrl = sideUrlMap ? (sideUrlMap[name] || '').trim() : ''
    const { image: _oldFront, imageBack: _oldBack, ...untouched } = existing?.[name] || {}
    if (sideUrlMap) delete untouched.imageSide
    const entry = {
      ...untouched,
      ...(url ? { image: url } : {}),
      ...(backUrl ? { imageBack: backUrl } : {}),
      ...(sideUrl ? { imageSide: sideUrl } : {}),
    }
    if (Object.keys(entry).length) result[name] = entry
  })
  return Object.keys(result).length ? result : undefined
}

// Older versions of this form saved `imageBack = front photo` whenever the
// Back photo was left empty, which made the storefront show a second,
// identical "Back View" thumbnail. A back photo that's the very same file as
// its front photo is that leftover, not a real back shot -- treat it as
// "no back photo" so it reads as empty in Edit and stays hidden on the
// storefront instead of needing to be cleared by hand on every product.
function realBackPhoto(back, front) {
  const b = (back || '').trim()
  return b && b !== (front || '').trim() ? b : ''
}

function AddCategoryForm({ onSuccess }) {
  const { addProduct, products } = useProducts()
  const [form, setForm] = useState({ category: 'men', name: '', heading: '' })
  const [error, setError] = useState('')

  const megaMenu = useMemo(() => buildMegaMenu(products), [products])
  const columns = megaMenu[form.category] || []

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'category' ? { heading: '' } : {}) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.heading) return
    const slug = slugify(form.name)
    const seed = `vss-admin-cat-${slug}-${Date.now()}`
    const image = fallbackSrc(seed, 600, 600)
    try {
      setError('')
      await addProduct({
        name: form.name.trim(),
        category: form.category,
        subCategory: slug,
        subCategoryLabel: form.name.trim(),
        menuHeading: form.heading.trim(),
        image,
        colors: [],
        price: 499,
        oldPrice: 499,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: '',
        inStock: true,
        isFeatured: false,
        isBestSeller: false,
        isNew: false,
      })
      setForm({ category: form.category, name: '', heading: '' })
      onSuccess?.(form.name.trim())
    } catch (err) {
      setError(err.message || 'Could not add category')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed border-thread rounded-xl p-4">
      <p className="text-xs text-ink-soft mb-3">
        Creates a new subcategory with one starter product (a placeholder photo to start) so it shows up
        on the site right away — open it from the inventory below afterwards to upload its real photo.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Category">
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-base">
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
        <Field label="New Category Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Nighty"
            className="input-base"
            required
          />
        </Field>
        <Field label="Menu Heading">
          <input
            type="text"
            value={form.heading}
            onChange={(e) => update('heading', e.target.value)}
            placeholder="e.g. Women Innerwear"
            className="input-base"
            required
          />
        </Field>
      </div>
      {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
      <button type="submit" className="btn-primary px-5 py-2 text-sm mt-4">
        Add Category
      </button>
    </form>
  )
}

function AddProductForm({ onSuccess }) {
  const { addProduct, products } = useProducts()
  const megaMenu = useMemo(() => buildMegaMenu(products), [products])
  const [form, setForm] = useState({ ...emptyForm, subCategorySlug: '', menuParent: '' })
  // Side View photos only exist for Women's Tops (see Product.jsx).
  const isWomenTops = form.category === 'women' && form.menuParent === 'Tops'
  const [success, setSuccess] = useState(false)

  // Menu Heading and Subcategory are chosen from whatever already exists
  // under the selected category (Men/Women/Boys/Girls) — same data the
  // "Manage Categories" panel and the site's mega menu are built from — so
  // picking "Men" only offers Men's existing headings/subcategories, "Women"
  // only Women's, and so on. Each still has an "Add new…" option that swaps
  // in a plain text box, for when you want to create one that doesn't exist
  // yet.
  const columns = megaMenu[form.category] || []
  const headingOptions = useMemo(() => {
    const seen = new Set()
    columns.forEach((col) => seen.add(col.heading))
    return [...seen]
  }, [columns])
  // The dropdown mirrors what shoppers see in the mega menu under this
  // heading — group labels like "T-Shirts" / "Track Pant" / "Shorts" each
  // list their existing products (pick one to reuse it exactly, no new
  // naming needed) plus a "+ Add new item…" row (to file a brand-new
  // product into that group). Any true top-level (ungrouped) item is
  // offered directly, same as before. Child option values are prefixed
  // with the group label since the same model name (e.g. "Airforce") can
  // legitimately exist under more than one group.
  const headingItems = columns.find((col) => col.heading === form.menuHeading)?.items || []
  const flatItemsForHeading = headingItems.filter((item) => !item.isGroup)
  const groupItemsForHeading = headingItems
    .filter((item) => item.isGroup)
    .map((group) => ({
      ...group,
      children: (group.children || []).map((child) => ({ ...child, value: `${group.label}::${child.slug}` })),
    }))
  const itemsForHeading = [
    ...flatItemsForHeading.map((item) => ({ ...item, kind: 'flat' })),
    ...groupItemsForHeading.map((item) => ({ ...item, kind: 'group' })),
  ]

  // Both pickers work exactly like the Category dropdown above them: pick a
  // Category and its Menu Heading + Subcategory dropdowns immediately fill
  // with THAT category's real data, same as picking Men shows Men's
  // headings. 'mode' only tracks an explicit "+ Add new…" choice — every
  // other case is derived straight from the current category/heading, so
  // switching Category (or picking a different Heading) can never leave a
  // picker stuck showing a plain text box from a stale earlier choice.
  const [headingMode, setHeadingMode] = useState('auto')
  const [subCategoryMode, setSubCategoryMode] = useState('auto')
  const addingHeading = headingMode === 'new' || headingOptions.length === 0
  const addingSubCategory = subCategoryMode === 'new' || !form.menuHeading || itemsForHeading.length === 0

  // As soon as a category with existing headings is selected (including the
  // default "Men" on first load), jump straight to its first heading —
  // exactly like Category always shows a real value instead of a blank
  // placeholder — which in turn immediately populates the Subcategory
  // dropdown with that heading's real items.
  useEffect(() => {
    if (headingMode !== 'auto') return
    if (headingOptions.length === 0) return
    if (form.menuHeading && headingOptions.includes(form.menuHeading)) return
    setForm((prev) => ({ ...prev, menuHeading: headingOptions[0], subCategoryName: '', subCategorySlug: '', menuParent: '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category, headingOptions.join('|')])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateColorImage(name, url) {
    setForm((prev) => ({ ...prev, colorImageUrls: { ...prev.colorImageUrls, [name]: url } }))
  }

  function updateColorBackImage(name, url) {
    setForm((prev) => ({ ...prev, colorBackImageUrls: { ...prev.colorBackImageUrls, [name]: url } }))
  }

  function updateColorSideImage(name, url) {
    setForm((prev) => ({ ...prev, colorSideImageUrls: { ...prev.colorSideImageUrls, [name]: url } }))
  }

  function updateColorStock(name, inStock) {
    setForm((prev) => ({ ...prev, colorStock: { ...prev.colorStock, [name]: inStock } }))
  }

  // Switching category resets heading/subcategory; the effect above then
  // fills the new category's first heading back in automatically.
  function handleCategoryChange(value) {
    setForm((prev) => ({ ...prev, category: value, menuHeading: '', subCategoryName: '', subCategorySlug: '', menuParent: '' }))
    setHeadingMode('auto')
    setSubCategoryMode('auto')
  }

  function handleHeadingSelect(value) {
    if (value === '__new__') {
      setHeadingMode('new')
      setSubCategoryMode('auto')
      setForm((prev) => ({ ...prev, menuHeading: '', subCategoryName: '', subCategorySlug: '', menuParent: '' }))
    } else {
      setHeadingMode('auto')
      setSubCategoryMode('auto')
      setForm((prev) => ({ ...prev, menuHeading: value, subCategoryName: '', subCategorySlug: '', menuParent: '' }))
    }
  }

  function handleSubCategorySelect(value) {
    if (value === '__new__') {
      setSubCategoryMode('new')
      setForm((prev) => ({ ...prev, subCategoryName: '', subCategorySlug: '', menuParent: '' }))
      return
    }
    if (value.startsWith('__newgroup__::')) {
      // "+ Add new item…" inside a specific group — still need a name for
      // this specific product, so drop back into the text box, pre-tagged
      // with the chosen group.
      const groupLabel = value.slice('__newgroup__::'.length)
      setSubCategoryMode('new')
      setForm((prev) => ({ ...prev, subCategoryName: '', subCategorySlug: '', menuParent: groupLabel }))
      return
    }
    if (value.includes('::')) {
      // An existing product already filed under a group — reuse it exactly,
      // no new naming needed.
      const [groupLabel, slug] = value.split('::')
      const group = groupItemsForHeading.find((g) => g.label === groupLabel)
      const child = group?.children.find((c) => c.slug === slug)
      if (!child) return
      setSubCategoryMode('auto')
      setForm((prev) => ({ ...prev, subCategoryName: child.label, subCategorySlug: child.slug, menuParent: groupLabel }))
      return
    }
    // A true top-level (ungrouped) item — reuse it exactly.
    const item = flatItemsForHeading.find((i) => i.slug === value)
    if (!item) return
    setSubCategoryMode('auto')
    setForm((prev) => ({ ...prev, subCategoryName: item.label, subCategorySlug: item.slug, menuParent: '' }))
  }


  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.subCategoryName || !form.menuHeading || !form.price) return

    // A flat subcategory picked from the dropdown already carries its exact
    // slug; a freshly typed one (including a new product filed under an
    // existing group) gets slugified here instead.
    const slug = form.subCategorySlug || slugify(form.subCategoryName)
    // If it matches an existing top-level subcategory slug, reuse its exact
    // label/heading so it groups with the existing entry instead of forking
    // into a near-duplicate.
    const existing = flatItemsForHeading.find((item) => item.slug === slug)
    const seed = `vss-admin-${slug}-${Date.now()}`
    // Uses whatever was uploaded/pasted above; falls back to a placeholder
    // for any photo left empty, so adding a product is still never blocked
    // on having images ready — you can always fill them in later from Edit.
    const placeholder = fallbackSrc(seed, 600, 600)
    const front = form.imageFront.trim() || placeholder
    const colorNames = fromCsv(form.colors)
    const sizePricing = makeSizePricing(fromCsv(form.sizes), form.perSizePrice, form.sizePriceRows, form.price, form.oldPrice, sizeGroupMode(form.category, form.menuParent))
    const startPrice = sizePricing ? lowestSizePrice(sizePricing) : null
    try {
      setError('')
      await addProduct({
        name: form.name,
        category: form.category,
        subCategory: slug,
        subCategoryLabel: existing?.label || form.subCategoryName.trim(),
        menuHeading: existing?.heading || form.menuHeading.trim(),
        menuParent: form.menuParent || existing?.menuParent || undefined,
        image: front,
        // Only set when a back photo was actually added -- left empty, the
        // product simply has no Back View (no duplicate of the front).
        imageBack: form.imageBack.trim() || undefined,
        // Women's Tops only. Left empty, the storefront shows a "coming
        // soon" placeholder in the Side View slot.
        ...(isWomenTops ? { imageSide: form.imageSide.trim() || undefined } : {}),
        colors: toColorObjects(colorNames, form.colorStock),
        colorImages: toColorImages(colorNames, form.colorImageUrls, form.colorBackImageUrls, {}, isWomenTops ? form.colorSideImageUrls : {}),
        price: startPrice ? startPrice.price : Number(form.price) || 0,
        oldPrice: startPrice ? startPrice.oldPrice : Number(form.oldPrice) || Number(form.price) || 0,
        rating: cleanRating(form.rating),
        fabric: form.fabric.trim() || undefined,
        // Bras only (WSB / Colours); empty (Auto) = worked out from the colours
        // on the storefront, see utils/braShade.js.
        ...(form.menuParent === 'Bras' ? { shade: form.shade || undefined } : {}),
        sizes: fromCsv(form.sizes),
        sizePricing: sizePricing || undefined,
        description: form.description,
        inStock: form.inStock,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
      })

      setForm({ ...emptyForm, category: form.category, subCategorySlug: '', menuParent: '', colorImageUrls: {}, colorBackImageUrls: {}, colorSideImageUrls: {} })
      setHeadingMode('auto')
      setSubCategoryMode('auto')
      setSuccess(true)
      onSuccess?.()
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err.message || 'Could not add product')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-base p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center">
            <Plus size={18} />
          </div>
          <h3 className="font-semibold text-ink">Add New Product</h3>
        </div>
        {success && (
          <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={14} /> Product added
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Field label="Front View Photo (optional — placeholder used if left empty)">
          <ImageUploadField
            value={form.imageFront}
            onChange={(dataUrl) => update('imageFront', dataUrl)}
            hint="Drag & drop a photo, or browse"
          />
        </Field>

        <Field label="Back View Photo (optional)">
          <ImageUploadField
            value={form.imageBack}
            onChange={(dataUrl) => update('imageBack', dataUrl)}
            hint="No back photo — the Back View is hidden"
          />
        </Field>

        {isWomenTops && (
          <Field label="Side View Photo (optional — the thumbnail only shows on the site once you add one)">
            <ImageUploadField
              value={form.imageSide}
              onChange={(dataUrl) => update('imageSide', dataUrl)}
              hint="No side photo — a placeholder is shown"
            />
          </Field>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Product Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Cotton Round Neck T-Shirt"
            className="input-base"
            required
          />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} className="input-base">
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Menu Heading (section it groups under)">
          {addingHeading ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.menuHeading}
                onChange={(e) => update('menuHeading', e.target.value)}
                placeholder="e.g. Bottomwear"
                className="input-base flex-1"
                required
              />
              {headingOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleHeadingSelect(headingOptions[0])}
                  className="text-xs font-medium text-brand whitespace-nowrap"
                >
                  Choose existing
                </button>
              )}
            </div>
          ) : (
            <select
              value={form.menuHeading}
              onChange={(e) => handleHeadingSelect(e.target.value)}
              className="input-base"
              required
            >
              <option value="" disabled>
                Select a heading for {categoryLabelMap[form.category]}…
              </option>
              {headingOptions.map((heading) => (
                <option key={heading} value={heading}>
                  {heading}
                </option>
              ))}
              <option value="__new__">+ Add new heading…</option>
            </select>
          )}
        </Field>

        <Field label="Subcategory">
          {addingHeading || addingSubCategory ? (
            <div>
              {form.menuParent && (
                <p className="text-xs text-ink-soft mb-1.5">
                  New item under existing group <span className="font-medium text-ink">{form.menuParent}</span> —{' '}
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, menuParent: '' }))}
                    className="font-medium text-brand"
                  >
                    change
                  </button>
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.subCategoryName}
                  onChange={(e) => update('subCategoryName', e.target.value)}
                  placeholder={form.menuParent ? 'e.g. Bomber Jacket' : 'e.g. Nighty'}
                  className="input-base flex-1"
                  required
                />
                {!addingHeading && !form.menuParent && itemsForHeading.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubCategoryMode('auto')
                      setForm((prev) => ({ ...prev, subCategoryName: '', subCategorySlug: '', menuParent: '' }))
                    }}
                    className="text-xs font-medium text-brand whitespace-nowrap"
                  >
                    Choose existing
                  </button>
                )}
              </div>
            </div>
          ) : (
            <select
              value={form.subCategorySlug ? (form.menuParent ? `${form.menuParent}::${form.subCategorySlug}` : form.subCategorySlug) : ''}
              onChange={(e) => handleSubCategorySelect(e.target.value)}
              className="input-base"
              required
            >
              <option value="" disabled>
                Select a subcategory under {form.menuHeading}…
              </option>
              {flatItemsForHeading.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
              {groupItemsForHeading.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.children.map((child) => (
                    <option key={child.value} value={child.value}>
                      {child.label}
                    </option>
                  ))}
                  <option value={`__newgroup__::${group.label}`}>+ Add new item to {group.label}…</option>
                </optgroup>
              ))}
              <option value="__new__">+ Add new subcategory…</option>
            </select>
          )}
        </Field>

        <Field label="Price (₹)">
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="e.g. 599"
            className="input-base"
            required
          />
        </Field>

        <Field label="Original Price (₹) — optional, for discount">
          <input
            type="number"
            min="0"
            value={form.oldPrice}
            onChange={(e) => update('oldPrice', e.target.value)}
            placeholder="e.g. 799"
            className="input-base"
          />
        </Field>

        <RatingFields
          rating={form.rating}
          onRatingChange={(v) => update('rating', v)}
        />

        <FabricField value={form.fabric} onChange={(v) => update('fabric', v)} />

        {form.menuParent === 'Bras' && (
          <ShadeField value={form.shade} onChange={(v) => update('shade', v)} colorsCsv={form.colors} />
        )}

        <Field label="Colors (comma separated)">
          <input
            type="text"
            value={form.colors}
            onChange={(e) => update('colors', e.target.value)}
            placeholder="Black, White, Navy"
            className="input-base"
          />
        </Field>

        {fromCsv(form.colors).length > 0 && (
          <Field label="Photo & stock per color (optional)" className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-ink-soft/70 -mt-1 mb-1">
              A color with no photos of its own uses the front/back photo above. Once a color has
              its own photo, its Back View shows only if you add a Back photo for that color —
              clear it to hide the Back View. Uncheck "In stock" to gray out that color on the
              product page and stop shoppers picking it — the rest of the product stays orderable
              in its other colors. Tip: drag a photo from one color's box and drop it onto another
              color's box to reuse the same picture there.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fromCsv(form.colors).map((name) => (
                <ColorPhotoCard
                  key={name}
                  name={name}
                  swatch={colorHex[name]}
                  front={form.colorImageUrls[name] || ''}
                  onFrontChange={(dataUrl) => updateColorImage(name, dataUrl)}
                  back={form.colorBackImageUrls[name] || ''}
                  onBackChange={(dataUrl) => updateColorBackImage(name, dataUrl)}
                  side={form.colorSideImageUrls[name] || ''}
                  onSideChange={(dataUrl) => updateColorSideImage(name, dataUrl)}
                  showSide={isWomenTops}
                  inStock={form.colorStock[name] !== false}
                  onStockChange={(v) => updateColorStock(name, v)}
                />
              ))}
            </div>
          </Field>
        )}

        <Field label="Sizes (comma separated)">
          <input
            type="text"
            value={form.sizes}
            onChange={(e) => update('sizes', e.target.value)}
            placeholder="S, M, L, XL"
            className="input-base"
          />
        </Field>

        <SizePriceFields
          grouped={sizeGroupMode(form.category, form.menuParent)}
          className="sm:col-span-2 lg:col-span-4"
          sizes={fromCsv(form.sizes)}
          enabled={form.perSizePrice}
          onEnabledChange={(v) => update('perSizePrice', v)}
          rows={form.sizePriceRows}
          onRowChange={(size, key, value) =>
            setForm((prev) => ({ ...prev, sizePriceRows: { ...prev.sizePriceRows, [size]: { ...prev.sizePriceRows[size], [key]: value } } }))
          }
          onFillAll={(value) =>
            setForm((prev) => ({ ...prev, sizePriceRows: Object.fromEntries(fromCsv(prev.sizes).map((sz) => [sz, { ...prev.sizePriceRows[sz], price: value }])) }))
          }
          basePrice={form.price}
          baseOldPrice={form.oldPrice}
        />

        <Field label="Description" className="sm:col-span-2 lg:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Short product description..."
            rows={2}
            className="input-base resize-none"
          />
        </Field>

        <Field label="Flags" className="lg:col-span-2">
          <div className="flex items-center gap-5 h-full pt-1 flex-wrap">
            <Checkbox checked={form.inStock} onChange={(v) => update('inStock', v)} label="In Stock" />
            <Checkbox checked={form.isBestSeller} onChange={(v) => update('isBestSeller', v)} label="Best Seller" />
            <Checkbox checked={form.isNew} onChange={(v) => update('isNew', v)} label="New Arrival" />
            <Checkbox
              checked={form.isFeatured}
              onChange={(v) => update('isFeatured', v)}
              label="Homepage Collections (Bras/Panties/Slips/Tights/Nighty/Tops)"
            />
          </div>
        </Field>
      </div>

      <button type="submit" className="btn-primary mt-5 px-6 py-2.5 text-sm flex items-center gap-2">
        <Plus size={16} /> Add Product
      </button>
    </form>
  )
}

function EditProductModal({ product, onClose, onSaved, onNavigate, hasPrev, hasNext, position }) {
  const { updateProduct } = useProducts()
  const [form, setForm] = useState({
    name: product.name || '',
    category: product.category || 'men',
    price: product.price ?? '',
    oldPrice: product.oldPrice ?? '',
    rating: product.rating ?? 0,
    fabric: product.fabric || '',
    shade: product.menuParent === 'Bras' ? product.shade || '' : '',
    description: product.description || '',
    imageFront: product.image || '',
    imageBack: realBackPhoto(product.imageBack, product.image),
    // Side View photo -- Women's Tops only (empty = placeholder on the storefront).
    imageSide: realBackPhoto(product.imageSide, product.image),
    colors: toCsv(product.colors),
    // Seed from whatever per-color photos this product already has (see
    // toColorImages/colorImages below) so re-opening Edit shows the URLs
    // that are already set instead of blank fields.
    colorImageUrls: Object.fromEntries(
      Object.entries(product.colorImages || {}).map(([name, img]) => [name, img.image || ''])
    ),
    // Same idea, but for each color's Back photo — so re-opening Edit shows
    // an already-uploaded back photo instead of a blank uploader.
    colorBackImageUrls: Object.fromEntries(
      Object.entries(product.colorImages || {}).map(([name, img]) => [
        name,
        realBackPhoto(img.imageBack, img.image || product.image),
      ])
    ),
    // And each color's Side photo (Women's Tops only).
    colorSideImageUrls: Object.fromEntries(
      Object.entries(product.colorImages || {}).map(([name, img]) => [
        name,
        realBackPhoto(img.imageSide, img.image || product.image),
      ])
    ),
    // Seed each color's "In stock" checkbox from product.colors — a color
    // with no inStock field yet (every product saved before this feature)
    // reads as true, matching the `!== false` convention used elsewhere.
    colorStock: Object.fromEntries(
      (product.colors || []).map((c) => [c.name, c.inStock !== false])
    ),
    sizes: (product.sizes || []).join(', '),
    // Per-size prices: on when the product already has a price for its sizes.
    perSizePrice: !!product.sizePricing && Object.keys(product.sizePricing).length > 0,
    sizePriceRows: Object.fromEntries(
      Object.entries(product.sizePricing || {}).map(([size, v]) => [size, { price: v.price ?? '', oldPrice: v.oldPrice ?? '' }])
    ),
    inStock: product.inStock !== false,
    isFeatured: !!product.isFeatured,
    isBestSeller: !!product.isBestSeller,
    isNew: !!product.isNew,
  })

  // Side View photos only exist for Women's Tops (see Product.jsx).
  const isWomenTops = form.category === 'women' && product.menuParent === 'Tops'

  // Esc closes the modal like Cancel -- one less trip to the mouse for
  // something people expect to just work on any dialog.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const [error, setError] = useState('')
  // Which action is currently in flight -- 'save', 'prev' or 'next' -- so
  // just that one button shows a busy state instead of the whole form
  // locking up or every button spinning at once.
  const [pendingAction, setPendingAction] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateColorImage(name, url) {
    setForm((prev) => ({ ...prev, colorImageUrls: { ...prev.colorImageUrls, [name]: url } }))
  }

  function updateColorBackImage(name, url) {
    setForm((prev) => ({ ...prev, colorBackImageUrls: { ...prev.colorBackImageUrls, [name]: url } }))
  }

  function updateColorSideImage(name, url) {
    setForm((prev) => ({ ...prev, colorSideImageUrls: { ...prev.colorSideImageUrls, [name]: url } }))
  }

  function updateColorStock(name, inStock) {
    setForm((prev) => ({ ...prev, colorStock: { ...prev.colorStock, [name]: inStock } }))
  }

  // Shared by "Save Changes" and the Previous/Next buttons -- both need to
  // write the same payload to Firestore, they just differ in what happens
  // afterwards (close the modal vs. move on to the next product).
  async function saveForm() {
    setError('')
    const front = form.imageFront.trim() || fallbackSrc(`vss-admin-${product.id}`, 600, 600)
    const colorNames = fromCsv(form.colors)
    const sizePricing = makeSizePricing(fromCsv(form.sizes), form.perSizePrice, form.sizePriceRows, form.price, form.oldPrice, sizeGroupMode(form.category, product.menuParent))
    const startPrice = sizePricing ? lowestSizePrice(sizePricing) : null
    try {
      await updateProduct(
        product.id,
        {
          name: form.name,
          category: form.category,
          price: startPrice ? startPrice.price : Number(form.price) || 0,
          oldPrice: startPrice ? startPrice.oldPrice : Number(form.oldPrice) || Number(form.price) || 0,
          rating: cleanRating(form.rating),
          // Empty => deleted (see replaceFields below), so the product page
          // goes back to the default fabric for its type.
          fabric: form.fabric.trim() || undefined,
          // Bras only (WSB / Colours); empty (Auto) = worked out from the colours
        // on the storefront, see utils/braShade.js.
          ...(product.menuParent === 'Bras' ? { shade: form.shade || undefined } : {}),
          description: form.description,
          image: front,
          // Empty => `undefined`, and 'imageBack' / 'colorImages' are listed
          // in replaceFields below, so undefined DELETES them from Firestore.
          // (A plain merge write ignores undefined, which is why removing a
          // back photo used to change nothing on the storefront.)
          imageBack: form.imageBack.trim() || undefined,
          // Women's Tops only. Empty => deleted (see replaceFields below) and
          // the storefront shows the "coming soon" placeholder in the Side View
          // slot. Any other product can't have a side photo, so a leftover one
          // is deleted on save too.
          ...(isWomenTops
            ? { imageSide: form.imageSide.trim() || undefined }
            : product.imageSide ? { imageSide: undefined } : {}),
          colors: toColorObjects(colorNames, form.colorStock),
          colorImages: toColorImages(colorNames, form.colorImageUrls, form.colorBackImageUrls, product.colorImages, isWomenTops ? form.colorSideImageUrls : {}),
          sizes: fromCsv(form.sizes),
          // null (not undefined) when off, so a size-price table that came from
          // the code catalog is switched off too instead of coming back.
          sizePricing,
          inStock: form.inStock,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          isNew: form.isNew,
        },
        { replaceFields: ['imageBack', 'imageSide', 'colorImages', 'fabric', 'shade', 'sizePricing'] }
      )
      return true
    } catch (err) {
      setError(err.message || 'Could not save changes')
      return false
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setPendingAction('save')
    try {
      if (await saveForm()) onSaved?.()
    } finally {
      setPendingAction(null)
    }
  }

  async function handleNavigate(direction) {
    setPendingAction(direction)
    try {
      if (await saveForm()) onNavigate?.(direction)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-thread sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-ink">Edit Product</h3>
            {position && (
              <p className="text-xs text-ink-soft mt-0.5">
                Product {position.index + 1} of {position.total}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft/60 hover:text-brand transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2">{error}</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            <Field label="Front View Photo (leave as-is to keep the current photo)">
              <ImageUploadField
                value={form.imageFront}
                onChange={(dataUrl) => update('imageFront', dataUrl)}
                hint="Drag & drop a photo, or browse"
              />
            </Field>

            <Field label="Back View Photo (optional)">
              <ImageUploadField
                value={form.imageBack}
                onChange={(dataUrl) => update('imageBack', dataUrl)}
                hint="No back photo — the Back View is hidden"
              />
            </Field>

            {isWomenTops && (
              <Field label="Side View Photo (optional — the thumbnail only shows on the site once you add one)">
                <ImageUploadField
                  value={form.imageSide}
                  onChange={(dataUrl) => update('imageSide', dataUrl)}
                  hint="No side photo — a placeholder is shown"
                />
              </Field>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Product Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input-base"
                required
              />
            </Field>

            <Field label="Category">
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-base">
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Price (₹)">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                className="input-base"
                required
              />
            </Field>

            <Field label="Original Price (₹)">
              <input
                type="number"
                min="0"
                value={form.oldPrice}
                onChange={(e) => update('oldPrice', e.target.value)}
                className="input-base"
              />
            </Field>

            <div className="sm:col-span-2 lg:col-span-3">
              <RatingFields
                rating={form.rating}
                onRatingChange={(v) => update('rating', v)}
              />
            </div>

            <FabricField value={form.fabric} onChange={(v) => update('fabric', v)} />

            {product.menuParent === 'Bras' && (
              <ShadeField value={form.shade} onChange={(v) => update('shade', v)} colorsCsv={form.colors} />
            )}

            <Field label="Colors (comma separated)">
              <input
                type="text"
                value={form.colors}
                onChange={(e) => update('colors', e.target.value)}
                className="input-base"
              />
            </Field>

            {fromCsv(form.colors).length > 0 && (
              <Field label="Photo & stock per color (optional)" className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-ink-soft/70 -mt-1 mb-1">
                  A color with no photos of its own uses the front/back photo above. Once a color
                  has its own photo, its Back View shows only if you add a Back photo for that
                  color — clear it to hide the Back View. Uncheck "In stock" to gray out that
                  color on the product page and stop shoppers picking it — the rest of the product
                  stays orderable in its other colors. Tip: drag a photo from one color's box and
                  drop it onto another color's box to reuse the same picture there.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fromCsv(form.colors).map((name) => (
                    <ColorPhotoCard
                      key={name}
                      name={name}
                      swatch={colorHex[name]}
                      front={form.colorImageUrls[name] || ''}
                      onFrontChange={(dataUrl) => updateColorImage(name, dataUrl)}
                      back={form.colorBackImageUrls[name] || ''}
                      onBackChange={(dataUrl) => updateColorBackImage(name, dataUrl)}
                      side={form.colorSideImageUrls[name] || ''}
                      onSideChange={(dataUrl) => updateColorSideImage(name, dataUrl)}
                      showSide={isWomenTops}
                      inStock={form.colorStock[name] !== false}
                      onStockChange={(v) => updateColorStock(name, v)}
                    />
                  ))}
                </div>
              </Field>
            )}

            <Field label="Sizes (comma separated)">
              <input
                type="text"
                value={form.sizes}
                onChange={(e) => update('sizes', e.target.value)}
                className="input-base"
              />
            </Field>

            <SizePriceFields
              grouped={sizeGroupMode(form.category, product.menuParent)}
              className="sm:col-span-2 lg:col-span-3"
              sizes={fromCsv(form.sizes)}
              enabled={form.perSizePrice}
              onEnabledChange={(v) => update('perSizePrice', v)}
              rows={form.sizePriceRows}
              onRowChange={(size, key, value) =>
                setForm((prev) => ({ ...prev, sizePriceRows: { ...prev.sizePriceRows, [size]: { ...prev.sizePriceRows[size], [key]: value } } }))
              }
              onFillAll={(value) =>
                setForm((prev) => ({ ...prev, sizePriceRows: Object.fromEntries(fromCsv(prev.sizes).map((sz) => [sz, { ...prev.sizePriceRows[sz], price: value }])) }))
              }
              basePrice={form.price}
              baseOldPrice={form.oldPrice}
            />

            <Field label="Description" className="sm:col-span-2 lg:col-span-3">
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="input-base resize-none"
              />
            </Field>

            <Field label="Flags" className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-5 h-full pt-1 flex-wrap">
                <Checkbox checked={form.inStock} onChange={(v) => update('inStock', v)} label="In Stock" />
                <Checkbox checked={form.isBestSeller} onChange={(v) => update('isBestSeller', v)} label="Best Seller" />
                <Checkbox checked={form.isNew} onChange={(v) => update('isNew', v)} label="New Arrival" />
                <Checkbox
                  checked={form.isFeatured}
                  onChange={(v) => update('isFeatured', v)}
                  label="Homepage Collections (Bras/Panties/Slips/Tights/Nighty/Tops)"
                />
              </div>
            </Field>
          </div>

          <div className="flex items-center gap-3 mt-6 sticky bottom-0 bg-white pt-4 pb-1 -mx-6 px-6 border-t border-thread flex-wrap">
            <button
              type="button"
              onClick={() => handleNavigate('prev')}
              disabled={!hasPrev || pendingAction != null}
              title="Save this product and go to the previous one"
              className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              {pendingAction === 'prev' ? 'Saving…' : 'Previous'}
            </button>
            <button type="submit" disabled={pendingAction != null} className="btn-primary px-6 py-2.5 text-sm flex-1 disabled:opacity-60">
              {pendingAction === 'save' ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('next')}
              disabled={!hasNext || pendingAction != null}
              title="Save this product and go to the next one"
              className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pendingAction === 'next' ? 'Saving…' : 'Next'}
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onClose} disabled={pendingAction != null} className="btn-outline px-6 py-2.5 text-sm w-full sm:w-auto">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand w-4 h-4"
      />
      {label}
    </label>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

// A product's row thumbnail in the Inventory list, made directly tappable:
// click it and a new photo goes straight onto that product, no "Edit
// Product" modal or scrolling required. Uses the same /api/upload endpoint
// as ImageUploadField.
function InventoryThumb({ product, onReplace }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onReplace(null, new Error('Please choose an image file'))
      return
    }
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { path: savedPath } = await res.json()
      await onReplace(savedPath)
    } catch (err) {
      onReplace(null, err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      title="Click to replace this product's photo"
      className="relative w-10 h-10 rounded-lg shrink-0 cursor-pointer group"
    >
      <img
        src={product.image}
        alt={product.name}
        onError={onImgError(product.fallbackSeed || product.id, 100, 100)}
        className="w-10 h-10 rounded-lg object-cover"
      />
      <div
        className={`absolute inset-0 rounded-lg flex items-center justify-center transition-opacity ${
          uploading ? 'opacity-100 bg-black/55' : 'opacity-0 group-hover:opacity-100 bg-black/45'
        }`}
      >
        {uploading ? (
          <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload size={13} className="text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

// Direct file upload for product photos: drag-and-drop or click to browse.
// The file is POSTed to the dev server's /api/upload endpoint (see
// vite.config.js), which writes it into public/images/uploads/ as a real
// file and hands back its public path (e.g. /images/uploads/tee-front.jpg).
// That path is what's stored in the product data — so uploaded photos are
// actual files on disk, not just base64 blobs living in localStorage, and
// they show up in the project folder the same as any other product image.
//
// /api/upload only exists while Vite's dev server (or `vite preview`) is
// running — see the catch block below for what happens without it.
// One color's full photo set (Front/Back/optional Side) plus its stock
// toggle, as a single self-contained card. Every tile is the same large,
// full-width size and both a drag source and a drop target (see
// ImageUploadField), so a photo can be picked up from one color's card and
// dropped straight onto another color's tile to reuse it — no need to
// upload the same picture twice.
function ColorPhotoCard({ name, swatch, front, onFrontChange, back, onBackChange, side, onSideChange, showSide, inStock, onStockChange }) {
  return (
    <div className="border border-thread rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-5 h-5 rounded-full border border-thread shrink-0"
            style={{ backgroundColor: swatch || '#CBD5E1' }}
            title={name}
          />
          <span className="text-sm font-medium text-ink truncate">{name}</span>
        </div>
        <Checkbox checked={inStock} onChange={onStockChange} label="In stock" />
      </div>
      <div className={`grid ${showSide ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
        <div>
          <p className="text-[10.5px] font-medium text-ink-soft/70 mb-1 text-center">Front</p>
          <ImageUploadField value={front} onChange={onFrontChange} hint={`${name} front`} compact />
        </div>
        <div>
          <p className="text-[10.5px] font-medium text-ink-soft/70 mb-1 text-center">Back</p>
          <ImageUploadField value={back} onChange={onBackChange} hint={`${name} back`} compact />
        </div>
        {showSide && (
          <div>
            <p className="text-[10.5px] font-medium text-ink-soft/70 mb-1 text-center">Side</p>
            <ImageUploadField value={side} onChange={onSideChange} hint={`${name} side`} compact />
          </div>
        )}
      </div>
    </div>
  )
}

function ImageUploadField({ value, onChange, hint, compact = false, wide = false }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function readFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFileError('Please choose an image file')
      return
    }
    setFileError('')
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { path: savedPath } = await res.json()
      onChange(savedPath)
    } catch (err) {
      // No /api/upload available (e.g. a static production build with no
      // Node server behind it, or the dev server's upload endpoint erroring
      // out) — we used to silently fall back to an in-memory base64 data
      // URL here and save THAT as the product's image. That looked fine in
      // the current tab, but Firestore rejects any document over 1 MiB —
      // and a photo encoded as base64 blows past that in one image. The
      // write would fail silently, so the "photo" only ever existed in
      // this browser's local state; refreshing (which re-reads the real,
      // never-saved Firestore data) made it vanish and fall back to the
      // grey placeholder icon. That's confusing because nothing here ever
      // said the save had failed.
      //
      // A data URL under Firestore's limit is still not something we
      // silently commit to a product record — a preview only, and we say
      // so plainly and persistently (not just a small caption) so it can't
      // be mistaken for "saved".
      const approxDataUrlBytes = file.size * 1.37 // base64 overhead
      if (approxDataUrlBytes > 700_000) {
        setFileError(
          `Couldn't save "${file.name}" to disk (upload endpoint failed), and it's too large to preview safely — this photo has NOT been saved. Make sure "npm run dev" is running, then try again.`
        )
        setUploading(false)
        return
      }
      setFileError(
        `Couldn't save "${file.name}" to disk — showing a temporary preview only. This will NOT persist after a refresh or a real save until the upload endpoint works ("npm run dev" running) and you re-upload it.`
      )
      const reader = new FileReader()
      reader.onload = () => onChange(reader.result)
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  // A photo dragged out of another slot in this panel (see handleDragStart
  // below) carries its already-saved path as plain text rather than a real
  // file — reuse that path directly instead of trying to "upload" it again.
  // A real file dragged in from the desktop/Explorer/Finder still goes
  // through the normal upload path.
  const INTERNAL_DRAG_TYPE = 'text/x-vss-photo-path'

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const internalPath = e.dataTransfer.getData(INTERNAL_DRAG_TYPE)
    if (internalPath) {
      onChange(internalPath)
      return
    }
    readFile(e.dataTransfer.files?.[0])
  }

  // Lets someone copy a photo (Ctrl+C on a file in File Explorer/Finder, or
  // "Copy image" from a browser/photo app) and paste it straight in here
  // with Ctrl+V — no file-browser dialog, and nothing to minimize or
  // arrange side-by-side first. Works as soon as this box has focus, which
  // a click already gives it (see tabIndex on the box below).
  function handlePaste(e) {
    const item = Array.from(e.clipboardData?.items || []).find((it) => it.type?.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    readFile(item.getAsFile())
  }

  // Picking up the photo itself (not the whole box) starts an internal
  // drag — drop it on any other photo slot on the page (another color,
  // another view) to reuse the same picture there instead of uploading it
  // a second time.
  function handleDragStart(e) {
    if (!value) return
    e.dataTransfer.setData(INTERNAL_DRAG_TYPE, value)
    e.dataTransfer.setData('text/plain', value)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onPaste={handlePaste}
        role="button"
        tabIndex={0}
        title={
          value
            ? 'Click to replace this photo — or drag it onto another slot to reuse it there'
            : 'Click to browse for a photo, drag one in from your desktop or another slot, or click here then press Ctrl+V to paste a copied image'
        }
        className={`group relative w-full ${
          wide ? 'aspect-[1920/700] min-h-[110px]' : compact ? 'aspect-square min-h-[96px]' : 'aspect-square min-h-[140px]'
        } rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-cream-dark ${
          dragOver ? 'border-brand bg-brand-light/50' : 'border-thread hover:border-brand/60 hover:bg-brand-light/10'
        }`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              draggable
              onDragStart={handleDragStart}
              onError={onImgError(`vss-admin-preview-${value}`, 100, 100)}
              className={`w-full h-full ${wide ? 'object-contain' : 'object-cover'} cursor-grab active:cursor-grabbing`}
            />
            {/* Sits on the thumbnail itself so it's an obviously separate
                action from tapping the photo to replace it or dragging it
                elsewhere — big enough to hit reliably on touch, but tucked
                in the corner so it's never the accidental target. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              title="Remove this photo"
              aria-label="Remove this photo"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-10"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] leading-tight text-center px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {uploading ? 'Uploading…' : 'Click to replace, or drag to another slot'}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-center px-2">
            {uploading ? (
              <span className="w-5 h-5 border-2 border-brand/40 border-t-brand rounded-full animate-spin" />
            ) : (
              <ImagePlus size={compact ? 20 : 26} className="text-gray-300" />
            )}
            <span className="text-[10.5px] leading-tight text-ink-soft px-1">
              {uploading ? 'Uploading…' : hint || 'Drag & drop, click to browse, or paste (Ctrl+V)'}
            </span>
          </div>
        )}
      </div>
      {fileError && (
        <p className="text-red-700 text-[10.5px] font-medium bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠ {fileError}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
      {/* For photos you've copied into public/images yourself rather than
          uploading through the box above — paste the path here (e.g.
          /images/products/men/my-shirt.jpg) and it's used as-is, no upload
          involved. Kept as plain text so pasting a full URL works too. */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="...or paste an image path"
        className="input-base text-[10.5px] py-1"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hero Slider tab — edits the big banner slider at the very top of the
// homepage (the "Everyday Essential / Designed for every you" one and its
// siblings). Each slide is one full-width banner photo plus the page it
// links to. Everything is saved to Firestore (siteContent/heroSlides) via
// SiteContentContext, and HeroSection.jsx reads the same document live, so
// there is no code (data/heroSlides.js) to touch anymore.
//
// The banner's headline/tagline/button are baked into the photo itself, so
// what's editable per slide is: the photo, where a click on it goes, an
// accessibility name, and whether it's currently shown. Order = order on
// the homepage.
// ---------------------------------------------------------------------------
const HERO_LINK_PRESETS = [
  { label: 'Shop By Category (scrolls down the homepage)', to: '/#shop-by-category' },
  { label: 'Daily Essentials page', to: '/daily-essentials' },
  { label: 'Bras', to: '/shop/women?type=bras' },
  { label: 'T-Shirts page', to: '/t-shirts' },
  { label: 'Slips page', to: '/slips' },
  { label: 'Panties page', to: '/panties' },
  { label: 'Special Offers page', to: '/offers' },
  { label: 'All Men products', to: '/shop/men' },
  { label: "All Women's products", to: '/shop/women' },
  { label: 'All Boys products', to: '/shop/boys' },
  { label: 'All Girls products', to: '/shop/girls' },
]
const HERO_CUSTOM = '__custom__'

function newHeroSlide() {
  return {
    id: `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    image: '',
    ctaLabel: 'Shop Now',
    ctaTo: '/shop',
    active: true,
  }
}

function HeroSlidesAdminTab({ onToast }) {
  const { allHeroSlides, heroIsCustomized, saveHeroSlides, resetHeroSlides } = useSiteContent()
  const [draft, setDraft] = useState(allHeroSlides)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Which slides have the "custom link" box open (a link that doesn't match
  // any preset always shows it).
  const [customLinkIds, setCustomLinkIds] = useState(() => new Set())

  // Pick up changes from Firestore (another device, a reset, the first
  // load finishing) — but never overwrite edits the admin hasn't saved yet.
  useEffect(() => {
    if (!dirty) setDraft(allHeroSlides)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHeroSlides])

  function change(next) {
    setDraft(next)
    setDirty(true)
    setError('')
  }

  function updateSlide(id, patch) {
    change(draft.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= draft.length) return
    const next = [...draft]
    ;[next[index], next[target]] = [next[target], next[index]]
    change(next)
  }

  function removeSlide(slide) {
    if (!window.confirm(`Delete this slide${slide.title ? ` ("${slide.title}")` : ''}? It disappears from the homepage once you press Save.`)) return
    change(draft.filter((s) => s.id !== slide.id))
  }

  function discard() {
    setDraft(allHeroSlides)
    setDirty(false)
    setError('')
  }

  async function handleSave() {
    // A temporary in-browser preview (data: URL) means the upload to disk
    // failed — saving that would exceed Firestore's document limit and
    // vanish on refresh, so stop here with a clear message instead.
    const unsaved = draft.findIndex((s) => s.image?.startsWith('data:'))
    if (unsaved !== -1) {
      setError(`Slide ${unsaved + 1}'s photo was only a temporary preview (the upload didn't reach the server). Make sure "npm run dev" is running and upload it again.`)
      return
    }
    const missingLink = draft.findIndex((s) => s.active && s.image && !s.ctaTo.trim())
    if (missingLink !== -1) {
      setError(`Slide ${missingLink + 1} needs a link — choose where it should go when clicked.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveHeroSlides(draft)
      setDirty(false)
      onToast('Hero slider saved — live on the homepage')
    } catch (err) {
      setError(err.message || 'Could not save the hero slider')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Go back to the original built-in slides? Your saved slides will be replaced on the homepage.')) return
    setSaving(true)
    setError('')
    try {
      await resetHeroSlides()
      setDirty(false)
      onToast('Hero slider reset to the original slides')
    } catch (err) {
      setError(err.message || 'Could not reset the hero slider')
    } finally {
      setSaving(false)
    }
  }

  const liveCount = draft.filter((s) => s.active && s.image).length

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          <Images size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Hero Slider</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            The big banner slider at the top of the homepage (Everyday Essentials, Brassier, T-shirt Collection, …). Upload
            a wide banner photo for each slide — the headline, tagline and button are part of the photo itself — and choose which
            page it opens when a shopper taps it. Slides play top to bottom. Nothing goes live until you press{' '}
            <span className="font-semibold">Save changes</span>.
          </p>
          <p className="text-xs text-ink-soft mt-1.5">
            Best photo size: <span className="font-semibold">1920 × 700 px</span> (wide landscape). Other sizes are centre-cropped to fit.
          </p>
        </div>
      </div>

      <div className="card-base p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20">
        <p className="text-sm text-ink">
          <span className="font-semibold">{liveCount}</span> slide{liveCount === 1 ? '' : 's'} live
          {dirty && <span className="ml-2 text-xs font-medium text-amber-600">• Unsaved changes</span>}
          {!dirty && !heroIsCustomized && <span className="ml-2 text-xs text-ink-soft/70">Showing the original built-in slides</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {heroIsCustomized && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              title="Delete your saved slides and go back to the original ones"
            >
              <RotateCcw size={13} /> Reset to defaults
            </button>
          )}
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            className="btn-outline text-xs px-3 py-2 disabled:opacity-40"
          >
            Discard changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-700 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">⚠ {error}</p>
      )}

      <div className="space-y-4">
        {draft.map((slide, i) => {
          const preset = HERO_LINK_PRESETS.find((p) => p.to === slide.ctaTo)
          const showCustom = customLinkIds.has(slide.id) || !preset
          return (
            <div key={slide.id} className={`card-base p-4 sm:p-5 ${slide.active ? '' : 'opacity-70'}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-ink truncate">{slide.title || 'Untitled slide'}</p>
                  {!slide.active && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Move earlier"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.length - 1}
                    title="Move later"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide)}
                    title="Delete this slide"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
                <ImageUploadField
                  wide
                  value={slide.image}
                  onChange={(v) => updateSlide(slide.id, { image: v })}
                  hint="Drop the banner photo here, click to browse, or paste (Ctrl+V)"
                />

                <div className="flex flex-col gap-3">
                  <Field label="Slide name (for screen readers / your reference)">
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                      placeholder="e.g. Everyday Essentials"
                      className="input-base"
                    />
                  </Field>

                  <Field label="When a shopper taps the banner, open…">
                    <select
                      value={showCustom ? HERO_CUSTOM : slide.ctaTo}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === HERO_CUSTOM) {
                          setCustomLinkIds((prev) => new Set(prev).add(slide.id))
                        } else {
                          setCustomLinkIds((prev) => {
                            const next = new Set(prev)
                            next.delete(slide.id)
                            return next
                          })
                          const p = HERO_LINK_PRESETS.find((x) => x.to === v)
                          updateSlide(slide.id, { ctaTo: v, ctaLabel: p ? `Shop ${p.label.split(' (')[0]}` : slide.ctaLabel })
                        }
                      }}
                      className="input-base"
                    >
                      {HERO_LINK_PRESETS.map((p) => (
                        <option key={p.to} value={p.to}>
                          {p.label}
                        </option>
                      ))}
                      <option value={HERO_CUSTOM}>Custom link…</option>
                    </select>
                  </Field>

                  {showCustom && (
                    <Field label="Custom link (a site path like /shop/men?type=shirts, or a full https:// address)">
                      <input
                        type="text"
                        value={slide.ctaTo}
                        onChange={(e) => updateSlide(slide.id, { ctaTo: e.target.value })}
                        placeholder="/shop/women?type=nighty"
                        className="input-base"
                      />
                    </Field>
                  )}

                  <Checkbox
                    checked={slide.active}
                    onChange={(v) => updateSlide(slide.id, { active: v })}
                    label="Show this slide on the homepage"
                  />
                </div>
              </div>
            </div>
          )
        })}

        {draft.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-ink-soft/70">
            No slides yet — the homepage banner is hidden until you add one.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => change([...draft, newHeroSlide()])}
        className="w-full border-2 border-dashed border-thread hover:border-brand/60 hover:bg-brand-light/10 rounded-xl py-4 text-sm font-medium text-ink-soft hover:text-brand flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} /> Add a slide
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// About Us Page tab — edits everything on the /about page (src/pages/About.jsx):
// header text, "Our story" text + photo, the four category cards, the product
// range tiles, the "How it's made" steps and the numbers strip. Saved to
// Firestore (siteContent/aboutPage). Anything left empty falls back to an
// automatic value taken from your live catalogue, so nothing can break.
// ---------------------------------------------------------------------------
function AboutSection({ title, note, children }) {
  return (
    <div className="card-base p-4 sm:p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {note && <p className="text-xs text-ink-soft mt-0.5">{note}</p>}
      </div>
      {children}
    </div>
  )
}

function AboutUsAdminTab({ onToast }) {
  const { aboutContent, aboutCustomized, saveAboutContent, resetAboutContent } = useSiteContent()
  const { storeProducts } = useProducts()
  const [draft, setDraft] = useState(aboutContent)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!dirty) setDraft(aboutContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aboutContent])

  const productTypes = useMemo(() => aboutProductTypes(storeProducts), [storeProducts])

  function change(updater) {
    setDraft((d) => updater(d))
    setDirty(true)
    setError('')
  }
  const setIn = (section, patch) => change((d) => ({ ...d, [section]: { ...d[section], ...patch } }))
  const newId = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  function move(list, i, dir) {
    const t = i + dir
    if (t < 0 || t >= list.length) return list
    const next = [...list]
    ;[next[i], next[t]] = [next[t], next[i]]
    return next
  }

  async function handleSave() {
    const all = JSON.stringify(draft)
    if (all.includes('"data:image')) {
      setError('A photo is only a temporary preview (the upload did not reach the server). Make sure "npm run dev" is running and upload it again.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveAboutContent(draft)
      setDirty(false)
      onToast('About Us page saved — live on the website')
    } catch (err) {
      setError(err.message || 'Could not save the About Us page')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Go back to the original About Us page content? Everything you saved here will be replaced.')) return
    setSaving(true)
    setError('')
    try {
      await resetAboutContent()
      setDirty(false)
      onToast('About Us page reset to the original content')
    } catch (err) {
      setError(err.message || 'Could not reset the About Us page')
    } finally {
      setSaving(false)
    }
  }

  const textarea = 'input-base min-h-[84px] resize-y'
  const d = draft

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          <Info size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">About Us Page</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            Edit every text and photo on the About Us page. Leave a photo empty to use an automatic one from your products.
            In any text you can type <span className="font-mono font-semibold">{'{products}'}</span> (live product count) and{' '}
            <span className="font-mono font-semibold">{'{fabrics}'}</span> (top fabrics) and they fill in automatically.
            Nothing goes live until you press <span className="font-semibold">Save changes</span>.
          </p>
          <Link to="/about" target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-brand mt-2 hover:underline">
            <ExternalLink size={12} /> Open the About Us page
          </Link>
        </div>
      </div>

      <div className="card-base p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20">
        <p className="text-sm text-ink">
          {dirty ? (
            <span className="text-xs font-medium text-amber-600">• Unsaved changes</span>
          ) : aboutCustomized ? (
            <span className="text-xs text-ink-soft/70">Showing your saved version</span>
          ) : (
            <span className="text-xs text-ink-soft/70">Showing the original built-in content</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {aboutCustomized && (
            <button type="button" onClick={handleReset} disabled={saving} className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
              <RotateCcw size={13} /> Reset to defaults
            </button>
          )}
          <button type="button" onClick={() => { setDraft(aboutContent); setDirty(false); setError('') }} disabled={!dirty || saving} className="btn-outline text-xs px-3 py-2 disabled:opacity-40">
            Discard changes
          </button>
          <button type="button" onClick={handleSave} disabled={!dirty || saving} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-700 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">⚠ {error}</p>}

      <AboutSection title="1. Page header" note="The dark banner at the top.">
        <Field label="Small line above the title">
          <input className="input-base" value={d.hero.eyebrow} onChange={(e) => setIn('hero', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Title">
          <input className="input-base" value={d.hero.title} onChange={(e) => setIn('hero', { title: e.target.value })} />
        </Field>
        <Field label="Paragraph">
          <textarea className={textarea} value={d.hero.text} onChange={(e) => setIn('hero', { text: e.target.value })} />
        </Field>
      </AboutSection>

      <AboutSection title="2. Our story" note="The big photo with your story next to it.">
        <div className="grid md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-4">
          <Field label="Photo (empty = automatic product photo)">
            <ImageUploadField value={d.story.image} onChange={(v) => setIn('story', { image: v })} hint="Drop your story photo here" />
          </Field>
          <div className="flex flex-col gap-3">
            <Field label="Small line above the title">
              <input className="input-base" value={d.story.eyebrow} onChange={(e) => setIn('story', { eyebrow: e.target.value })} />
            </Field>
            <Field label="Title">
              <input className="input-base" value={d.story.title} onChange={(e) => setIn('story', { title: e.target.value })} />
            </Field>
            <Field label="Paragraph 1">
              <textarea className={textarea} value={d.story.paragraph1} onChange={(e) => setIn('story', { paragraph1: e.target.value })} />
            </Field>
            <Field label="Paragraph 2 (optional)">
              <textarea className={textarea} value={d.story.paragraph2} onChange={(e) => setIn('story', { paragraph2: e.target.value })} />
            </Field>
          </div>
        </div>
      </AboutSection>

      <AboutSection title="3. What we make (Men / Women / Boys / Girls cards)" note="Style counts are always live. Photo and the small details line are optional overrides.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Small line above the title">
            <input className="input-base" value={d.categories.eyebrow} onChange={(e) => setIn('categories', { eyebrow: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input-base" value={d.categories.title} onChange={(e) => setIn('categories', { title: e.target.value })} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {d.categories.items.map((item, i) => (
            <div key={item.id} className="border border-thread rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-ink">{categoryLabelMap[item.id] || item.id}</p>
              <ImageUploadField compact value={item.image} onChange={(v) => change((x) => ({ ...x, categories: { ...x.categories, items: x.categories.items.map((it, j) => (j === i ? { ...it, image: v } : it)) } }))} hint="Photo (empty = automatic)" />
              <Field label="Details line (empty = automatic)">
                <input className="input-base text-xs" placeholder="Tops • Nighties • Bras" value={item.details} onChange={(e) => change((x) => ({ ...x, categories: { ...x.categories, items: x.categories.items.map((it, j) => (j === i ? { ...it, details: e.target.value } : it)) } }))} />
              </Field>
            </div>
          ))}
        </div>
      </AboutSection>

      <AboutSection title="4. Our product range" note="One tile per product type found in your catalogue. Change a tile's photo or hide it.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Small line above the title">
            <input className="input-base" value={d.range.eyebrow} onChange={(e) => setIn('range', { eyebrow: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input-base" value={d.range.title} onChange={(e) => setIn('range', { title: e.target.value })} />
          </Field>
        </div>
        <Checkbox checked={d.range.showFabrics} onChange={(v) => setIn('range', { showFabrics: v })} label="Show the list of fabrics under the tiles" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {productTypes.map((t) => {
            const ov = d.range.overrides[t.label] || {}
            const setOv = (patch) => change((x) => ({ ...x, range: { ...x.range, overrides: { ...x.range.overrides, [t.label]: { ...ov, ...patch } } } }))
            return (
              <div key={t.label} className={`border border-thread rounded-xl p-3 space-y-2 ${ov.hidden ? 'opacity-60' : ''}`}>
                <p className="text-sm font-semibold text-ink">{t.label} <span className="text-xs font-normal text-ink-soft">· {t.count} styles</span></p>
                <ImageUploadField compact value={ov.image || ''} onChange={(v) => setOv({ image: v })} hint="Photo (empty = automatic)" />
                <Checkbox checked={!ov.hidden} onChange={(v) => setOv({ hidden: !v })} label="Show this tile" />
              </div>
            )
          })}
          {productTypes.length === 0 && <p className="text-xs text-ink-soft/70">No products with photos yet — tiles appear once products are added.</p>}
        </div>
      </AboutSection>

      <AboutSection title="5. How it's made" note="The red section with the process steps.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Small line above the title">
            <input className="input-base" value={d.process.eyebrow} onChange={(e) => setIn('process', { eyebrow: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input-base" value={d.process.title} onChange={(e) => setIn('process', { title: e.target.value })} />
          </Field>
        </div>
        <div className="space-y-3">
          {d.process.steps.map((st, i) => {
            const setStep = (patch) => setIn('process', { steps: d.process.steps.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
            return (
              <div key={st.id} className="border border-thread rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={i === 0} onClick={() => setIn('process', { steps: move(d.process.steps, i, -1) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronUp size={16} /></button>
                    <button type="button" disabled={i === d.process.steps.length - 1} onClick={() => setIn('process', { steps: move(d.process.steps, i, 1) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronDown size={16} /></button>
                    <button type="button" onClick={() => setIn('process', { steps: d.process.steps.filter((_, j) => j !== i) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
                <Field label="Step title"><input className="input-base" value={st.title} onChange={(e) => setStep({ title: e.target.value })} /></Field>
                <Field label="Description"><textarea className={textarea} value={st.desc} onChange={(e) => setStep({ desc: e.target.value })} /></Field>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={() => setIn('process', { steps: [...d.process.steps, { id: newId('step'), title: '', desc: '' }] })} className="w-full border-2 border-dashed border-thread hover:border-brand/60 rounded-xl py-3 text-sm font-medium text-ink-soft hover:text-brand flex items-center justify-center gap-2">
          <Plus size={16} /> Add a step
        </button>
      </AboutSection>

      <AboutSection title="6. Videos: how we work" note="Company, production, packing, warehouse and transport videos. Paste a YouTube link or upload a file. A video with no link shows 'Video coming soon'.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Small line above the title">
            <input className="input-base" value={d.videos.eyebrow} onChange={(e) => setIn('videos', { eyebrow: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input-base" value={d.videos.title} onChange={(e) => setIn('videos', { title: e.target.value })} />
          </Field>
        </div>
        <Field label="Sub-heading (optional)">
          <input className="input-base" value={d.videos.subtitle} onChange={(e) => setIn('videos', { subtitle: e.target.value })} />
        </Field>
        <div className="space-y-3">
          {d.videos.items.map((v, i) => {
            const setVid = (patch) => setIn('videos', { items: d.videos.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
            return (
              <div key={v.id} className={`border border-thread rounded-xl p-3 space-y-3 ${v.active ? '' : 'opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={i === 0} onClick={() => setIn('videos', { items: move(d.videos.items, i, -1) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronUp size={16} /></button>
                    <button type="button" disabled={i === d.videos.items.length - 1} onClick={() => setIn('videos', { items: move(d.videos.items, i, 1) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronDown size={16} /></button>
                    <button type="button" onClick={() => setIn('videos', { items: d.videos.items.filter((_, j) => j !== i) })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-[180px_minmax(0,1fr)] gap-3">
                  <Field label="Label (e.g. Packing)"><input className="input-base" value={v.tag} onChange={(e) => setVid({ tag: e.target.value })} /></Field>
                  <Field label="Title"><input className="input-base" value={v.title} onChange={(e) => setVid({ title: e.target.value })} /></Field>
                </div>
                <Field label="Short description"><input className="input-base" value={v.desc} onChange={(e) => setVid({ desc: e.target.value })} /></Field>
                <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,200px)] gap-3">
                  <VideoSourceField value={v.src} onChange={(x) => setVid({ src: x })} />
                  <Field label="Thumbnail (optional)">
                    <ImageUploadField compact value={v.poster} onChange={(x) => setVid({ poster: x })} hint="YouTube uses its own" />
                  </Field>
                </div>
                <Checkbox checked={v.active} onChange={(x) => setVid({ active: x })} label="Show this video on the About Us page" />
              </div>
            )
          })}
        </div>
        <button type="button" onClick={() => setIn('videos', { items: [...d.videos.items, { id: newId('vid'), tag: '', title: '', desc: '', poster: '', src: '', active: true }] })} className="w-full border-2 border-dashed border-thread hover:border-brand/60 rounded-xl py-3 text-sm font-medium text-ink-soft hover:text-brand flex items-center justify-center gap-2">
          <Plus size={16} /> Add a video
        </button>
      </AboutSection>

      <AboutSection title="7. Numbers strip" note="Leave the number empty on an automatic item to count it live from your catalogue; type your own number to override it.">
        <div className="space-y-3">
          {d.stats.map((st, i) => {
            const setStat = (patch) => change((x) => ({ ...x, stats: x.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))
            return (
              <div key={st.id} className="border border-thread rounded-xl p-3 grid sm:grid-cols-[150px_150px_minmax(0,1fr)_auto] gap-3 items-end">
                <Field label="Automatic number">
                  <select className="input-base" value={st.auto} onChange={(e) => setStat({ auto: e.target.value })}>
                    <option value="">None (type my own)</option>
                    <option value="products">Product count</option>
                    <option value="collections">Collections count</option>
                    <option value="fabrics">Fabric types count</option>
                  </select>
                </Field>
                <Field label="Your number (optional)">
                  <input className="input-base" placeholder={st.auto ? 'Automatic' : 'e.g. 10+'} value={st.value} onChange={(e) => setStat({ value: e.target.value })} />
                </Field>
                <Field label="Label"><input className="input-base" value={st.label} onChange={(e) => setStat({ label: e.target.value })} /></Field>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => change((x) => ({ ...x, stats: move(x.stats, i, -1) }))} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button type="button" disabled={i === d.stats.length - 1} onClick={() => change((x) => ({ ...x, stats: move(x.stats, i, 1) }))} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button type="button" onClick={() => change((x) => ({ ...x, stats: x.stats.filter((_, j) => j !== i) }))} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={() => change((x) => ({ ...x, stats: [...x.stats, { id: newId('stat'), auto: '', value: '', label: '' }] }))} className="w-full border-2 border-dashed border-thread hover:border-brand/60 rounded-xl py-3 text-sm font-medium text-ink-soft hover:text-brand flex items-center justify-center gap-2">
          <Plus size={16} /> Add a number
        </button>
      </AboutSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Videos tab — edits the "See How We Make It" video section on the homepage
// (src/components/home/FactoryVideos.jsx). Each video is a title, a tag
// (Our Factory / Our Products), a video (YouTube link OR an uploaded file)
// and an optional thumbnail. Saved to Firestore (siteContent/homeVideos).
// ---------------------------------------------------------------------------
function newHomeVideo() {
  return {
    id: `video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    tag: 'Our Factory',
    title: '',
    desc: '',
    poster: '',
    src: '',
    active: true,
  }
}

function VideoSourceField({ value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  async function upload(file) {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setErr('Please choose a video file (.mp4, .webm or .mov)')
      return
    }
    setErr('')
    setUploading(true)
    try {
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
        body: file,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.path) throw new Error(data.error || 'Upload failed')
      onChange(data.path)
    } catch (e) {
      setErr(`${e.message}. Uploading only works while "npm run dev" is running — or paste a YouTube link instead.`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Field label="YouTube link, or video file path">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…   or   /videos/factory.mp4"
          className="input-base"
        />
      </Field>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-outline text-xs px-3 py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Film size={14} /> {uploading ? 'Uploading video… please wait' : 'Upload a video file from this computer'}
      </button>
      {err && <p className="text-red-700 text-xs">{err}</p>}
    </div>
  )
}

function HomeVideosAdminTab({ onToast }) {
  const { allHomeVideos, homeVideosCustomized, saveHomeVideos, resetHomeVideos } = useSiteContent()
  const [draft, setDraft] = useState(allHomeVideos)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!dirty) setDraft(allHomeVideos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHomeVideos])

  function change(next) {
    setDraft(next)
    setDirty(true)
    setError('')
  }
  function update(id, patch) {
    change(draft.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }
  function move(i, dir) {
    const t = i + dir
    if (t < 0 || t >= draft.length) return
    const next = [...draft]
    ;[next[i], next[t]] = [next[t], next[i]]
    change(next)
  }
  function remove(v) {
    if (!window.confirm(`Delete this video${v.title ? ` ("${v.title}")` : ''}? It disappears from the homepage once you press Save.`)) return
    change(draft.filter((x) => x.id !== v.id))
  }

  async function handleSave() {
    const bad = draft.findIndex((v) => v.poster?.startsWith('data:'))
    if (bad !== -1) {
      setError(`Video ${bad + 1}'s thumbnail was only a temporary preview — make sure "npm run dev" is running and upload it again.`)
      return
    }
    const noTitle = draft.findIndex((v) => v.active && !v.title.trim())
    if (noTitle !== -1) {
      setError(`Video ${noTitle + 1} needs a title.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveHomeVideos(draft)
      setDirty(false)
      onToast('Videos saved — live on the homepage')
    } catch (e) {
      setError(e.message || 'Could not save the videos')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Go back to the original placeholder videos? Your saved videos will be removed from the homepage.')) return
    setSaving(true)
    try {
      await resetHomeVideos()
      setDirty(false)
      onToast('Videos reset to the defaults')
    } catch (e) {
      setError(e.message || 'Could not reset the videos')
    } finally {
      setSaving(false)
    }
  }

  const liveCount = draft.filter((v) => v.active && (v.src || v.poster)).length

  return (
    <div className="space-y-5">
      <div className="card-base p-5 sm:p-6 flex items-start gap-3 border border-brand/20 bg-brand-light/20">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          <Film size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Homepage Videos — "See How We Make It"</p>
          <p className="text-xs text-ink-soft mt-0.5 max-w-2xl">
            Add videos of your factory and products. Paste a <span className="font-semibold">YouTube link</span> (easiest — works everywhere)
            or upload a video file. The first video is the big one; the rest appear in the list beside it. Nothing goes live until you press{' '}
            <span className="font-semibold">Save changes</span>.
          </p>
          <p className="text-xs text-ink-soft mt-1.5">
            Thumbnail is optional — YouTube videos use their own. Uploaded files are saved in <span className="font-mono">public/videos</span>;
            keep them under ~30 MB and remember to deploy that folder with your site.
          </p>
        </div>
      </div>

      <div className="card-base p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-20">
        <p className="text-sm text-ink">
          <span className="font-semibold">{liveCount}</span> video{liveCount === 1 ? '' : 's'} live
          {dirty && <span className="ml-2 text-xs font-medium text-amber-600">• Unsaved changes</span>}
          {!dirty && !homeVideosCustomized && <span className="ml-2 text-xs text-ink-soft/70">Showing the built-in placeholders</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {homeVideosCustomized && (
            <button type="button" onClick={handleReset} disabled={saving} className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
              <RotateCcw size={13} /> Reset to defaults
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setDraft(allHomeVideos)
              setDirty(false)
              setError('')
            }}
            disabled={!dirty || saving}
            className="btn-outline text-xs px-3 py-2 disabled:opacity-40"
          >
            Discard changes
          </button>
          <button type="button" onClick={handleSave} disabled={!dirty || saving} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-700 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">⚠ {error}</p>}

      <div className="space-y-4">
        {draft.map((v, i) => (
          <div key={v.id} className={`card-base p-4 sm:p-5 ${v.active ? '' : 'opacity-70'}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm font-semibold text-ink truncate">{v.title || 'Untitled video'}</p>
                {!v.active && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move earlier" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronUp size={16} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === draft.length - 1} title="Move later" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronDown size={16} />
                </button>
                <button type="button" onClick={() => remove(v)} title="Delete this video" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Field label="Title">
                  <input type="text" value={v.title} onChange={(e) => update(v.id, { title: e.target.value })} placeholder="e.g. A Walk Through the VSS Factory" className="input-base" />
                </Field>
                <Field label="Short description (optional)">
                  <input type="text" value={v.desc} onChange={(e) => update(v.id, { desc: e.target.value })} placeholder="One line shown on the big video" className="input-base" />
                </Field>
                <Field label="Category">
                  <select value={v.tag} onChange={(e) => update(v.id, { tag: e.target.value })} className="input-base">
                    <option value="Our Factory">Our Factory</option>
                    <option value="Our Products">Our Products</option>
                  </select>
                </Field>
                <Checkbox checked={v.active} onChange={(x) => update(v.id, { active: x })} label="Show this video on the homepage" />
              </div>

              <div className="flex flex-col gap-3">
                <VideoSourceField value={v.src} onChange={(x) => update(v.id, { src: x })} />
                <div>
                  <p className="font-medium text-ink-soft text-sm mb-1.5">Thumbnail (optional)</p>
                  <ImageUploadField
                    wide
                    value={v.poster}
                    onChange={(x) => update(v.id, { poster: x })}
                    hint="Drop a thumbnail photo here, or click to browse"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {draft.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-ink-soft/70">No videos yet — the homepage video section is hidden until you add one.</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => change([...draft, newHomeVideo()])}
        className="w-full border-2 border-dashed border-thread hover:border-brand/60 hover:bg-brand-light/10 rounded-xl py-4 text-sm font-medium text-ink-soft hover:text-brand flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} /> Add a video
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Messages tab — everything customers send from the Contact page
// (Firestore collection "contactMessages"). Opening a message marks it read.
// ---------------------------------------------------------------------------
function MessagesAdminTab({ messages, loading, error, setRead, remove, onToast }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)

  const unread = messages.filter((m) => m.status !== 'read').length
  const shown = messages.filter((m) => {
    if (filter === 'new' && m.status === 'read') return false
    if (filter === 'read' && m.status !== 'read') return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [m.name, m.email, m.subject, m.message].some((v) => (v || '').toLowerCase().includes(q))
  })
  const open = messages.find((m) => m.id === openId) || null

  async function openMessage(m) {
    setOpenId(m.id)
    if (m.status !== 'read') {
      try {
        await setRead(m.id, true)
      } catch (e) {
        console.error(e)
      }
    }
  }
  async function toggleRead(m) {
    try {
      await setRead(m.id, m.status !== 'read')
      onToast(m.status !== 'read' ? 'Marked as read' : 'Marked as unread')
    } catch (e) {
      onToast('Could not update the message')
    }
  }
  async function del(m) {
    if (!window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return
    try {
      await remove(m.id)
      if (openId === m.id) setOpenId(null)
      onToast('Message deleted')
    } catch (e) {
      onToast('Could not delete the message')
    }
  }
  const fmt = (m) => {
    const d = messageDate(m)
    return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Just now'
  }

  return (
    <div className="space-y-5">
      <div className="card-base p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ['all', `All (${messages.length})`],
            ['new', `Unread (${unread})`],
            ['read', 'Read'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                filter === id ? 'bg-brand text-white border-brand' : 'bg-white text-ink-soft border-thread hover:border-brand/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, subject…"
            className="input-base pl-9"
          />
        </div>
      </div>

      {error && <p className="text-red-700 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">⚠ {error}</p>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 items-start">
        <div className="card-base overflow-hidden divide-y divide-thread">
          {loading && <p className="p-6 text-sm text-ink-soft/70">Loading messages…</p>}
          {!loading && shown.length === 0 && (
            <div className="p-10 text-center text-sm text-ink-soft/70">
              <Mail size={30} className="mx-auto mb-2 text-brand/40" />
              {messages.length === 0 ? 'No messages yet. Messages from your Contact page will appear here.' : 'No messages match this filter.'}
            </div>
          )}
          {shown.map((m) => {
            const isNew = m.status !== 'read'
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => openMessage(m)}
                className={`w-full text-left p-4 flex gap-3 transition-colors hover:bg-brand-light/30 ${openId === m.id ? 'bg-brand-light/50' : ''}`}
              >
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${isNew ? 'bg-brand' : 'bg-transparent border border-thread'}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${isNew ? 'font-semibold text-ink' : 'font-medium text-ink-soft'}`}>{m.name}</span>
                    <span className="text-[11px] text-ink-soft/60 shrink-0">{fmt(m)}</span>
                  </span>
                  <span className={`block text-sm truncate ${isNew ? 'text-ink' : 'text-ink-soft'}`}>{m.subject}</span>
                  <span className="block text-xs text-ink-soft/70 truncate">{m.message}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="card-base p-5 sm:p-6 lg:sticky lg:top-24">
          {!open ? (
            <div className="py-14 text-center text-sm text-ink-soft/70">
              <MailOpen size={32} className="mx-auto mb-2 text-brand/40" />
              Select a message to read it.
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-lg text-ink break-words">{open.subject}</h3>
                  <p className="text-xs text-ink-soft/70 mt-1">{fmt(open)}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${open.status === 'read' ? 'bg-gray-100 text-gray-500' : 'bg-brand text-white'}`}>
                  {open.status === 'read' ? 'Read' : 'New'}
                </span>
              </div>
              <div className="bg-cream-dark rounded-lg px-4 py-3 mb-4 text-sm">
                <p className="font-medium text-ink">{open.name}</p>
                <a href={`mailto:${open.email}`} className="text-brand hover:underline break-all">{open.email}</a>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap break-words leading-relaxed mb-6">{open.message}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                  className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5"
                >
                  <Mail size={14} /> Reply by email
                </a>
                <button type="button" onClick={() => toggleRead(open)} className="btn-outline text-xs px-4 py-2.5">
                  {open.status === 'read' ? 'Mark as unread' : 'Mark as read'}
                </button>
                <button type="button" onClick={() => del(open)} className="btn-outline text-xs px-4 py-2.5 flex items-center gap-1.5 hover:!text-red-600 hover:!border-red-300">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
