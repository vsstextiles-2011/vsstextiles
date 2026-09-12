import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allProducts, homepageNightyPicks } from '../../data/products.js'
import ProductCard from '../common/ProductCard.jsx'
import Reveal from '../common/Reveal.jsx'

// Standalone "Nighty" row for the homepage — same 8-card grid + "View All"
// treatment used elsewhere on the site, kept in its own file per request so
// nothing in WomensInnerwearShowcase.jsx needs to change.
//
// Which 8 styles show up here is controlled by `homepageNightyPicks` in
// src/data/products.js (search for "Homepage \"Women's Collections\" row
// picks") — edit that list, not this file. Entries must match a product's
// exact `name` (the Nighty entries there are named like "Nighty Calandulla",
// "Nighty Full Open", etc — not just "Calandulla" / "Full Open").

export default function NightyShowcase() {
  const styles = useMemo(
    () =>
      allProducts
        .filter((p) => p.category === 'women' && p.menuParent === 'Nighty' && homepageNightyPicks.includes(p.name))
        .sort((a, b) => homepageNightyPicks.indexOf(a.name) - homepageNightyPicks.indexOf(b.name)),
    []
  )

  if (styles.length === 0) return null

  return (
    <section className="section-py bg-white">
      <div className="container-app">
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-5">Nighty</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {styles.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <ProductCard product={p} />
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
