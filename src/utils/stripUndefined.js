// Firestore rejects any `undefined` value, anywhere in a document --
// including nested inside objects/arrays -- with "Unsupported field value:
// undefined". A few places in the app end up with `undefined` on plain
// objects that are otherwise perfectly valid in JS (e.g. optional catalog
// fields in data/products.js, or a cart/order item spread from one of
// those products), so anything writing user-shaped data to Firestore
// should run it through this first.
//
// Leaves `null`, `0`, `false`, `''`, and Dates untouched -- only drops
// keys whose value is exactly `undefined`.
//
// NOTE: don't run this over a payload that contains a Firestore sentinel
// like serverTimestamp()/arrayUnion() -- it isn't a plain object and this
// would silently corrupt it. Strip the rest of the payload first, then
// add the sentinel field back in afterward (see OrderContext/CartContext
// for the pattern).
export function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined)
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {}
    Object.entries(value).forEach(([key, v]) => {
      if (v === undefined) return
      out[key] = stripUndefined(v)
    })
    return out
  }
  return value
}
