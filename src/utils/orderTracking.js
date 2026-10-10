// Order status is now a real field the admin sets from the Admin panel
// (see Admin.jsx's Orders tab + OrderContext.updateOrderStatus), with every
// change appended to statusHistory so each stage keeps its own timestamp.
// This replaces the old time-estimated version of this file, which
// guessed progress from placedAt/estimatedDelivery because nothing ever
// updated status after order creation.

export const STAGE_DEFS = [
  { id: 'confirmed', label: 'Order Confirmed', description: 'We\u2019ve received your order and payment.' },
  { id: 'processing', label: 'Processing', description: 'We\u2019re getting your items ready.' },
  { id: 'packed', label: 'Packed', description: 'Your order is packed and waiting for the courier.' },
  { id: 'shipped', label: 'Shipped', description: 'Your order has left our warehouse.' },
  { id: 'out-for-delivery', label: 'Out for Delivery', description: 'Your order is on its way to you.' },
  { id: 'delivered', label: 'Delivered', description: 'Your order has been delivered.' },
]

const STAGE_ORDER = STAGE_DEFS.map((s) => s.id)

// Side flow that only applies AFTER an order has been delivered: the
// customer asks to send it back, we receive it, then refund the money.
// These sit outside the main delivery timeline and get their own small
// "Return & Refund" timeline (see getReturnSteps / ReturnTimeline).
export const RETURN_STAGE_DEFS = [
  { id: 'return-requested', label: 'Return Requested', description: 'A return has been requested for this order.' },
  { id: 'returned', label: 'Returned', description: 'We\u2019ve received the returned items.' },
  { id: 'refunded', label: 'Refunded', description: 'Your refund has been issued.' },
]
const RETURN_ORDER = RETURN_STAGE_DEFS.map((s) => s.id)

// Everything an admin can set an order to -- the main delivery stages,
// "cancelled" (outside the normal flow), and the return/refund statuses.
export const ORDER_STATUS_OPTIONS = [
  ...STAGE_DEFS.map((s) => ({ id: s.id, label: s.label })),
  { id: 'cancelled', label: 'Cancelled' },
  ...RETURN_STAGE_DEFS.map((s) => ({ id: s.id, label: s.label })),
]

// Statuses that mean the money is no longer (or never was) revenue --
// used by the Admin sales totals.
export const NON_REVENUE_STATUSES = ['cancelled', 'refunded']

// A customer can't cancel once an order is delivered, or once a return
// has started. Keep in sync with firestore.rules and OrderContext.cancelOrder.
export const NON_CANCELLABLE_STATUSES = ['delivered', 'cancelled', ...RETURN_ORDER]

export function isOrderInReturnFlow(order) {
  return RETURN_ORDER.includes(order?.status)
}

export function isOrderCancelled(order) {
  return order?.status === 'cancelled'
}

function normalizedHistory(order) {
  if (order?.statusHistory?.length) return order.statusHistory
  // Older orders created before statusHistory existed: fall back to just
  // the "confirmed" stage at placedAt so the timeline still renders.
  return [{ status: 'confirmed', at: order?.placedAt }]
}

function dateForStage(history, stageId) {
  // Last matching entry wins, in case a status was ever set more than once.
  const entry = [...history].reverse().find((h) => h.status === stageId)
  return entry?.at ? new Date(entry.at) : null
}

export function getTrackingSteps(order) {
  if (!order) return []

  const history = normalizedHistory(order)
  const status = order.status || 'confirmed'
  const cancelled = status === 'cancelled'

  // A cancelled order freezes at whichever real stage it last reached
  // before being cancelled, rather than resetting to the very start.
  // A returned order has, by definition, already been delivered, so the
  // main timeline stays complete and the return steps are shown separately.
  const effectiveStatus = cancelled || RETURN_ORDER.includes(status)
    ? [...history].reverse().find((h) => STAGE_ORDER.includes(h.status))?.status || 'confirmed'
    : status

  const currentIndex = Math.max(STAGE_ORDER.indexOf(effectiveStatus), 0)

  return STAGE_DEFS.map((stage, i) => ({
    ...stage,
    done: i <= currentIndex,
    current: i === currentIndex,
    date: dateForStage(history, stage.id),
  }))
}

// Steps for the Return & Refund timeline. Empty unless the order has
// actually entered the return flow, so callers can just check .length.
export function getReturnSteps(order) {
  if (!isOrderInReturnFlow(order)) return []
  const history = normalizedHistory(order)
  const currentIndex = RETURN_ORDER.indexOf(order.status)
  return RETURN_STAGE_DEFS.map((stage, i) => ({
    ...stage,
    done: i <= currentIndex,
    current: i === currentIndex,
    date: dateForStage(history, stage.id),
  }))
}

export function getTrackingNumber(order) {
  if (!order) return ''
  // Deterministic pseudo tracking number derived from the order id so it
  // stays stable across renders without needing its own field in Firestore.
  let hash = 0
  for (let i = 0; i < order.id.length; i++) {
    hash = (hash * 31 + order.id.charCodeAt(i)) >>> 0
  }
  return `VSSTRK${(hash % 1000000000).toString().padStart(9, '0')}`
}

export function statusLabel(statusId) {
  return ORDER_STATUS_OPTIONS.find((s) => s.id === statusId)?.label || statusId
}
