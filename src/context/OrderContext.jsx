import { createContext, useContext, useEffect, useState } from 'react'
import { arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { stripUndefined } from '../utils/stripUndefined.js'

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
// Admin.jsx's Orders tab) moves an order through Processing -> Shipped ->
// Out for Delivery -> Delivered (or Cancelled) via updateOrderStatus
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
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
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
    if (!user) {
      throw new Error('You need to be signed in to place an order.')
    }

    const id = generateOrderId()
    const placedAt = new Date().toISOString()
    const order = {
      userId: user.uid,
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

    await setDoc(doc(db, ORDERS_COLLECTION, id), {
      // Cart items (see CartContext) are spread straight from product
      // data, and the static seed catalog (data/products.js) leaves a lot
      // of optional fields as literal `undefined` rather than omitting
      // them -- Firestore rejects `undefined` anywhere in a document, so
      // everything except the serverTimestamp() sentinel gets sanitized
      // here before the write.
      ...stripUndefined(order),
      createdAt: serverTimestamp(),
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
    const at = new Date().toISOString()
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      statusHistory: arrayUnion({ status, at }),
      statusUpdatedAt: serverTimestamp(),
      // Tracked so anyone looking at the order later -- and the lock
      // above -- can tell an admin cancellation from a customer one.
      ...(status === 'cancelled' ? { cancelledBy: 'admin' } : {}),
    })
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
    const at = new Date().toISOString()
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status: 'cancelled',
      statusHistory: arrayUnion({ status: 'cancelled', at }),
      statusUpdatedAt: serverTimestamp(),
      cancelledBy: 'user',
    })
  }

  function getOrder(id) {
    return orders.find((o) => o.id === id) || adminOrders.find((o) => o.id === id)
  }

  const value = {
    orders,
    isLoading,
    placeOrder,
    getOrder,
    adminOrders,
    adminOrdersLoading,
    updateOrderStatus,
    cancelOrder,
  }
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
