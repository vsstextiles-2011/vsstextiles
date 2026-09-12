import { Link } from 'react-router-dom'
import { shopByCategory } from '../../data/categories.js'
import SectionHeading from '../common/SectionHeading.jsx'
import Reveal from '../common/Reveal.jsx'
import { onImgError } from '../../utils/imgFallback.js'

export default function CategorySection() {
  return (
    <section id="shop-by-category" className="section-py bg-white scroll-mt-24">
      <div className="container-app">
        <SectionHeading index={1} eyebrow="Four wardrobes, one rack" title="Shop By Category" subtitle="Find the perfect fit for everyone in the family" />
        {/* Each card is its own separate box (gap + rounded border all the way
            around) instead of a shared grid with only internal divider lines */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {shopByCategory.map((cat, i) => (
            <Reveal key={cat.id} as={Link} to={cat.link} delay={i * 70}
              className="group flex flex-col rounded-2xl border border-thread hover:shadow-lg hover:border-ink/30 transition-all duration-300 overflow-hidden text-ink"
            >
              {/* Image shown in full — no dark gradient or blur veil over it,
                  and a taller aspect ratio (instead of a fixed short height)
                  so the whole photo is visible rather than cropped. */}
              <div className="relative overflow-hidden aspect-[3/4]">
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  onError={onImgError(`vss-cat-${cat.id}`, 800, 800)}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Separator line between the photo and the label, then the
                  label row itself — sits below the image, centered, no arrow */}
              <div className="border-t border-thread" />
              <div className="p-5 bg-white text-center">
                <h3 className="text-ink text-lg sm:text-xl font-display font-semibold">{cat.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
