import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shirt, ArrowRight } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import ProductCard from '../components/common/ProductCard.jsx'

// T-Shirts — a dedicated, always-up-to-date landing page pulling every
// T-Shirt product from every category (Men, Women, Boys, Girls) into one
// place. Catalog entries spell the group two ways ('T-Shirt' singular,
// 'T-Shirts' plural — both mean the same thing), so this page matches
// either. Like DailyEssentials.jsx, this reads straight from products.js —
// add a new T-Shirt to any category's catalog and it appears here
// automatically, no second list to maintain.
const CATEGORY_ORDER = ['men', 'women', 'boys', 'girls']
const CATEGORY_LABELS = { men: 'Men', women: "Women's", boys: 'Boys', girls: 'Girls' }
const isTshirtGroup = (p) => p.menuParent === 'T-Shirt' || p.menuParent === 'T-Shirts'
export default function TShirts() {
  const { products } = useProducts()
  const [activeTab, setActiveTab] = useState('all')

  const sections = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const items = products.filter((p) => p.category === cat && isTshirtGroup(p))
      return { category: cat, label: CATEGORY_LABELS[cat], items, groupSlug: items[0]?.groupSlug || 't-shirt' }
    }).filter((s) => s.items.length > 0)
  }, [products])

  const visibleSections = activeTab === 'all' ? sections : sections.filter((s) => s.category === activeTab)
  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <section className="pt-6 sm:pt-8 pb-16 md:pb-20 bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink flex items-center gap-3">
            <Shirt className="text-brand" size={26} />
            T-Shirts
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Every T-Shirt in the store, for the whole family — {totalCount} styles
          </p>
        </div>

        {/* All / Men / Women / Boys / Girls tab switcher — kept local to
            this page since it's a fixed, curated cross-category pairing,
            not the general Shop filter panel. */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              activeTab === 'all' ? 'bg-brand text-white border-brand' : 'border-thread text-ink-soft hover:border-brand hover:text-brand'
            }`}
          >
            All ({totalCount})
          </button>
          {sections.map((s) => (
            <button
              key={s.category}
              type="button"
              onClick={() => setActiveTab(s.category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === s.category ? 'bg-brand text-white border-brand' : 'border-thread text-ink-soft hover:border-brand hover:text-brand'
              }`}
            >
              {s.label} ({s.items.length})
            </button>
          ))}
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-20 text-ink-soft">Nothing to show here right now — check back soon.</div>
        ) : (
          <div className="space-y-14">
            {visibleSections.map((section) => (
              <div key={section.category}>
                <div className="flex items-center justify-between gap-4 mb-5 pb-2 border-b border-thread">
                  <h2 className="text-lg sm:text-xl font-bold text-ink">
                    {section.label} <span className="text-ink-soft font-normal text-sm">({section.items.length})</span>
                  </h2>
                  <Link
                    to={`/shop/${section.category}?type=${section.groupSlug}`}
                    className="hidden sm:flex items-center gap-1.5 shrink-0 text-brand font-mono text-xs uppercase tracking-wider hover:gap-2.5 transition-all border-b border-brand pb-0.5"
                  >
                    View all {section.label} T-Shirts <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
                  {section.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
