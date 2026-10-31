// Couriers the admin can pick when entering a shipment's tracking number.
export const COURIERS = ['India Post', 'DTDC', 'Delhivery', 'Blue Dart', 'Xpressbees', 'Ecom Express', 'Shadowfax', 'Other']

// A made-up tracking number for testing, stable-looking but unique per call.
export function dummyCourierNumber(orderId = '') {
  const tail = String(orderId).replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4)
  const rand = Math.floor(Math.random() * 1e8).toString().padStart(8, '0')
  return `DUM${rand}${tail}`.slice(0, 20)
}
