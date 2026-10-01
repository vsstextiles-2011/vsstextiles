import { useEffect, useState } from 'react'
import {
  X,
  MapPin,
  Truck,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
  XCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Phone,
} from 'lucide-react'
import { formatPrice } from '../../utils/formatPrice.js'
import { onImgError } from '../../utils/imgFallback.js'
import { getTrackingSteps, getTrackingNumber, ORDER_STATUS_OPTIONS } from '../../utils/orderTracking.js'

const STAGE_ICONS = {
  confirmed: CheckCircle2,
  processing: PackageOpen,
  shipped: Truck,
  'out-for-delivery': MapPin,
  delivered: PackageCheck,
}

const PAYMENT_LABEL = {
  card: { label: 'Card', icon: CreditCard },
  upi: { label: 'UPI', icon: Smartphone },
  cod: { label: 'Cash on Delivery', icon: Banknote },
}

export default function AdminOrderModal({ order, onClose, onUpdateStatus }) {
  const [selectedStatus, setSelectedStatus] = useState(order?.status || 'confirmed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // If the admin re-opens/refreshes while a different order's already
  // selected (or Firestore pushes an update while it's open), keep the
  // dropdown in sync with that order's real current status.
  useEffect(() => {
    setSelectedStatus(order?.status || 'confirmed')
  }, [order?.id, order?.status])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!order) return null

  const steps = getTrackingSteps(order)
  const trackingNumber = getTrackingNumber(order)
  const payment = PAYMENT_LABEL[order.payment?.method] || PAYMENT_LABEL.cod
  const PaymentIcon = payment.icon
  const cancelled = order.status === 'cancelled'
  const dirty = selectedStatus !== order.status
  // Once cancelled -- by the admin here or by the customer themselves
  // (order.cancelledBy) -- this is a terminal state. firestore.rules
  // rejects any further status write for a cancelled order, so the
  // control is locked here too rather than letting the admin hit Save
  // and only find out from the resulting error.
  const cancelledByLabel = order.cancelledBy === 'user' ? 'the customer' : 'an admin'

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      await onUpdateStatus(order.id, selectedStatus)
    } catch (err) {
      setError(err.message || 'Could not update order status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Order details"
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-thread sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-ink-soft">Order number</p>
            <p className="font-display font-semibold text-ink text-lg">{order.id}</p>
            <p className="text-xs text-ink-soft mt-1">Tracking ID: {trackingNumber}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink shrink-0 -mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Status update control -- this is what actually writes to
              Firestore (see OrderContext.updateOrderStatus). Everything
              else on this modal is read-only order detail. */}
          <div className="rounded-xl border border-thread p-4 mb-6 bg-cream-dark/40">
            <p className="text-sm font-semibold text-ink mb-3">Update Order Status</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={cancelled}
                className="flex-1 text-sm rounded-lg border border-thread px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cream-dark"
              >
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSave}
                disabled={cancelled || !dirty || saving}
                className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saving ? 'Saving…' : 'Save Status'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {cancelled ? (
              <p className="text-xs text-ink-soft mt-2">
                This order was cancelled by {cancelledByLabel}. Cancelled orders are locked and can't be moved to another status.
              </p>
            ) : (
              <p className="text-xs text-ink-soft mt-2">
                The customer sees this update immediately on their Track Order page.
              </p>
            )}
          </div>

          {cancelled && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-6">
              <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-ink">
                This order is cancelled{order.cancelledBy === 'user' ? ' — the customer cancelled it' : ''}.
              </p>
            </div>
          )}

          <p className="text-sm font-semibold text-ink mb-3">Progress</p>
          <ol className="space-y-0 mb-6">
            {steps.map((step, i) => {
              const Icon = STAGE_ICONS[step.id]
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
                  <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`text-sm font-medium ${step.done ? 'text-ink' : 'text-ink-soft'}`}>{step.label}</p>
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

          <div className="stitch-divider mb-5" />

          <div className="space-y-3 mb-5">
            {order.items?.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color || ''}`} className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                  <img src={item.image} alt={item.name} onError={onImgError(item.fallbackSeed || item.id)} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink line-clamp-1">{item.name}</p>
                  <p className="text-xs text-ink-soft">
                    Qty {item.qty} · {item.size}{item.color ? ` · ${item.color}` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink shrink-0">{formatPrice(item.price * item.qty)}</p>
              </div>
            ))}
          </div>

          <div className="stitch-divider mb-5" />

          <div className="grid sm:grid-cols-2 gap-6 mb-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                <MapPin size={13} /> Shipping to
              </div>
              <p className="text-sm text-ink font-medium">{order.address?.fullName}</p>
              <p className="text-sm text-ink-soft">
                {order.address?.line1}{order.address?.area ? `, ${order.address.area}` : ''}, {order.address?.city}, {order.address?.state} — {order.address?.pincode}
              </p>
              <p className="text-sm text-ink-soft flex items-center gap-1 mt-1"><Phone size={12} /> {order.address?.phone}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                <PaymentIcon size={13} /> Payment
              </div>
              <p className="text-sm text-ink font-medium">{payment.label}</p>
              {order.payment?.last4 && <p className="text-sm text-ink-soft">Card ending in {order.payment.last4}</p>}
              {order.payment?.upiId && <p className="text-sm text-ink-soft">{order.payment.upiId}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-thread space-y-1.5">
            {/* Same subtotal → offer(s) → shipping → total breakdown the
                customer saw on Checkout (see totals in
                Checkout.jsx/handlePlaceOrder), so an admin can see exactly
                which offer(s) brought the price down instead of just the
                final number. `discount` is the combined promo + bulk-order
                amount, and `bigOrderDiscount` is stored separately, so the
                promo-only portion is whatever's left after subtracting it. */}
            {(() => {
              const t = order.totals || {}
              const bigOrderDiscount = t.bigOrderDiscount || 0
              const promoDiscount = Math.max(0, (t.discount || 0) - bigOrderDiscount)
              return (
                <>
                  {t.subtotal != null && (
                    <div className="flex items-center justify-between text-sm text-ink-soft">
                      <span>Subtotal</span>
                      <span>{formatPrice(t.subtotal)}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-brand">
                      <span>Offer{t.promoCode ? ` (${t.promoCode})` : ''}</span>
                      <span>−{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {bigOrderDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-brand">
                      <span>Bulk order offer (25% off)</span>
                      <span>−{formatPrice(bigOrderDiscount)}</span>
                    </div>
                  )}
                  {t.shipping != null && (
                    <div className="flex items-center justify-between text-sm text-ink-soft">
                      <span>Shipping</span>
                      <span>{t.shipping > 0 ? formatPrice(t.shipping) : 'Free'}</span>
                    </div>
                  )}
                </>
              )
            })()}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-thread">
              <span className="text-sm text-ink-soft">Order total</span>
              <span className="text-base font-semibold text-brand">{formatPrice(order.totals?.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
