import { Link } from 'react-router-dom'
import { ArrowRight, Scissors, Palette, PackageCheck } from 'lucide-react'
import { allProducts } from '../data/products.js'
import { shopByCategory } from '../data/categories.js'
import { onImgError } from '../utils/imgFallback.js'

// Everything on this page is built from the real catalog (data/products.js),
// so it updates on its own when products are added or removed.
const MERGE = { 'T-Shirt': 'T-Shirts', '3/4th': '3/4th Sets', '3/4th Set': '3/4th Sets', Nighty: 'Nighties', Bras: 'Bras' }
const typeLabel = (p) => {
  const raw = p.menuParent || p.subCategoryLabel || p.baseName || 'Other'
  return MERGE[raw] || raw
}

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
const productTypes = [...typeMap.values()].filter((t) => t.sample).sort((a, b) => b.count - a.count).slice(0, 8)

const fabricMap = new Map()
allProducts.forEach((p) => {
  const f = (p.fabric || '').trim()
  if (f) fabricMap.set(f, (fabricMap.get(f) || 0) + 1)
})
const fabrics = [...fabricMap.entries()]
  .map(([name, count]) => ({ name: name[0].toUpperCase() + name.slice(1).toLowerCase(), count }))
  .sort((a, b) => b.count - a.count)

const stats = [
  { value: `${allProducts.length}+`, label: 'Products in our range' },
  { value: String(categoryStats.length), label: 'Collections: Men, Women, Boys, Girls' },
  { value: String(fabrics.length), label: 'Fabric types' },
  { value: '10+', label: 'Years in Pollachi' },
]

const process = [
  { icon: Palette, title: 'Yarn & Dye', desc: 'Cotton and cotton-blend yarns selected for softness, then dyed in small, controlled batches for consistent colour.' },
  { icon: Scissors, title: 'Knit & Cut', desc: 'Fabric is knit in-house and layer-cut to pattern, so every size in a run holds the same fit and finish.' },
  { icon: PackageCheck, title: 'Check & Pack', desc: 'Every piece is hand-checked for stitching and fabric flaws before it is folded, tagged and shipped.' },
]

export default function About() {
  const featured = productTypes[0]?.sample
  return (
    <div>
      <section className="bg-brand-darker py-20 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFFFFF 0, #FFFFFF 1px, transparent 1px, transparent 34px)' }}
        />
        <div className="container-app text-center max-w-2xl mx-auto relative">
          <p className="eyebrow text-gold mb-3">Est. Tirupur, Tamil Nadu</p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4">Clothing for the whole family, made in Pollachi</h1>
          <p className="text-white/80">
            From everyday tops, nighties and innerwear to t-shirts, track pants and kids' wear, every product on VSS Textiles is made where the yarn is knit, cut and stitched, and sold to you without the extra markup.
          </p>
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app grid md:grid-cols-2 gap-10 items-center">
          <img
            src={featured?.image || '/images/categories/main/women.jpg'}
            alt={featured?.name || 'VSS Textiles products'}
            onError={onImgError(featured?.fallbackSeed || 'vss-about-story', 800, 800)}
            className="swing-tag shadow-md w-full h-80 object-cover"
          />
          <div>
            <p className="eyebrow mb-2">Our story</p>
            <h2 className="text-2xl font-display font-semibold text-ink mb-4">Good clothing shouldn't cost a fortune</h2>
            <p className="text-ink-soft mb-4 text-sm leading-relaxed">
              VSS Textiles started as a single garment shop and grew alongside Tirupur's knitwear industry. Today our range covers {allProducts.length}+ styles across men's, women's, boys' and girls' wear, in fabrics like {fabrics.slice(0, 3).map((f) => f.name.toLowerCase()).join(', ')} and more.
            </p>
            <p className="text-ink-soft text-sm leading-relaxed">
              Our team personally checks stitching and fabric quality before any product goes live, so you can shop with confidence.
            </p>
            <span className="stitch-divider block w-16 mt-6" />
          </div>
        </div>
      </section>

      <section className="section-py bg-cream-dark">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">What we make</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">Something for everyone at home</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryStats.map((c) => (
              <Link key={c.id} to={c.link} className="group card-base bg-white overflow-hidden">
                <div className="aspect-[4/5] overflow-hidden bg-cream-dark">
                  <img
                    src={c.image}
                    alt={c.title}
                    onError={onImgError(`vss-about-${c.id}`, 600, 750)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-ink flex items-center justify-between">
                    {c.title}
                    <ArrowRight size={16} className="text-brand transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-brand font-mono mt-1">{c.count} styles</p>
                  <p className="text-xs text-ink-soft mt-1.5 line-clamp-2">{c.types.join(' • ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Our product range</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">What you'll find on VSS Textiles</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {productTypes.map((t) => (
              <div key={t.label} className="card-base bg-white overflow-hidden">
                <div className="aspect-square overflow-hidden bg-cream-dark">
                  <img
                    src={t.sample.image}
                    alt={t.label}
                    onError={onImgError(t.sample.fallbackSeed, 500, 500)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-ink">{t.label}</p>
                  <p className="text-xs text-ink-soft">{t.count} styles</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-soft self-center mr-1">Fabrics:</span>
            {fabrics.map((f) => (
              <span key={f.name} className="px-3 py-1.5 text-xs font-medium bg-white border border-thread text-ink">
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-py bg-brand text-white">
        <div className="container-app">
          <div className="text-center mb-10">
            <p className="eyebrow text-gold mb-2">How it's made</p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold">From yarn to your doorstep</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {process.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="swing-tag w-12 h-12 bg-gold text-white flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-display font-semibold mb-2">{title}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-py bg-cream-dark">
        <div className="container-app grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="card-base p-6 text-center bg-white">
              <p className="font-mono text-3xl font-semibold text-brand mb-1">{value}</p>
              <p className="text-sm font-medium text-ink-soft">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}