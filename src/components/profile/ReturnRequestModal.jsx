import { useEffect, useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { useOrders } from '../../context/OrderContext.jsx'
import { RETURN_REASONS, RETURN_WINDOW_DAYS } from '../../utils/orderTracking.js'

// "Request a return" form for a delivered order (opened from My Profile -> Orders).
export default function ReturnRequestModal({ order, onClose, onDone }) {
  const { requestReturn } = useOrders()
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  // Which products to return: { [lineIndex]: quantity } (missing = not returning)
  const [picked, setPicked] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const items = Object.entries(picked).map(([i, qty]) => ({ index: Number(i), qty }))
    if (items.length === 0) { setError('Select at least one product to return.'); return }
    if (!reason) { setError('Please choose a reason for the return.'); return }
    setBusy(true)
    try {
      await requestReturn(order.id, { reason, comment, items })
      onDone?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not send the return request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink flex items-center gap-2"><RotateCcw size={18} /> Request a return</h3>
            <p className="text-xs text-ink-soft mt-1">Order #{order.id}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink"><X size={20} /></button>
        </div>

        <p className="text-sm font-medium text-ink mb-1.5">Which product(s) do you want to return?</p>
        <ul className="mb-4 space-y-2">
          {(order.items || []).map((it, i) => {
            const on = picked[i] != null
            const max = Number(it.qty) || 1
            return (
              <li key={i} className={`flex items-center gap-3 border rounded-lg p-3 ${on ? 'border-brand bg-brand-light/40' : 'border-thread'}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setPicked((p) => {
                    const n = { ...p }
                    if (e.target.checked) n[i] = max; else delete n[i]
                    return n
                  })}
                  className="w-4 h-4 accent-red-600 shrink-0"
                  aria-label={`Return ${it.name}`}
                />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-ink line-clamp-1">{it.name}</p>
                  <p className="text-xs text-ink-soft">{[it.color, it.size && `Size ${it.size}`].filter(Boolean).join(' · ')} · ₹{it.price} each</p>
                </div>
                {on && max > 1 ? (
                  <select value={picked[i]} onChange={(e) => setPicked((p) => ({ ...p, [i]: Number(e.target.value) }))} className="text-xs border border-thread rounded-md px-1.5 py-1 bg-white">
                    {Array.from({ length: max }, (_, k) => k + 1).map((n) => <option key={n} value={n}>Qty {n}</option>)}
                  </select>
                ) : (
                  <span className="text-xs text-ink-soft shrink-0">× {max}</span>
                )}
              </li>
            )
          })}
        </ul>

        <label className="block text-sm font-medium text-ink mb-1.5">Reason for return</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-thread rounded-lg px-3 py-2.5 text-sm mb-4 bg-white">
          <option value="">Select a reason…</option>
          {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <label className="block text-sm font-medium text-ink mb-1.5">Anything else we should know? <span className="text-ink-soft font-normal">(optional)</span></label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} className="w-full border border-thread rounded-lg px-3 py-2.5 text-sm mb-1" />
        <p className="text-[11px] text-ink-soft mb-4">
          Returns can be requested within {RETURN_WINDOW_DAYS} days of delivery. Items should be unused, with tags.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60">{busy ? 'Sending…' : 'Submit request'}</button>
        </div>
      </form>
    </div>
  )
}
