import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Lock,
  Loader2,
  ChevronLeft,
  MapPin,
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgError } from '../utils/imgFallback.js'

const STATES = [
  'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Maharashtra',
  'Delhi', 'Gujarat', 'Rajasthan', 'West Bengal', 'Punjab', 'Uttar Pradesh',
]

function Stepper({ step }) {
  const steps = ['Cart', 'Checkout', 'Confirmation']
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {steps.map((label, i) => {
        const index = i + 1
        const state = index < step ? 'done' : index === step ? 'active' : 'upcoming'
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  state === 'active'
                    ? 'bg-brand text-white'
                    : state === 'done'
                    ? 'bg-brand-light text-brand'
                    : 'bg-gray-100 text-ink-soft/60'
                }`}
              >
                {index}
              </span>
              <span className={`text-xs font-medium hidden sm:inline ${state === 'upcoming' ? 'text-ink-soft/60' : 'text-ink'}`}>
                {label}
              </span>
            </div>
            {index < steps.length && <span className="stitch-divider w-8 sm:w-14" />}
          </div>
        )
      })}
    </div>
  )
}

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart()
  const { placeOrder } = useOrders()
  const navigate = useNavigate()

  const shipping = cartTotal > 999 || cartTotal === 0 ? 0 : 79
  const total = cartTotal + shipping

  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', city: '', state: STATES[0], pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [upiId, setUpiId] = useState('')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  function updateAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!address.fullName.trim()) next.fullName = 'Enter the recipient\'s name'
    if (!/^\d{10}$/.test(address.phone.trim())) next.phone = 'Enter a valid 10-digit phone number'
    if (!address.line1.trim()) next.line1 = 'Enter the delivery address'
    if (!address.city.trim()) next.city = 'Enter a city'
    if (!/^\d{6}$/.test(address.pincode.trim())) next.pincode = 'Enter a valid 6-digit pincode'

    if (paymentMethod === 'card') {
      if (!/^\d{16}$/.test(card.number.replace(/\s/g, ''))) next.cardNumber = 'Enter a valid 16-digit card number'
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) next.cardExpiry = 'Use MM/YY format'
      if (!/^\d{3}$/.test(card.cvv)) next.cardCvv = 'Enter a valid 3-digit CVV'
      if (!card.name.trim()) next.cardName = 'Enter the name on the card'
    }
    if (paymentMethod === 'upi' && !/^[\w.\-]{2,}@[\w]{2,}$/.test(upiId.trim())) {
      next.upiId = 'Enter a valid UPI ID (e.g. name@bank)'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    if (!validate()) return
    setPlacing(true)
    try {
      const order = await placeOrder({
        items,
        address,
        payment: { method: paymentMethod, cardNumber: card.number.replace(/\s/g, ''), upiId },
        totals: { subtotal: cartTotal, shipping, total },
      })
      clearCart()
      navigate(`/order-confirmation/${order.id}`)
    } finally {
      setPlacing(false)
    }
  }

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return (
    <section className="section-py bg-cream min-h-[70vh]">
      <div className="container-app">
        <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand mb-6">
          <ChevronLeft size={15} /> Back to cart
        </Link>

        <Stepper step={2} />

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-6">
            {/* Shipping address */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center">
                  <MapPin size={16} />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">Shipping Address</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Full name</label>
                  <input
                    className="input-base"
                    value={address.fullName}
                    onChange={(e) => updateAddress('fullName', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                  />
                  {errors.fullName && <p className="text-xs text-brand mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Phone number</label>
                  <input
                    className="input-base"
                    value={address.phone}
                    onChange={(e) => updateAddress('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                  />
                  {errors.phone && <p className="text-xs text-brand mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Pincode</label>
                  <input
                    className="input-base"
                    value={address.pincode}
                    onChange={(e) => updateAddress('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                  />
                  {errors.pincode && <p className="text-xs text-brand mt-1">{errors.pincode}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Address</label>
                  <input
                    className="input-base"
                    value={address.line1}
                    onChange={(e) => updateAddress('line1', e.target.value)}
                    placeholder="House no., street, area"
                  />
                  {errors.line1 && <p className="text-xs text-brand mt-1">{errors.line1}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">City</label>
                  <input
                    className="input-base"
                    value={address.city}
                    onChange={(e) => updateAddress('city', e.target.value)}
                    placeholder="e.g. Coimbatore"
                  />
                  {errors.city && <p className="text-xs text-brand mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">State</label>
                  <select
                    className="input-base"
                    value={address.state}
                    onChange={(e) => updateAddress('state', e.target.value)}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center">
                  <CreditCard size={16} />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">Payment</h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {[
                  { key: 'card', label: 'Card', icon: CreditCard, hint: 'Visa, Mastercard, RuPay' },
                  { key: 'upi', label: 'UPI', icon: Smartphone, hint: 'GPay, PhonePe, Paytm' },
                  { key: 'cod', label: 'Cash on Delivery', icon: Banknote, hint: 'Pay when it arrives' },
                ].map((opt) => {
                  const Icon = opt.icon
                  const active = paymentMethod === opt.key
                  return (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => setPaymentMethod(opt.key)}
                      className={`text-left rounded-xl border-2 p-3.5 transition-all ${
                        active ? 'border-brand bg-brand-light' : 'border-thread hover:border-brand/40'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-brand' : 'text-ink-soft'} />
                      <p className={`text-sm font-semibold mt-2 ${active ? 'text-brand' : 'text-ink'}`}>{opt.label}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5">{opt.hint}</p>
                    </button>
                  )
                })}
              </div>

              {paymentMethod === 'card' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-ink-soft mb-1 block">Card number</label>
                    <input
                      className="input-base tracking-wider"
                      value={card.number}
                      onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                    />
                    {errors.cardNumber && <p className="text-xs text-brand mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-ink-soft mb-1 block">Name on card</label>
                    <input
                      className="input-base"
                      value={card.name}
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                      placeholder="As printed on the card"
                    />
                    {errors.cardName && <p className="text-xs text-brand mt-1">{errors.cardName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft mb-1 block">Expiry</label>
                    <input
                      className="input-base"
                      value={card.expiry}
                      onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                    />
                    {errors.cardExpiry && <p className="text-xs text-brand mt-1">{errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft mb-1 block">CVV</label>
                    <input
                      className="input-base"
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                      placeholder="•••"
                      inputMode="numeric"
                      type="password"
                    />
                    {errors.cardCvv && <p className="text-xs text-brand mt-1">{errors.cardCvv}</p>}
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">UPI ID</label>
                  <input
                    className="input-base"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@bank"
                  />
                  {errors.upiId && <p className="text-xs text-brand mt-1">{errors.upiId}</p>}
                  <p className="text-xs text-ink-soft mt-2">You'll get a payment request on your UPI app to approve.</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <p className="text-sm text-ink-soft bg-cream-dark rounded-lg px-4 py-3">
                  Pay in cash when your order is delivered. A small COD handling fee may apply for some pincodes.
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-ink-soft mt-5">
                <Lock size={12} /> Your payment details are encrypted and never stored in plain text.
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-24">
            <h3 className="font-display font-semibold text-ink mb-4">Order Summary</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 -mr-1">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color || ''}`} className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <img src={item.image} alt={item.name} onError={onImgError(item.fallbackSeed || item.id)} className="w-full h-full object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-ink-soft">{item.size}{item.color ? ` · ${item.color}` : ''}</p>
                  </div>
                  <p className="text-xs font-semibold text-ink shrink-0">{formatPrice(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="stitch-divider my-4" />

            <div className="space-y-2 text-sm text-ink-soft">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>
            <div className="border-t border-thread mt-3 pt-3 flex justify-between font-bold text-ink">
              <span>Total</span>
              <span className="text-brand">{formatPrice(total)}</span>
            </div>

            <button
              type="submit"
              disabled={placing}
              className="btn-primary w-full py-3.5 mt-6 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {placing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing payment…
                </>
              ) : (
                <>Place Order · {formatPrice(total)}</>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-soft mt-4">
              <ShieldCheck size={13} className="text-brand" /> 100% secure checkout
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
