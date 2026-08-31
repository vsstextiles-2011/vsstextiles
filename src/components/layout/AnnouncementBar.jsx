import { Truck, RotateCcw, Headset, ShieldCheck, BadgePercent, Sparkles, Wallet } from 'lucide-react'

// Two logical groups: everyday service promises, and this week's offers.
// Kept as separate arrays so each can be extended independently without
// touching the ticker/render logic below.
const features = [
  { icon: Truck, text: 'Free Shipping on Orders Above ₹999' },
  { icon: RotateCcw, text: 'Easy 7-Day Returns' },
  { icon: Headset, text: '24/7 Customer Support' },
  { icon: ShieldCheck, text: '100% Secure Payments' },
]

const offers = [
  { icon: BadgePercent, text: 'Flat 40% Off on Your First Order' },
  { icon: Sparkles, text: 'New Arrivals Every Week' },
  { icon: Wallet, text: 'Cash on Delivery Available' },
  { icon: BadgePercent, text: 'Offer Ends This Week' },
]

const items = [...features, ...offers]

export default function AnnouncementBar() {
  return (
    <div className="bg-ink text-cream/90 text-xs sm:text-sm overflow-hidden border-b border-white/10">
      <div className="py-2 overflow-hidden">
        {/* Track is the item list rendered twice so translating by -50% loops
            seamlessly; pauses on hover/focus so the text can be read. */}
        <div className="marquee-track flex w-max items-center whitespace-nowrap font-mono uppercase tracking-wide text-[11px]">
          {[items, items].map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center" aria-hidden={groupIndex === 1}>
              {group.map(({ icon: Icon, text }, i) => (
                <span key={`${groupIndex}-${i}`} className="flex items-center gap-2 px-5 border-l border-white/15 first:border-l-0">
                  <Icon size={13} className="shrink-0 text-brand" />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
