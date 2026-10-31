// Product page views (Firestore collection "productViews").
//  - The product page calls trackProductView() once per product per browser
//    session (refreshing the page doesn't inflate the count).
//  - One document per product per day: id "<YYYY-MM-DD>_<productId>", so the
//    admin Sales tab can show "most viewed" for any date range.
//  - Security lives in firestore.rules: anyone may add exactly +1 to a day's
//    counter; only a signed-in admin can read the numbers.
import { useEffect, useState } from 'react'
import { collection, doc, increment, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export const PRODUCT_VIEWS_COLLECTION = 'productViews'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function trackProductView(product) {
  if (!product?.id) return
  try {
    const day = todayKey()
    const productId = String(product.id).replace(/\//g, '-')
    const sessionKey = `vss-viewed:${day}:${productId}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, '1')
    setDoc(
      doc(db, PRODUCT_VIEWS_COLLECTION, `${day}_${productId}`),
      { productId, name: String(product.name || '').slice(0, 150), day, views: increment(1) },
      { merge: true }
    ).catch((err) => console.warn('View not counted:', err?.message || err))
  } catch {
    // Analytics must never break the product page.
  }
}

// Admin-only live feed of every day/product counter.
export function useProductViews(enabled) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!enabled) return undefined
    return onSnapshot(
      collection(db, PRODUCT_VIEWS_COLLECTION),
      (snap) => {
        setRows(snap.docs.map((d) => d.data()))
        setError('')
      },
      (err) => setError(err?.code === 'permission-denied' ? 'permission' : err?.message || 'Could not load views')
    )
  }, [enabled])
  return { rows, error }
}
