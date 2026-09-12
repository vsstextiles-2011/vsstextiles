import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Tag, Ruler, Palette, PackageCheck, IndianRupee, RotateCcw, Shirt, Scissors } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import { buildMegaMenu } from '../utils/menu.js'
import { toSlug } from '../data/products.js'

const categoryLabels = { men: 'Men', women: "Women's", boys: 'Boys', girls: 'Girls' }
const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL', '3XL']

// Persist the shopper's facet selections across a visit to a Product page
// and back, so returning from a product opened out of a filtered list still
// shows that same filtered list instead of resetting to everything. Scoped
// by category/type/heading/search/offers so switching to a genuinely
// different listing still starts fresh.
const SHOP_FILTERS_STORAGE_KEY = 'vss-shop-filters'

function shopScopeKey(category, type, headingParam, search) {
  return JSON.stringify([category || '', type || '', headingParam || '', search || ''])
}

function loadStoredShopFilters() {
  try {
    const raw = sessionStorage.getItem(SHOP_FILTERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveStoredShopFilters(state) {
  try {
    sessionStorage.setItem(SHOP_FILTERS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — filters just won't persist
  }
}

// Products under a shared `menuParent` (e.g. Men's T-Shirts: MT-911,
// MTC-901, MTC-902, Rolex — all separate model codes but the same style of
// garment) collapse into one Product Type row for that parent group ("T-
// Shirts (4)") instead of one row per code, so the panel always matches
// exactly what the mega menu shows. Tops is the one exception: its shared
// `menuParent` groups together genuinely different garment styles (Anarkali,
// Cord Set, Georgette Top, Prince Cut Long Top, Side Open Top, Umbrella Cut
// Top, Vertican Cord Top, Vertican Open Top) rather than model-number
// variants of one style, so collapsing it the same way hid that variety
// behind a single "Tops (126)" row. Tops products key off their own
// per-style label instead, giving the panel one checkable row per style
// (e.g. "Georgette Top (21)") so shoppers can jump straight to the look
// they want. Only products with no menuParent at all (e.g. Trunks) keep
// using their own subCategory.
function typeKeyFor(p) {
  if (p.menuParent === 'Tops') return toSlug(p.subCategoryLabel)
  if (p.menuParent) return p.groupSlug
  return p.subCategory
}

function typeOptionsFor(list) {
  const counts = new Map()
  list.forEach((p) => {
    const key = typeKeyFor(p)
    const isTopsStyle = p.menuParent === 'Tops'
    const label = isTopsStyle ? p.subCategoryLabel : p.menuParent || p.subCategoryLabel
    const entry = counts.get(key) || { label, menuParent: isTopsStyle ? undefined : p.menuParent, count: 0 }
    entry.count += 1
    counts.set(key, entry)
  })
  const options = [...counts.entries()].map(([slug, v]) => ({ slug, ...v }))

  // Some styles (e.g. "Turbo") are reused across multiple product groups —
  // Track Pant Turbo, Shorts Turbo — and share the same short display label.
  // Whenever more than one group in the current list shares a label,
  // disambiguate by prefixing the parent group name, so the panel reads
  // "Track Pant Turbo" / "Shorts Turbo" instead of two identical "Turbo" rows.
  const labelCounts = new Map()
  options.forEach((o) => labelCounts.set(o.label, (labelCounts.get(o.label) || 0) + 1))

  return options
    .map((o) => ({
      slug: o.slug,
      count: o.count,
      label: labelCounts.get(o.label) > 1 && o.menuParent ? `${o.menuParent} ${o.label}` : o.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export default function Shop() {
  const { products: allProducts } = useProducts()
  const { category } = useParams()
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const headingParam = searchParams.get('heading') || ''

  const scopeKey = useMemo(
    () => shopScopeKey(category, type, headingParam, search),
    [category, type, headingParam, search]
  )

  // Read once, at first mount, whether we have a saved filter state for this
  // exact scope (e.g. the shopper came back from a Product page rather than
  // arriving at this listing fresh) so the initial state below can restore
  // it instead of defaulting.
  const restoredRef = useRef(undefined)
  if (restoredRef.current === undefined) {
    const stored = loadStoredShopFilters()
    restoredRef.current = stored && stored.scopeKey === scopeKey ? stored : null
  }
  const restored = restoredRef.current

  const [sort, setSort] = useState(() => restored?.sort ?? 'popular')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Facet selections — all multi-select, applied on top of the category
  // that came from the URL. `type` from the nav link becomes the *initial*
  // Product Type selection rather than a hard lock, so the panel still
  // shows every sibling type (e.g. landing on "Bras" still lists
  // Panties/Slips/Shorts as choosable, not just Bras) and checking another
  // one works instead of returning zero results.
  const [selectedTypes, setSelectedTypes] = useState(
    () => new Set(restored?.selectedTypes ?? (type ? [type] : []))
  )
  // Whether the *current* type selection came from the user actually
  // checking something in the Product Type panel, as opposed to just being
  // pre-seeded from the nav link that got them here. Landing on "Trunks"
  // via the menu should show its results without the Filter badge/chip
  // lighting up as if a filter had been manually applied — that only
  // happens once the user actually touches the panel themselves.
  const [typeFilterManual, setTypeFilterManual] = useState(() => restored?.typeFilterManual ?? false)
  const [selectedSizes, setSelectedSizes] = useState(() => new Set(restored?.selectedSizes ?? []))
  const [selectedColors, setSelectedColors] = useState(() => new Set(restored?.selectedColors ?? []))
  const [selectedAvailability, setSelectedAvailability] = useState(() => new Set(restored?.selectedAvailability ?? []))
  const [minPrice, setMinPrice] = useState(() => restored?.minPrice ?? null)
  const [maxPrice, setMaxPrice] = useState(() => restored?.maxPrice ?? null)
  // Nighty-only facets — populated from `fabric`/`style` on each nighty
  // catalog entry.
  const [selectedFabrics, setSelectedFabrics] = useState(() => new Set(restored?.selectedFabrics ?? []))
  const [selectedStyles, setSelectedStyles] = useState(() => new Set(restored?.selectedStyles ?? []))

  // If we arrived scoped to a whole heading (e.g. clicking "WOMEN INNERWEAR"
  // itself in the mega menu) or a specific type within one (e.g. "Bras"),
  // resolve the real menuHeading string so the results — and the Product
  // Type panel — cover every product under that heading, not just one type.
  const entryHeading = useMemo(() => {
    if (headingParam) {
      const match = allProducts.find(
        (p) => (!category || p.category === category) && p.menuHeading && toSlug(p.menuHeading) === headingParam
      )
      return match?.menuHeading || null
    }
    if (!type) return null
    const match = allProducts.find((p) => (!category || p.category === category) && (p.subCategory === type || p.groupSlug === type))
    return match?.menuHeading || null
  }, [headingParam, type, category, allProducts])

  // Women's Tops sits under the same broad "Women Outerwear" heading as
  // several unrelated groups (Nighty, Full Pant, Kurta Sets, etc.), unlike
  // the innerwear groups (Bras/Panties/Slips/Shorts) which are deliberately
  // shown as siblings under "Women Innerwear". So landing specifically on
  // Tops via its nav link must scope to just the Tops group instead of the
  // whole heading — otherwise the Product Type panel fills up with styles
  // (like Nighty prints) that have nothing to do with Tops.
  const isTopsEntry = useMemo(() => {
    if (headingParam || !type) return false
    const match = allProducts.find((p) => (!category || p.category === category) && p.groupSlug === type)
    return match?.menuParent === 'Tops'
  }, [headingParam, type, category, allProducts])

  // Base list scoped by URL (category/search/offers, and — when we arrived
  // via a heading or a specific type — that heading too) — used both to
  // compute facet options/counts AND, when no specific type is selected, as
  // the actual results (so clicking a heading shows everything under it).
  const baseList = useMemo(() => {
    // Out-of-stock products stay visible on the storefront (with a clear
    // "Out of Stock" label on the card) rather than disappearing entirely —
    // that way shoppers can still add them to their wishlist and come back
    // once restocked. They're only excluded from the curated homepage
    // rails (Featured/Best Seller/New Arrival) via ProductContext.
    let list = allProducts
    if (category) list = list.filter((p) => p.category === category)
    if (isTopsEntry) list = list.filter((p) => p.menuParent === 'Tops')
    else if (entryHeading) list = list.filter((p) => p.menuHeading === entryHeading)
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [category, entryHeading, isTopsEntry, search])

  const priceBounds = useMemo(() => {
    if (baseList.length === 0) return { min: 0, max: 1000 }
    const prices = baseList.map((p) => p.price)
    return { min: Math.floor(Math.min(...prices) / 10) * 10, max: Math.ceil(Math.max(...prices) / 10) * 10 }
  }, [baseList])

  // Every type key that actually appears as a checkable option for the
  // current scope (see typeKeyFor/typeOptionsFor above) — used to tell a
  // legitimate individual pre-selection apart from a group-only seed like
  // 'tops', which never matches any single product's own type key.
  const validTypeKeys = useMemo(() => new Set(baseList.map(typeKeyFor)), [baseList])

  // Re-seed (rather than just clear) whenever the URL-driven scope changes,
  // so clicking a different nav link pre-selects its type instead of either
  // silently keeping the old one or losing the new one. Clicking a whole
  // heading (no specific type) leaves selectedTypes empty on purpose, so
  // every product under that heading shows rather than just one type.
  //
  // The very first run is skipped: the state above is already correctly
  // seeded (from sessionStorage when returning to the same scope, or
  // defaulted otherwise) by the lazy useState initializers, so re-running
  // this on mount would only throw that away.
  const isFirstScopeRun = useRef(true)
  useEffect(() => {
    if (isFirstScopeRun.current) {
      isFirstScopeRun.current = false
      return
    }
    const stored = loadStoredShopFilters()
    if (stored && stored.scopeKey === scopeKey) {
      setSort(stored.sort ?? 'popular')
      setSelectedTypes(new Set(stored.selectedTypes ?? []))
      setTypeFilterManual(stored.typeFilterManual ?? false)
      setSelectedSizes(new Set(stored.selectedSizes ?? []))
      setSelectedColors(new Set(stored.selectedColors ?? []))
      setSelectedAvailability(new Set(stored.selectedAvailability ?? []))
      setSelectedFabrics(new Set(stored.selectedFabrics ?? []))
      setSelectedStyles(new Set(stored.selectedStyles ?? []))
      setMinPrice(stored.minPrice ?? null)
      setMaxPrice(stored.maxPrice ?? null)
      return
    }
    setSelectedTypes(type ? new Set([type]) : new Set())
    setTypeFilterManual(false)
    setSelectedSizes(new Set())
    setSelectedColors(new Set())
    setSelectedAvailability(new Set())
    setSelectedFabrics(new Set())
    setSelectedStyles(new Set())
    setMinPrice(null)
    setMaxPrice(null)
  }, [scopeKey])

  // Keep the saved filter state in sync with whatever the shopper currently
  // has selected, so navigating to a Product page and back (or a fresh page
  // load within the same tab) can restore exactly this.
  useEffect(() => {
    saveStoredShopFilters({
      scopeKey,
      sort,
      selectedTypes: [...selectedTypes],
      typeFilterManual,
      selectedSizes: [...selectedSizes],
      selectedColors: [...selectedColors],
      selectedAvailability: [...selectedAvailability],
      selectedFabrics: [...selectedFabrics],
      selectedStyles: [...selectedStyles],
      minPrice,
      maxPrice,
    })
  }, [
    scopeKey,
    sort,
    selectedTypes,
    typeFilterManual,
    selectedSizes,
    selectedColors,
    selectedAvailability,
    selectedFabrics,
    selectedStyles,
    minPrice,
    maxPrice,
  ])

  const effectiveMinPrice = minPrice ?? priceBounds.min
  const effectiveMaxPrice = maxPrice ?? priceBounds.max

  function toggleType(slug) {
    setTypeFilterManual(true)
    setSelectedTypes((prev) => toggleInSet(prev, slug))
  }

  // Once the user manually checks/unchecks something, a leftover group-only
  // seed (e.g. 'tops', pre-selected just so landing on the group showed
  // everything in it) must stop acting as a blanket "match everything" —
  // otherwise checking a specific option like Anarkali still shows every
  // Tops product because 'tops' never got removed from the set. A seed that
  // is itself a real, checkable type (landing on one specific item directly)
  // keeps behaving as a normal selection, so picking another one still adds
  // to it instead of replacing it.
  const effectiveSelectedTypes = useMemo(() => {
    if (!typeFilterManual || !type || validTypeKeys.has(type) || !selectedTypes.has(type)) return selectedTypes
    const next = new Set(selectedTypes)
    next.delete(type)
    return next
  }, [selectedTypes, typeFilterManual, type, validTypeKeys])

  const products = useMemo(() => {
    let list = baseList.filter((p) => p.price >= effectiveMinPrice && p.price <= effectiveMaxPrice)
    if (effectiveSelectedTypes.size > 0) {
      list = list.filter((p) => effectiveSelectedTypes.has(typeKeyFor(p)) || effectiveSelectedTypes.has(p.groupSlug))
    }
    if (selectedSizes.size > 0) list = list.filter((p) => p.sizes.some((s) => selectedSizes.has(s)))
    if (selectedColors.size > 0) list = list.filter((p) => p.colors.some((c) => selectedColors.has(c.name)))
    if (selectedAvailability.size > 0) {
      list = list.filter((p) => selectedAvailability.has(p.inStock ? 'in' : 'out'))
    }
    if (selectedFabrics.size > 0) list = list.filter((p) => selectedFabrics.has(p.fabric))
    if (selectedStyles.size > 0) list = list.filter((p) => selectedStyles.has(p.style))

    list = [...list]
    if (sort === 'priceLow') list.sort((a, b) => a.price - b.price)
    if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price)
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'discount') list.sort((a, b) => b.discount - a.discount)

    return list
  }, [
    baseList,
    effectiveMinPrice,
    effectiveMaxPrice,
    effectiveSelectedTypes,
    selectedSizes,
    selectedColors,
    selectedAvailability,
    selectedFabrics,
    selectedStyles,
    sort,
  ])

  // True once every currently-visible product is a Nighty — this is what
  // gates the Nighty-only quick-filter row and Fabric/Style facets, so they
  // never show up while browsing other Women Outerwear types that happen to
  // share the same menuHeading.
  const isNightyView = products.length > 0 && products.every((p) => p.menuParent === 'Nighty')
  const nightyBaseList = useMemo(() => baseList.filter((p) => p.menuParent === 'Nighty'), [baseList])

  const pageTitle = category ? `${categoryLabels[category] || category} Collection` : 'All Products'

  // Only count a "type" selection toward the badge/chips if it's actually a
  // real, checkable option in the Product Type panel (i.e. an individual
  // style's own subCategory slug, like 'dilse'). Arriving via a group link
  // (e.g. "View All Bras") seeds `selectedTypes` with the *group* slug
  // ('bras') purely to narrow the results — that slug never appears as a
  // checkbox, so it shouldn't be counted as an active filter either, or the
  // badge reads "1" while the panel shows nothing checked.
  const activeTypeCount = useMemo(
    () => (typeFilterManual ? typeOptionsFor(baseList).filter((o) => selectedTypes.has(o.slug)).length : 0),
    [baseList, selectedTypes, typeFilterManual]
  )

  const isPriceFiltered =
    (minPrice !== null && minPrice > priceBounds.min) || (maxPrice !== null && maxPrice < priceBounds.max)

  const activeFilterCount =
    activeTypeCount +
    selectedSizes.size +
    selectedColors.size +
    selectedAvailability.size +
    selectedFabrics.size +
    selectedStyles.size +
    (isPriceFiltered ? 1 : 0)

  const activeChips = useMemo(() => {
    const chips = []
    if (typeFilterManual) {
      typeOptionsFor(baseList).forEach((o) => {
        if (selectedTypes.has(o.slug)) chips.push({ key: `type-${o.slug}`, label: o.label, onRemove: () => toggleType(o.slug) })
      })
    }
    selectedSizes.forEach((s) => chips.push({ key: `size-${s}`, label: `Size ${s}`, onRemove: () => setSelectedSizes((p) => toggleInSet(p, s)) }))
    selectedColors.forEach((c) => chips.push({ key: `color-${c}`, label: c, onRemove: () => setSelectedColors((p) => toggleInSet(p, c)) }))
    selectedAvailability.forEach((a) =>
      chips.push({ key: `avail-${a}`, label: a === 'in' ? 'In stock' : 'Out of stock', onRemove: () => setSelectedAvailability((p) => toggleInSet(p, a)) })
    )
    selectedFabrics.forEach((f) => chips.push({ key: `fabric-${f}`, label: f, onRemove: () => setSelectedFabrics((p) => toggleInSet(p, f)) }))
    selectedStyles.forEach((s) => chips.push({ key: `style-${s}`, label: s, onRemove: () => setSelectedStyles((p) => toggleInSet(p, s)) }))
    if (isPriceFiltered) {
      chips.push({
        key: 'price',
        label: `₹${minPrice ?? priceBounds.min} – ₹${maxPrice ?? priceBounds.max}`,
        onRemove: () => {
          setMinPrice(null)
          setMaxPrice(null)
        },
      })
    }
    return chips
  }, [
    baseList,
    selectedTypes,
    typeFilterManual,
    selectedSizes,
    selectedColors,
    selectedAvailability,
    selectedFabrics,
    selectedStyles,
    isPriceFiltered,
    minPrice,
    maxPrice,
    priceBounds.min,
    priceBounds.max,
  ])

  function clearAllFilters() {
    setSelectedTypes(new Set())
    setTypeFilterManual(false)
    setSelectedSizes(new Set())
    setSelectedColors(new Set())
    setSelectedAvailability(new Set())
    setSelectedFabrics(new Set())
    setSelectedStyles(new Set())
    setMinPrice(null)
    setMaxPrice(null)
  }

  return (
    <section className="pt-6 sm:pt-8 pb-16 md:pb-20 bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">{pageTitle}</h1>
          {search && <p className="text-sm text-ink-soft mt-1">Search results for "{search}"</p>}
        </div>

        {/* Toolbar — Filter on the left, live result count centered, sort on the
            right, all in one bordered bar. */}
        <div className="flex items-center justify-between gap-4 mb-6 border border-thread rounded-xl bg-white px-4 py-3">
          {/* Filter trigger — the panel floats over the products section, it doesn't push the layout */}
          <div
            className="relative shrink-0"
            onMouseEnter={() => setFiltersOpen(true)}
            onMouseLeave={() => setFiltersOpen(false)}
          >
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`relative flex items-center gap-1.5 border rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                filtersOpen ? 'border-brand text-brand bg-brand-light' : 'border-thread text-ink hover:border-brand'
              }`}
            >
              <SlidersHorizontal size={15} /> Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Always mounted so opacity/translate can transition smoothly
                instead of the panel popping in and out abruptly. Anchored to
                the left now that the trigger itself lives on the left. */}
            <div
              className={`absolute left-0 top-full pt-2 z-40 transition-all duration-200 ease-out ${
                filtersOpen
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <FilterPanel
                category={category}
                type={type}
                baseList={baseList}
                priceBounds={priceBounds}
                minPrice={effectiveMinPrice}
                setMinPrice={setMinPrice}
                maxPrice={effectiveMaxPrice}
                setMaxPrice={setMaxPrice}
                selectedTypes={selectedTypes}
                setSelectedTypes={toggleType}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                selectedAvailability={selectedAvailability}
                setSelectedAvailability={setSelectedAvailability}
                selectedFabrics={selectedFabrics}
                setSelectedFabrics={setSelectedFabrics}
                selectedStyles={selectedStyles}
                setSelectedStyles={setSelectedStyles}
                isNightyView={isNightyView}
                nightyBaseList={nightyBaseList}
                activeFilterCount={activeFilterCount}
                resultCount={products.length}
                onClose={() => setFiltersOpen(false)}
                onClearAll={clearAllFilters}
              />
            </div>
          </div>

          <p className="hidden sm:block flex-1 text-center text-sm text-ink-soft">{products.length} products</p>
        </div>

        {/* Same count, shown below the bar on narrow screens where it's hidden above */}
        <p className="sm:hidden text-sm text-ink-soft text-center -mt-3 mb-6">{products.length} products</p>

        {/* Active filter chips — quick visual summary + one-tap removal */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className="flex items-center gap-1.5 bg-white border border-brand-soft text-ink text-xs font-medium pl-3 pr-2 py-1.5 rounded-full hover:border-brand transition-colors"
              >
                {chip.label}
                <X size={12} className="text-ink-soft/60" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline pl-1"
            >
              <RotateCcw size={12} /> Clear all
            </button>
          </div>
        )}

        <div>
          {products.length === 0 ? (
            <div className="text-center py-20 text-ink-soft">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} previewColor={selectedColors.size === 1 ? [...selectedColors][0] : null} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function toggleInSet(set, value) {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function FilterSection({ title, icon: Icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-thread py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft tracking-[0.15em] uppercase group-hover:text-brand transition-colors">
          {Icon && <Icon size={13} />}
          {title}
        </span>
        <ChevronDown size={15} className={`text-ink-soft/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`collapse-rows ${open ? 'is-open' : ''}`}>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

// Dual-handle price range slider — two native range inputs stacked on the
// same track (see .range-slider in index.css for the thumb/track styling
// that makes the overlap work), with a highlighted bar drawn between the
// two thumbs to show the selected span at a glance.
function PriceRangeSlider({ bounds, min, max, onMinChange, onMaxChange, step = 10 }) {
  const span = Math.max(bounds.max - bounds.min, 1)
  const minPct = ((min - bounds.min) / span) * 100
  const maxPct = ((max - bounds.min) / span) * 100
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-ink mb-3">
        <span>₹{min.toFixed(2)}</span>
        <span>₹{max.toFixed(2)}</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className="absolute left-0 right-0 h-[2px] bg-thread rounded-full" />
        <div
          className="absolute h-[2px] bg-brand rounded-full"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={min}
          onChange={(e) => onMinChange(Math.min(Number(e.target.value), max - step))}
          className="range-slider absolute w-full h-4 m-0"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={max}
          onChange={(e) => onMaxChange(Math.max(Number(e.target.value), min + step))}
          className="range-slider absolute w-full h-4 m-0"
        />
      </div>
    </div>
  )
}

function FilterPanel({
  category,
  type,
  baseList,
  priceBounds,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedTypes,
  setSelectedTypes,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  selectedAvailability,
  setSelectedAvailability,
  selectedFabrics,
  setSelectedFabrics,
  selectedStyles,
  setSelectedStyles,
  isNightyView,
  nightyBaseList,
  activeFilterCount,
  resultCount,
  onClose,
  onClearAll,
}) {
  // When we're already inside a specific collection (e.g. /shop/men), only that
  // category is relevant — no point showing Men/Women/Boys/Girls side by side.
  const categoryKeys = category ? [category] : Object.keys(categoryLabels)
  const [openCat, setOpenCat] = useState(category || null)

  // Nav structure derived live from the full catalog (not just baseList,
  // which is already scoped to the current category/type) so every
  // category's subcategory list is available here regardless of what's
  // currently being viewed.
  const { products: allProductsForMenu } = useProducts()
  const megaMenu = useMemo(() => buildMegaMenu(allProductsForMenu), [allProductsForMenu])

  // Facet options derived from the current (URL-scoped) product list, each with
  // a live count — e.g. "T-Shirt (12)".
  const typeOptions = useMemo(() => typeOptionsFor(baseList), [baseList])


  const sizeOptions = useMemo(() => {
    const counts = new Map()
    baseList.forEach((p) => p.sizes.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)))
    return SIZE_ORDER.filter((s) => counts.has(s)).map((s) => ({ size: s, count: counts.get(s) }))
  }, [baseList])

  const colorOptions = useMemo(() => {
    const counts = new Map()
    baseList.forEach((p) =>
      p.colors.forEach((c) => {
        const entry = counts.get(c.name) || { hex: c.hex, count: 0 }
        entry.count += 1
        counts.set(c.name, entry)
      })
    )
    return [...counts.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count)
  }, [baseList])

  const fabricOptions = useMemo(() => {
    const counts = new Map()
    nightyBaseList.forEach((p) => p.fabric && counts.set(p.fabric, (counts.get(p.fabric) || 0) + 1))
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [nightyBaseList])

  const styleOptions = useMemo(() => {
    const counts = new Map()
    nightyBaseList.forEach((p) => p.style && counts.set(p.style, (counts.get(p.style) || 0) + 1))
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [nightyBaseList])

  const availabilityOptions = useMemo(() => {
    const inStock = baseList.filter((p) => p.inStock).length
    const outOfStock = baseList.length - inStock
    return [
      { key: 'in', label: 'In stock', count: inStock },
      { key: 'out', label: 'Out of stock', count: outOfStock },
    ].filter((opt) => opt.count > 0)
  }, [baseList])

  return (
    <div className="w-80 max-w-[85vw] max-h-[75vh] flex flex-col bg-white rounded-2xl shadow-xl border border-thread">
      <div className="flex items-center justify-between px-6 py-5">
        <h3 className="text-lg font-display font-semibold text-ink">Filter</h3>
        <button onClick={onClose} aria-label="Close filters" className="text-ink-soft/60 hover:text-brand transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="stitch-divider mx-6" />

      <div className="px-6 overflow-y-auto flex-1">
        {!category && (
          <FilterSection title="Category" icon={Tag}>
            <div className="flex flex-col rounded-xl border border-thread overflow-hidden">
              {categoryKeys.map((key) => {
                const label = categoryLabels[key]
                const isOpen = openCat === key
                const columns = megaMenu[key] || []
                return (
                  <div key={key} className="border-b border-thread last:border-b-0">
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-brand-light hover:text-brand transition-colors">
                      <Link to={`/shop/${key}`} className="flex-1">
                        {label}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Toggle ${label} categories`}
                        onClick={() => setOpenCat((prev) => (prev === key ? null : key))}
                        className="p-1 -m-1"
                      >
                        <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="bg-cream-dark px-4 py-3 space-y-4">
                        {columns.map((col) => (
                          <div key={col.heading}>
                            <p className="text-[10px] font-semibold text-ink-soft/60 tracking-[0.12em] uppercase mb-1.5">
                              {col.heading}
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {col.items.map((item) => (
                                <Link
                                  key={item.slug}
                                  to={`/shop/${key}?type=${item.slug}`}
                                  className="text-sm leading-tight text-ink-soft hover:text-brand transition-colors"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </FilterSection>
        )}

        {isNightyView ? (
          <>
            {/* Same order and open-by-default sections as every other
                collection — Price, Product Type, Size, Availability all
                open, Color closed — with the two Nighty-only facets
                (Brand → Style, Occasion → Fabric) appended afterwards,
                closed by default like Color. Previously this branch used
                its own order (Availability open first, everything else
                including Price/Product Type/Size collapsed), which made
                the Women/Nighty filter panel behave inconsistently with
                Men/Boys/Girls and the rest of Women. */}
            <FilterSection title="Price" icon={IndianRupee}>
              <PriceRangeSlider
                bounds={priceBounds}
                min={minPrice}
                max={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
              />
            </FilterSection>

            {typeOptions.length > 0 && (
              <FilterSection title="Product Type" icon={Tag}>
                <div className="flex flex-col gap-1">
                  {typeOptions.map((opt) => (
                    <label
                      key={opt.slug}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedTypes.has(opt.slug)}
                          onChange={() => setSelectedTypes(opt.slug)}
                        />
                        {opt.label}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {sizeOptions.length > 0 && (
              <FilterSection title="Size" icon={Ruler}>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((opt) => {
                    const active = selectedSizes.has(opt.size)
                    return (
                      <button
                        key={opt.size}
                        type="button"
                        title={`${opt.count} product${opt.count === 1 ? '' : 's'}`}
                        onClick={() => setSelectedSizes((prev) => toggleInSet(prev, opt.size))}
                        className={`min-w-[2.75rem] h-9 px-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                          active ? 'bg-brand text-white border-brand scale-105' : 'border-thread text-ink hover:border-brand hover:scale-105'
                        }`}
                      >
                        {opt.size}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>
            )}

            {availabilityOptions.length > 0 && (
              <FilterSection title="Availability" icon={PackageCheck}>
                <div className="flex flex-col gap-1">
                  {availabilityOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedAvailability.has(opt.key)}
                          onChange={() => setSelectedAvailability((prev) => toggleInSet(prev, opt.key))}
                        />
                        {opt.label}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {colorOptions.length > 0 && (
              <FilterSection title="Color" icon={Palette} defaultOpen={false}>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((opt) => {
                    const active = selectedColors.has(opt.name)
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setSelectedColors((prev) => toggleInSet(prev, opt.name))}
                        className="flex flex-col items-center gap-1 w-14"
                      >
                        <span
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            active ? 'border-brand scale-110' : 'border-thread hover:scale-105'
                          }`}
                          style={{ backgroundColor: opt.hex }}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-white shadow" />}
                        </span>
                        {/* Color name is always visible (not just on hover) so
                            tapping a swatch on touch devices still shows what
                            was picked, not only a bare dot + count. */}
                        <span className={`text-[10px] text-center leading-tight ${active ? 'text-brand font-semibold' : 'text-ink-soft'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[9px] text-ink-soft/60">({opt.count})</span>
                      </button>
                    )
                  })}
                </div>
              </FilterSection>
            )}

            {styleOptions.length > 0 && (
              <FilterSection title="Brand" icon={Scissors} defaultOpen={false}>
                <div className="flex flex-col gap-1">
                  {styleOptions.map((opt) => (
                    <label
                      key={opt.name}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedStyles.has(opt.name)}
                          onChange={() => setSelectedStyles((prev) => toggleInSet(prev, opt.name))}
                        />
                        {opt.name}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {fabricOptions.length > 0 && (
              <FilterSection title="Occasion" icon={Shirt} defaultOpen={false}>
                <div className="flex flex-col gap-1">
                  {fabricOptions.map((opt) => (
                    <label
                      key={opt.name}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedFabrics.has(opt.name)}
                          onChange={() => setSelectedFabrics((prev) => toggleInSet(prev, opt.name))}
                        />
                        {opt.name}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}
          </>
        ) : (
          <>
            <FilterSection title="Price" icon={IndianRupee}>
              <PriceRangeSlider
                bounds={priceBounds}
                min={minPrice}
                max={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
              />
            </FilterSection>

            {typeOptions.length > 0 && (
              <FilterSection title="Product Type" icon={Tag}>
                <div className="flex flex-col gap-1">
                  {typeOptions.map((opt) => (
                    <label
                      key={opt.slug}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedTypes.has(opt.slug)}
                          onChange={() => setSelectedTypes(opt.slug)}
                        />
                        {opt.label}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {sizeOptions.length > 0 && (
              <FilterSection title="Size" icon={Ruler}>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((opt) => {
                    const active = selectedSizes.has(opt.size)
                    return (
                      <button
                        key={opt.size}
                        type="button"
                        title={`${opt.count} product${opt.count === 1 ? '' : 's'}`}
                        onClick={() => setSelectedSizes((prev) => toggleInSet(prev, opt.size))}
                        className={`min-w-[2.75rem] h-9 px-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                          active ? 'bg-brand text-white border-brand scale-105' : 'border-thread text-ink hover:border-brand hover:scale-105'
                        }`}
                      >
                        {opt.size}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>
            )}

            {availabilityOptions.length > 0 && (
              <FilterSection title="Availability" icon={PackageCheck}>
                <div className="flex flex-col gap-1">
                  {availabilityOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center justify-between gap-2.5 cursor-pointer text-sm text-ink rounded-lg px-2 py-1.5 hover:bg-cream-dark transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4"
                          checked={selectedAvailability.has(opt.key)}
                          onChange={() => setSelectedAvailability((prev) => toggleInSet(prev, opt.key))}
                        />
                        {opt.label}
                      </span>
                      <span className="text-xs text-ink-soft/60">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {colorOptions.length > 0 && (
              <FilterSection title="Color" icon={Palette} defaultOpen={false}>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((opt) => {
                    const active = selectedColors.has(opt.name)
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setSelectedColors((prev) => toggleInSet(prev, opt.name))}
                        className="flex flex-col items-center gap-1 w-14"
                      >
                        <span
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            active ? 'border-brand scale-110' : 'border-thread hover:scale-105'
                          }`}
                          style={{ backgroundColor: opt.hex }}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-white shadow" />}
                        </span>
                        {/* Color name is always visible (not just on hover) so
                            tapping a swatch on touch devices still shows what
                            was picked, not only a bare dot + count. */}
                        <span className={`text-[10px] text-center leading-tight ${active ? 'text-brand font-semibold' : 'text-ink-soft'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[9px] text-ink-soft/60">({opt.count})</span>
                      </button>
                    )
                  })}
                </div>
              </FilterSection>
            )}
          </>
        )}
      </div>

      <div className="px-6 py-5 border-t border-thread flex items-center gap-3">
        <button
          onClick={onClearAll}
          disabled={activeFilterCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand transition-colors disabled:opacity-30 disabled:hover:text-ink-soft"
        >
          <RotateCcw size={13} /> Clear
        </button>
        <button onClick={onClose} className="btn-primary flex-1 py-2.5 text-sm">
          Show {resultCount} result{resultCount === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
