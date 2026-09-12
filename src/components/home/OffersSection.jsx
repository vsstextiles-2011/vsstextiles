import { Link } from 'react-router-dom'
import { Tag, ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useProducts } from '../../context/ProductContext.jsx'
import { offerPicks } from '../../data/products.js'
import ProductCard from '../common/ProductCard.jsx'
import SectionHeading from '../common/SectionHeading.jsx'
import Reveal from '../common/Reveal.jsx'

const CATEGORY_LABELS = { men: 'Men', women: "Women's", boys: 'Boys', girls: 'Girls' }
const CATEGORY_ORDER = ['men', 'women', 'boys', 'girls']

// How many products to show per category row on the homepage — the full
// list (including everything else) is still one tap away via "View All".
const PRODUCTS_PER_ROW = 4

export default function OffersSection() {
  const { products } = useProducts()

  // Reads from the same curated `offerPicks` list as the dedicated Offers
  // page (src/pages/Offers.jsx) — see src/data/products.js to add/remove
  // which products show up here.
  const offerSections = useMemo(() => {
    const byCategory = new Map()
    offerPicks.forEach((pick) => {
      const match = products.find((p) => p.category === pick.category && p.name === pick.name)
      if (!match) return
      if (!byCategory.has(pick.category)) byCategory.set(pick.category, [])
      byCategory.get(pick.category).push(match)
    })
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c] || c,
      items: byCategory.get(c).slice(0, PRODUCTS_PER_ROW),
    }))
  }, [products])

  return (
    <>
      <section className="bg-brand border-y border-brand-dark">
        <Reveal as="div" className="container-app py-14 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-5">
            <span className="hidden sm:flex w-14 h-14 border border-white/40 items-center justify-center text-white shrink-0">
              <Tag size={22} />
            </span>
            <div>
              <span className="eyebrow text-white/80 mb-2 block">Limited Time Offer</span>
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-2">
                Flat 10% Off on Your First Order
              </h2>
              <p className="text-white/90 text-sm max-w-md">
                Use code <span className="font-mono font-semibold">VSS40</span> at checkout. Valid on all men's, women's, boys' and girls' collections this week only.
              </p>
            </div>
          </div>
          <Link
            to="/offers"
            className="bg-white text-brand hover:bg-ink hover:text-white font-mono text-xs uppercase tracking-wider px-8 py-3.5 whitespace-nowrap flex items-center gap-2 transition-colors shrink-0"
          >
            Shop Now <ArrowRight size={14} />
          </Link>
        </Reveal>
      </section>

      {offerSections.length > 0 && (
        <section className="section-py bg-white">
          <div className="container-app">
            <SectionHeading
              eyebrow="Save More"
              title="Special Offers"
              subtitle="Handpicked deals from every collection — Men, Women, Boys and Girls"
              viewAllLink="/offers"
            />

            <div className="space-y-14">
              {offerSections.map((section) => (
                <div key={section.category}>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink">{section.label}</h3>
                    <Link
                      to="/offers"
                      className="hidden sm:flex items-center gap-1.5 shrink-0 text-brand font-mono text-xs uppercase tracking-wider hover:gap-2.5 transition-all border-b border-brand pb-0.5"
                    >
                      View all <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {section.items.map((p, i) => (
                      <Reveal key={p.id} delay={i * 70}>
                        <ProductCard product={p} />
                      </Reveal>
                    ))}
                  </div>

                  <div className="mt-6 text-center sm:hidden">
                    <Link
                      to="/offers"
                      className="inline-block border-2 border-brand text-brand bg-white font-semibold text-xs uppercase tracking-wider px-8 py-3 rounded-lg hover:bg-brand hover:text-white transition-colors"
                    >
                      View All {section.label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
