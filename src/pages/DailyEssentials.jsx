import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shirt, Moon, ArrowRight } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import ProductCard from '../components/common/ProductCard.jsx'

// Daily Essentials — a dedicated, always-up-to-date landing page for
// women's everyday wear: every Tops style (menuParent 'Tops') plus every
// Nighty style (menuParent 'Nighty'), pulled straight from the same
// products.js catalog that powers the rest of the site. Nothing is
// hand-picked here (unlike Offers.jsx) — add a new Tops or Nighty entry to
// womenCatalog in data/products.js and it shows up here automatically, no
// second list to maintain.
const GROUPS = [
  { key: 'tops', menuParent: 'Tops', label: 'Tops', icon: Shirt, blurb: 'Everyday tops, co-ord sets and long tops' },
  { key: 'nighty', menuParent: 'Nighty', label: 'Nighty', icon: Moon, blurb: 'Soft, comfortable nightwear for every night' },
]

export default function DailyEssentials() {
  const { products } = useProducts()
  const [activeTab, setActiveTab] = useState('all')

  const sections = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: products.filter((p) => p.category === 'women' && p.menuParent === g.menuParent),
    })).filter((g) => g.items.length > 0)
  }, [products])

  const visibleSections = activeTab === 'all' ? sections : sections.filter((s) => s.key === activeTab)
  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <section className="pt-6 sm:pt-8 pb-16 md:pb-20 bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">Daily Essentials</h1>
          <p className="text-sm text-ink-soft mt-1">
            Everyday tops and nightwear, made for all-day (and all-night) comfort — {totalCount} styles
          </p>
        </div>

        {/* Simple tab switcher — All / Tops / Nighty. Kept local to this
            page (not the Shop filter panel) since Daily Essentials is a
            fixed, curated pairing of exactly these two groups. */}
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
              key={s.key}
              type="button"
              onClick={() => setActiveTab(s.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === s.key ? 'bg-brand text-white border-brand' : 'border-thread text-ink-soft hover:border-brand hover:text-brand'
              }`}
            >
              <s.icon size={14} /> {s.label} ({s.items.length})
            </button>
          ))}
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-20 text-ink-soft">Nothing to show here right now — check back soon.</div>
        ) : (
          <div className="space-y-14">
            {visibleSections.map((section) => (
              <div key={section.key}>
                <div className="flex items-center justify-between gap-4 mb-5 pb-2 border-b border-thread">
                  <h2 className="text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
                    <section.icon className="text-brand" size={20} />
                    {section.label} <span className="text-ink-soft font-normal text-sm">({section.items.length})</span>
                  </h2>
                  <Link
                    to={`/shop/women?type=${section.key}`}
                    className="hidden sm:flex items-center gap-1.5 shrink-0 text-brand font-mono text-xs uppercase tracking-wider hover:gap-2.5 transition-all border-b border-brand pb-0.5"
                  >
                    View all {section.label} <ArrowRight size={14} />
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
