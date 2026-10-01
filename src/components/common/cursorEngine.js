/**
 * Cursor animation engine (plain JS, no React).
 *
 * Eight styles, picked from Admin -> Cursor:
 *   'blob'      – squishy red blob that stretches in the direction you move
 *   'trail'     – comet tail of fading dots
 *   'glow'      – soft spotlight glow drifting behind a small dot
 *   'ring'      – small dot + thin trailing ring
 *   'sparkle'   – colourful sparkles shed behind the pointer (burst on click)
 *   'ripple'    – pulsing dot; a ripple spreads out on every click
 *   'crosshair' – thin crosshair that turns into an X over links
 *   'magnet'    – small circle that morphs to wrap around buttons/links
 *
 * startCursor(style, options) starts the animation and returns a stop()
 * function. It is used twice: site-wide by <CustomCursor /> (target: window)
 * and inside the Admin -> Cursor tab for the live style previews
 * (target: the preview box).
 */

export const CURSOR_STYLES = [
  { id: 'blob', label: 'Blob', desc: 'A squishy blob that stretches as you move and swells over links.' },
  { id: 'trail', label: 'Trail', desc: 'A comet tail of fading dots that follows the mouse.' },
  { id: 'glow', label: 'Glow', desc: 'A soft spotlight that drifts behind a small dot.' },
  { id: 'ring', label: 'Ring', desc: 'A small dot with a thin ring that trails a little behind.' },
  { id: 'sparkle', label: 'Sparkle', desc: 'Colourful sparkles fall behind the pointer, with a burst on click.' },
  { id: 'ripple', label: 'Ripple', desc: 'A pulsing dot — every click sends a ripple spreading outward.' },
  { id: 'crosshair', label: 'Crosshair', desc: 'A thin crosshair that spins into an X over links and buttons.' },
  { id: 'magnet', label: 'Magnet', desc: 'A small circle that morphs to wrap around buttons and links.' },
]
export const CURSOR_STYLE_IDS = CURSOR_STYLES.map((s) => s.id)
export const DEFAULT_CURSOR_STYLE = 'trail'

const PALETTE = {
  blob: '236, 50, 55', 
  trail: '236, 50, 55',
  glow: '236, 50, 55',
  ring: '236, 50, 55', 
  sparkle: '236, 50, 55',
  ripple: '236, 50, 55',
  crosshair: '236, 50, 55',
  magnet: '236, 50, 55',
}

const INTERACTIVE =
  'a, button, [role="button"], input, select, textarea, label, summary, [data-cursor="hover"]'

function makeEl(css) {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    borderRadius: '50%',
    willChange: 'transform, opacity',
    ...css,
  })
  return el
}

const lerp = (a, b, k) => a + (b - a) * k

/* Each style returns { els, update() }. `st` is the shared mouse state:
   { x, y, hover, pressed } and `k(n)` is the follow-speed helper. */

function blobStyle(st, k) {
  const c = PALETTE.blob
  const size = 28
  const body = makeEl({ width: size + 'px', height: size + 'px', background: `rgba(${c}, 0.85)` })
  const dot = makeEl({ width: '6px', height: '6px', background: '#1A1A1A' })
  const p = { x: -100, y: -100 }
  let s = 1
  let angle = 0
  let stretch = 0
  return {
    els: [body, dot],
    snap() { p.x = st.x; p.y = st.y },
    update() {
      const dx = st.x - p.x
      const dy = st.y - p.y
      p.x = lerp(p.x, st.x, k(0.2))
      p.y = lerp(p.y, st.y, k(0.2))
      const speed = Math.hypot(dx, dy)
      if (speed > 0.5) angle = Math.atan2(dy, dx)
      stretch = lerp(stretch, Math.min(speed * 0.035, 0.75), 0.25)
      const goal = st.hover ? 2.1 : st.pressed ? 0.7 : 1
      s = lerp(s, goal, 0.18)
      body.style.background = `rgba(${c}, ${st.hover ? 0.28 : 0.85})`
      body.style.transform =
        `translate3d(${p.x - size / 2}px, ${p.y - size / 2}px, 0) ` +
        `rotate(${angle}rad) scale(${s * (1 + stretch)}, ${s * (1 - stretch * 0.45)})`
      dot.style.transform = `translate3d(${st.x - 3}px, ${st.y - 3}px, 0)`
    },
  }
}

