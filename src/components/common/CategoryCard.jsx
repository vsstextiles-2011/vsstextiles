import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { onImgError } from '../../utils/imgFallback.js'

export default function CategoryCard({ title, image, link }) {
  return (
    <Link
      to={link}
      className="group relative block overflow-hidden border border-thread hover:border-ink bg-white transition-colors duration-300"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden bg-cream-dark">
        <img
          src={image}
          alt={title}
          loading="lazy"
          onError={onImgError(`vss-cat-${title}`)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-0 left-0 bg-brand text-white text-[10px] font-mono px-2 py-1">
          NEW
        </span>
      </div>
      <div className="flex items-center justify-between px-3.5 py-3 border-t border-thread group-hover:border-ink">
        <span className="font-display text-sm font-semibold text-ink">{title}</span>
        <ArrowUpRight
          size={15}
          className="text-ink-soft group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
        />
      </div>
    </Link>
  )
}
