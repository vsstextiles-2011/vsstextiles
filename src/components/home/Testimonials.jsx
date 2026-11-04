import { Quote } from 'lucide-react'
import { testimonials } from '../../data/testimonials.js'
import StarRating from '../common/StarRating.jsx'
import Reveal from '../common/Reveal.jsx'

export default function Testimonials() {
  return (
    <section className="section-py bg-cream-dark">
      <div className="container-app">
        <Reveal as="div" className="mb-10">
          <p className="eyebrow text-brand mb-2">From households we dress</p>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">What Our Customers Say</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-thread">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 70} className="bg-white p-6 relative border-r border-b border-thread">
              <Quote className="absolute top-5 right-5 text-brand/15" size={30} />
              <div className="flex items-center gap-3 mb-3">
                <img src={t.image} alt={t.name} className="w-11 h-11 object-cover border border-thread" loading="lazy" />
                <div>
                  <p className="font-semibold text-ink text-sm">{t.name}</p>
                  <StarRating rating={t.rating} size={12} />
                </div>
              </div>
              <p className="text-sm text-ink-soft">{t.review}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
