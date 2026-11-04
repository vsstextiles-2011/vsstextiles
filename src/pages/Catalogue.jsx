import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Download, ExternalLink, FileText, Lock, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useProducts } from '../context/ProductContext.jsx'
import { aboutProductTypes } from '../utils/aboutTypes.js'
import { useCatalogueSettings, useCatalogueAccess, isLiveItem, catalogueFileName, formatUpdated } from '../utils/catalogue.js'

// Product catalogues page (/catalogue): one ready-made PDF per product, for the
// marketing team and customers to view or download. Managed in Admin -> Catalogue.
export default function Catalogue() {
  const { user, loading: authLoading } = useAuth()
  const { storeProducts } = useProducts()
  const access = useCatalogueAccess()
  const { settings, loaded } = useCatalogueSettings(access.allowed)
  const [search, setSearch] = useState('')

  const typeImages = useMemo(() => new Map(aboutProductTypes(storeProducts).map((t) => [t.label, t.image])), [storeProducts])
  const live = settings.items.filter(isLiveItem)
  const shown = live.filter((i) => {
    const q = search.trim().toLowerCase()
    return !q || `${i.title} ${i.subtitle}`.toLowerCase().includes(q)
  })
  const signedIn = !!user && !user.isAnonymous

  if (authLoading || access.checking || (access.allowed && !loaded)) {
    return <div className="section-py text-center text-ink-soft text-sm">Loading catalogues...</div>
  }

  // Only admins and the staff an admin listed (email + phone) may open this page.
  if (!access.allowed) {
    return (
      <div className="section-py bg-cream">
        <div className="container-app max-w-xl text-center">
          <Lock size={36} className="mx-auto text-brand mb-3" />
          <h1 className="text-2xl font-display font-semibold text-ink mb-2">Staff only</h1>
          <p className="text-ink-soft text-sm mb-6">
            The product catalogue is available only to VSS Textiles staff. If you are staff, sign in with the email address
            registered with us and make sure the same mobile number is saved in your profile.
          </p>
          {signedIn ? (
            <Link to="/profile" className="btn-primary px-6 py-2.5 text-sm inline-block">Open my profile</Link>
          ) : (
            <Link to="/account" state={{ from: '/catalogue' }} className="btn-primary px-6 py-2.5 text-sm inline-block">Sign in</Link>
          )}
        </div>
      </div>
    )
  }

  if (!settings.enabled) {
    return (
      <div className="section-py bg-cream">
        <div className="container-app max-w-xl text-center">
          <BookOpen size={36} className="mx-auto text-brand mb-3" />
          <h1 className="text-2xl font-display font-semibold text-ink mb-2">Catalogues</h1>
          <p className="text-ink-soft text-sm mb-6">Our catalogues are not available right now. Please check back soon.</p>
          <Link to="/shop" className="btn-primary px-6 py-2.5 text-sm inline-block">Browse the shop</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section className="bg-brand-darker text-white py-14">
        <div className="container-app text-center max-w-2xl mx-auto">
          <p className="eyebrow text-gold mb-3">Catalogue</p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4">{settings.title}</h1>
          {settings.intro && <p className="text-white/80">{settings.intro}</p>}
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app">
          {live.length > 6 && (
            <div className="relative max-w-sm mx-auto mb-8">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalogues..."
                className="w-full border border-thread rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {live.length === 0 ? (
            <p className="text-center text-ink-soft text-sm py-10">No catalogues have been added yet. Please check back soon.</p>
          ) : shown.length === 0 ? (
            <p className="text-center text-ink-soft text-sm py-10">No catalogue matches "{search}".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((item) => {
                const cover = item.cover || typeImages.get(item.productType) || ''
                const updated = formatUpdated(item.updatedAt)
                return (
                  <article key={item.id} className="card-base border border-thread overflow-hidden flex flex-col">
                    <div className="aspect-[4/5] bg-cream-dark flex items-center justify-center overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={item.title} loading="lazy" className="w-full h-full object-cover object-top" />
                      ) : (
                        <FileText size={48} className="text-brand/40" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h2 className="font-display font-semibold text-ink text-lg">{item.title}</h2>
                      {item.subtitle && <p className="text-xs text-ink-soft mt-1">{item.subtitle}</p>}
                      {updated && <p className="text-[11px] text-ink-soft/80 mt-1">Updated {updated}</p>}
                      <div className="flex gap-2 mt-auto pt-4">
                        <a
                          href={item.pdf}
                          download={catalogueFileName(item)}
                          className="btn-primary flex-1 px-3 py-2.5 text-sm inline-flex items-center justify-center gap-2"
                        >
                          <Download size={15} /> Download PDF
                        </a>
                        <a
                          href={item.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View in a new tab"
                          aria-label={`View ${item.title} catalogue`}
                          className="btn-outline px-3 py-2.5 inline-flex items-center justify-center"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
