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
// How far (in px) a drag/swipe has to travel before it counts as a
// slide change, rather than snapping back to the current slide.
const DRAG_THRESHOLD = 60
const COUNT = slides.length

// --- Seamless infinite loop -------------------------------------------
// The track is built as [clone-of-last, ...slides, clone-of-first], so
// there's always a real-looking frame just past either end. "position"
// walks that extended array (1..COUNT are the real slides). Landing on
// one of the two clone frames (0 or COUNT+1) still animates normally,
// but the instant that animation finishes we silently teleport (no
// transition) to the matching real frame on the opposite side — so a
// swipe/click off either end just keeps gliding in the same direction
// instead of snapping back or sweeping across every slide in between.
const extendedSlides = [slides[COUNT - 1], ...slides, slides[0]]
const TRACK_LEN = extendedSlides.length
const SLIDE_PCT = 100 / TRACK_LEN
const START_POSITION = 1

export default function HeroSection() {
  const navigate = useNavigate()
  const [position, setPosition] = useState(START_POSITION)
  const [dragging, setDragging] = useState(false)
  // True for the one frame where we jump the track with no animation
  // (the clone -> real teleport above). Kept separate from `dragging` so
  // the two "no transition" cases can't fight each other.
  const [snapping, setSnapping] = useState(false)
  const [dragX, setDragX] = useState(0)
  const dragStartX = useRef(null)
  // Tracks whether the pointer actually moved far enough to count as a
  // swipe (not just a slightly-wobbly tap/click). There's no separate CTA
  // button anymore — the whole photo is the only click target — so a click
  // fires from the same pointer-up that ends a drag. Without this guard, a
  // swipe that changes slides would ALSO navigate to that slide's link.
  const wasDragRef = useRef(false)

  // Real (0-indexed) slide currently on screen, derived from the extended
  // track position — this is what the dots and the CTA link use.
  const index = ((position - 1) % COUNT + COUNT) % COUNT
  const slide = slides[index]

  // After a transition lands on one of the two clone frames, jump straight
  // to the matching real frame with the transition switched off for one
  // frame, then switch it back on for whatever the user does next.
  const handleTrackTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
    if (position === 0) {
      setSnapping(true)
      setPosition(COUNT)
    } else if (position === COUNT + 1) {
      setSnapping(true)
      setPosition(1)
    }
  }

  useEffect(() => {
    if (!snapping) return
    // Give the no-transition frame a paint, then re-enable animation.
    const raf = requestAnimationFrame(() => setSnapping(false))
    return () => cancelAnimationFrame(raf)
  }, [snapping])

  // Step forward/back by exactly one slide — used by swipe/drag and by the
  // dot-click wrap cases below. This is what makes first<->last a single
  // smooth glide instead of a sweep through every slide in between.
  const step = useCallback((delta) => {
    setPosition((p) => p + delta)
  }, [])

  // Dots jump straight to any slide. Going first->last or last->first is
  // special-cased to travel via the adjacent clone (one smooth step) rather
  // than sweeping forward across every slide in between; every other jump
  // just animates directly to that position, as before.
  const goTo = useCallback((i) => {
    if (index === 0 && i === COUNT - 1) {
      step(-1)
    } else if (index === COUNT - 1 && i === 0) {
      step(1)
    } else {
      setPosition(i + 1)
    }
  }, [index, step])

  // Pointer events cover mouse drag and touch swipe with the same code path.
  // setPointerCapture keeps receiving move/up events even if the cursor
  // leaves the slide while the button is still held down. Dragging is one
  // way to change slides, not the only way — the dots below work the same
  // with mouse, keyboard, or touch.
  const handlePointerDown = (e) => {
    dragStartX.current = e.clientX
    wasDragRef.current = false
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (dragStartX.current === null) return
    let delta = e.clientX - dragStartX.current
    // A handful of pixels of jitter shouldn't cancel the click a tap/touch
    // was going for, but anything past that is a deliberate swipe. This must
    // match DRAG_THRESHOLD (the distance that actually changes slides) —
    // it used to be a much smaller 8px, which meant ordinary mouse/finger
    // jitter during a normal click was misread as a swipe and the link's
    // navigation got cancelled (the click preview/href always looked right,
    // but clicking "Shop Now" silently did nothing).
    if (Math.abs(delta) > DRAG_THRESHOLD) wasDragRef.current = true
    // Cap the raw offset, so a long drag/swipe can't fling the track
    // further than one slide-width's worth of motion before release —
    // that's what made big swipes feel like they were "chasing" the cursor
    // instead of tracking it 1:1. (No more rubber-banding at the real
    // first/last slide — the loop is seamless now, so every edge just
    // keeps gliding via the clone frames instead of resisting.)
    const max = 220
    delta = Math.max(-max, Math.min(max, delta))
    setDragX(delta)
  }

  const endDrag = () => {
    if (dragStartX.current === null) return
    const wasSwipe = dragX <= -DRAG_THRESHOLD || dragX >= DRAG_THRESHOLD
    if (dragX <= -DRAG_THRESHOLD) step(1)
    else if (dragX >= DRAG_THRESHOLD) step(-1)
    dragStartX.current = null
    setDragX(0)
    setDragging(false)
    // Navigate straight from here rather than relying on the overlay
    // <Link>'s native click event to fire. Once setPointerCapture() (in
    // handlePointerDown) hands this container all pointer events for the
    // gesture, some browsers/webviews don't reliably re-hit-test and fire
    // a click on the link underneath afterwards — so a plain tap/click
    // could silently do nothing. Deciding and navigating right here, from
    // the same pointer-up that already tracks the drag, makes a tap always
    // land on the slide's destination regardless of that click quirk.
    if (!wasSwipe && !wasDragRef.current) navigate(slide.cta.to)
    wasDragRef.current = false
  }

  // The overlay <a> below stays as a real link (for accessibility, right
  // click, and ctrl/cmd-click "open in new tab"), but plain left-clicks are
  // always handled by endDrag above — so suppress the link's own default
  // navigation for those and let our programmatic navigate() be the single
  // source of truth. Modified clicks (new tab, etc.) are left alone.
  const handleSlideClick = (e) => {
    const isModifiedClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    if (!isModifiedClick) e.preventDefault()
  }

  return (
    <section className="relative bg-ink border-b border-thread">
      {/* Editorial slide — the photo fills the section edge-to-edge and the
          whole photo is the link (no CTA button on top of it). Kept compact
          so it reads as a banner, not a full page. All slides sit side by
          side on one track that slides as a whole, which is what makes the
          drag/swipe feel like one continuous, smooth motion instead of a
          hard cut between images. */}
      <div
        className="relative w-full aspect-[1920/700] overflow-hidden select-none touch-pan-y cursor-default"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* The sliding track — one flex row holding every slide plus a
            clone of the last slide up front and a clone of the first slide
            at the end, shifted left by position * (1 / track length) plus
            the live drag offset. Landing on a clone frame teleports
            (transition-free) to the matching real frame right after, so
            the loop reads as one continuous strip with no visible seam. */}
        <div
          className="absolute inset-0 flex h-full"
          style={{
            width: `${TRACK_LEN * 100}%`,
            transform: `translate3d(calc(${-position * SLIDE_PCT}% + ${dragX}px), 0, 0)`,
            transition: dragging || snapping ? 'none' : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {extendedSlides.map((s, i) => (
            <div key={`${s.id}-${i}`} className="relative h-full overflow-hidden bg-cream-dark" style={{ width: `${SLIDE_PCT}%` }}>
              {/* The whole photo is the link now — no separate "Shop" button
                  sitting on top of it. object-cover here is a no-op crop-
                  wise since the container's aspect-[1920/700] above already
                  matches the image's real aspect ratio, so the full photo
                  always shows, just scaled responsively. */}
              <Link to={s.cta.to} draggable={false} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
                <img
                  src={s.image}
                  alt={s.title}
                  width={IMAGE_WIDTH}
                  height={IMAGE_HEIGHT}
                  draggable={false}
                  onError={onImgError(`vss-hero-${s.id}-${i}`, IMAGE_WIDTH, IMAGE_HEIGHT)}
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                />
              </Link>
            </div>
          ))}
        </div>

        {/* No separate "Shop" button anymore — the entire photo is the
            link. This sits on top of the sliding track and is the one real,
            focusable anchor (the per-slide ones inside the track are
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
          className="absolute inset-0"
        />

        {/* Dot pagination — click any dot to jump straight to that slide.
            No countdown/auto-advance here; navigation is manual only, via
            these dots or a drag/swipe on the photo itself. */}
        <div
          className="absolute left-0 right-0 bottom-4 container-app flex justify-center sm:justify-start gap-2"
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
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out ${
                i === index
                  ? 'w-12 sm:w-16 bg-brand'
                  : 'w-8 sm:w-11 bg-ink/15 hover:bg-ink/25'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
