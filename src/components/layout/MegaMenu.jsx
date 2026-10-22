import { Link } from 'react-router-dom'
import { toSlug } from '../../data/products.js'

// Innerwear is shown before Outerwear (any other heading falls in after, in
// whatever order the catalog produced it).
function headingPriority(heading) {
  if (/innerwear/i.test(heading)) return 0
  if (/outerwear/i.test(heading)) return 1
  return 2
}

export default function MegaMenu({ gender, columns }) {
  const orderedColumns = [...columns].sort((a, b) => headingPriority(a.heading) - headingPriority(b.heading))

  return (
    <div className="bg-white border border-thread shadow-lg p-8 inline-flex items-start gap-12">
      {orderedColumns.map((col) => (
        <div key={col.heading} className="w-44 shrink-0">
          {/* Highlighted heading — solid brand-red tab, and clickable: shows
              every product under this whole heading (e.g. all of Women
              Innerwear — Panties, Slips, Shorts, Bras, and every bra style)
              at once, not just one type at a time. */}
          <Link
            to={`/shop/${gender}?heading=${toSlug(col.heading)}`}
            className="block bg-brand hover:bg-brand-dark text-white text-[11px] font-mono font-semibold tracking-[0.15em] uppercase px-3 py-2 mb-4 -mx-1 transition-colors"
          >
            {col.heading}
          </Link>
          <ul className="space-y-3">
            {col.items.map((item) => (
              // Every item — whether it's a standalone product/style or a
              // shared group label like "T-Shirt"/"Nighty" — is just a plain
              // link straight through to its filtered shop listing now. No
              // hover/tap flyout box of sub-styles anymore; clicking the
              // group label shows every product grouped under it (via its
              // groupSlug/slug) in one go instead.
              <li key={item.slug}>
                <Link
                  to={`/shop/${gender}?type=${item.slug}`}
                  className="text-sm text-ink-soft hover:text-brand transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
