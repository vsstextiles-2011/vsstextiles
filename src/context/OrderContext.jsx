import { createContext, useContext, useEffect, useState } from 'react'
import { arrayUnion, collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { stripUndefined } from '../utils/stripUndefined.js'
import { promoAllowedFor } from '../utils/promo.js'
import { fetchPromoCodes, isPromoActive } from '../utils/promoCodes.js'
import { checkStaff } from '../utils/catalogue.js'
import { logActivity } from '../utils/activityLog.js'
import { statusLabel } from '../utils/orderTracking.js'
import { canRequestReturn, RETURN_WINDOW_DAYS } from '../utils/orderTracking.js'
import { applyReturn, applySale, groupOrderLines } from '../utils/stock.js'
import { mirrorAllOrdersOnce, mirrorOrder, mongoEnabled, saveOrderToMongo } from '../utils/mongoSync.js'

const OrderContext = createContext(null)
const ORDERS_COLLECTION = 'orders'

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `VSS${stamp}${rand}`
}

function sortNewestFirst(list) {
  return [...list].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
}

// Orders live in Firestore now, one document per order, keyed by the
// human-readable order id (e.g. "VSSK3F9A2B") rather than an
// auto-generated one -- that's the same id used in the
// /order-confirmation/:orderId URL and shown to the customer, so keeping
// it as the actual document id means no separate lookup/index is needed.
//
// NOTE: placeOrder still writes "status: confirmed" straight from the
// browser, same as the old localStorage version -- there's no real
// payment verification yet. Once a payment gateway (e.g. Razorpay) is
// wired in, order creation and the "confirmed"/"paid" status flip should
// move into a Cloud Function that verifies the payment first, with
// firestore.rules locked down so a client can create a *pending* order
// but can no longer set its own status to confirmed/paid.
//
// From there, though, status DOES really change: the admin panel (see
// Admin.jsx's Orders tab) moves an order through Processing -> Packed ->
// Shipped -> Out for Delivery -> Delivered (or Cancelled, or after
// delivery Return Requested -> Returned -> Refunded) via updateOrderStatus
// below, and every change is appended to statusHistory so the customer's
// Track Order view (utils/orderTracking.js) can show a real timeline
// instead of a guess.
export function OrderProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // The signed-in shopper's own orders.
  useEffect(() => {
    if (!user) {
      setOrders([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', user.uid))
    let first = true
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Copy new / changed orders to MongoDB (no-op unless VITE_MONGO_API_URL
        // is set). The first snapshot is the initial load, not a change.
        if (!first) snapshot.docChanges().forEach((c) => c.type !== 'removed' && !c.doc.metadata.hasPendingWrites && mirrorOrder({ id: c.doc.id, ...c.doc.data() }))
        first = false
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Newest first -- sorted client-side so this doesn't need a
        // composite Firestore index just to list a shopper's own orders.
        setOrders(sortNewestFirst(list))
        setIsLoading(false)
      },
      (err) => {
        console.error('Orders sync failed:', err)
        setIsLoading(false)
      }
    )
    return unsubscribe
  }, [user])

  // Every order, for the admin panel. firestore.rules only lets this
  // query succeed for a verified admin (see isAdmin() there), so it's
  // gated the same way here to avoid firing a doomed listener for
  // ordinary shoppers.
  const [adminOrders, setAdminOrders] = useState([])
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) {
      setAdminOrders([])
      setAdminOrdersLoading(false)
      return
    }
    setAdminOrdersLoading(true)
    const q = query(collection(db, ORDERS_COLLECTION))
    let first = true
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Admin status changes (Shipped, Delivered, ...) reach MongoDB here.
        if (!first) snapshot.docChanges().forEach((c) => c.type !== 'removed' && !c.doc.metadata.hasPendingWrites && mirrorOrder({ id: c.doc.id, ...c.doc.data() }))
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        // First load of the admin panel: copy every order once so MongoDB is up to date.
        if (first) mirrorAllOrdersOnce(list)
        first = false
        setAdminOrders(sortNewestFirst(list))
        setAdminOrdersLoading(false)
      },
      (err) => {
        console.error('Admin orders sync failed:', err)
        setAdminOrdersLoading(false)
      }
    )
    return unsubscribe
  }, [isAdmin])

  async function placeOrder({ items, address, payment, totals }) {
    if (!user || user.isAnonymous) {
      throw new Error('Please log in or create an account to place an order.')
    }

    // Re-check the code against the admin's CURRENT promo list (it may have
    // been switched off or expired since it went into the cart), and
    // first-order-only codes against the shopper's real order history in
    // Firestore right now, so a returning customer can't slip them through.
    const usedCode = totals?.promoCode
    if (usedCode) {
      const staff = await checkStaff(user, isAdmin)
      const def = (await fetchPromoCodes({ includeStaff: staff }))[usedCode]
      if (!def || !isPromoActive(def) || !promoAllowedFor(def, { isStaff: staff })) {
        throw new Error(`The code ${usedCode} isn't valid any more. Please remove it and place your order again.`)
      }
      if (def.firstOrderOnly) {
        const prior = await getDocs(query(collection(db, ORDERS_COLLECTION), where('userId', '==', user.uid)))
        const hasPrevious = prior.docs.some((d) => d.data().status !== 'cancelled')
        if (!promoAllowedFor(def, { hasPreviousOrder: hasPrevious })) {
          throw new Error(`The code ${usedCode} isn't valid. Please remove it and place your order again.`)
        }
      }
    }

    const id = generateOrderId()
    const placedAt = new Date().toISOString()
    const order = {
      userId: user.uid,
      customer: { name: user.displayName || '', email: user.email || '' },
      placedAt,
      status: 'confirmed',
      // Every later status change (by the admin) is appended here so the
      // customer's tracking view can show a real per-stage timestamp
      // instead of an estimate. See utils/orderTracking.js.
      statusHistory: [{ status: 'confirmed', at: placedAt }],
      items,
      address,
      payment: {
        method: payment.method,
        // Never persist full card details -- only what's safe to show
        // back to the customer, same as a real payment gateway would
        // return. A real integration replaces this whole object with
        // whatever the gateway's response actually contains.
        ...(payment.method === 'card' ? { last4: payment.cardNumber.slice(-4) } : {}),
        ...(payment.method === 'upi' ? { upiId: payment.upiId } : {}),
      },
      totals,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // The order and the stock it uses are written in ONE transaction: the
    // product counts are re-read at that moment, an order for more than is
    // left is refused (so two shoppers can't both buy the last piece), and
    // the counts go down by exactly what was ordered. If anything fails,
    // neither the order nor the stock change is saved.
    const lines = groupOrderLines(items)
    const productIds = Object.keys(lines)
    await runTransaction(db, async (tx) => {
      const snaps = await Promise.all(productIds.map((pid) => tx.get(doc(db, 'products', pid))))
      const writes = []
      const moved = []
      snaps.forEach((snap, i) => {
        if (!snap.exists()) return // not a Firestore product (nothing to count)
        const { changes, shortage } = applySale({ id: snap.id, ...snap.data() }, lines[productIds[i]])
        if (shortage) throw new Error(`${shortage} Please update your cart and try again.`)
        if (changes) {
          writes.push([snap.ref, changes])
          lines[productIds[i]].forEach((l) => moved.push({ id: productIds[i], size: l.size || '', color: l.color || '', qty: l.qty }))
        }
      })
      writes.forEach(([ref, changes]) => tx.update(ref, { ...stripUndefined(changes), lastOrderId: id }))
      tx.set(doc(db, ORDERS_COLLECTION, id), {
        // Cart items (see CartContext) are spread straight from product
        // data, and the static seed catalog (data/products.js) leaves a lot
        // of optional fields as literal `undefined` rather than omitting
        // them -- Firestore rejects `undefined` anywhere in a document, so
        // everything except the serverTimestamp() sentinel gets sanitized
        // here before the write.
        ...stripUndefined(order),
        // Which units were taken off the stock counts, so a cancellation can
        // put back exactly those (and nothing that was never counted).
        ...(moved.length ? { stockDeducted: true, stockMoved: moved } : {}),
        createdAt: serverTimestamp(),
      })
    })
    return { id, ...order }
  }

  // Admin-only (also enforced server-side by firestore.rules): moves an
  // order to a new status and records when that happened. Uses arrayUnion
  // rather than overwriting the whole array so concurrent admins editing
  // different orders -- or quick repeat updates -- never clobber history.
  //
  // Cancellation is a one-way door, no matter who triggered it: once an
  // order is "cancelled" -- whether the admin set that status here or the
  // shopper cancelled it themselves via cancelOrder below -- this refuses
  // to move it anywhere else. firestore.rules enforces the same lock
  // server-side, so this client-side check is just for a fast, friendly
  // error message rather than a failed write.
  async function updateOrderStatus(orderId, status) {
    if (!isAdmin) {
      throw new Error('Only an admin can update order status.')
    }
    const current = adminOrders.find((o) => o.id === orderId)
    if (current?.status === 'cancelled') {
      throw new Error('This order was cancelled and its status can no longer be changed.')
    }
    if (current?.status === 'refunded') {
      throw new Error('This order was refunded and its status can no longer be changed.')
    }
    const at = new Date().toISOString()
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      statusHistory: arrayUnion({ status, at }),
      statusUpdatedAt: serverTimestamp(),
      // Tracked so anyone looking at the order later -- and the lock
      // above -- can tell an admin cancellation from a customer one.
      ...(status === 'cancelled' ? { cancelledBy: 'admin' } : {}),
    })
    // A cancelled order never reaches the customer, so its units go straight
    // back on the shelf. (Returned / refunded goods are put back by hand from
    // the order, once someone has checked they are fine to resell.)
    if (status === 'cancelled' && current?.stockDeducted && !current?.stockRestored) {
      restoreOrderStock(orderId).catch((err) => console.warn('Could not put stock back automatically:', err.message))
    }
    logActivity({
      action: 'order_status',
      targetType: 'order',
      targetId: orderId,
      targetName: `Order ${orderId}`,
      summary: `Order ${orderId}: ${current?.status ? `${statusLabel(current.status)} \u2192 ` : ''}${statusLabel(status)}`,
    })
    // Copy the change to MongoDB right now (not just via the live listener) so the
    // MongoDB order always matches. Returns true/false so the admin panel can say so.
    if (!mongoEnabled) return { mongo: 'off' }
    const base = current || { id: orderId }
    const saved = await saveOrderToMongo({
      ...base,
      id: orderId,
      status,
      statusHistory: [...(base.statusHistory || []), { status, at }],
      statusUpdatedAt: at,
      ...(status === 'cancelled' ? { cancelledBy: 'admin' } : {}),
    })
    return { mongo: saved ? 'ok' : 'failed' }
  }

  // Admin-only: courier name + tracking number for a shipment. The customer
  // sees it on their Track Order page. (The numbers are entered by hand, or
  // generated as a dummy until a real courier is connected.)
  async function updateOrderCourier(orderId, { courier, courierTrackingNumber }) {
    if (!isAdmin) throw new Error('Only an admin can update courier details.')
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      courier: (courier || '').trim().slice(0, 60),
      courierTrackingNumber: (courierTrackingNumber || '').trim().slice(0, 60),
      courierUpdatedAt: serverTimestamp(),
    })
  }

  // Admin-only: remembers that this order's units were already taken off the
  // product stock counts, so the same order can't be deducted twice.
  async function markOrderStockDeducted(orderId, moved) {
    if (!isAdmin) throw new Error('Only an admin can update stock.')
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { stockDeducted: true, ...(moved?.length ? { stockMoved: moved } : {}) })
  }

  // Admin-only: puts an order's units back into the product stock counts (a
  // cancelled / returned order). Safe to press twice: it checks and sets the
  // order's stockRestored flag inside one transaction, so units are only
  // ever returned once. Resolves to the number of products updated.
  async function restoreOrderStock(orderId) {
    if (!isAdmin) throw new Error('Only an admin can update stock.')
    const restored = await runTransaction(db, async (tx) => {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId)
      const orderSnap = await tx.get(orderRef)
      if (!orderSnap.exists()) throw new Error('Order not found.')
      const o = orderSnap.data()
      if (o.stockRestored || !o.stockDeducted) return 0
      // Orders reduced by hand before this feature have no stockMoved list.
      // A return of selected products puts back only those products.
      const inReturn = ['return-requested', 'return-approved', 'pickup-scheduled', 'returned', 'refunded'].includes(o.status)
      const by = groupOrderLines(inReturn && Array.isArray(o.returnItems) && o.returnItems.length ? o.returnItems : Array.isArray(o.stockMoved) ? o.stockMoved : o.items)
      const ids = Object.keys(by)
      const snaps = await Promise.all(ids.map((pid) => tx.get(doc(db, 'products', pid))))
      let n = 0
      snaps.forEach((snap, i) => {
        if (!snap.exists()) return
        const changes = applyReturn({ id: snap.id, ...snap.data() }, by[ids[i]])
        if (!changes) return
        tx.update(snap.ref, stripUndefined(changes))
        n += 1
      })
      tx.update(orderRef, { stockRestored: true })
      return n
    })
    if (restored) {
      logActivity({
        action: 'stock_restore',
        targetType: 'order',
        targetId: orderId,
        targetName: `Order ${orderId}`,
        summary: `Order ${orderId}: put stock back for ${restored} product${restored === 1 ? '' : 's'}`,
      })
    }
    return restored
  }

  // Customer-initiated cancellation. A shopper may cancel their own order
  // right up until it's been delivered (or already cancelled) -- once
  // cancelled this way, firestore.rules stops the admin from moving it to
  // any other status (see the rules file), matching the same one-way-door
  // behaviour as an admin cancellation above.
  async function cancelOrder(orderId) {
    if (!user) {
      throw new Error('You need to be signed in to cancel an order.')
    }
    const current = orders.find((o) => o.id === orderId)
    if (!current) {
      throw new Error('Order not found.')
    }
    if (current.status === 'cancelled') {
      throw new Error('This order is already cancelled.')
    }
    if (current.status === 'delivered') {
      throw new Error('A delivered order can no longer be cancelled.')
    }
    if (['return-requested', 'return-approved', 'pickup-scheduled', 'returned', 'refunded'].includes(current.status)) {
      throw new Error('This order is already in the return process and can no longer be cancelled.')
    }
    const at = new Date().toISOString()
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status: 'cancelled',
      statusHistory: arrayUnion({ status: 'cancelled', at }),
      statusUpdatedAt: serverTimestamp(),
      cancelledBy: 'user',
    })
  }

  // Customer-initiated return request. Only possible once the order is
  // Delivered (firestore.rules enforces the same). Moves the order to
  // "return-requested" with the reason, so the admin sees it in Orders.
  async function requestReturn(orderId, { reason, comment, items: picked }) {
    if (!user) throw new Error('You need to be signed in to request a return.')
    const current = orders.find((o) => o.id === orderId)
    if (!current) throw new Error('Order not found.')
    if (current.status !== 'delivered') throw new Error('A return can only be requested after the order is delivered.')
    if (!canRequestReturn(current)) throw new Error(`The ${RETURN_WINDOW_DAYS}-day return period for this order has ended.`)
    const cleanReason = String(reason || '').trim().slice(0, 120)
    if (!cleanReason) throw new Error('Please choose a reason for the return.')
    // Only the products the shopper picked are returned (index = line in the order).
    const returnItems = (Array.isArray(picked) ? picked : [])
      .map((pk) => {
        const line = (current.items || [])[pk.index]
        const qty = Math.min(Math.max(1, Math.floor(Number(pk.qty) || 0)), Number(line?.qty) || 0)
        if (!line || qty < 1) return null
        return { index: pk.index, id: line.id, name: String(line.name || '').slice(0, 150), size: line.size || '', color: line.color || '', qty, price: Number(line.price) || 0 }
      })
      .filter(Boolean)
    if (returnItems.length === 0) throw new Error('Please select at least one product to return.')
    const at = new Date().toISOString()
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      returnItems,
      status: 'return-requested',
      statusHistory: arrayUnion({ status: 'return-requested', at }),
      statusUpdatedAt: serverTimestamp(),
      returnReason: cleanReason,
      returnComment: String(comment || '').trim().slice(0, 500),
      returnRequestedAt: at,
    })
  }

  function getOrder(id) {
    return orders.find((o) => o.id === id) || adminOrders.find((o) => o.id === id)
  }

  // Has this shopper already placed an order (cancelled ones don't count)?
  // Drives the first-order-only promo code (first-order-only codes).
  const hasPreviousOrder = orders.some((o) => o.status !== 'cancelled')

  const value = {
    orders,
    isLoading,
    hasPreviousOrder,
    placeOrder,
    getOrder,
    adminOrders,
    adminOrdersLoading,
    updateOrderStatus,
    updateOrderCourier,
    markOrderStockDeducted,
    restoreOrderStock,
    cancelOrder,
    requestReturn,
  }
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
