import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import LiveCount from '../components/common/LiveCount.jsx'
import { aboutTypeLabel, aboutTypeSlug } from '../utils/aboutTypes.js'
import { displayOrder, groupByStyle } from '../utils/catalogOrder.js'

const CATEGORY_LABELS = { men: 'Men', women: 'Women', boys: 'Boys', girls: 'Girls' }
const SORTS = [
  { key: 'popular', label: 'Popular' },
  { key: 'priceLow', label: 'Price: Low to High' },
  { key: 'priceHigh', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top rated' },
]

// Dedicated page for one product type from the About page's "Our product
// range" section (Tops, Nighties, T-Shirts, Bras, ...). Everything is built
// from the live catalogue, so the counts and the list follow Admin changes
// immediately - no list of types is hardcoded here.
export default function ProductType() {
  const { typeSlug } = useParams()
  const { storeProducts, isLoading } = useProducts()
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('popular')

  const items = useMemo(
    () => storeProducts.filter((p) => aboutTypeSlug(aboutTypeLabel(p)) === typeSlug),
    [storeProducts, typeSlug]
  )
  const label = items[0] ? aboutTypeLabel(items[0]) : ''

  const categoryCounts = useMemo(() => {
    const counts = {}
    items.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [items])

  const visible = useMemo(() => {
    let list = category === 'all' ? items : items.filter((p) => p.category === category)
    list = [...list].sort((a, b) => displayOrder(a) - displayOrder(b))
    if (sort === 'popular') list = groupByStyle(list)
    if (sort === 'priceLow') list.sort((a, b) => a.price - b.price)
    if (sort === 'priceHigh') list.sort((a, b) => b.price - a.price)
    if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return list
  }, [items, category, sort])

  const hero = items.find((p) => p.image)
  const fabrics = useMemo(() => [...new Set(items.map((p) => (p.fabric || '').trim()).filter(Boolean))].slice(0, 4), [items])

  if (items.length === 0) {
    return (
      <section className="section-py bg-cream min-h-[50vh]">
        <div className="container-app text-center max-w-md mx-auto">
          <h1 className="text-2xl font-display font-semibold text-ink mb-3">
            {isLoading ? 'Loading…' : 'No styles in this range yet'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-ink-soft mb-6">
              We couldn't find any products for this type. It may have been renamed or is currently unavailable.
            </p>
          )}
          <Link to="/about" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
            <ArrowLeft size={15} /> Back to About
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div>
      <section className="bg-brand-darker text-white py-14">
        <div className="container-app">
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-5" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight size={12} />
            <Link to="/about" className="hover:text-white">About</Link>
            <ChevronRight size={12} />
            <span className="text-white">{label}</span>
          </nav>
          <div className="flex items-center gap-6">
            {hero && (
              <img src={hero.image} alt={label} className="hidden sm:block w-24 h-24 object-cover rounded-lg border border-white/20" />
            )}
            <div>
              <p className="eyebrow text-gold mb-2">Our product range</p>
              <h1 className="text-3xl sm:text-4xl font-display font-semibold">{label}</h1>
              <p className="text-white/80 mt-2 text-sm">
                <LiveCount value={items.length} /> {items.length === 1 ? 'style' : 'styles'}
                {fabrics.length > 0 && <span> · {fabrics.join(', ')}</span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-6 pb-16 bg-cream min-h-[50vh]">
        <div className="container-app">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border border-thread rounded-xl bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {[['all', 'All', items.length], ...Object.keys(CATEGORY_LABELS).filter((k) => categoryCounts[k]).map((k) => [k, CATEGORY_LABELS[k], categoryCounts[k]])].map(
                ([key, text, count]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      category === key ? 'bg-brand text-white border-brand' : 'border-thread text-ink hover:border-brand'
                    }`}
                  >
                    {text} <span className="text-xs opacity-70">({count})</span>
                  </button>
                )
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-thread rounded-lg px-2 py-1.5 text-sm text-ink bg-white"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm text-ink-soft text-center mb-6">{visible.length} products</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
