import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './AuthContext.jsx'
import { stripUndefined } from '../utils/stripUndefined.js'

const WishlistContext = createContext(null)
// Used only as a brief pre-auth staging area -- the moment we have a
// Firebase uid (anonymous or real), Firestore becomes the source of truth
// and this key is cleared. Mirrors CartContext's staging approach.
const STAGING_KEY = 'vss-wishlist-v1'

function loadStagedWishlist() {
  try {
    const raw = localStorage.getItem(STAGING_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt/unavailable storage — just start empty; the wishlist still
    // works for this page view, it just won't survive a reload.
    return []
  }
}

function saveStagedWishlist(items) {
  try {
    localStorage.setItem(STAGING_KEY, JSON.stringify(items))
  } catch {
    // Storage full/unavailable -- wishlist still works in-memory this page view.
  }
}

// Combine a wishlist already saved in Firestore with whatever was staged
// locally before auth resolved (e.g. items favorited in the first instant
// of a page load). Products are unique by id, so this is a plain union.
function mergeWishlists(remote, staged) {
  const merged = [...remote]
  staged.forEach((s) => {
    if (!merged.some((i) => i.id === s.id)) {
      merged.push(s)
    }
  })
  return merged
}

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(loadStagedWishlist)
  const mergedRef = useRef(false)

  // Anonymous sign-in for guest shoppers is handled once, centrally, in
  // AuthContext -- see CartContext for the same note. By the time this
  // component sees a `user`, it's always the right one.

  const uid = user?.uid

  // Subscribe to this shopper's wishlist doc. On the very first snapshot
  // for a given uid, fold in anything staged in localStorage (see
  // mergeWishlists) and clear the staging key -- every snapshot after
  // that is just a normal live sync, so a login on another tab/device
  // shows up here too.
  useEffect(() => {
    mergedRef.current = false
    if (!uid) return

    const wishlistRef = doc(db, 'wishlists', uid)
    const unsubscribe = onSnapshot(
      wishlistRef,
      (snap) => {
        const remoteItems = snap.exists() ? snap.data().items || [] : []
        if (!mergedRef.current) {
          mergedRef.current = true
          const staged = loadStagedWishlist()
          if (staged.length) {
            const merged = mergeWishlists(remoteItems, staged)
            setDoc(wishlistRef, { items: stripUndefined(merged), updatedAt: serverTimestamp() }, { merge: true }).catch((err) =>
              console.error('Could not merge staged wishlist into Firestore:', err)
            )
            localStorage.removeItem(STAGING_KEY)
            setItems(merged)
            return
          }
        }
        setItems(remoteItems)
      },
      (err) => {
        console.error('Wishlist sync failed -- falling back to local wishlist:', err)
        setItems(loadStagedWishlist())
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
      // Wishlist items are whole product objects, and the static seed
      // catalog leaves several optional fields as literal `undefined` --
      // Firestore rejects `undefined` anywhere in a document, so
      // sanitize before every save.
      setDoc(doc(db, 'wishlists', uid), { items: stripUndefined(nextItems), updatedAt: serverTimestamp() }, { merge: true }).catch(
        (err) => console.error('Could not save wishlist to Firestore:', err)
      )
    } else {
      saveStagedWishlist(nextItems)
    }
  }

  function isWishlisted(id) {
    return items.some((i) => i.id === id)
  }

  function toggleWishlist(product) {
    const next = items.some((i) => i.id === product.id)
      ? items.filter((i) => i.id !== product.id)
      : [...items, product]
    persist(next)
  }

  function removeFromWishlist(id) {
    persist(items.filter((i) => i.id !== id))
  }

  const value = { items, isWishlisted, toggleWishlist, removeFromWishlist, wishlistCount: items.length }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
