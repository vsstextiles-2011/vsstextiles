import { createContext, useContext, useEffect, useState } from 'react'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'vss-wishlist-v1'

function loadWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt/unavailable storage — just start empty; the wishlist still
    // works for this page view, it just won't survive a reload.
    return []
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(loadWishlist)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage full or unavailable — wishlist still works in-memory for
      // this page view, it just won't persist past it.
    }
  }, [items])

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
