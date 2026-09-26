import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onImgError } from '../../utils/imgFallback.js'
import { heroSlides as slides } from '../../data/heroSlides.js'

// Recommended source size for hero photos — set as explicit width/height on
// the <img> below so the browser reserves the right space before the photo
// loads, and so the intended dimensions show up when you inspect the
// element. Actual on-screen size still scales responsively via CSS.
const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 700
// How long each slide stays on screen before it auto-advances. The switch
// to the next slide is instant — no crossfade, no zoom — so this is simply
// the interval between swaps.
const AUTOPLAY_MS = 4000
const COUNT = slides.length
// How far (in px) a swipe has to travel before it's read as a deliberate
// gesture rather than a tap — decides next/previous vs. tap-to-navigate;
// there's no live preview mid-swipe.
const SWIPE_THRESHOLD = 40

export default function HeroSection() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  // Paused while the mouse rests over the banner, so autoplay never yanks
  // a slide away out from under someone reading it. Touch devices have no
  // hover, so there autoplay just keeps running between swipes.
  const [hovering, setHovering] = useState(false)
  const touchStartX = useRef(null)
  // Tracks whether the pointer actually moved far enough to count as a
  // swipe (not just a slightly-wobbly tap/click), same guard as before —
  // without it a swipe that changes slides would ALSO navigate to the
  // slide's link on release.
  const wasSwipeRef = useRef(false)

  // Which slide photos have actually finished loading, keyed by slide id.
  // index.html preloads every slide before React even mounts, so in
  // practice this fills in almost immediately — this state is the safety
  // net for a slow connection/device, so a still-loading slide fades in
  // instead of popping in over a blank gap.
  const [loadedIds, setLoadedIds] = useState(() => new Set())
  const markLoaded = useCallback((id) => {
    setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const slide = slides[index]

  const step = useCallback((delta) => {
    setIndex((i) => (i + delta + COUNT) % COUNT)
  }, [])

  // Autoplay — every slide gets exactly AUTOPLAY_MS on screen, then steps
  // forward by one, wrapping from last back to first. The timer restarts
  // from zero every time `index` changes for ANY reason — autoplay's own
  // step, a dot click, or a swipe — so a slide someone just navigated to
  // always gets its own full AUTOPLAY_MS. Paused entirely while hovering.
  useEffect(() => {
    if (hovering) return
    const timer = setTimeout(() => step(1), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [index, hovering, step])

  const goTo = useCallback((i) => setIndex(i), [])

  // Pointer events cover mouse drag and touch swipe with the same code
  // path. setPointerCapture keeps receiving move/up events even if the
  // cursor leaves the slide while the button is still held down.
  const handlePointerDown = (e) => {
    touchStartX.current = e.clientX
    wasSwipeRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (touchStartX.current === null) return
    const delta = e.clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_THRESHOLD) wasSwipeRef.current = true
  }

  const endSwipe = (e) => {
    if (touchStartX.current === null) return
    const delta = e.clientX - touchStartX.current
    if (delta <= -SWIPE_THRESHOLD) step(1)
    else if (delta >= SWIPE_THRESHOLD) step(-1)
    touchStartX.current = null
    // Navigate straight from here rather than relying on the overlay
    // <Link>'s native click event to fire — see the equivalent note this
    // replaced for why that isn't always reliable once a pointer capture
    // has been in play during the gesture.
    if (!wasSwipeRef.current) navigate(slide.cta.to)
    wasSwipeRef.current = false
  }

  // The overlay <a> below stays as a real link (for accessibility, right
  // click, and ctrl/cmd-click "open in new tab"), but plain left-clicks are
  // always handled by endSwipe above — so suppress the link's own default
  // navigation for those and let our programmatic navigate() be the single
  // source of truth. Modified clicks (new tab, etc.) are left alone.
  const handleSlideClick = (e) => {
    const isModifiedClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    if (!isModifiedClick) e.preventDefault()
  }

  return (
    <section className="relative bg-cream-dark border-b border-thread">
      {/* Editorial slide — the photo fills the section edge-to-edge and the
          whole photo is the link (no CTA button on top of it). Every slide
          is stacked full-bleed on top of the others; only which one is
          shown (opacity 0/1, no transition) changes between them — the
          switch is instant, no crossfade, no zoom, nothing slides. */}
      <div
        className="relative w-full aspect-[1920/700] overflow-hidden select-none touch-pan-y cursor-default"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {slides.map((s, i) => (
          <HeroSlide
            key={s.id}
            slide={s}
            active={i === index}
            loaded={loadedIds.has(s.id)}
            eager={i === 0}
            onLoad={() => markLoaded(s.id)}
            onError={(e) => {
              onImgError(`vss-hero-${s.id}`, IMAGE_WIDTH, IMAGE_HEIGHT)(e)
              markLoaded(s.id)
            }}
          />
        ))}

        {/* No separate "Shop" button anymore — the entire photo is the
            link. This sits on top of every slide and is the one real,
            focusable anchor (the per-slide ones inside each HeroSlide are
            aria-hidden/tabIndex=-1, just for the visual). Tap or click
            anywhere on the image to go straight to that slide's page; a
            drag/swipe is caught by handleSlideClick above and doesn't
            navigate, so swiping between slides still works as before. */}
        <Link
          to={slide.cta.to}
          aria-label={`${slide.title} — ${slide.cta.label}`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={handleSlideClick}
          className="absolute inset-0 z-20"
        />

        {/* Dot pagination — click any dot to jump straight to that slide,
            same as before. Slides also auto-advance on their own every
            AUTOPLAY_MS (see the effect above); a dot click, swipe, or just
            hovering the banner all take over from/pause autoplay. */}
        <div
          className="absolute left-0 right-0 bottom-4 container-app flex justify-center sm:justify-start gap-2 z-30"
          role="tablist"
          aria-label="Hero slides"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.eyebrow} slide`}
              className={`relative h-1.5 rounded-full overflow-hidden transition-[width] duration-300 ease-out ${
                i === index ? 'w-12 sm:w-16 bg-brand/20' : 'w-8 sm:w-11 bg-ink/15 hover:bg-ink/25'
              }`}
            >
              {/* Countdown fill — only the active dot gets one, and it's
                  re-keyed on `index` so the animation restarts from 0%
                  every time this slide becomes current (autoplay step, dot
                  click, or swipe alike). Paused in lockstep with the
                  autoplay timer itself (see the effect above) so the bar
                  never keeps filling while the slide isn't advancing. */}
              {i === index && (
                <span
                  key={index}
                  className="hero-dot-fill absolute inset-0 rounded-full bg-brand"
                  style={{
                    animationDuration: `${AUTOPLAY_MS}ms`,
                    animationPlayState: hovering ? 'paused' : 'running',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// One stacked hero photo. All slides are always mounted (full-bleed,
// absolutely positioned on top of one another) — becoming "active" just
// shows this one instantly above the rest, with no crossfade and no zoom.
function HeroSlide({ slide, active, loaded, eager, onLoad, onError }) {
  return (
    <div className={`absolute inset-0 h-full ${active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
      <Link to={slide.cta.to} draggable={false} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block overflow-hidden">
        {/* Soft brand-tinted placeholder behind the photo — covers the
            fraction of a second (if any, since index.html already
            preloads every slide) before the real photo has painted, so a
            still-loading slide reads as "loading", never as a bare
            white/blank gap. */}
        <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-thread animate-pulse" aria-hidden="true" />
        <img
          src={slide.image}
          alt={slide.title}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          draggable={false}
          // Every slide is mounted up front (not swapped in/out), so all
          // of them need to be fetched right away — eager here (rather
          // than the browser's lazy-loading heuristics) plus a high fetch
          // priority on the very first frame is what makes sure the
          // instant swap never reveals a still-loading photo underneath.
          loading="eager"
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </Link>
    </div>
  )
}
