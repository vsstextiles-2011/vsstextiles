import { useProducts } from '../../context/ProductContext.jsx'
import ProductCard from '../common/ProductCard.jsx'
import SectionHeading from '../common/SectionHeading.jsx'
import Reveal from '../common/Reveal.jsx'
import { STOREFRONT_SECTIONS, sectionProducts } from '../../utils/storefrontSections.js'

// Best Seller and New Arrivals shown as two separate stacked rows — same
// layout language as the Women's Innerwear showcase below it (numbered
// section header, then a bold row title above each 4-product grid, with a
// boxed red/white "View All" button under it) rather than a tab switcher.
//
// Both rows are fully admin-controlled from the Admin panel's own Best
// Seller / New Arrivals sidebar tabs — no code-array editing needed. Each
// reads its shared STOREFRONT_SECTIONS entry (utils/storefrontSections.js)
// and renders in exactly the order the admin manually arranged there —
// there's no automatic per-category cycling here anymore, so an admin's
// chosen order is never silently reshuffled.
const ROW_IDS = ['best-seller', 'new-arrivals']

export default function TrendingTabsShowcase() {
  const { storeProducts: products } = useProducts()

  const rows = ROW_IDS.map((id) => {
    const section = STOREFRONT_SECTIONS.find((s) => s.id === id)
    return { key: section.id, label: section.label, products: sectionProducts(section, products) }
  }).filter((row) => row.products.length > 0)

  if (rows.length === 0) return null

  return (
    <section className="section-py bg-white">
      <div className="container-app">
        <SectionHeading
          index={2}
          title="Trending Now"
          subtitle="What everyone's loving, and what just landed"
        />

        <div className="space-y-14">
          {rows.map((row) => (
            <div key={row.key}>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-5">{row.label}</h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {row.products.map((p, i) => (
                  <Reveal key={p.id} delay={i * 70}>
                    <ProductCard product={p} disableQuickAdd />
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
