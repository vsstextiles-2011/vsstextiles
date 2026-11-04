import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Star, Trash2, Pencil, LogIn } from 'lucide-react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { StarsRow } from './StarRating.jsx'

const MAX_COMMENT = 1000

// Review documents live in Firestore `reviews/{productId}_{uid}` -- the id
// itself guarantees one review per shopper per product (writing again simply
// edits it). See firestore.rules for who may read / write.
export function reviewDocId(productId, uid) {
  return `${productId}_${uid}`
}

// Approved reviews only (new / edited reviews wait for the admin in Admin -> Reviews).
// Shared hook so the page header can show the count as well.
export function useProductReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!productId) return undefined
    setLoaded(false)
    setError('')
    const q = query(collection(db, 'reviews'), where('productId', '==', productId), where('status', '==', 'approved'))
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Newest first; a just-written review has no server time yet.
        list.sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()))
        setReviews(list)
        setLoaded(true)
      },
      (err) => {
        console.warn('Reviews could not be loaded:', err.message)
        setError(err.code === 'permission-denied' ? 'rules' : 'load')
        setLoaded(true)
      }
    )
  }, [productId])

  const count = reviews.length
  const average = count ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0
  return { reviews, loaded, error, count, average }
}

// The signed-in customer's own review for this product, whatever its status
// (pending / approved / rejected), so they can see and edit it.
function useMyReview(productId, uid) {
  const [mine, setMine] = useState(null)
  useEffect(() => {
    if (!productId || !uid) {
      setMine(null)
      return undefined
    }
    return onSnapshot(
      doc(db, 'reviews', reviewDocId(productId, uid)),
      (snap) => setMine(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setMine(null)
    )
  }, [productId, uid])
  return mine
}

function Stars({ value, size = 14 }) {
  return <StarsRow value={value} size={size} />
}

function formatDate(ts) {
  const d = ts?.toDate?.()
  if (!d) return 'Just now'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProductReviews({ product, reviewData }) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const location = useLocation()
  const { reviews, loaded, error, count, average } = reviewData

  // Guests are signed in anonymously behind the scenes -- that's not an account.
  const canReview = !!user && !user.isAnonymous && !isAdmin
  const myReview = useMyReview(product.id, canReview ? user.uid : null)

  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [ratingText, setRatingText] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  // Reset the form when switching products.
  useEffect(() => {
    setEditing(false)
    setRating(0)
    setComment('')
    setFormError('')
    setNotice('')
  }, [product.id])

  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const n = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)))
      counts[n] += 1
    })
    return counts
  }, [reviews])

  // Typing a star count (1 to 5, in steps of 0.5) updates the stars too.
  function onRatingTyped(text) {
    const cleaned = text.replace(/[^0-9.]/g, '').slice(0, 3)
    setRatingText(cleaned)
    const n = parseFloat(cleaned)
    if (Number.isFinite(n) && n >= 1 && n <= 5 && n * 2 === Math.floor(n * 2)) setRating(n)
    else setRating(0)
  }

  function pickRating(n) {
    setRating(n)
    setRatingText(String(n))
  }

  function startEdit() {
    setRating(myReview?.rating || 0)
    setRatingText(myReview?.rating ? String(myReview.rating) : '')
    setComment(myReview?.comment || '')
    setFormError('')
    setEditing(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canReview) return
    if (!rating) return setFormError('Please choose a star rating from 1 to 5 (half stars like 4.5 are allowed).')
    const text = comment.trim()
    if (text.length < 3) return setFormError('Please write a few words about the product.')

    setSubmitting(true)
    setFormError('')
    try {
      const ref = doc(db, 'reviews', reviewDocId(product.id, user.uid))
      await setDoc(ref, {
        productId: product.id,
        productName: product.name || '',
        userId: user.uid,
        userName: (user.displayName || user.email?.split('@')[0] || 'Customer').slice(0, 60),
        rating,
        comment: text,
        // Every new or edited review waits for the admin's approval.
        status: 'pending',
        createdAt: myReview?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setEditing(false)
      setRating(0)
      setRatingText('')
      setComment('')
      setNotice('Thank you! Your review has been posted successfully.')
    } catch (err) {
      console.error('Saving review failed:', err)
      setFormError(
        err.code === 'permission-denied'
          ? 'Reviews are not enabled yet — publish the updated firestore.rules in Firebase Console.'
          : 'Could not save your review. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(review) {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteDoc(doc(db, 'reviews', review.id))
    } catch (err) {
      console.error('Deleting review failed:', err)
      window.alert('Could not delete the review. Please try again.')
    }
  }

  const showForm = canReview && (!myReview || editing)
  const shownRating = hover || rating

  return (
    <div id="reviews" className="mt-12 pt-10 border-t border-thread max-w-3xl scroll-mt-24">
      <h2 className="text-xl font-bold text-ink mb-5">Customer Reviews</h2>

      {count > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-8 p-5 bg-cream-dark/50 border border-thread rounded-sm">
          <div className="text-center sm:text-left">
            <div className="text-4xl font-semibold font-mono text-ink">{average.toFixed(1)}</div>
            <Stars value={average} size={16} />
            <p className="text-xs text-ink-soft mt-1">
              {count} review{count === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs text-ink-soft">
                <span className="w-3 font-mono">{n}</span>
                <Star size={11} className="fill-gold text-gold shrink-0" />
                <span className="flex-1 h-1.5 bg-thread rounded-full overflow-hidden">
                  <span className="block h-full bg-gold" style={{ width: `${(breakdown[n] / count) * 100}%` }} />
                </span>
                <span className="w-6 text-right font-mono">{breakdown[n]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a review -- real (non-guest) accounts only */}
      {authLoading ? null : !canReview ? (
        isAdmin ? (
          <p className="mb-8 text-sm text-ink-soft">Admins moderate reviews in Admin → Reviews.</p>
        ) : (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-dashed border-thread rounded-sm p-4 bg-white">
            <p className="text-sm text-ink-soft">Please log in to write a review for this product.</p>
            <Link
              to="/account"
              state={{ from: location }}
              className="btn-primary h-10 px-5 inline-flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider shrink-0"
            >
              <LogIn size={15} /> Login to review
            </Link>
          </div>
        )
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="mb-8 border border-thread rounded-sm p-5 bg-white">
          <h3 className="font-semibold text-ink mb-3">{myReview ? 'Edit your review' : 'Write a review'}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const fill = Math.min(1, Math.max(0, shownRating - (n - 1)))
                // Left half of a star = half rating, right half = full.
                const valueAt = (e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  return e.clientX - rect.left < rect.width / 2 ? n - 0.5 : n
                }
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={(e) => pickRating(valueAt(e))}
                    onMouseMove={(e) => setHover(valueAt(e))}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    className="p-0.5"
                  >
                    <span className="relative inline-block" style={{ width: 28, height: 28 }}>
                      <Star size={28} className="absolute inset-0 fill-thread text-thread" />
                      {fill > 0 && (
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                          <Star size={28} className="fill-gold text-gold" />
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              Or type it:
              <input
                value={ratingText}
                onChange={(e) => onRatingTyped(e.target.value)}
                onBlur={() => setRatingText(rating ? String(rating) : '')}
                inputMode="decimal"
                placeholder="e.g. 4.5"
                maxLength={3}
                aria-label="Star rating from 1 to 5"
                className="w-20 border border-thread rounded-sm px-2 py-1.5 text-sm font-mono text-ink focus:outline-none focus:border-brand"
              />
              <span className="font-mono">/ 5</span>
            </label>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            rows={4}
            placeholder="How was the fit, fabric and quality?"
            className="w-full border border-thread rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand resize-y"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] text-ink-soft/70">
            <span>Posting as {user.displayName || user.email}</span>
            <span>{comment.length}/{MAX_COMMENT}</span>
          </div>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary h-10 px-6 text-xs font-mono uppercase tracking-wider disabled:opacity-60"
            >
              {submitting ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-10 px-5 border border-thread rounded-sm text-xs font-mono uppercase tracking-wider text-ink-soft hover:border-brand hover:text-brand"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : null}

      {canReview && myReview && !editing && (
        <div className={`mb-6 border rounded-sm p-4 ${'border-green-200 bg-green-50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">
                Your review —{' '}
                posted successfully
              </p>
              <div className="mt-1.5 flex items-center gap-2"><Stars value={myReview.rating} /></div>
              <p className="mt-2 text-sm text-ink-soft whitespace-pre-line break-words">{myReview.comment}</p>
              {notice && <p className="mt-2 text-xs text-ink-soft">{notice}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={startEdit} aria-label="Edit your review" className="p-1.5 text-ink-soft hover:text-brand"><Pencil size={14} /></button>
              <button type="button" onClick={() => handleDelete(myReview)} aria-label="Delete your review" className="p-1.5 text-ink-soft hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-ink-soft">
          {error === 'rules'
            ? 'Reviews are not enabled yet — publish the updated firestore.rules in Firebase Console.'
            : 'Reviews could not be loaded right now.'}
        </p>
      ) : !loaded ? (
        <p className="text-sm text-ink-soft">Loading reviews…</p>
      ) : count === 0 ? (
        <p className="text-sm text-ink-soft">No approved reviews yet. Be the first to review this product.</p>
      ) : (
        <ul className="divide-y divide-thread">
          {reviews.map((r) => {
            return (
              <li key={r.id} className="py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-sm font-semibold shrink-0">
                      {(r.userName || 'C').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {r.userName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-ink-soft/70">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Stars value={r.rating} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-soft leading-relaxed whitespace-pre-line break-words">{r.comment}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
