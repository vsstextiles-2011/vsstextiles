import { Link, Navigate, useParams } from 'react-router-dom'
import { CheckCircle2, Package, MapPin, CreditCard, Smartphone, Banknote } from 'lucide-react'
import { useOrders } from '../context/OrderContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgError } from '../utils/imgFallback.js'

const PAYMENT_LABEL = {
  card: { label: 'Card', icon: CreditCard },
  upi: { label: 'UPI', icon: Smartphone },
  cod: { label: 'Cash on Delivery', icon: Banknote },
}

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const { getOrder } = useOrders()
  const order = getOrder(orderId)

  if (!order) {
    return <Navigate to="/" replace />
  }

  const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const payment = PAYMENT_LABEL[order.payment.method]
  const PaymentIcon = payment.icon

  return (
    <section className="section-py bg-cream min-h-[70vh]">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-flex w-16 h-16 rounded-full bg-brand-light text-brand items-center justify-center mb-4">
            <CheckCircle2 size={34} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">Order confirmed</h1>
          <p className="text-ink-soft text-sm mt-2">
            Thank you! We've received your order and payment{order.payment.method === 'cod' ? ' method' : ''}.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <div>
              <p className="text-xs text-ink-soft">Order number</p>
              <p className="font-display font-semibold text-ink text-lg">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-soft">Estimated delivery</p>
              <p className="font-semibold text-brand text-sm">{deliveryDate}</p>
            </div>
          </div>
          <div className="stitch-divider mb-5" />

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color || ''}`} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
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

          <div className="stitch-divider my-5" />

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                <MapPin size={13} /> Shipping to
              </div>
              <p className="text-sm text-ink font-medium">{order.address.fullName}</p>
              <p className="text-sm text-ink-soft">
                {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
              <p className="text-sm text-ink-soft">{order.address.phone}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                <PaymentIcon size={13} /> Payment
              </div>
              <p className="text-sm text-ink font-medium">{payment.label}</p>
              {order.payment.last4 && <p className="text-sm text-ink-soft">Card ending in {order.payment.last4}</p>}
              {order.payment.upiId && <p className="text-sm text-ink-soft">{order.payment.upiId}</p>}
            </div>
          </div>

          <div className="stitch-divider my-5" />

          <div className="space-y-2 text-sm text-ink-soft max-w-xs ml-auto">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink border-t border-thread pt-2 mt-1">
              <span>Total paid</span>
              <span className="text-brand">{formatPrice(order.totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link to="/shop" className="btn-primary px-6 py-3 text-sm text-center">Continue Shopping</Link>
          <Link to="/account" className="btn-outline px-6 py-3 text-sm text-center flex items-center justify-center gap-2">
            <Package size={16} /> Track Orders
          </Link>
        </div>
      </div>
    </section>
  )
}
