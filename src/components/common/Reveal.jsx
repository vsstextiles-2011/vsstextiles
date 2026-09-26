import { useEffect, useRef, useState } from 'react'

// Fires once per element as it scrolls into view, then flips a class that
// the CSS in index.css (.reveal / .reveal.is-visible) animates from — a
// gentle fade + rise, staggered by `delay` when several of these sit in a
// grid together. Kept as one shared wrapper so every section (category
// tiles, product cards, feature boxes, testimonials, ...) gets the exact
// same motion instead of each component re-implementing its own observer.
//
// - `once` (default true): stays visible after the first reveal instead of
//   re-hiding on scroll-away/back — matches how these transitions read in
//   practice (a one-time entrance, not a repeating peekaboo).
// - `delay` (ms): passed through as a CSS custom property so a whole row of
//   cards can stagger in left-to-right / top-to-bottom just by bumping this
//   per item (e.g. `delay={i * 70}`).
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  once = true,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (very old browser) — just show the content
    // rather than leaving it permanently invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(el)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      // Triggers a little before the element's edge actually reaches the
      // viewport bottom so the motion reads as "arriving", not "already
      // sitting there" when it becomes visible.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
