import { Truck, RotateCcw, ShieldCheck, Lock } from 'lucide-react'
import Reveal from '../common/Reveal.jsx'

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On all orders above ₹999 across India' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free return policy' },
  { icon: ShieldCheck, title: 'Premium Quality', desc: 'Carefully checked fabric and stitching' },
  { icon: Lock, title: 'Secure Payments', desc: '100% safe and encrypted transactions' },
]

export default function WhyChooseUs() {
  return (
    <section className="section-py bg-white border-y border-thread">
      <div className="container-app">
        <Reveal as="div" className="mb-10">
          <p className="eyebrow text-brand mb-2">The fine print, in plain sight</p>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink">Why Choose Us</h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-thread">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 70}
              className="p-6 sm:p-7 border-r border-b border-thread flex flex-col"
            >
              <span className="font-mono text-[11px] text-brand mb-4">{String(i + 1).padStart(2, '0')}</span>
              <Icon size={26} className="text-ink mb-4" strokeWidth={1.5} />
              <h3 className="font-display font-semibold text-ink mb-1">{title}</h3>
              <p className="text-xs text-ink-soft">{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
