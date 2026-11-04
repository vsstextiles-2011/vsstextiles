import { Star } from 'lucide-react'

// Rounds to the nearest half star (4.5 stays 4.5, 4.3 -> 4.5, 4.2 -> 4).
export function toHalf(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, Math.round(n * 2) / 2))
}

// A row of five stars. Half values fill half of a star (4.5 = four and a half).
export function StarsRow({ value, size = 13 }) {
  const v = toHalf(value)
  return (
    <span className="inline-flex items-center" role="img" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.min(1, Math.max(0, v - (n - 1)))
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 fill-thread text-thread" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="fill-gold text-gold" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

export default function StarRating({ rating, count, size = 13 }) {
  return (
    <div className="flex items-center gap-1">
      <StarsRow value={rating} size={size} />
      <span className="text-xs text-ink-soft">
        {rating} {count ? `(${count})` : ''}
      </span>
    </div>
  )
}
