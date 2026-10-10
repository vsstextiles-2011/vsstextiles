import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Flame, ArrowRight } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { STOREFRONT_SECTIONS, sectionProducts } from '../utils/storefrontSections.js'
import ProductCard from '../components/common/ProductCard.jsx'

// Full-page view of one homepage "Trending Now" row -- Best Sellers or New
// Arrivals. It reads the SAME section definition and ordering as the
// homepage row (STOREFRONT_SECTIONS / sectionProducts), so the products
// picked in Admin -> Homepage Sections -> Best Seller / New Arrivals show
// here in exactly the same order, and the two can never disagree.
const PAGES = {
  'best-seller': {
    title: 'Best Sellers',
    subtitle: 'What everyone is loving right now',
    Icon: Flame,
  },
  'new-arrivals': {
    title: 'New Arrivals',
    subtitle: 'Fresh pieces that just landed',
    Icon: Sparkles,
  },
}

export default function TrendingPage({ sectionId }) {
  const { storeProducts: products } = useProducts()
  const page = PAGES[sectionId]
  const section = STOREFRONT_SECTIONS.find((s) => s.id === sectionId)
  const items = useMemo(() => (section ? sectionProducts(section, products) : []), [section, products])
  if (!page || !section) return null
  const { Icon } = page

  return (
    <section className="pt-6 sm:pt-8 pb-16 md:pb-20 bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink flex items-center gap-3">
            <Icon className="text-brand" size={26} />
            {page.title}
            {items.length > 0 && <span className="text-ink-soft font-normal text-base">({items.length})</span>}
          </h1>
          <p className="text-sm text-ink-soft mt-1">{page.subtitle}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-ink-soft">
            Nothing here yet — check back soon.{' '}
            <Link to="/shop" className="text-brand inline-flex items-center gap-1 hover:gap-2 transition-all">
              Browse the shop <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
