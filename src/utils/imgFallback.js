// Safety net for hotlinked photos: if the "real" category-relevant image
// fails to load (deleted, renamed, offline host, etc.), swap it for a
// guaranteed-to-load placeholder from Lorem Picsum instead of leaving a
// broken image icon on the page. Pass a stable, unique seed (e.g. the
// product id) so the fallback is at least consistent across reloads.
export function fallbackSrc(seed, w = 600, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export function onImgError(seed, w = 600, h = 600) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = fallbackSrc(seed, w, h)
  }
}
