// Safety net for product photos: if the "real" image fails to load
// (deleted, renamed, never uploaded, or the browser has no internet
// access at all), swap it for a placeholder instead of leaving the
// browser's bare broken-image icon on the page.
//
// This used to call out to https://picsum.photos for the placeholder
// itself, which meant the "fallback" could ALSO fail to load (no network,
// the host being blocked, etc.) — leaving exactly the broken-icon-plus-
// alt-text look this file exists to prevent. It's now a same-origin data
// URI built entirely in the browser, so it always renders, offline or on.

const PALETTE = ['#F3D9C6', '#D9E4D9', '#D9E0F3', '#F3D9E4', '#E8E0D0', '#D0E8E4', '#E4D0E8']

function hashSeed(seed) {
  let h = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

// Builds a small, deterministic (same seed -> same look) placeholder square:
// a soft background tint plus a simple shirt/garment glyph, so a missing
// photo reads as "no photo yet" rather than "something broke".
export function fallbackSrc(seed, w = 600, h = 600) {
  const hash = hashSeed(seed)
  const bg = PALETTE[hash % PALETTE.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${bg}"/>
    <path d="M35 22 L42 22 L50 30 L58 22 L65 22 L75 32 L67 40 L62 36 L62 78 L38 78 L38 36 L33 40 L25 32 Z"
      fill="#ffffff" fill-opacity="0.55" stroke="#00000022" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Placeholder for a Women's Top's "Side View" slot when no side photo has been
// added yet (Admin -> Edit Product -> Side View Photo). Same look as the
// other placeholders above (same garment glyph), plus a label so shoppers can
// tell it's a not-yet-added photo rather than a broken image. It's a fixed
// same-origin data URI, so it always renders -- no file to host or lose.
export const SIDE_VIEW_PLACEHOLDER = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#EFEAE2"/>
    <g transform="translate(0 -4)">
      <path d="M35 22 L42 22 L50 30 L58 22 L65 22 L75 32 L67 40 L62 36 L62 78 L38 78 L38 36 L33 40 L25 32 Z"
        fill="#ffffff" fill-opacity="0.55" stroke="#00000022" stroke-width="1.5" stroke-linejoin="round"/>
    </g>
    <text x="50" y="90" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="4.6" fill="#8A8378">Side view · photo coming soon</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
})()

// Standard <img onError> handler: swap straight to the local placeholder.
// Use this for single-photo spots (product cards, category tiles, hero
// slides) where there's no other real photo of the same item to try first.
export function onImgError(seed, w = 600, h = 600) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = fallbackSrc(seed, w, h)
  }
}

// Chained <img onError> handler for the product gallery's Side/Back
// thumbnails: a missing back/side photo isn't really "no photo" for that
// product, it's usually just a shot that was never taken for that specific
// angle -- so try the product's own Front photo first (an actual, correct
// picture of the same item) before dropping to the generic placeholder.
// `recoverSrc` is the Front image src to try; pass null/undefined to skip
// straight to the placeholder.
export function onImgErrorChain(recoverSrc, seed, w = 600, h = 600) {
  return (e) => {
    const img = e.currentTarget
    if (recoverSrc && img.src !== recoverSrc) {
      img.onerror = () => {
        img.onerror = null
        img.src = fallbackSrc(seed, w, h)
      }
      img.src = recoverSrc
    } else {
      img.onerror = null
      img.src = fallbackSrc(seed, w, h)
    }
  }
}
