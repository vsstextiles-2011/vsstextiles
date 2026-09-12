import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'vss-cart-v1'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt/unavailable storage — just start empty; the cart still
    // works for this page view, it just won't survive a reload.
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or unavailable — cart still works in-memory for this
      // page view, it just won't persist past it.
    }
  }, [items])

  function addToCart(product, size = 'M', qty = 1, color = '') {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size && i.color === color)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size && i.color === color ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...product, size, qty, color }]
    })
  }

  function removeFromCart(id, size, color = '') {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size && i.color === color)))
  }

  function updateQty(id, size, qty, color = '') {
    if (qty < 1) return
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.size === size && i.color === color ? { ...i, qty } : i))
    )
  }

  function clearCart() {
    setItems([])
  }

  const cartCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const cartTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  )

  const value = { items, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