function trailStyle(st, k) {
  const c = PALETTE.trail
  const N = 14
  const dots = []
  const pos = []
  for (let i = 0; i < N; i++) {
    const size = Math.max(4, 16 - i * 0.9)
    dots.push(
      makeEl({
        width: size + 'px',
        height: size + 'px',
        background: `rgba(${c}, ${Math.max(0.08, 0.95 - i * 0.07)})`,
      }),
    )
    pos.push({ x: -100, y: -100, size })
  }
  let s = 1
  return {
    els: dots,
    snap() { pos.forEach((q) => { q.x = st.x; q.y = st.y }) },
    update() {
      s = lerp(s, st.hover ? 1.7 : st.pressed ? 0.75 : 1, 0.18)
      pos.forEach((q, i) => {
        const tx = i === 0 ? st.x : pos[i - 1].x
        const ty = i === 0 ? st.y : pos[i - 1].y
        q.x = lerp(q.x, tx, k(i === 0 ? 0.6 : 0.42))
        q.y = lerp(q.y, ty, k(i === 0 ? 0.6 : 0.42))
        const sc = i === 0 ? s : 1
        dots[i].style.transform = `translate3d(${q.x - q.size / 2}px, ${q.y - q.size / 2}px, 0) scale(${sc})`
      })
    },
  }
}

function glowStyle(st, k) {
  const c = PALETTE.glow
  const size = 200
  const glow = makeEl({
    width: size + 'px',
    height: size + 'px',
    background: `radial-gradient(circle, rgba(${c}, 0.30) 0%, rgba(${c}, 0.12) 40%, rgba(${c}, 0) 68%)`,
  })
  const dot = makeEl({ width: '9px', height: '9px', background: `rgb(${c})` })
  const p = { x: -200, y: -200 }
  let gs = 1
  let ds = 1
  return {
    els: [glow, dot],
    snap() { p.x = st.x; p.y = st.y },
    update() {
      p.x = lerp(p.x, st.x, k(0.1))
      p.y = lerp(p.y, st.y, k(0.1))
      gs = lerp(gs, st.hover ? 1.6 : st.pressed ? 0.8 : 1, 0.12)
      ds = lerp(ds, st.hover ? 0.4 : st.pressed ? 1.6 : 1, 0.2)
      glow.style.transform = `translate3d(${p.x - size / 2}px, ${p.y - size / 2}px, 0) scale(${gs})`
      dot.style.transform = `translate3d(${st.x - 4.5}px, ${st.y - 4.5}px, 0) scale(${ds})`
    },
  }
}

function ringStyle(st, k) {
  const c = PALETTE.ring
  const RING = 26
  const DOT = 10
  const ring = makeEl({ width: RING + 'px', height: RING + 'px', border: `1.5px solid rgb(${c})` })
  const dot = makeEl({ width: DOT + 'px', height: DOT + 'px', background: `rgba(${c}, 0.42)` })
  const d = { x: -100, y: -100 }
  const r = { x: -100, y: -100 }
  let s = 1
  return {
    els: [ring, dot],
    snap() { d.x = r.x = st.x; d.y = r.y = st.y },
    update() {
      d.x = lerp(d.x, st.x, k(0.35))
      d.y = lerp(d.y, st.y, k(0.35))
      r.x = lerp(r.x, st.x, k(0.15))
      r.y = lerp(r.y, st.y, k(0.15))
      s = lerp(s, st.hover ? 1.7 : st.pressed ? 0.8 : 1, 0.2)
      dot.style.transform = `translate3d(${d.x - DOT / 2}px, ${d.y - DOT / 2}px, 0)`
      ring.style.transform = `translate3d(${r.x - RING / 2}px, ${r.y - RING / 2}px, 0) scale(${s})`
    },
  }
}

