import { useEffect, useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { POLICIES } from '../../pages/Policy.jsx'
import { POLICY_UPDATED } from '../../data/business.js'

// Shown at checkout, right before the order is placed / paid. The customer
// reads the policies (tabs) and must press "I agree" to continue.
const TABS = [
  { id: 'refund', label: 'Refund & Cancellation' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
]

export default function PolicyPopup({ open, onClose, onAgree, busy = false }) {
  const [tab, setTab] = useState('refund')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab('refund')
    setAgreed(false)
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, busy, onClose])

  if (!open) return null
  const p = POLICIES[tab]

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order policies"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Before you place your order</h2>
            <p className="text-xs text-ink-soft mt-0.5">Please read our policies. Last updated: {POLICY_UPDATED}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-ink-soft hover:text-brand hover:bg-brand-light/50 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 sm:px-6 border-b border-thread overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap text-sm px-3 py-2 border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-brand text-brand font-semibold' : 'border-transparent text-ink-soft hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 text-sm text-ink-soft leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {p.body()}
        </div>

        <div className="border-t border-thread px-5 sm:px-6 py-4 bg-cream/60">
          <label className="flex items-start gap-2 text-sm text-ink cursor-pointer select-none">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#EC3237]" />
            <span>I have read and agree to the Refund &amp; Cancellation, Shipping, Terms and Privacy policies.</span>
          </label>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={onClose} disabled={busy} className="btn-outline flex-1 py-2.5 text-sm disabled:opacity-50">Go back</button>
            <button type="button" onClick={onAgree} disabled={!agreed || busy} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <ShieldCheck size={15} /> {busy ? 'Placing order…' : 'Agree & place order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
