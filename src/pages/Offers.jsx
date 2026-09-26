import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Tag, ArrowRight } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { OFFER_SECTIONS, sectionProducts } from '../utils/storefrontSections.js'
import ProductCard from '../components/common/ProductCard.jsx'

// A dedicated, hand-curated Offers page — separate from the normal Shop
// listing so it's not tied to each product's `discount` field or any
// filter/sort machinery. What shows here (and in what order, per category)
// is controlled live from the Admin panel's "Special Offers" tabs (one per
// category — Men/Women's/Boys/Girls), which flip each product's `isOffer`
// flag in Firestore. See OFFER_SECTIONS/sectionProducts in
// utils/storefrontSections.js — the same helpers the Admin tabs use, so
// this page and Admin can never disagree on what's eligible or the order.
export default function Offers() {
  const { storeProducts: products } = useProducts()

  const sections = useMemo(
    () =>
      OFFER_SECTIONS.map((s) => ({
        category: s.scope,
        label: s.label,
        items: sectionProducts(s, products),
      })).filter((s) => s.items.length > 0),
    [products]
  )

  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0)

  return (
    <section className="pt-6 sm:pt-8 pb-16 md:pb-20 bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink flex items-center gap-3">
            <Tag className="text-brand" size={26} />
            Special Offers
          </h1>
          <p className="text-sm text-ink-soft mt-1">Handpicked deals from every collection</p>
        </div>

        {totalCount === 0 ? (
          <div className="text-center py-20 text-ink-soft">
            No offers right now — check back soon.
          </div>
        ) : (
          <div className="space-y-14">
            {sections.map((section) => (
              <div key={section.category}>
                <div className="flex items-center justify-between gap-4 mb-5 pb-2 border-b border-thread">
                  <h2 className="text-lg sm:text-xl font-bold text-ink">
                    {section.label} <span className="text-ink-soft font-normal text-sm">({section.items.length})</span>
                  </h2>
                  <Link
                    to={`/shop/${section.category}`}
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
