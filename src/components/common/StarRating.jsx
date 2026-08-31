import { Star } from 'lucide-react'

export default function StarRating({ rating, count, size = 13 }) {
  const rounded = Math.round(Number(rating))
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= rounded ? 'fill-gold text-gold' : 'fill-thread text-thread'}
          />
        ))}
      </div>
      <span className="text-xs text-ink-soft">
        {rating} {count ? `(${count})` : ''}
      </span>
    </div>
  )
}
