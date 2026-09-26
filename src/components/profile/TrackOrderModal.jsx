import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, MapPin, Truck, CheckCircle2, PackageCheck, PackageOpen, XCircle } from 'lucide-react'
import { formatPrice } from '../../utils/formatPrice.js'
import { getTrackingSteps, getTrackingNumber, isOrderCancelled } from '../../utils/orderTracking.js'
import { useOrders } from '../../context/OrderContext.jsx'

const STAGE_ICONS = {
  confirmed: CheckCircle2,
  processing: PackageOpen,
  shipped: Truck,
  'out-for-delivery': MapPin,
  delivered: PackageCheck,
}

export default function TrackOrderModal({ order, onClose }) {
  const { cancelOrder } = useOrders()
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Close on Escape, same convention as any other modal in the app.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!order) return null

  const steps = getTrackingSteps(order)
  const cancelled = isOrderCancelled(order)
  // Once delivered (or already cancelled) there's nothing left to cancel --
  // this stays in sync with the same rule OrderContext.cancelOrder and
  // firestore.rules enforce server-side.
  const canCancel = !cancelled && order.status !== 'delivered'
  const trackingNumber = getTrackingNumber(order)

  async function handleCancel() {
    setCancelError('')
    setCancelling(true)
    try {
      await cancelOrder(order.id)
      setConfirming(false)
    } catch (err) {
      setCancelError(err.message || 'Could not cancel this order.')
    } finally {
      setCancelling(false)
    }
  }
  const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Track order"
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-thread sticky top-0 bg-white">
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
          {cancelled ? (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-6">
              <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-ink">
                  This order was cancelled{order.cancelledBy === 'admin' ? ' by our team' : ''}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">It won't be shipped. Contact us if you have questions.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-brand-light border border-brand/20 px-4 py-3 mb-6">
              <span className="text-xs font-medium text-ink-soft">Estimated delivery</span>
              <span className="text-sm font-semibold text-brand">{deliveryDate}</span>
            </div>
          )}

          <ol className="space-y-0">
            {steps.map((step, i) => {
              const Icon = STAGE_ICONS[step.id]
              const isLast = i === steps.length - 1
              return (
                <li key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-brand text-white'
                          : 'bg-cream-dark text-ink-soft border border-thread'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    {!isLast && (
                      <span className={`w-0.5 flex-1 min-h-[28px] ${step.done && steps[i + 1]?.done ? 'bg-brand' : 'bg-thread'}`} />
                    )}
                  </div>
                  <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`text-sm font-medium ${step.done ? 'text-ink' : 'text-ink-soft'}`}>
                      {step.label}
                      {step.current && !cancelled && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-brand bg-brand-light px-2 py-0.5 rounded-full align-middle">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft mt-0.5">{step.description}</p>
                    {step.date && (
                      <p className="text-[11px] text-ink-soft/80 mt-1">
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

          <div className="stitch-divider my-6" />

          <div className="flex items-start gap-1.5 text-xs text-ink-soft mb-1">
            <MapPin size={13} className="shrink-0 mt-0.5" /> Shipping to
          </div>
          <p className="text-sm text-ink font-medium">{order.address.fullName}</p>
          <p className="text-sm text-ink-soft">
            {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
          </p>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-thread">
            <span className="text-xs text-ink-soft">Order total</span>
            <span className="text-sm font-semibold text-ink">{formatPrice(order.totals?.total || 0)}</span>
          </div>

          {canCancel && (
            <div className="mt-6 pt-4 border-t border-thread">
              {confirming ? (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm font-medium text-ink">Cancel this order?</p>
                  <p className="text-xs text-ink-soft mt-0.5 mb-3">This can't be undone once confirmed.</p>
                  {cancelError && <p className="text-xs text-red-600 mb-2">{cancelError}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn-primary flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirming(false); setCancelError('') }}
                      disabled={cancelling}
                      className="btn-outline flex-1 py-2 text-sm"
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1.5"
                >
                  <XCircle size={15} /> Cancel Order
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link
              to={`/order-confirmation/${order.id}`}
              onClick={onClose}
              className="btn-outline flex-1 py-2.5 text-sm text-center"
            >
              View Order Details
            </Link>
            <button onClick={onClose} className="btn-primary flex-1 py-2.5 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
