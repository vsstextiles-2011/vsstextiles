import { useProducts } from '../../context/ProductContext.jsx'
import { newArrivalPicks } from '../../data/products.js'
import ProductCard from '../common/ProductCard.jsx'
import SectionHeading from '../common/SectionHeading.jsx'
import Reveal from '../common/Reveal.jsx'

// Best Seller and New Arrivals shown as two separate stacked rows — same
// layout language as the Women's Innerwear showcase below it (numbered
// section header, then a bold row title above each 4-product grid, with a
// boxed red/white "View All" button under it) rather than a tab switcher.
// Best Seller is capped at 1 per category on purpose (it's meant to stay a
// tight highlight reel). New Arrivals shows every product listed in
// newArrivalPicks (data/products.js), in the EXACT order they're listed
// there — reorder/add/remove lines in that array and the homepage grid
// follows, top-left to bottom-right, no automatic re-grouping by category.
const ROWS = [
  { key: 'best-seller', label: 'Best Seller', filterKey: 'isBestSeller', perCategory: 1 },
  { key: 'new-arrivals', label: 'New Arrivals', filterKey: 'isNew', picks: newArrivalPicks },
]

// Cycle through categories (in this order) instead of whichever products
// happen to sit first in the catalog — otherwise a single category (e.g.
// Men) can fill every slot before Women/Boys/Girls ever get a turn. Each
// category gets its "round 1" pick before anyone gets a "round 2" pick, so
// the grid still reads men/women/boys/girls in order.
const CATEGORIES = ['men', 'women', 'boys', 'girls']

// Lays products out in the exact order given by `picks` (a flat list of
// exact product names, same shape as newArrivalPicks/bestSellerPicks in
// data/products.js) instead of round-robin regrouping them by category.
// Whatever order the names are listed in is the order shown in the grid.
function productsInPickOrder(products, picks, exclude) {
  const picked = []
  picks.forEach((pick) => {
    const name = typeof pick === 'string' ? pick : pick.name
    const category = typeof pick === 'string' ? undefined : pick.category
    const match = products.find(
      (p) =>
        p.name === name &&
        (category ? p.category === category : true) &&
        p.inStock !== false &&
        !exclude.has(p.id)
    )
    if (match) picked.push(match)
  })
  return picked
}

function productsPerCategory(products, filterKey, exclude, perCategory) {
  const matchesByCategory = CATEGORIES.map((category) =>
    products.filter((p) => p.category === category && p[filterKey] && p.inStock !== false && !exclude.has(p.id))
  )

  // No perCategory passed (New Arrivals) → run as many rounds as the
  // longest category needs, so every picked product gets shown instead of
  // being cut off after a fixed count.
  const rounds = perCategory ?? Math.max(...matchesByCategory.map((m) => m.length), 0)

  const picked = []
  for (let round = 0; round < rounds; round++) {
    matchesByCategory.forEach((matches) => {
      if (matches[round]) picked.push(matches[round])
    })
  }
  return picked
}

export default function TrendingTabsShowcase() {
  const { products } = useProducts()

  const usedIds = new Set()
  const rows = ROWS.map((row) => {
    const rowProducts = row.picks
      ? productsInPickOrder(products, row.picks, usedIds)
      : productsPerCategory(products, row.filterKey, usedIds, row.perCategory)
    rowProducts.forEach((p) => usedIds.add(p.id))
    return { ...row, products: rowProducts }
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
                    <ProductCard product={p} />
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
