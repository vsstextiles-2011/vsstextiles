import { useEffect, useState } from 'react'
import {
  X,
  MapPin,
  Truck,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
  Package,
  XCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Phone,
  Printer,
  FileText,
} from 'lucide-react'
import { formatPrice } from '../../utils/formatPrice.js'
import { onImgError } from '../../utils/imgFallback.js'
import { getTrackingSteps, getTrackingNumber, ORDER_STATUS_OPTIONS } from '../../utils/orderTracking.js'
import ReturnTimeline from '../common/ReturnTimeline.jsx'
import { useOrders } from '../../context/OrderContext.jsx'
import { useProducts } from '../../context/ProductContext.jsx'
import { applySale, groupOrderLines } from '../../utils/stock.js'
import { COURIERS, dummyCourierNumber } from '../../utils/courier.js'
import { printInvoice, printLabels } from '../../utils/printOrder.js'

const STAGE_ICONS = {
  confirmed: CheckCircle2,
  processing: PackageOpen,
  packed: Package,
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
  const { updateOrderCourier, markOrderStockDeducted, restoreOrderStock } = useOrders()
  const { products, updateProducts } = useProducts()
  const [stockBusy, setStockBusy] = useState(false)
  const [stockMsg, setStockMsg] = useState('')
  const [courier, setCourier] = useState(order?.courier || '')
  const [courierNo, setCourierNo] = useState(order?.courierTrackingNumber || '')
  const [courierSaving, setCourierSaving] = useState(false)
  const [courierMsg, setCourierMsg] = useState('')

  // If the admin re-opens/refreshes while a different order's already
  // selected (or Firestore pushes an update while it's open), keep the
  // dropdown in sync with that order's real current status.
  useEffect(() => {
    setSelectedStatus(order?.status || 'confirmed')
  }, [order?.id, order?.status])

  useEffect(() => {
    setCourier(order?.courier || '')
    setCourierNo(order?.courierTrackingNumber || '')
    setCourierMsg('')
  }, [order?.id, order?.courier, order?.courierTrackingNumber])

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
  const refunded = order.status === 'refunded'
  // Cancelled and Refunded are final: the status can't be changed again.
  const locked = cancelled || refunded
  const dirty = selectedStatus !== order.status
  // Once cancelled -- by the admin here or by the customer themselves
  // (order.cancelledBy) -- this is a terminal state. firestore.rules
  // rejects any further status write for a cancelled order, so the
  // control is locked here too rather than letting the admin hit Save
  // and only find out from the resulting error.
  const cancelledByLabel = order.cancelledBy === 'user' ? 'the customer' : 'an admin'

  // Takes this order's units off the product stock counts (only products that
  // have a counted "Stock quantity"). Once per order.
  async function handleDeductStock() {
    setStockMsg('')
    const by = groupOrderLines(order.items)
    const updates = []
    const moved = []
    Object.entries(by).forEach(([id, lines]) => {
      const p = products.find((x) => x.id === id)
      if (!p) return
      const { changes } = applySale(p, lines, { clamp: true })
      if (!changes) return // not counted
      updates.push({ id, changes })
      lines.forEach((l) => moved.push({ id, size: l.size || '', color: l.color || '', qty: l.qty }))
    })
    setStockBusy(true)
    try {
      if (updates.length) await updateProducts(updates)
      await markOrderStockDeducted(order.id, moved)
      setStockMsg(updates.length ? `Stock reduced for ${updates.length} product${updates.length === 1 ? '' : 's'}.` : 'None of these products have a stock quantity, so nothing changed.')
    } catch (err) {
      setStockMsg(err.message || 'Could not update stock.')
    } finally {
      setStockBusy(false)
    }
  }

  // Cancelled / returned order: puts the units back (once - see restoreOrderStock).
  async function handleRestoreStock() {
    setStockMsg('')
    setStockBusy(true)
    try {
      const n = await restoreOrderStock(order.id)
      setStockMsg(n ? `Put back in stock for ${n} product${n === 1 ? '' : 's'}.` : 'Nothing needed putting back.')
    } catch (err) {
      setStockMsg(err.message || 'Could not put the units back.')
    } finally {
      setStockBusy(false)
    }
  }

  async function handleSaveCourier() {
    setCourierMsg('')
    setCourierSaving(true)
    try {
      await updateOrderCourier(order.id, { courier, courierTrackingNumber: courierNo })
      setCourierMsg('Saved — the customer can see this on their Track Order page.')
    } catch (err) {
      setCourierMsg(err.message || 'Could not save courier details.')
    } finally {
      setCourierSaving(false)
    }
  }

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
          <div className="flex items-center gap-2 shrink-0 -mt-1">
            <button
              type="button"
              onClick={() => printInvoice(order)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-thread text-ink-soft hover:text-brand hover:border-brand"
            >
              <FileText size={13} /> Print bill
            </button>
            <button
              type="button"
              onClick={() => printLabels([order])}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-thread text-ink-soft hover:text-brand hover:border-brand"
            >
              <Printer size={13} /> Print label
            </button>
            <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
              <X size={20} />
            </button>
          </div>
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
                disabled={locked}
                className="flex-1 text-sm rounded-lg border border-thread px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cream-dark"
              >
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSave}
                disabled={locked || !dirty || saving}
                className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saving ? 'Saving…' : 'Save Status'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {refunded ? (
              <p className="text-xs text-ink-soft mt-2">
                This order has been refunded. Refunded orders are locked and can't be moved to another status.
              </p>
            ) : cancelled ? (
              <p className="text-xs text-ink-soft mt-2">
                This order was cancelled by {cancelledByLabel}. Cancelled orders are locked and can't be moved to another status.
              </p>
            ) : (
              <p className="text-xs text-ink-soft mt-2">
                The customer sees this update immediately on their Track Order page.
              </p>
            )}
          </div>

          {/* Courier details -- shown to the customer on Track Order. */}
          {!cancelled && (
            <div className="rounded-xl border border-thread p-4 mb-6 bg-cream-dark/40">
              <p className="text-sm font-semibold text-ink mb-3">Courier &amp; tracking number</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="text-sm rounded-lg border border-thread px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">Select courier…</option>
                  {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={courierNo}
                  onChange={(e) => setCourierNo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30))}
                  placeholder="Tracking number"
                  className="text-sm font-mono rounded-lg border border-thread px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleSaveCourier}
                  disabled={courierSaving || !courier || !courierNo}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {courierSaving ? 'Saving…' : 'Save courier details'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCourier((c) => c || COURIERS[0]); setCourierNo(dummyCourierNumber(order.id)) }}
                  className="px-4 py-2 text-sm rounded-lg border border-thread text-ink-soft hover:border-brand hover:text-brand"
                >
                  Generate dummy number
                </button>
              </div>
              {courierMsg && <p className="text-xs text-ink-soft mt-2">{courierMsg}</p>}
              <p className="text-xs text-ink-soft mt-2">
                The dummy number is only a placeholder for testing. Replace it with the real number from your courier before shipping.
              </p>
            </div>
          )}

          {(order.items || []).length > 0 && (cancelled || refunded || order.status === 'returned' || !!order.stockDeducted || !locked) && (
            <div className="rounded-xl border border-thread p-4 mb-6 bg-cream-dark/40 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-ink">Stock</p>
                <p className="text-xs text-ink-soft">
                  {order.stockRestored
                    ? 'This order\'s units were put back in stock.'
                    : order.stockDeducted && (cancelled || refunded || order.status === 'returned')
                      ? 'This order\'s units are still off your stock counts. If the goods can be resold, put them back.'
                      : order.stockDeducted
                        ? 'Taken off your stock counts automatically when the order was placed.'
                        : 'Take this order\'s units off the stock counts (only products that have a quantity set).'}
                </p>
                {stockMsg && <p className="text-xs text-ink mt-1">{stockMsg}</p>}
              </div>
              {order.stockDeducted && (cancelled || refunded || order.status === 'returned') && !order.stockRestored ? (
                <button
                  type="button"
                  onClick={handleRestoreStock}
                  disabled={stockBusy}
                  className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {stockBusy ? 'Updating…' : 'Put units back in stock'}
                </button>
              ) : !locked ? (
                <button
                  type="button"
                  onClick={handleDeductStock}
                  disabled={!!order.stockDeducted || stockBusy}
                  className="px-4 py-2 text-sm rounded-lg border border-thread text-ink-soft hover:border-brand hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {order.stockDeducted ? 'Stock updated' : stockBusy ? 'Updating…' : 'Reduce stock'}
                </button>
              ) : null}
            </div>
          )}

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

          {order.returnReason && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mt-4 text-sm">
              <p className="font-semibold text-ink">Customer return request</p>
              {Array.isArray(order.returnItems) && order.returnItems.length > 0 && (
                <div className="mt-1">
                  <p className="text-ink">Products to return:</p>
                  <ul className="list-disc pl-5 text-ink-soft">
                    {order.returnItems.map((it, i) => (
                      <li key={i}>{it.name}{it.color ? ` · ${it.color}` : ''}{it.size ? ` · ${it.size}` : ''} × {it.qty} (₹{(it.price || 0) * it.qty})</li>
                    ))}
                  </ul>
                  <p className="text-ink font-medium mt-1">Refund value: ₹{order.returnItems.reduce((n, it) => n + (it.price || 0) * it.qty, 0)}</p>
                </div>
              )}
              <p className="text-ink mt-1">Reason: {order.returnReason}</p>
              {order.returnComment && <p className="text-ink-soft mt-1">“{order.returnComment}”</p>}
            </div>
          )}
          <ReturnTimeline order={order} />

          <div className="stitch-divider my-5" />

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
