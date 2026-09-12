import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ShoppingBag, Tag, ShieldCheck, Truck, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgError } from '../utils/imgFallback.js'

const PROMO_CODES = { VSS10: 0.1, WELCOME50: 50 }

export default function Cart() {
  const { items, removeFromCart, updateQty, cartTotal } = useCart()
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState(null)
  const [promoError, setPromoError] = useState('')

  const shipping = cartTotal > 999 || cartTotal === 0 ? 0 : 79
  const discount = promo
    ? promo.type === 'percent'
      ? Math.round(cartTotal * promo.value)
      : Math.min(promo.value, cartTotal)
    : 0
  const total = Math.max(0, cartTotal - discount) + shipping

  function applyPromo(e) {
    e.preventDefault()
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    const value = PROMO_CODES[code]
    if (value === undefined) {
      setPromo(null)
      setPromoError('That code isn\'t valid.')
      return
    }
    setPromo({ code, type: value < 1 ? 'percent' : 'flat', value })
    setPromoError('')
  }

  if (items.length === 0) {
    return (
      <div className="container-app section-py text-center min-h-[55vh] flex flex-col items-center justify-center bg-cream">
        <span className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mb-5">
          <ShoppingBag size={34} className="text-brand" />
        </span>
        <h2 className="text-xl font-display font-semibold text-ink mb-2">Your cart is empty</h2>
        <p className="text-ink-soft text-sm mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary px-6 py-3 text-sm">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <section className="section-py bg-cream min-h-[60vh]">
      <div className="container-app">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">Shopping Cart</h1>
          <span className="text-sm text-ink-soft">{items.reduce((n, i) => n + i.qty, 0)} item{items.length === 1 ? '' : 's'}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.size}-${item.color || ''}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4 items-center border border-transparent hover:border-brand-soft"
              >
                <Link to={`/product/${item.id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-cream-dark shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={onImgError(item.fallbackSeed || item.id)}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`} className="font-medium text-ink text-sm hover:text-brand line-clamp-2">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink-soft mt-1">
                    Size: {item.size}
                    {item.color ? ` · Color: ${item.color}` : ''}
                  </p>
                  <p className="font-semibold text-brand mt-1">{formatPrice(item.price)}</p>
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-brand mt-1.5"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-cream-dark rounded-full p-1">
                  <button
                    onClick={() => updateQty(item.id, item.size, item.qty - 1, item.color)}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink hover:text-brand shadow-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.size, item.qty + 1, item.color)}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink hover:text-brand shadow-sm"
                  >
                    +
                  </button>
                </div>
                <p className="hidden sm:block font-semibold text-ink w-20 text-right shrink-0">
                  {formatPrice(item.price * item.qty)}
                </p>
              </div>
            ))}

            {/* Promo code */}
            <form onSubmit={applyPromo} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <Tag size={18} className="text-brand shrink-0" />
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Have a promo code? Try VSS10"
                className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-ink-soft/60"
              />
              <button type="submit" className="text-sm font-semibold text-brand hover:underline shrink-0">Apply</button>
            </form>
            {promoError && <p className="text-xs text-brand px-1">{promoError}</p>}
            {promo && <p className="text-xs text-brand px-1">Code {promo.code} applied — you're saving {promo.type === 'percent' ? `${promo.value * 100}%` : formatPrice(promo.value)}.</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-24">
            <h3 className="font-display font-semibold text-ink mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm text-ink-soft">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand">
                  <span>Discount ({promo.code})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>
            <div className="stitch-divider my-4" />
            <div className="flex justify-between font-bold text-ink text-base">
              <span>Total</span>
              <span className="text-brand">{formatPrice(total)}</span>
            </div>

            <Link
              to="/checkout"
              className="btn-primary w-full py-3.5 mt-6 text-sm flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </Link>
            <Link to="/shop" className="block text-center text-sm text-brand mt-4 hover:underline">
              Continue Shopping
            </Link>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-thread">
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <Truck size={15} className="text-brand shrink-0" /> Free shipping over ₹999
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <ShieldCheck size={15} className="text-brand shrink-0" /> Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
