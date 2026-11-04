import { useState } from 'react'
import { StarsRow } from '../common/StarRating.jsx'
import { Check, X, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { setReviewStatus, removeReview } from '../../utils/reviews.js'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'removed', label: 'Deleted' },
  { id: 'all', label: 'All' },
]

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  removed: 'bg-gray-200 text-gray-700',
}

function when(ts) {
  const d = ts?.toDate?.()
  return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'
}

// Admin -> Reviews: customer reviews wait here ("pending") until approved.
// A review a customer edits goes back to "pending" for another decision.
export default function ReviewsAdminTab({ reviews, loading, error, onToast }) {
  const [filter, setFilter] = useState('pending')
  const [busyId, setBusyId] = useState(null)

  const statusOf = (r) => r.status || 'pending'
  const counts = { all: reviews.length }
  FILTERS.forEach((f) => { if (f.id !== 'all') counts[f.id] = reviews.filter((r) => statusOf(r) === f.id).length })
  const shown = filter === 'all' ? reviews : reviews.filter((r) => statusOf(r) === filter)

  async function decide(r, status) {
    setBusyId(r.id)
    try {
      await setReviewStatus(r.id, status)
      onToast?.(status === 'approved' ? 'Review approved — now visible on the product page' : 'Review rejected')
    } catch (e) {
      console.error(e)
      onToast?.('Could not update the review')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(r) {
    if (!window.confirm('Delete this review from the store? The customer will still see it as posted on their own account.')) return
    setBusyId(r.id)
    try {
      await removeReview(r.id)
      onToast?.('Review deleted from the store')
    } catch (e) {
      console.error(e)
      onToast?.('Could not delete the review')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink mb-1">Customer Reviews</h2>
      <p className="text-sm text-ink-soft mb-5">
        New and edited reviews wait here. Only approved reviews are shown on the product page. Rejected or deleted reviews are hidden from the store, but the customer still sees theirs as posted.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.id ? 'bg-brand text-white border-brand' : 'border-thread text-ink-soft hover:border-brand'
            }`}
          >
            {f.label} ({counts[f.id] || 0})
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm text-ink-soft">Loading reviews…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-ink-soft">{filter === 'pending' ? 'No reviews waiting for approval.' : 'No reviews here.'}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const st = statusOf(r)
            return (
              <li key={r.id} className="border border-thread rounded-lg p-4 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{r.userName || 'Customer'}</p>
                    <Link to={`/product/${r.productId}`} target="_blank" className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                      {r.productName || r.productId} <ExternalLink size={11} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarsRow value={r.rating} size={14} />
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLE[st]}`}>{st === 'removed' ? 'deleted' : st}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-soft whitespace-pre-line break-words">{r.comment}</p>
                <p className="mt-2 text-[11px] text-ink-soft/70">
                  {r.updatedAt && r.createdAt && r.updatedAt?.toMillis?.() !== r.createdAt?.toMillis?.() ? 'Updated ' : 'Posted '}
                  {when(r.updatedAt || r.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {st !== 'approved' && (
                    <button disabled={busyId === r.id} onClick={() => decide(r, 'approved')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                      <Check size={13} /> Approve
                    </button>
                  )}
                  {st !== 'rejected' && (
                    <button disabled={busyId === r.id} onClick={() => decide(r, 'rejected')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-300 text-red-700 text-xs font-medium hover:bg-red-50 disabled:opacity-60">
                      <X size={13} /> Reject
                    </button>
                  )}
                  {st !== 'removed' && <button disabled={busyId === r.id} onClick={() => remove(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-thread text-ink-soft text-xs font-medium hover:text-red-600 disabled:opacity-60">
                    <Trash2 size={13} /> Delete
                  </button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
