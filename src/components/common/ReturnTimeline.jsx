import { RotateCcw, Undo2, IndianRupee } from 'lucide-react'
import { getReturnSteps } from '../../utils/orderTracking.js'

const RETURN_ICONS = {
  'return-requested': RotateCcw,
  returned: Undo2,
  refunded: IndianRupee,
}

// Small "Return & Refund" timeline shown under the main delivery timeline.
// Renders nothing unless the order is in the return flow.
export default function ReturnTimeline({ order, showDescriptions = false }) {
  const steps = getReturnSteps(order)
  if (!steps.length) return null

  return (
    <div className="mt-6 pt-5 border-t border-thread">
      <p className="text-sm font-semibold text-ink mb-3">Return &amp; Refund</p>
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const Icon = RETURN_ICONS[step.id] || RotateCcw
          const isLast = i === steps.length - 1
          return (
            <li key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? 'bg-brand text-white' : 'bg-cream-dark text-ink-soft border border-thread'
                  }`}
                >
                  <Icon size={14} />
                </span>
                {!isLast && (
                  <span className={`w-0.5 flex-1 min-h-[20px] ${step.done && steps[i + 1]?.done ? 'bg-brand' : 'bg-thread'}`} />
                )}
              </div>
              <div className={isLast ? '' : 'pb-4'}>
                <p className={`text-sm font-medium ${step.done ? 'text-ink' : 'text-ink-soft'}`}>{step.label}</p>
                {showDescriptions && <p className="text-xs text-ink-soft mt-0.5">{step.description}</p>}
                {step.date && (
                  <p className="text-[11px] text-ink-soft/80 mt-0.5">
                    {step.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {step.date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
