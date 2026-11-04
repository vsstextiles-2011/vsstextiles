import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal.jsx'

export default function SectionHeading({ eyebrow, title, subtitle, viewAllLink, index }) {
  return (
    <Reveal as="div" className="mb-10">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          {index != null && (
            <span className="index-num text-4xl sm:text-5xl leading-none shrink-0 pt-2">
              {String(index).padStart(2, '0')}
            </span>
          )}
          <div className={index != null ? 'border-l border-thread pl-4 sm:pl-5' : ''}>
            {eyebrow && (
              <p className="eyebrow mb-2.5 flex items-center gap-2">
                <span className="w-4 h-px bg-brand" />
                {eyebrow}
              </p>
            )}
            {/* The title is rendered as an actual swing-tag — the die-cut
                garment hang-tag the rest of the brand language is built
                from (see Footer) — instead of a flat color chip, with a
                hard offset shadow so it reads as a physical, stamped
                object rather than a CSS background. */}
            <h2 className="swing-tag inline-block bg-brand text-white text-2xl sm:text-3xl font-display font-semibold pl-6 pr-4 py-1.5 shadow-[4px_4px_0_0_#1A1A1A]">
              {title}
            </h2>
            {subtitle && <p className="text-ink-soft text-sm mt-2.5 max-w-md">{subtitle}</p>}
          </div>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="hidden sm:flex items-center gap-1.5 shrink-0 text-brand font-mono text-xs uppercase tracking-wider hover:gap-2.5 transition-all border-b border-brand pb-0.5"
          >
            View all <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </Reveal>
  )
}
