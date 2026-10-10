import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onImgError } from '../../utils/imgFallback.js'
import { useSiteContent } from '../../context/SiteContentContext.jsx'

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
// How far (in px) a swipe has to travel before it's read as a deliberate
// gesture rather than a tap — decides next/previous vs. tap-to-navigate;
// there's no live preview mid-swipe.
const SWIPE_THRESHOLD = 40

export default function HeroSection() {
  // Slides are managed from Admin -> Hero Slider and stored in Firestore
  // (falls back to data/heroSlides.js until an admin saves their own).
  const { heroSlides: slides } = useSiteContent()
  const COUNT = slides.length
  const navigate = useNavigate()
  const [rawIndex, setIndex] = useState(0)
  // The admin can add/remove slides while this page is open, so never let
  // the index point past the end of the current list.
  const index = COUNT ? rawIndex % COUNT : 0
  // Autoplay is paused for any of these reasons. Each one is tracked
  // separately so releasing one (e.g. mouse leaves) can't accidentally
  // un-pause another (e.g. the tab is still hidden).
  const [hovering, setHovering] = useState(false) // real mouse only — see onPointerEnter below
  const [pressing, setPressing] = useState(false) // finger/mouse is down (mid-swipe)
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  const [inView, setInView] = useState(true) // banner scrolled off-screen
  const rootRef = useRef(null)
  const touchStartX = useRef(null)
  // Whether the pointer moved far enough to count as a swipe (not a tap).
  const wasSwipeRef = useRef(false)

  // Which slide photos have finished loading AND decoding. A slide is never
  // advanced to until its photo is ready, so the swap can never reveal a
  // blank/placeholder frame — no matter how slow the connection is.
  const [loadedIds, setLoadedIds] = useState(() => new Set())
  const markLoaded = useCallback((id) => {
    setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const slide = slides[index]
  const nextIndex = COUNT ? (index + 1) % COUNT : 0
  const nextId = slides[nextIndex]?.id
  const currentReady = slide ? loadedIds.has(slide.id) : false
  const nextReady = nextId ? loadedIds.has(nextId) : false

  const step = useCallback(
    (delta) => {
      if (!COUNT) return
      setIndex((i) => (i + delta + COUNT) % COUNT)
    },
    [COUNT],
  )

  const goTo = useCallback((i) => setIndex(i), [])

  // Pause while the tab is in the background (browsers throttle timers
  // there, which used to make the next slide arrive late/early on return).
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Pause while the banner isn't on screen (no point animating unseen).
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The countdown only runs when nothing is holding it back — including
  // "this slide's photo isn't ready yet", so every slide gets its FULL
  // AUTOPLAY_MS of actual visible time.
  const paused = hovering || pressing || tabHidden || !inView || !currentReady

  // Timing is driven by the dot's CSS countdown animation itself (see
  // onAnimationEnd below) rather than a separate setTimeout. One clock
  // means the progress bar and the slide swap can never drift apart, and
  // pausing/resuming (hover, hidden tab, …) continues from exactly where it
  // stopped instead of restarting the interval from zero.
  const [advanceWaiting, setAdvanceWaiting] = useState(false)
  useEffect(() => setAdvanceWaiting(false), [index])

  const handleCountdownEnd = useCallback(
    (e) => {
      if (e.animationName !== 'hero-dot-fill') return
      if (nextReady) step(1)
      else setAdvanceWaiting(true) // hold on this slide until the next one is ready
    },
    [nextReady, step],
  )

  // If we were holding for a slow image, advance the moment it's ready.
  useEffect(() => {
    if (advanceWaiting && nextReady && !paused) step(1)
  }, [advanceWaiting, nextReady, paused, step])

  // Pointer events cover mouse drag and touch swipe with the same code
  // path. setPointerCapture keeps receiving move/up events even if the
  // cursor leaves the slide while the button is still held down.
  const handlePointerDown = (e) => {
    touchStartX.current = e.clientX
    wasSwipeRef.current = false
    setPressing(true)
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
    setPressing(false)
    // Navigate straight from here rather than relying on the overlay
    // <Link>'s native click event to fire — see the equivalent note this
    // replaced for why that isn't always reliable once a pointer capture
    // has been in play during the gesture.
    if (!wasSwipeRef.current) navigate(slide.ctaTo)
    wasSwipeRef.current = false
  }

  // The browser fires pointercancel when it takes over the gesture — e.g. the
  // shopper starts scrolling the page vertically with their finger on the
  // banner. That is NOT a tap, so reset without navigating anywhere.
  const cancelSwipe = () => {
    touchStartX.current = null
    wasSwipeRef.current = false
    setPressing(false)
  }

  // The overlay <a> below stays as a real link (for accessibility, right
  // click, and ctrl/cmd-click "open in new tab"), but plain left-clicks are
  // always handled by endSwipe above — so suppress the link's own default
  // navigation for those and let our programmatic navigate() be the single
  // source of truth. Modified clicks (new tab, etc.) are left alone.
  const handleSlideClick = (e) => {
    // detail === 0 means the click came from the keyboard (Enter on the
    // focused link) — let that navigate normally; pointer clicks are
    // handled in endSwipe.
    const isKeyboard = e.detail === 0
    const isModifiedClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    if (!isModifiedClick && !isKeyboard) e.preventDefault()
  }

  // Every slide switched off (or none saved with a photo) -> no banner.
  if (!slide) return null

  return (
    <section className="relative bg-cream-dark border-b border-thread">
      {/* Editorial slide — the photo fills the section edge-to-edge and the
          whole photo is the link (no CTA button on top of it). Every slide
          is stacked full-bleed on top of the others; only which one is
          shown (opacity 0/1, no transition) changes between them — the
          switch is instant, no crossfade, no zoom, nothing slides. */}
      <div
        ref={rootRef}
        className="relative w-full aspect-[1920/700] overflow-hidden select-none touch-pan-y cursor-default"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={cancelSwipe}
        // Mouse only. Touch taps also fire mouseenter but never a matching
        // mouseleave, which used to leave autoplay stuck paused on phones.
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHovering(false)}
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
          to={slide.ctaTo}
          aria-label={`${slide.title} — ${slide.ctaLabel}`}
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
              aria-label={`Go to ${s.title || `slide ${i + 1}`}`}
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
                  onAnimationEnd={handleCountdownEnd}
                  style={{
                    animationDuration: `${AUTOPLAY_MS}ms`,
                    animationPlayState: paused ? 'paused' : 'running',
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
  const imgRef = useRef(null)

  // "Loaded" means downloaded AND decoded. Without decode(), a hidden
  // (opacity-0) photo is often only decoded at the moment it first paints,
  // which is exactly the tiny hitch you'd see on the swap.
  const finish = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const done = () => onLoad()
    if (typeof img.decode === 'function') img.decode().then(done, done)
    else done()
  }, [onLoad])

  // A cached image can already be complete before React attaches onLoad
  // (e.g. coming back to Home), in which case onLoad never fires.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) finish()
  }, [finish])

  return (
    <div className={`absolute inset-0 h-full ${active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
      <Link to={slide.ctaTo} draggable={false} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block overflow-hidden">
        {/* Placeholder only until the photo is ready; removed afterwards so
            six infinite pulse animations don't keep running underneath. */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-thread animate-pulse" aria-hidden="true" />
        )}
        <img
          ref={imgRef}
          src={slide.image}
          alt={slide.title}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          draggable={false}
          loading="eager"
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onLoad={finish}
          onError={onError}
          className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </Link>
    </div>
  )
}
