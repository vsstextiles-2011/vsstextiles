import { createContext, useContext, useState } from 'react'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([])

  function isWishlisted(id) {
    return items.some((i) => i.id === id)
  }

  function toggleWishlist(product) {
    setItems((prev) =>
      prev.some((i) => i.id === product.id)
        ? prev.filter((i) => i.id !== product.id)
        : [...prev, product]
    )
  }

  function removeFromWishlist(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const value = { items, isWishlisted, toggleWishlist, removeFromWishlist, wishlistCount: items.length }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