const rand = (a, b) => a + Math.random() * (b - a)

function sparkleStyle(st, k) {
  const COLORS = ['236, 50, 55', '255, 140, 60', '244, 114, 182', '250, 204, 21']
  const N = 30
  const parts = []
  const els = []
  for (let i = 0; i < N; i++) {
    const el = makeEl({ width: '8px', height: '8px', borderRadius: '1px', opacity: '0' })
    els.push(el)
    parts.push({ life: 0, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, size: 8 })
  }
  const head = makeEl({ width: '8px', height: '8px', background: `rgb(${PALETTE.sparkle})` })
  els.push(head)
  let idx = 0
  let last = { x: -100, y: -100 }
  let lastClick = 0
  let s = 1
  const spawn = (x, y, vx, vy) => {
    const q = parts[idx++ % N]
    q.life = 1
    q.x = x
    q.y = y
    q.vx = vx
    q.vy = vy
    q.rot = rand(0, 90)
    q.vr = rand(-6, 6)
    q.size = rand(5, 10)
    const el = els[(idx - 1) % N]
    el.style.width = el.style.height = q.size + 'px'
    el.style.background = `rgb(${COLORS[Math.floor(Math.random() * COLORS.length)]})`
  }
  return {
    els,
    snap() { last = { x: st.x, y: st.y } },
    update() {
      const dx = st.x - last.x
      const dy = st.y - last.y
      last = { x: st.x, y: st.y }
      const speed = Math.hypot(dx, dy)
      const count = speed > 1.5 ? Math.min(3, 1 + Math.floor(speed / 10)) : 0
      for (let i = 0; i < count; i++) {
        spawn(st.x + rand(-4, 4), st.y + rand(-4, 4), rand(-0.7, 0.7) - dx * 0.03, rand(-0.3, 0.9) - dy * 0.03)
      }
      if (st.clickId !== lastClick) {
        lastClick = st.clickId
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2
          const v = rand(2, 4.5)
          spawn(st.x, st.y, Math.cos(a) * v, Math.sin(a) * v)
        }
      }
      parts.forEach((q, i) => {
        if (q.life <= 0) return
        q.life -= 0.03
        q.x += q.vx
        q.y += q.vy
        q.vy += 0.05
        q.rot += q.vr
        const el = els[i]
        if (q.life <= 0) {
          el.style.opacity = '0'
          return
        }
        el.style.opacity = String(Math.min(1, q.life * 1.4))
        el.style.transform = `translate3d(${q.x - q.size / 2}px, ${q.y - q.size / 2}px, 0) rotate(${q.rot}deg) scale(${q.life})`
      })
      s = lerp(s, st.hover ? 1.8 : st.pressed ? 0.7 : 1, 0.2)
      head.style.transform = `translate3d(${st.x - 4}px, ${st.y - 4}px, 0) rotate(45deg) scale(${s})`
    },
  }
}

