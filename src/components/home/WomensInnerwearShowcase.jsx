import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  allProducts,
  homepageTopsPicks,
  homepageBraPicks,
  homepagePantiesPicks,
  homepageSlipsPicks,
  homepageTightsPicks,
} from '../../data/products.js'
import ProductCard from '../common/ProductCard.jsx'
import SectionHeading from '../common/SectionHeading.jsx'
import Reveal from '../common/Reveal.jsx'
import NightyShowcase from './NightyShowcase.jsx'

// Dedicated Women's Innerwear showcase — every category shows its own row
// of styles, stacked one after another (Bras, then Panties, then Slips,
// then Tights) so the person sees all of them just by scrolling down,
// instead of clicking through tabs to reveal one category at a time.
//
// Which styles show up in each row (and in what order) is NOT configured
// here — it lives in one dedicated, clearly-commented block in
// `src/data/products.js` (search for "Homepage \"Women's Collections\" row
// picks"), right next to bestSellerPicks / newArrivalPicks. Edit the
// homepageBraPicks / homepagePantiesPicks / homepageSlipsPicks /
// homepageTightsPicks / homepageTopsPicks lists there to change what
// appears on the homepage — this file just renders whatever those lists
// say. (homepageNightyPicks lives there too, but is read by
// NightyShowcase.jsx below, not this file.)
//
// Nighty is a Women Outerwear item (not Innerwear), so it's kept out of
// this list and rendered as its own separate section right below via the
// NightyShowcase component (see src/components/home/NightyShowcase.jsx).
const INNERWEAR_CATEGORIES = [
  { label: 'Bras', menuParent: 'Bras', picks: homepageBraPicks },
  { label: 'Panties', menuParent: 'Panties', picks: homepagePantiesPicks },
  { label: 'Slips', menuParent: 'Slips', picks: homepageSlipsPicks },
  { label: 'Tights', menuParent: 'Tights', picks: homepageTightsPicks },
]

// Tops is also Women Outerwear (like Nighty) — rendered as its own section
// right below the Nighty row, using the same row/grid treatment.
const TOPS_CATEGORY = { label: 'Tops', menuParent: 'Tops', picks: homepageTopsPicks }

function buildGroup({ label, menuParent, picks = [] }) {
  return {
    label,
    styles: allProducts
      // Matched by exact product `name` (not the shared style `label`) —
      // some groups, like Tops, have many color/print variants that all
      // share one label (e.g. several prints are all labeled "Side Open
      // Top"), so matching by label would pull in every variant instead
      // of just the ones picked.
      .filter((p) => p.category === 'women' && p.menuParent === menuParent && picks.includes(p.name))
      // Show styles in the exact order they're listed in the picks array
      // (in products.js), not catalog order.
      .sort((a, b) => picks.indexOf(a.name) - picks.indexOf(b.name)),
  }
}

// One category row — heading, card grid, and the "View All" button. Shared
// by both the Innerwear rows and the standalone Nighty row below.
function CategoryRow({ group }) {
  return (
    <div>
      {/* Category row heading — no more inline View All here */}
      <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-5">{group.label}</h3>

      {/* Style cards for this category — same card + grid sizing as
          the Best Sellers section elsewhere on the site */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {group.styles.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>

      {/* View All — a boxed red/white button below the grid. Uses
          groupSlug (shared by every style in this row via their
          common menuParent, e.g. all Bras styles → 'bras') rather
          than the first card's own subCategory slug — that slug is
          unique to just that one style (e.g. 'dilse'), which was
          filtering the results down to a single product instead of
          the whole category. */}
      <div className="mt-6 text-center">
        <Link
          to={`/shop/women?type=${group.styles[0]?.groupSlug || ''}`}
          className="inline-block border-2 border-brand text-brand bg-white font-semibold text-xs uppercase tracking-wider px-8 py-3 rounded-lg hover:bg-brand hover:text-white transition-colors"
        >
          View All {group.label}
        </Link>
      </div>
    </div>
  )
}

export default function WomensInnerwearShowcase() {
  const groups = useMemo(() => INNERWEAR_CATEGORIES.map(buildGroup).filter((g) => g.styles.length > 0), [])
  const topsGroup = useMemo(() => {
    const g = buildGroup(TOPS_CATEGORY)
    return g.styles.length > 0 ? g : null
  }, [])

  if (groups.length === 0 && !topsGroup) return null

  return (
    <>
      {groups.length > 0 && (
        <section className="section-py bg-white">
          <div className="container-app">
            {/* Overall section heading, above every Innerwear row */}
            <SectionHeading title="Women's Innerwear Collections" />
            <div className="space-y-14">
              {groups.map((g) => (
                <CategoryRow key={g.label} group={g} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nighty is Women Outerwear, not Innerwear — kept as its own
          section right below so the section above stays innerwear-only.
          Rendered via the standalone NightyShowcase component (see
          src/components/home/NightyShowcase.jsx) so its product list can
          be edited there without touching this file. */}
      <NightyShowcase />

      {/* Tops — also Women Outerwear, rendered as its own section right
          below Nighty. */}
      {topsGroup && (
        <section className="section-py bg-white">
          <div className="container-app">
            <CategoryRow group={topsGroup} />
          </div>
        </section>
      )}
    </>
  )
}
