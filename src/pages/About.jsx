import { Users, ShoppingBag, MapPin, Award, Scissors, Palette, PackageCheck } from 'lucide-react'
import { onImgError } from '../utils/imgFallback.js'

const stats = [
  { value: '10,000+', label: 'Families dressed' },
  { value: '500+', label: 'Products in catalog' },
  { value: '5', label: 'Store locations' },
  { value: '15+', label: 'Years in Tirupur' },
]

const process = [
  { icon: Palette, title: 'Yarn & Dye', desc: 'Cotton and cotton-blend yarns selected for softness, then dyed in small, controlled batches for consistent colour.' },
  { icon: Scissors, title: 'Knit & Cut', desc: 'Fabric is knit in-house and layer-cut to pattern, so every size in a run holds the same fit and finish.' },
  { icon: PackageCheck, title: 'Check & Pack', desc: 'Every piece is hand-checked for stitching and fabric flaws before it is folded, tagged and shipped.' },
]

export default function About() {
  return (
    <div>
      <section className="bg-brand-darker py-20 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFFFFF 0, #FFFFFF 1px, transparent 1px, transparent 34px)' }}
        />
        <div className="container-app text-center max-w-2xl mx-auto relative">
          <p className="eyebrow text-gold mb-3">Est. Tirupur, Tamil Nadu</p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4">A manufacturer first, a storefront second</h1>
          <p className="text-white/80">
            VSS Textiles started as a single garment shop and grew alongside Tirupur's knitwear industry — the same yarn, dyeing and cutting floors that supply brands across India now supply this store directly, cutting out the markup in between.
          </p>
        </div>
      </section>

      <section className="section-py bg-cream">
        <div className="container-app grid md:grid-cols-2 gap-10 items-center">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
            alt="Garment store interior"
            onError={onImgError('vss-about-story', 800, 800)}
            className="swing-tag shadow-md w-full h-80 object-cover"
          />
          <div>
            <p className="eyebrow mb-2">Our story</p>
            <h2 className="text-2xl font-display font-semibold text-ink mb-4">Good clothing shouldn't cost a fortune</h2>
            <p className="text-ink-soft mb-4 text-sm leading-relaxed">
              Every product on VSS Textiles is chosen for everyday comfort, fabric quality and honest value, whether it's a school uniform for your child, a set for a family function, or a casual tee for the weekend.
            </p>
            <p className="text-ink-soft text-sm leading-relaxed">
              Our team personally checks stitching and fabric quality before any product goes live, so you can shop with confidence.
            </p>
            <span className="stitch-divider block w-16 mt-6" />
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