function rippleStyle(st, k) {
  const c = PALETTE.ripple
  const dot = makeEl({ width: '9px', height: '9px', background: `rgb(${c})` })
  const pulse = makeEl({ width: '30px', height: '30px', border: `1.5px solid rgba(${c}, 0.55)` })
  const waves = []
  for (let i = 0; i < 4; i++) {
    waves.push({ el: makeEl({ width: '40px', height: '40px', border: `2px solid rgba(${c}, 0.7)`, opacity: '0' }), t0: 0, x: 0, y: 0, on: false })
  }
  const p = { x: -100, y: -100 }
  let ds = 1
  let ps = 1
  let lastClick = 0
  let wi = 0
  return {
    els: [pulse, ...waves.map((w) => w.el), dot],
    snap() { p.x = st.x; p.y = st.y },
    update() {
      const now = performance.now()
      p.x = lerp(p.x, st.x, k(0.3))
      p.y = lerp(p.y, st.y, k(0.3))
      if (st.clickId !== lastClick) {
        lastClick = st.clickId
        const w = waves[wi++ % waves.length]
        w.t0 = now
        w.x = st.x
        w.y = st.y
        w.on = true
      }
      waves.forEach((w) => {
        if (!w.on) return
        const t = (now - w.t0) / 700
        if (t >= 1) {
          w.on = false
          w.el.style.opacity = '0'
          return
        }
        const e = 1 - Math.pow(1 - t, 3)
        w.el.style.opacity = String(0.8 * (1 - t))
        w.el.style.transform = `translate3d(${w.x - 20}px, ${w.y - 20}px, 0) scale(${0.3 + e * 3.2})`
      })
      const beat = k(1) === 1 ? 1 + 0.12 * Math.sin(now / 260) : 1
      ps = lerp(ps, st.hover ? 1.7 : st.pressed ? 0.7 : 1, 0.18)
      ds = lerp(ds, st.hover ? 0.6 : st.pressed ? 1.5 : 1, 0.2)
      pulse.style.transform = `translate3d(${p.x - 15}px, ${p.y - 15}px, 0) scale(${ps * beat})`
      dot.style.transform = `translate3d(${st.x - 4.5}px, ${st.y - 4.5}px, 0) scale(${ds})`
    },
  }
}

function crosshairStyle(st, k) {
  const c = PALETTE.crosshair
  const LEN = 38
  const h = makeEl({ width: LEN + 'px', height: '1.5px', borderRadius: '0', background: '#1A1A1A' })
  const v = makeEl({ width: '1.5px', height: LEN + 'px', borderRadius: '0', background: '#1A1A1A' })
  const dot = makeEl({ width: '4px', height: '4px', background: `rgb(${c})` })
  const p = { x: -100, y: -100 }
  let rot = 0
  let sc = 1
  return {
    els: [h, v, dot],
    snap() { p.x = st.x; p.y = st.y },
    update() {
      p.x = lerp(p.x, st.x, k(0.35))
      p.y = lerp(p.y, st.y, k(0.35))
      rot = lerp(rot, st.hover ? 45 : 0, 0.18)
      sc = lerp(sc, st.hover ? 1.5 : st.pressed ? 0.75 : 1, 0.2)
      const col = st.hover ? `rgb(${c})` : '#1A1A1A'
      h.style.background = v.style.background = col
      h.style.transform = `translate3d(${p.x - LEN / 2}px, ${p.y - 0.75}px, 0) rotate(${rot}deg) scale(${sc})`
      v.style.transform = `translate3d(${p.x - 0.75}px, ${p.y - LEN / 2}px, 0) rotate(${rot}deg) scale(${sc})`
      dot.style.transform = `translate3d(${st.x - 2}px, ${st.y - 2}px, 0)`
    },
  }
}

function magnetStyle(st, k) {
  const c = PALETTE.magnet
  const BASE = 22
  const box = makeEl({
    width: BASE + 'px',
    height: BASE + 'px',
    boxSizing: 'border-box',
    border: `1.5px solid rgba(${c}, 0.9)`,
    background: `rgba(${c}, 0.06)`,
  })
  const dot = makeEl({ width: '5px', height: '5px', background: `rgb(${c})` })
  const cur = { cx: -100, cy: -100, w: BASE, h: BASE }
  return {
    els: [box, dot],
    snap() { cur.cx = st.x; cur.cy = st.y },
    update() {
      let tx = st.x
      let ty = st.y
      let tw = st.pressed ? BASE * 0.7 : BASE
      let th = tw
      let wrapped = false
      if (st.hover && st.hoverEl && st.hoverEl.isConnected) {
        const r = st.hoverEl.getBoundingClientRect()
        // Only wrap reasonably sized things (buttons, links) — not huge cards.
        if (r.width > 0 && r.width < 420 && r.height < 260) {
          tx = r.left + r.width / 2
          ty = r.top + r.height / 2
          tw = r.width + 12
          th = r.height + 12
          wrapped = true
        } else {
          tw = th = BASE * 1.6
        }
      }
      const f = k(0.22)
      cur.cx = lerp(cur.cx, tx, f)
      cur.cy = lerp(cur.cy, ty, f)
      cur.w = lerp(cur.w, tw, f)
      cur.h = lerp(cur.h, th, f)
      box.style.width = cur.w + 'px'
      box.style.height = cur.h + 'px'
      box.style.borderRadius = Math.min(cur.w, cur.h, 24) / 2 + 'px'
      box.style.background = `rgba(${c}, ${wrapped ? 0.1 : 0.06})`
      box.style.transform = `translate3d(${cur.cx - cur.w / 2}px, ${cur.cy - cur.h / 2}px, 0)`
      dot.style.transform = `translate3d(${st.x - 2.5}px, ${st.y - 2.5}px, 0)`
    },
  }
}

