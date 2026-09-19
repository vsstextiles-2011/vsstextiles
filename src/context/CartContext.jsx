import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { stripUndefined } from '../utils/stripUndefined.js'

const CartContext = createContext(null)
// Used only as a brief pre-auth staging area -- the moment we have a
// Firebase uid (anonymous or real), Firestore becomes the source of truth
// and this key is cleared.
const STAGING_KEY = 'vss-cart-v1'

function loadStagedCart() {
  try {
    const raw = localStorage.getItem(STAGING_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStagedCart(items) {
  try {
    localStorage.setItem(STAGING_KEY, JSON.stringify(items))
  } catch {
    // Storage full/unavailable -- cart still works in-memory this page view.
  }
}

// Combine a cart already saved in Firestore with whatever was staged
// locally before auth resolved (e.g. items added in the first instant of
// a page load). Matches CartContext's own identity rule: same product id +
// size + color merges quantities; anything new is appended.
function mergeCarts(remote, staged) {
  const merged = [...remote]
  staged.forEach((s) => {
    const idx = merged.findIndex((i) => i.id === s.id && i.size === s.size && i.color === s.color)
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], qty: merged[idx].qty + s.qty }
    } else {
      merged.push(s)
    }
  })
  return merged
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(loadStagedCart)
  const mergedRef = useRef(false)

  // Anonymous sign-in for guest shoppers is handled once, centrally, in
  // AuthContext -- not here. It used to live in this file, but running it
  // as its own independent effect meant it could occasionally finish
  // *after* a real login elsewhere in the app and silently overwrite that
  // session. AuthContext now does this as part of its own bootstrap,
  // fully resolved (via its `loading` flag) before any login/signup form
  // becomes interactive, which closes that race entirely. By the time
  // this component sees a `user`, it's always the right one.

  const uid = user?.uid

  // Subscribe to this shopper's cart doc. On the very first snapshot for a
  // given uid, fold in anything staged in localStorage (see mergeCarts)
  // and clear the staging key -- every snapshot after that is just a
  // normal live sync.
  useEffect(() => {
    mergedRef.current = false
    if (!uid) return

    const cartRef = doc(db, 'carts', uid)
    const unsubscribe = onSnapshot(
      cartRef,
      (snap) => {
        const remoteItems = snap.exists() ? snap.data().items || [] : []
        if (!mergedRef.current) {
          mergedRef.current = true
          const staged = loadStagedCart()
          if (staged.length) {
            const merged = mergeCarts(remoteItems, staged)
            setDoc(cartRef, { items: merged, updatedAt: serverTimestamp() }, { merge: true }).catch((err) =>
              console.error('Could not merge staged cart into Firestore:', err)
            )
            localStorage.removeItem(STAGING_KEY)
            setItems(merged)
            return
          }
        }
        setItems(remoteItems)
      },
      (err) => {
        console.error('Cart sync failed -- falling back to local cart:', err)
        setItems(loadStagedCart())
      }
    )
    return unsubscribe
  }, [uid])

  // Every mutation updates local state immediately (so the UI never waits
  // on a round trip) and persists right afterward -- to Firestore once we
  // have a uid, to localStorage staging until then.
  function persist(nextItems) {
    setItems(nextItems)
    if (uid) {
      // Cart items are spread straight from product data (see addToCart
      // below), and the static seed catalog leaves several optional
      // fields as literal `undefined` -- Firestore rejects `undefined`
      // anywhere in a document, so sanitize before every save.
      setDoc(doc(db, 'carts', uid), { items: stripUndefined(nextItems), updatedAt: serverTimestamp() }, { merge: true }).catch(
        (err) => console.error('Could not save cart to Firestore:', err)
      )
    } else {
      saveStagedCart(nextItems)
    }
  }

  function addToCart(product, size = 'M', qty = 1, color = '') {
    const existing = items.find((i) => i.id === product.id && i.size === size && i.color === color)
    const next = existing
      ? items.map((i) =>
          i.id === product.id && i.size === size && i.color === color ? { ...i, qty: i.qty + qty } : i
        )
      : [...items, { ...product, size, qty, color }]
    persist(next)
  }

  function removeFromCart(id, size, color = '') {
    persist(items.filter((i) => !(i.id === id && i.size === size && i.color === color)))
  }

  function updateQty(id, size, qty, color = '') {
    if (qty < 1) return
    persist(items.map((i) => (i.id === id && i.size === size && i.color === color ? { ...i, qty } : i)))
  }

  function clearCart() {
    persist([])
  }

  const cartCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const cartTotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])

  const value = { items, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
