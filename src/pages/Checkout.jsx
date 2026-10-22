import { useEffect, useState } from 'react'
import { useStaffAccess } from '../utils/catalogue.js'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import {
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Lock,
  Loader2,
  ChevronLeft,
  MapPin,
  PartyPopper,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgError } from '../utils/imgFallback.js'
import { INDIAN_STATES as STATES } from '../utils/indianStates.js'
import { promoDiscountFor } from '../utils/promo.js'
import { BUSINESS } from '../data/business.js'
import { phoneError } from '../utils/phone.js'

const PROMO_STORAGE_KEY = 'vss-active-promo'

// Checkout-only "big order" perk: crossing ₹10,000 unlocks an automatic 25%
// off, on top of anything already applied at Cart (a promo code, say).
// Deliberately not touched anywhere in Cart.jsx / CartContext — it's meant
// to be a checkout-page surprise, not something shown while still shopping.
const BIG_ORDER_THRESHOLD = 10000
const BIG_ORDER_DISCOUNT_RATE = 0.25

function Stepper({ step }) {
  const steps = ['Cart', 'Delivery & Payment', 'Order Placed']
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
  const { placeOrder, hasPreviousOrder } = useOrders()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  let promo = null
  try { promo = JSON.parse(sessionStorage.getItem(PROMO_STORAGE_KEY)) } catch { promo = null }
  const { allowed: isStaff } = useStaffAccess()
  const promoDiscount = promoDiscountFor(promo, items, { hasPreviousOrder, isStaff })
  // Big-order perk is based on the cart's real subtotal, not whatever's left
  // after a promo code — so it kicks in as soon as the cart itself crosses
  // ₹10,000, and stacks with (rather than replaces) any promo discount.
  const qualifiesForBigOrderOffer = cartTotal > BIG_ORDER_THRESHOLD
  const bigOrderDiscount = qualifiesForBigOrderOffer
    ? Math.round(cartTotal * BIG_ORDER_DISCOUNT_RATE)
    : 0
  const discount = promoDiscount + bigOrderDiscount
  const discountedSubtotal = Math.max(0, cartTotal - discount)
  const shipping = cartTotal > BUSINESS.freeShippingAbove || cartTotal === 0 ? 0 : BUSINESS.shippingFee
  const total = discountedSubtotal + shipping

  const [address, setAddress] = useState({
    fullName: user?.displayName || '', phone: '', pincode: '', line1: '', area: '', city: '', state: STATES[0],
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [upiId, setUpiId] = useState('')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState('')

  // Addresses the shopper saved on the Profile page (users/{uid}.addresses).
  // They're offered at the top of this form, and the default one (or the
  // first) is filled in automatically as soon as they load — unless the
  // shopper has already started typing something themselves.
  const [savedAddresses, setSavedAddresses] = useState([])
  const [profilePhone, setProfilePhone] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressTouched, setAddressTouched] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  useEffect(() => {
    if (!user || user.isAnonymous) return undefined
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.exists() ? snap.data() : {}
        setSavedAddresses(Array.isArray(data.addresses) ? data.addresses : [])
        setProfilePhone(typeof data.phone === 'string' ? data.phone.replace(/\D/g, '').slice(-10) : '')
      },
      (err) => console.error('Could not load saved addresses:', err),
    )
  }, [user])

  useEffect(() => {
    if (autoFilled || addressTouched) return
    if (savedAddresses.length) {
      fillFromSavedAddress(savedAddresses.find((a) => a.isDefault) || savedAddresses[0])
      setAutoFilled(true)
    } else if (profilePhone) {
      setAddress((prev) => (prev.phone ? prev : { ...prev, phone: profilePhone }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses, profilePhone])

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  // A shopper gets a Firebase uid (anonymous or real) the moment the app
  // loads -- see CartContext -- but there's a brief window before that
  // resolves. Placing an order needs a uid, so hold the button until it's
  // ready rather than letting placeOrder fail.
  if (authLoading) {
    return (
      <section className="section-py bg-cream min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-ink-soft flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Preparing checkout…
        </p>
      </section>
    )
  }

  function updateAddress(field, value) {
    setAddressTouched(true)
    setSelectedAddressId(null)
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  // Fills the whole form from one of the shopper's saved addresses.
  function fillFromSavedAddress(a) {
    setAddress({
      fullName: a.fullName || user?.displayName || '',
      phone: (a.phone || profilePhone || '').replace(/\D/g, '').slice(-10),
      pincode: a.pincode || '',
      line1: a.line1 || '',
      area: a.area || '',
      city: a.city || '',
      state: STATES.includes(a.state) ? a.state : STATES[0],
    })
    setSelectedAddressId(a.id)
    setErrors({})
  }

  // "Use a different address": a blank form (name/phone still pre-filled).
  function fillBlankAddress() {
    setAddressTouched(true)
    setSelectedAddressId(null)
    setAddress({ fullName: user?.displayName || '', phone: profilePhone || '', pincode: '', line1: '', area: '', city: '', state: STATES[0] })
    setErrors({})
  }

  function validate() {
    const next = {}
    if (!address.fullName.trim()) next.fullName = 'Enter the recipient\'s name'
    { const pErr = phoneError(address.phone); if (pErr) next.phone = pErr }
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
    setOrderError('')
    try {
      const order = await placeOrder({
        items,
        address,
        payment: { method: paymentMethod, cardNumber: card.number.replace(/\s/g, ''), upiId },
        totals: {
          subtotal: cartTotal,
          discount,
          promoCode: promoDiscount > 0 ? promo?.code || null : null,
          bigOrderDiscount,
          shipping,
          total,
        },
      })
      clearCart()
      sessionStorage.removeItem(PROMO_STORAGE_KEY)
      navigate(`/order-confirmation/${order.id}`)
    } catch (err) {
      console.error('Could not place order:', err)
      setOrderError(err.message || 'Could not place your order — please try again.')
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
                <div><h2 className="font-display text-lg font-semibold text-ink">Delivery Details</h2><p className="text-xs text-ink-soft mt-0.5">Just the details we need to deliver your order.</p></div>
              </div>

              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-medium text-ink-soft">Your saved addresses</p>
                    <Link to="/profile" state={{ tab: 'addresses' }} className="text-xs text-brand hover:underline">Manage</Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((a) => {
                      const active = selectedAddressId === a.id
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => fillFromSavedAddress(a)}
                          aria-pressed={active}
                          className={`text-left rounded-xl border p-3.5 transition-colors ${
                            active ? 'border-brand bg-brand-light/40' : 'border-thread hover:border-ink/40 bg-white'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">{a.label || 'Address'}</span>
                            {active && <CheckCircle2 size={16} className="text-brand shrink-0" />}
                          </span>
                          <span className="block text-sm font-medium text-ink mt-2">{a.fullName}{a.phone ? ` · ${a.phone}` : ''}</span>
                          <span className="block text-xs text-ink-soft mt-0.5">
                            {a.line1}{a.area ? `, ${a.area}` : ''}, {a.city}, {a.state} - {a.pincode}
                          </span>
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={fillBlankAddress}
                      className="rounded-xl border border-dashed border-thread hover:border-brand/60 hover:text-brand text-ink-soft p-3.5 text-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus size={15} /> Use a different address
                    </button>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Full name</label>
                  <input
                    className="input-base"
                    value={address.fullName}
                    onChange={(e) => updateAddress('fullName', e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
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
                    inputMode="tel"
                    autoComplete="tel"
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
                    autoComplete="postal-code"
                  />
                  {errors.pincode && <p className="text-xs text-brand mt-1">{errors.pincode}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Address</label>
                  <input
                    className="input-base"
                    value={address.line1}
                    onChange={(e) => updateAddress('line1', e.target.value)}
                    placeholder="House / Flat no., street"
                    autoComplete="address-line1"
                  />
                  {errors.line1 && <p className="text-xs text-brand mt-1">{errors.line1}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-ink-soft mb-1 block">Area / Landmark <span className="font-normal text-ink-soft/60">(optional)</span></label>
                  <input
                    className="input-base"
                    value={address.area}
                    onChange={(e) => updateAddress('area', e.target.value)}
                    placeholder="Area, landmark or nearby place"
                    autoComplete="address-line2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-1 block">City</label>
                  <input
                    className="input-base"
                    value={address.city}
                    onChange={(e) => updateAddress('city', e.target.value)}
                    placeholder="City"
                    autoComplete="address-level2"
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
                  { key: 'cod', label: 'Cash on Delivery', icon: Banknote, hint: 'Easiest · Pay on delivery' },
                  { key: 'upi', label: 'UPI', icon: Smartphone, hint: 'GPay, PhonePe, Paytm' },
                  { key: 'card', label: 'Card', icon: CreditCard, hint: 'Visa, Mastercard, RuPay' },
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
                  Pay when your order arrives. No online payment details needed.
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

            {/* Checkout-only perk banner — never shown on the Cart page,
                only appears once the cart's real subtotal clears ₹10,000. */}
            {qualifiesForBigOrderOffer && (
              <div className="flex items-start gap-2.5 rounded-xl bg-brand-light border border-brand-soft px-3.5 py-3 mb-4">
                <PartyPopper size={18} className="text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-brand leading-relaxed">
                  <span className="font-semibold">Special Offer unlocked!</span> Orders above{' '}
                  {formatPrice(BIG_ORDER_THRESHOLD)} get an extra{' '}
                  {Math.round(BIG_ORDER_DISCOUNT_RATE * 100)}% off, applied automatically below.
                </p>
              </div>
            )}

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
                    <p className="text-[11px] text-ink-soft flex items-center gap-1">
                      <span>{item.size}{item.color ? ` · ${item.color}` : ''}</span>
                      {item.color && (() => {
                        const swatch = item.colors?.find((c) => c.name === item.color)
                        if (!swatch) return null
                        return (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-ink/20 shrink-0"
                            style={
                              swatch.topHex
                                ? { background: `conic-gradient(${swatch.topHex} 0deg 180deg, ${swatch.hex} 180deg 360deg)` }
                                : { backgroundColor: swatch.hex }
                            }
                            aria-hidden="true"
                          />
                        )
                      })()}
                    </p>
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
              {promoDiscount > 0 && (
                <div className="flex justify-between text-brand">
                  <span>Offer {promo?.code ? `(${promo.code})` : ''}</span>
                  <span>−{formatPrice(promoDiscount)}</span>
                </div>
              )}
              {bigOrderDiscount > 0 && (
                <div className="flex justify-between text-brand">
                  <span>Special Offer ({Math.round(BIG_ORDER_DISCOUNT_RATE * 100)}% off)</span>
                  <span>−{formatPrice(bigOrderDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>
            <div className="border-t border-thread mt-3 pt-3 flex justify-between font-bold text-ink">
              <span>Total</span>
              <span className="text-brand">{formatPrice(total)}</span>
            </div>

            {orderError && (
              <p className="text-xs text-brand text-center mt-3">{orderError}</p>
            )}

            <button
              type="submit"
              disabled={placing}
              className="btn-primary w-full py-3.5 mt-6 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {placing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Placing order…
                </>
              ) : (
                <>Place Order · {formatPrice(total)}</>
              )}
            </button>

            <p className="text-[11px] text-ink-soft text-center mt-3">
              By placing your order you agree to our{' '}
              <Link to="/terms" className="text-brand hover:underline">Terms</Link>,{' '}
              <Link to="/privacy-policy" className="text-brand hover:underline">Privacy Policy</Link>,{' '}
              <Link to="/refund-policy" className="text-brand hover:underline">Refund Policy</Link> and{' '}
              <Link to="/shipping-policy" className="text-brand hover:underline">Shipping Policy</Link>.
            </p>

            <div className="flex items-center justify-center gap-1.5 text-xs text-ink-soft mt-4">
              <ShieldCheck size={13} className="text-brand" /> Safe & simple checkout{user?.email ? ` · Signed in as ${user.email}` : ''}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
