// Product reviews (Firestore collection "reviews", doc id `{productId}_{uid}`).
//  - A customer writes (or edits) a review      -> status "pending"
//  - The admin approves / rejects it in Admin -> Reviews
//  - Only "approved" reviews are shown on product pages
// Security lives in firestore.rules.
import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export const REVIEWS_COLLECTION = 'reviews'

export function reviewMillis(r) {
  return r?.updatedAt?.toMillis?.() ?? r?.createdAt?.toMillis?.() ?? Date.now()
}

// Admin: every review, newest activity first.
export function useAdminReviews(enabled) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) {
      setReviews([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    return onSnapshot(
      collection(db, REVIEWS_COLLECTION),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => reviewMillis(b) - reviewMillis(a))
        setReviews(list)
        setError('')
        setLoading(false)
      },
      (err) => {
        console.error('Reviews listener failed:', err)
        setError(
          err?.code === 'permission-denied'
            ? 'Firestore rules do not allow reading reviews yet. Publish the updated firestore.rules in the Firebase console.'
            : 'Could not load reviews.'
        )
        setLoading(false)
      }
    )
  }, [enabled])

  return { reviews, loading, error, pendingCount: reviews.filter((r) => (r.status || 'pending') === 'pending').length }
}

export function setReviewStatus(id, status) {
  return updateDoc(doc(db, REVIEWS_COLLECTION, id), { status, moderatedAt: serverTimestamp() })
}

// Admin "delete" only hides the review from the store (status "removed"). The
// customer who wrote it still sees it as posted on their own account.
export function removeReview(id) {
  return setReviewStatus(id, 'removed')
}
