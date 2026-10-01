// Promo codes for the cart/checkout — one shared definition so Cart and
// Checkout can never disagree on what a code does.
//
// `minCartTotal`: the code only works when the cart subtotal is ABOVE this
// amount (strictly greater — exactly ₹1,000 does not qualify). When it does,
// the discount applies to the whole cart subtotal.
export const PROMO_CODES = {
  VSS10: { type: 'percent', value: 0.1, minCartTotal: 1000 },
}

export function cartSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

export function meetsMinimum(promo, items) {
  return !promo?.minCartTotal || cartSubtotal(items) > promo.minCartTotal
}

// Money the promo takes off the given cart items (0 if the minimum isn't met).
export function promoDiscountFor(promo, items) {
  if (!promo || !meetsMinimum(promo, items)) return 0
  const subtotal = cartSubtotal(items)
  return promo.type === 'percent'
    ? Math.round(subtotal * promo.value)
    : Math.min(promo.value, subtotal)
}
