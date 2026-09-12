import { useEffect, useMemo, useRef, useState } from 'react'
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
  LogOut,
} from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { buildMegaMenu } from '../utils/menu.js'
import { fallbackSrc, onImgError } from '../utils/imgFallback.js'
import { colorHex } from '../data/products.js'

const categoryOptions = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
]

const categoryLabelMap = Object.fromEntries(categoryOptions.map((c) => [c.value, c.label]))

const baseStats = [
  { icon: IndianRupee, label: 'Total Sales', value: '₹4,82,300' },
  { icon: ShoppingCart, label: 'Orders', value: '1,284' },
  { icon: Users, label: 'Customers', value: '3,940' },
]

// The "type" a product is filed under for the Types dropdown — a grouped
// product (e.g. every RN/RNS variant under "Premium Vest") answers to its
// menuParent group label; anything else answers to its own subcategory
// label. This mirrors exactly how utils/menu.js groups products for the
// nav/mega-menu, so the Types list here always matches what shoppers see.
function productType(p) {
  return p.menuParent || p.subCategoryLabel || p.subCategory || 'Other'
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
  const { products, deleteProduct, deleteProductsByType, deleteProductsByMenuParent, resetProducts, updateProduct, apiError } = useProducts()
  const { user, isAdmin, loading, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [wearFilter, setWearFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  const [toast, setToast] = useState('')
  // Which section of the admin panel is showing. The whole page used to be
  // one long scroll (stats → out-of-stock → add-product form → manage
  // categories → inventory table, one after another); it's split into tabs
  // instead so each job — checking stock, adding a product, tidying
  // categories, browsing inventory — has its own uncluttered screen instead
  // of a mile of scrolling to reach it.
  const [activeTab, setActiveTab] = useState('overview')

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
    return [...seen].sort()
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

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .filter((p) => {
      if (stockFilter === 'in') return p.inStock !== false
      if (stockFilter === 'out') return p.inStock === false
      return true
    })
    .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
    .filter((p) => wearFilter === 'all' || wearType(p.menuHeading) === wearFilter)
    .filter((p) => typeFilter === 'all' || productType(p) === typeFilter)

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

  const stats = [
    { icon: IndianRupee, label: 'Total Sales', value: baseStats[0].value },
    { icon: ShoppingCart, label: 'Orders', value: baseStats[1].value },
    { icon: Package, label: 'Products', value: products.length },
    { icon: PackageX, label: 'Out of Stock', value: outOfStockProducts.length, alert: outOfStockProducts.length > 0 },
    { icon: Users, label: 'Customers', value: baseStats[2].value },
  ]

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return
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

  async function handleResetAll() {
    if (!window.confirm('Reset the entire catalog back to the original defaults? All your added/edited/deleted products will be lost.')) return
    try {
      await resetProducts()
      showToast('Catalog reset to defaults')
    } catch (err) {
      showToast(err.message || 'Could not reset catalog')
    }
  }

  // Nav items for the sidebar/tab bar. `badge` is an optional small count
  // shown next to the label — Inventory always shows the live product
  // total, Overview lights up red with the out-of-stock count so a problem
  // is visible without having to click in.
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: outOfStockProducts.length || null, badgeAlert: true },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: products.length },
    { id: 'add', label: 'Add Product', icon: Plus },
    { id: 'categories', label: 'Categories', icon: Boxes },
  ]

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
              onClick={handleResetAll}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-brand transition-colors"
            >
              <RotateCcw size={13} /> Reset catalog to defaults
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-red-600 transition-colors"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </div>
        <p className="text-sm text-ink-soft mb-6 max-w-3xl">
          Add, edit, and delete products below — changes are saved in this browser, so they'll still be here after a refresh, but only on this device (there's no shared backend, so they won't show up if you open the site somewhere else).
        </p>

        {apiError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
            {apiError}
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
          {stats.map(({ icon: Icon, label, value, alert }) => (
            <div key={label} className="card-base p-4 flex items-center gap-3">
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
            </div>
          ))}
        </div>

        {/* Sidebar + content shell — one section on screen at a time
            instead of one long scroll through everything. */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <nav className="w-full lg:w-56 shrink-0 lg:sticky lg:top-24">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive ? 'bg-brand text-white shadow-sm' : 'bg-white text-ink-soft hover:bg-brand-light/60'
                    }`}
                  >
                    <tab.icon size={16} className="shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.badge != null && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
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
                    <ChevronRight size={14} className={`hidden lg:block shrink-0 ${isActive ? 'opacity-80' : 'opacity-0'}`} />
                  </button>
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
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: 'add', icon: Plus, title: 'Add a Product', desc: 'File a new item into the catalog' },
                      { id: 'inventory', icon: Package, title: 'Browse Inventory', desc: `${products.length} products across every category` },
                      { id: 'categories', icon: Boxes, title: 'Manage Categories', desc: 'Add or remove subcategories' },
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

            {activeTab === 'add' && <AddProductForm onSuccess={() => showToast('Product added')} />}

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
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="font-semibold text-ink">Product Inventory ({filtered.length})</h3>
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
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => (
                        <tr key={p.id} className="border-b border-thread/60 last:border-0">
                          <td className="py-3 pr-4 flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              onError={onImgError(p.fallbackSeed || p.id, 100, 100)}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <span className="text-ink line-clamp-1 max-w-[180px]">{p.name}</span>
                          </td>
                          <td className="py-3 pr-4 capitalize text-ink-soft">{p.category}</td>
                          <td className="py-3 pr-4 text-ink font-medium">{formatPrice(p.price)}</td>
                          <td className="py-3 pr-4 text-ink-soft">{p.rating} ★</td>
                          <td className="py-3 pr-4">
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
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingProduct(p)}
                                aria-label="Edit product"
                                title="Edit"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
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
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-ink-soft/60">
                            {query ? `No products match "${query}"` : 'No products match this filter'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null)
            showToast('Product updated')
          }}
        />
      )}
    </section>
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
function toColorObjects(names) {
  return names.map((name) => ({ name, hex: colorHex[name] || '#CBD5E1' }))
}

const emptyForm = {
  name: '',
  category: 'men',
  subCategoryName: '',
  menuHeading: '',
  price: '',
  oldPrice: '',
  description: '',
  colors: '',
  colorImageUrls: {},
  imageFront: '',
  imageBack: '',
  sizes: 'S, M, L, XL',
  inStock: true,
  isFeatured: false,
  isBestSeller: false,
}

// Turns { [name]: url } into the { [name]: { image } } shape products.js /
// the Product page expect, dropping any color that was left blank.
function toColorImages(colorNames, urlMap) {
  const result = {}
  colorNames.forEach((name) => {
    const url = (urlMap[name] || '').trim()
    if (url) result[name] = { image: url }
  })
  return Object.keys(result).length ? result : undefined
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
        imageBack: image,
        colors: [],
        price: 499,
        oldPrice: 499,
        sizes: ['S', 'M', 'L', 'XL'],
        description: '',
        inStock: true,
        isFeatured: false,
        isBestSeller: false,
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
        imageBack: form.imageBack.trim() || front,
        colors: toColorObjects(colorNames),
        colorImages: toColorImages(colorNames, form.colorImageUrls),
        price: Number(form.price) || 0,
        oldPrice: Number(form.oldPrice) || Number(form.price) || 0,
        sizes: fromCsv(form.sizes),
        description: form.description,
        inStock: form.inStock,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
      })

      setForm({ ...emptyForm, category: form.category, subCategorySlug: '', menuParent: '', colorImageUrls: {} })
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            hint="Defaults to the front photo if left empty"
          />
        </Field>

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
          <Field label="Photo per color (optional)" className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-ink-soft/70 -mt-1 mb-1">
              Leave any color without an upload to keep the front/back photo above for it.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fromCsv(form.colors).map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full border border-thread shrink-0"
                    style={{ backgroundColor: colorHex[name] || '#CBD5E1' }}
                    title={name}
                  />
                  <div className="flex-1">
                    <ImageUploadField
                      value={form.colorImageUrls[name] || ''}
                      onChange={(dataUrl) => updateColorImage(name, dataUrl)}
                      hint={`Upload a ${name} photo`}
                      compact
                    />
                  </div>
                </div>
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
          <div className="flex items-center gap-5 h-full pt-1">
            <Checkbox checked={form.inStock} onChange={(v) => update('inStock', v)} label="In Stock" />
            <Checkbox checked={form.isFeatured} onChange={(v) => update('isFeatured', v)} label="Featured" />
            <Checkbox checked={form.isBestSeller} onChange={(v) => update('isBestSeller', v)} label="Best Seller" />
          </div>
        </Field>
      </div>

      <button type="submit" className="btn-primary mt-5 px-6 py-2.5 text-sm flex items-center gap-2">
        <Plus size={16} /> Add Product
      </button>
    </form>
  )
}

function EditProductModal({ product, onClose, onSaved }) {
  const { updateProduct } = useProducts()
  const [form, setForm] = useState({
    name: product.name || '',
    category: product.category || 'men',
    price: product.price ?? '',
    oldPrice: product.oldPrice ?? '',
    description: product.description || '',
    imageFront: product.image || '',
    imageBack: product.imageBack || '',
    colors: toCsv(product.colors),
    // Seed from whatever per-color photos this product already has (see
    // toColorImages/colorImages below) so re-opening Edit shows the URLs
    // that are already set instead of blank fields.
    colorImageUrls: Object.fromEntries(
      Object.entries(product.colorImages || {}).map(([name, img]) => [name, img.image || ''])
    ),
    sizes: (product.sizes || []).join(', '),
    inStock: product.inStock !== false,
    isFeatured: !!product.isFeatured,
    isBestSeller: !!product.isBestSeller,
  })

  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateColorImage(name, url) {
    setForm((prev) => ({ ...prev, colorImageUrls: { ...prev.colorImageUrls, [name]: url } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      const front = form.imageFront.trim() || fallbackSrc(`vss-admin-${product.id}`, 600, 600)
      const colorNames = fromCsv(form.colors)
      await updateProduct(product.id, {
        name: form.name,
        category: form.category,
        price: Number(form.price) || 0,
        oldPrice: Number(form.oldPrice) || Number(form.price) || 0,
        description: form.description,
        image: front,
        imageBack: form.imageBack.trim() || front,
        colors: toColorObjects(colorNames),
        colorImages: toColorImages(colorNames, form.colorImageUrls),
        sizes: fromCsv(form.sizes),
        inStock: form.inStock,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
      })
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Could not save changes')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-thread sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-ink">Edit Product</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft/60 hover:text-brand transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2">{error}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
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

            <Field label="Colors (comma separated)">
              <input
                type="text"
                value={form.colors}
                onChange={(e) => update('colors', e.target.value)}
                className="input-base"
              />
            </Field>

            {fromCsv(form.colors).length > 0 && (
              <Field label="Photo per color (optional)" className="sm:col-span-2">
                <p className="text-xs text-ink-soft/70 -mt-1 mb-1">
                  Leave any color without an upload to keep the front/back photo above for it.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {fromCsv(form.colors).map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full border border-thread shrink-0"
                        style={{ backgroundColor: colorHex[name] || '#CBD5E1' }}
                        title={name}
                      />
                      <div className="flex-1">
                        <ImageUploadField
                          value={form.colorImageUrls[name] || ''}
                          onChange={(dataUrl) => updateColorImage(name, dataUrl)}
                          hint={`Upload a ${name} photo`}
                          compact
                        />
                      </div>
                    </div>
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
                hint="Defaults to the front photo if left empty"
              />
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="input-base resize-none"
              />
            </Field>

            <Field label="Flags" className="sm:col-span-2">
              <div className="flex items-center gap-5 h-full pt-1">
                <Checkbox checked={form.inStock} onChange={(v) => update('inStock', v)} label="In Stock" />
                <Checkbox checked={form.isFeatured} onChange={(v) => update('isFeatured', v)} label="Featured" />
                <Checkbox checked={form.isBestSeller} onChange={(v) => update('isBestSeller', v)} label="Best Seller" />
              </div>
            </Field>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm flex-1">
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="btn-outline px-6 py-2.5 text-sm">
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
function ImageUploadField({ value, onChange, hint, compact = false }) {
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
      // Node server behind it) — fall back to an in-memory data URL so the
      // form still works, but it won't be saved as a real file on disk.
      setFileError('Could not save to disk — using a temporary in-browser preview instead.')
      const reader = new FileReader()
      reader.onload = () => onChange(reader.result)
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    readFile(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex items-center gap-3 border border-dashed rounded-lg p-2.5 cursor-pointer transition-colors ${
          dragOver ? 'border-brand bg-brand-light/40' : 'border-thread hover:border-brand/50'
        }`}
      >
        <div
          className={`${
            compact ? 'w-11 h-11' : 'w-14 h-14'
          } rounded-lg border border-thread bg-cream-dark flex items-center justify-center shrink-0 overflow-hidden`}
        >
          {value ? (
            <img
              src={value}
              alt=""
              onError={onImgError(`vss-admin-preview-${value}`, 100, 100)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus size={compact ? 15 : 18} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-soft truncate">
            {uploading
              ? 'Uploading…'
              : value
                ? 'Photo attached — click to replace'
                : hint || 'Drag & drop, or click to upload'}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs font-medium text-brand">
              <Upload size={12} /> {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload photo'}
            </span>
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {fileError && <p className="text-red-600 text-xs mt-1">{fileError}</p>}
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
        placeholder="...or paste an image path, e.g. /images/products/men/my-shirt.jpg"
        className="input-base mt-1.5 text-xs py-1.5"
      />
    </div>
  )
}
