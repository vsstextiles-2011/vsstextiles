import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, ArrowRight, Scissors, Palette, PackageCheck, Sparkles, Ruler, Truck } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'
import { shopByCategory } from '../data/categories.js'
import { onImgError } from '../utils/imgFallback.js'
import { aboutTypeLabel as typeLabel, aboutTypePath } from '../utils/aboutTypes.js'
import AboutVideos from '../components/about/AboutVideos.jsx'
import LiveCount from '../components/common/LiveCount.jsx'

// Everything on this page is built from the LIVE catalog (the same products
// the shop shows, from Firestore), so the counts update the moment a product
// is added, hidden or deleted in Admin.
function buildAboutData(allProducts) {
  const categoryStats = shopByCategory.map((c) => {
    const items = allProducts.filter((p) => p.category === c.id)
    return { ...c, count: items.length, types: [...new Set(items.map(typeLabel))].slice(0, 4) }
  })

  const typeMap = new Map()
  allProducts.forEach((p) => {
    const key = typeLabel(p)
    const entry = typeMap.get(key) || { label: key, count: 0, sample: null }
    entry.count += 1
    if (!entry.sample && p.image) entry.sample = p
    typeMap.set(key, entry)
  })
  const productTypes = [...typeMap.values()].filter((t) => t.sample).sort((a, b) => b.count - a.count)

  const fabricMap = new Map()
  allProducts.forEach((p) => {
    const f = (p.fabric || '').trim()
    if (f) fabricMap.set(f, (fabricMap.get(f) || 0) + 1)
  })
  const fabrics = [...fabricMap.entries()]
    .map(([name, count]) => ({ name: name[0].toUpperCase() + name.slice(1).toLowerCase(), count }))
    .sort((a, b) => b.count - a.count)

  const autoValues = {
    products: `${allProducts.length}+`,
    collections: String(categoryStats.length),
    fabrics: String(fabrics.length),
  }
  return { categoryStats, productTypes, fabrics, autoValues }
}

// Icons are picked by position, so steps added in Admin still get one.
const STEP_ICONS = [Palette, Scissors, PackageCheck, Ruler, Sparkles, Truck]

// Fills {products} / {fabrics} in admin-written text with live values.
function fill(text, vars) {
  return String(text || '').replace(/\{(products|fabrics)\}/g, (_, k) => vars[k])
}

export default function About() {
  const { storeProducts } = useProducts()
  const { aboutContent: c } = useSiteContent()
  const { isAdmin } = useAuth()
  const { categoryStats, productTypes, fabrics, autoValues } = useMemo(() => buildAboutData(storeProducts), [storeProducts])
  const allProducts = storeProducts
  const featured = productTypes[0]?.sample
  const vars = {
    products: String(allProducts.length),
    fabrics: fabrics.slice(0, 3).map((f) => f.name.toLowerCase()).join(', '),
  }
  const storyImage = c.story.image || featured?.image || '/images/categories/main/women.jpg'
  const visibleTypes = productTypes.filter((t) => !c.range.overrides[t.label]?.hidden)
  const stats = c.stats
    .map((st) => ({ label: st.label, value: st.value || (st.auto ? autoValues[st.auto] : '') }))
    .filter((st) => st.value || st.label)
  return (
    <div>
      {isAdmin && (
        <Link
          to="/admin?tab=about"
          className="fixed bottom-5 right-5 z-40 btn-primary text-xs px-4 py-2.5 shadow-lg flex items-center gap-2"
        >
          <Pencil size={14} /> Edit this page
        </Link>
      )}
      <section className="bg-brand-darker py-20 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFFFFF 0, #FFFFFF 1px, transparent 1px, transparent 34px)' }}
        />
        <div className="container-app text-center max-w-2xl mx-auto relative">
          <p className="eyebrow text-gold mb-3">{c.hero.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4">{c.hero.title}</h1>
          <p className="text-white/80">{fill(c.hero.text, vars)}</p>
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app grid md:grid-cols-2 gap-10 items-center">
          <div className="swing-tag bg-white shadow-md w-full h-[26rem] sm:h-[32rem] flex items-center justify-center p-4">
            <img
              src={storyImage}
              alt={featured?.name || 'VSS Textiles products'}
              onError={onImgError(featured?.fallbackSeed || 'vss-about-story', 800, 800)}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div>
            <p className="eyebrow mb-2">{c.story.eyebrow}</p>
            <h2 className="text-2xl font-display font-semibold text-ink mb-4">{c.story.title}</h2>
            {c.story.paragraph1 && <p className="text-ink-soft mb-4 text-sm leading-relaxed">{fill(c.story.paragraph1, vars)}</p>}
            {c.story.paragraph2 && <p className="text-ink-soft text-sm leading-relaxed">{fill(c.story.paragraph2, vars)}</p>}
            <span className="stitch-divider block w-16 mt-6" />
          </div>
        </div>
      </section>

      <section className="section-py bg-cream-dark">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">{c.categories.eyebrow}</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">{c.categories.title}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryStats.map((cat) => {
              const custom = c.categories.items.find((x) => x.id === cat.id) || {}
              return (
              <Link key={cat.id} to={cat.link} className="group card-base bg-white overflow-hidden">
                <div className="aspect-[4/5] overflow-hidden bg-cream-dark">
                  <img
                    src={custom.image || cat.image}
                    alt={cat.title}
                    onError={onImgError(`vss-about-${cat.id}`, 600, 750)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-ink flex items-center justify-between">
                    {cat.title}
                    <ArrowRight size={16} className="text-brand transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-brand font-mono mt-1"><LiveCount value={cat.count} /> styles</p>
                  <p className="text-xs text-ink-soft mt-1.5 line-clamp-2">{custom.details || cat.types.join(' • ')}</p>
                </div>
              </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">{c.range.eyebrow}</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">{c.range.title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {visibleTypes.map((t) => (
              <Link
                key={t.label}
                to={aboutTypePath(t.label)}
                className="group card-base bg-white overflow-hidden hover:border-ink/40 transition-colors"
              >
                <div className="aspect-square overflow-hidden bg-cream-dark">
                  <img
                    src={c.range.overrides[t.label]?.image || t.sample.image}
                    alt={t.label}
                    onError={onImgError(t.sample.fallbackSeed, 500, 500)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-ink group-hover:text-brand transition-colors">{t.label}</p>
                  <p className="text-xs text-ink-soft"><LiveCount value={t.count} /> styles</p>
                </div>
              </Link>
            ))}
          </div>
          {c.range.showFabrics && fabrics.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-soft self-center mr-1">Fabrics:</span>
            {fabrics.map((f) => (
              <span key={f.name} className="px-3 py-1.5 text-xs font-medium bg-white border border-thread text-ink">
                {f.name}
              </span>
            ))}
          </div>
          )}
        </div>
      </section>

      <section className="section-py bg-brand text-white">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow text-gold mb-2">{c.process.eyebrow}</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold">{c.process.title}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {c.process.steps.map(({ id, title, desc }, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length]
              return (
              <div key={id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="swing-tag w-12 h-12 bg-gold text-white flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-display font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{desc}</p>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      <AboutVideos content={c.videos} />

      <section className="section-py bg-cream-dark">
        <div className="container-app grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }, i) => (
            <div key={`${label}-${i}`} className="card-base p-6 text-center bg-white">
              <p className="font-mono text-3xl font-semibold text-brand mb-1">{value}</p>
              <p className="text-sm font-medium text-ink-soft">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}