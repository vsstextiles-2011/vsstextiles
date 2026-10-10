import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductContext.jsx'
import ProductCard from '../common/ProductCard.jsx'
import Reveal from '../common/Reveal.jsx'
import { STOREFRONT_SECTIONS, sectionProducts } from '../../utils/storefrontSections.js'

// Standalone "Nighty" row for the homepage — same 8-card grid + "View All"
// treatment used elsewhere on the site, kept in its own file per request so
// nothing in WomensInnerwearShowcase.jsx needs to change.
//
// Which styles show up here, and in what order, is fully admin-controlled:
// the Admin sidebar's own "Nighty" tab (under "Homepage Sections") lets an
// admin reorder or add/remove styles — it appears here immediately, live
// from Firestore, in that exact order. No code-array editing needed.

const NIGHTY_SECTION = STOREFRONT_SECTIONS.find((s) => s.id === 'nighty')

export default function NightyShowcase() {
  const { storeProducts: products } = useProducts()

  const styles = useMemo(() => sectionProducts(NIGHTY_SECTION, products), [products])

  if (styles.length === 0) return null

  return (
    <section className="section-py bg-white">
      <div className="container-app">
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-5">Nighty</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {styles.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <ProductCard product={p} disableQuickAdd />
            </Reveal>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            to={`/shop/women?type=${styles[0]?.groupSlug || ''}`}
            className="inline-block border-2 border-brand text-brand bg-white font-semibold text-xs uppercase tracking-wider px-8 py-3 rounded-lg hover:bg-brand hover:text-white transition-colors"
          >
            View All Nighty
          </Link>
        </div>
      </div>
    </section>
  )
}
