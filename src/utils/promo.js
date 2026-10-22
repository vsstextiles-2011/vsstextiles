// Promo codes for the cart/checkout — one shared definition so Cart and
// Checkout can never disagree on what a code does.
//
// `minCartTotal` (optional): when set, the code only works when the cart
// subtotal is ABOVE this amount (strictly greater). VSS10 has no minimum — any
// first order qualifies, whatever the cart total. The discount applies to the
// whole cart subtotal.
//
// `firstOrderOnly`: the code works only for a shopper who has never placed an
// order (a cancelled order doesn't count). Once they have, it is treated as
// an invalid code everywhere and is no longer suggested.
export const PROMO_CODES = {
  VSS10: { type: 'percent', value: 0.1, firstOrderOnly: true },
}

// False when this shopper isn't allowed to use the code at all.
// `staffOnly` codes work only for company staff (isStaff) - see utils/catalogue.js.
export function promoAllowedFor(promo, { hasPreviousOrder = false, isStaff = false } = {}) {
  if (promo?.staffOnly && !isStaff) return false
  return !(promo?.firstOrderOnly && hasPreviousOrder)
}

export function cartSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

export function meetsMinimum(promo, items) {
  return !promo?.minCartTotal || cartSubtotal(items) > promo.minCartTotal
}

// Money the promo takes off the given cart items (0 if the minimum isn't met).
export function promoDiscountFor(promo, items, shopper) {
  if (!promo || !promoAllowedFor(promo, shopper) || !meetsMinimum(promo, items)) return 0
  const subtotal = cartSubtotal(items)
  return promo.type === 'percent'
    ? Math.round(subtotal * promo.value)
    : Math.min(promo.value, subtotal)
}
