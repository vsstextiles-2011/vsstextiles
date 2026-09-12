import { createContext, useContext, useEffect, useState } from 'react'

const OrderContext = createContext(null)
const STORAGE_KEY = 'vss-orders'

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `VSS${stamp}${rand}`
}

// This stands in for a real backend/order-service. In a production build,
// `placeOrder` would POST to a payments + orders API instead of writing to
// localStorage — the shape of the request/response is designed to match
// that (address, items, payment method, totals in, an order record with id
// + status out) so swapping in a real endpoint later is a small change.
export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }, [orders])

  async function placeOrder({ items, address, payment, totals }) {
    // Simulate network + payment-gateway latency.
    await new Promise((resolve) => setTimeout(resolve, 1400))

    const order = {
      id: generateOrderId(),
      placedAt: new Date().toISOString(),
      status: 'confirmed',
      items,
      address,
      payment: {
        method: payment.method,
        // Never persist full card details — only what's safe to show back
        // to the customer, same as a real payment gateway would return.
        last4: payment.method === 'card' ? payment.cardNumber.slice(-4) : undefined,
        upiId: payment.method === 'upi' ? payment.upiId : undefined,
      },
      totals,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }

    setOrders((prev) => [order, ...prev])
    return order
  }

  function getOrder(id) {
    return orders.find((o) => o.id === id)
  }

  const value = { orders, placeOrder, getOrder }
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