const STYLES = {
  blob: blobStyle,
  trail: trailStyle,
  glow: glowStyle,
  ring: ringStyle,
  sparkle: sparkleStyle,
  ripple: rippleStyle,
  crosshair: crosshairStyle,
  magnet: magnetStyle,
}

/**
 * @param {string} styleName  one of CURSOR_STYLE_IDS
 * @param {{ target?: Window|HTMLElement, hideNative?: boolean }} [options]
 *   target     – where the mouse is tracked (default: the whole window)
 *   hideNative – also hide the normal arrow, site-wide (html.hide-system-cursor)
 * @returns {() => void} stop function (removes everything it added)
 */
export function startCursor(styleName, { target = window, hideNative = false } = {}) {
  // Only for devices with a real mouse — skip touch screens.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const k = (n) => (reduce ? 1 : n)

  const st = { x: -100, y: -100, hover: false, hoverEl: null, pressed: false, clickId: 0 }
  const make = STYLES[styleName] || STYLES[DEFAULT_CURSOR_STYLE]
  const cursor = make(st, k)

  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  Object.assign(root.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '99999',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 200ms ease',
  })
  cursor.els.forEach((el) => root.appendChild(el))
  document.body.appendChild(root)

  if (hideNative) document.documentElement.classList.add('hide-system-cursor')

  const isWindow = target === window
  const leaveTarget = isWindow ? document.documentElement : target

  let started = false
  let visible = false
  let raf = 0
  let stopTimer = 0

  const tick = () => {
    cursor.update()
    raf = requestAnimationFrame(tick)
  }
  // The animation loop only runs while the cursor is on screen.
  const startLoop = () => {
    clearTimeout(stopTimer)
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const setVisible = (v) => {
    if (v === visible) return
    visible = v
    root.style.opacity = v ? '1' : '0'
    if (v) {
      startLoop()
    } else {
      stopTimer = setTimeout(() => {
        cancelAnimationFrame(raf)
        raf = 0
      }, 300)
    }
  }

  const onMove = (e) => {
    st.x = e.clientX
    st.y = e.clientY
    if (!started) {
      cursor.snap()
      started = true
    }
    setVisible(true)
    st.hoverEl = e.target && e.target.closest ? e.target.closest(INTERACTIVE) : null
    st.hover = !!st.hoverEl
  }
  const onDown = () => {
    st.pressed = true
    st.clickId += 1
  }
  const onUp = () => { st.pressed = false }
  const onLeave = () => {
    started = false // next entry jumps straight to the mouse instead of flying in
    setVisible(false)
  }

  target.addEventListener('mousemove', onMove, { passive: true })
  target.addEventListener('mousedown', onDown)
  window.addEventListener('mouseup', onUp)
  leaveTarget.addEventListener('mouseleave', onLeave)

  return () => {
    clearTimeout(stopTimer)
    cancelAnimationFrame(raf)
    target.removeEventListener('mousemove', onMove)
    target.removeEventListener('mousedown', onDown)
    window.removeEventListener('mouseup', onUp)
    leaveTarget.removeEventListener('mouseleave', onLeave)
    if (hideNative) document.documentElement.classList.remove('hide-system-cursor')
    root.remove()
  }
}
