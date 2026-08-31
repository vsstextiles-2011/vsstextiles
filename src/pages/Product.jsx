import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, ZoomIn, ZoomOut, X, Expand, Minimize2, Move, ChevronLeft, ChevronRight } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgError } from '../utils/imgFallback.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import StarRating from '../components/common/StarRating.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import { getProductDetails, getFabricType } from '../data/productDetails.js'

// Clamp how far the zoomed image can be dragged so its edges never leave a
// visible gap inside the frame.
function clampPan(value, zoomLevel, containerSize) {
  const maxOffset = ((zoomLevel - 1) * containerSize) / 2
  return Math.max(-maxOffset, Math.min(maxOffset, value))
}

// How much the image moves per pixel of cursor movement while dragging to
// pan around a zoomed image. 1 = 1:1 with the cursor; lower feels slower/
// heavier, higher feels faster/twitchier.
const DRAG_SENSITIVITY = 0.5

export default function Product() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { getProductById, products: allProducts } = useProducts()
  const product = getProductById(productId)
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [size, setSize] = useState(() => product?.sizes?.[0] || 'M')
  const [qty, setQty] = useState(1)
  const [color, setColor] = useState(product?.colors?.[0]?.name || '')
  const [activeImage, setActiveImage] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Drag-to-pan state for the main image and the fullscreen lightbox — each
  // tracked independently since they're separate viewers.
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const imageFrameRef = useRef(null)

  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 })
  const [isLightboxDragging, setIsLightboxDragging] = useState(false)
  const lightboxDragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const lightboxFrameRef = useRef(null)

  // Left/Right arrow keys: inside the fullscreen lightbox, step through this
  // color's other views (Front/Side/Back) — same as clicking the lightbox's
  // own chevrons. Outside the lightbox, step through the product's color
  // swatches instead — same swap as clicking a swatch directly. Skipped
  // while the shopper is typing in a field (e.g. the quantity input) so
  // arrow keys there still move the cursor/adjust the value as expected.
  // Placed above the early "product not found" return so hook order stays
  // consistent across renders; cycleColor/stepLightboxImage (defined
  // further down) are hoisted function declarations, so it's safe to
  // reference them here.
  //
  // IMPORTANT: stepLightboxImage's "next index" math reads activeImage
  // (via safeActiveImage) and gallery.length (which depends on colorImg's
  // side/back photos, i.e. product+color). If activeImage isn't in this
  // effect's deps, the listener keeps a stale closure after the first
  // keypress — it re-derives the same "next" index every time instead of
  // advancing, which is most visible on products with only 2 gallery
  // views, where it looks stuck bouncing between the same two images.
  useEffect(() => {
    function handleKeyDown(e) {
      if (!product) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const direction = e.key === 'ArrowRight' ? 1 : -1
      if (lightboxOpen) stepLightboxImage(direction)
      else cycleColor(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, color, lightboxOpen, activeImage])

  // The route only swaps :productId — this component stays mounted, so
  // switching products (via the Prev/Next buttons below, a related-product
  // card, etc.) wouldn't otherwise reset the size/color/qty/gallery picked
  // for the *previous* product. Sync all of that back to the new product's
  // defaults whenever productId changes. Skip the scroll-to-top on the very
  // first render so simply loading a product page doesn't jump/animate.
  const isFirstProductRender = useRef(true)
  useEffect(() => {
    setSize(product?.sizes?.[0] || 'M')
    setQty(1)
    setColor(product?.colors?.[0]?.name || '')
    setActiveImage(0)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
    setLightboxOpen(false)
    if (isFirstProductRender.current) {
      isFirstProductRender.current = false
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [productId])

  if (!product) {
    return (
      <div className="container-app py-20 text-center">
        <h2 className="text-xl font-semibold text-ink mb-3">Product not found</h2>
        <Link to="/shop" className="text-brand hover:underline">Back to Shop</Link>
      </div>
    )
  }

  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id && p.inStock !== false)
    .slice(0, 4)
  // Full same-category list (including this product) used to power the
  // Prev/Next product navigator below — order follows the site's normal
  // product listing order, and wraps around at either end.
  const categoryProducts = allProducts.filter((p) => p.category === product.category)
  const categoryIndex = categoryProducts.findIndex((p) => p.id === product.id)
  const prevProduct = categoryProducts.length > 1
    ? categoryProducts[(categoryIndex - 1 + categoryProducts.length) % categoryProducts.length]
    : null
  const nextProduct = categoryProducts.length > 1
    ? categoryProducts[(categoryIndex + 1) % categoryProducts.length]
    : null
  const productDetails = getProductDetails(product)
  const fabricType = getFabricType(product)
  const wishlisted = isWishlisted(product.id)
  // If this product defines real photos per color (product.colorImages),
  // use whichever set matches the currently selected color. A color with no
  // dedicated photos just keeps showing the product's normal photography —
  // we never simulate a color with a tint/filter, only with real photos.
  const colorImg = product.colorImages?.[color]
  // Once a color has its own colorImages entry, its Side/Back come only
  // from that entry's own imageSide/imageBack — never from that same
  // entry's `image`, or the view would keep showing (just reusing the
  // front photo) after someone deletes imageSide/imageBack to remove it.
  const sideSrc = colorImg ? colorImg.imageSide : product.imageSide
  const backSrc = colorImg ? colorImg.imageBack : product.imageBack
  const gallery = [
    {
      label: 'Front View',
      src: colorImg?.image || product.image,
      fallbackSeed: `${product.fallbackSeed || `${product.id}-a`}-${color}`,
    },
    // Side/Back only show up when the product (or the active color, if it
    // has its own colorImages entry) actually has a photo for them —
    // remove `imageSide` / `imageBack` (at the product level, or inside a
    // specific color's block in `colorImages`) in src/data/products.js to
    // drop that thumbnail entirely, instead of it silently reappearing.
    ...(sideSrc
      ? [{
          label: 'Side View',
          src: sideSrc,
          fallbackSeed: `${product.fallbackSeedSide || `${product.id}-s`}-${color}`,
        }]
      : []),
    ...(backSrc
      ? [{
          label: 'Back View',
          src: backSrc,
          fallbackSeed: `${product.fallbackSeedBack || `${product.id}-b`}-${color}`,
        }]
      : []),
  ]
  // If the gallery just shrank (e.g. the shopper had "Back View" open and
  // then picked a color with no back photo), fall back to the last
  // available image instead of pointing past the end of the array.
  const safeActiveImage = Math.min(activeImage, gallery.length - 1)

  // If this product has graduated pricing per size (e.g. vests sized by cm),
  // pull the price for whichever size is currently selected — otherwise just
  // use the product's normal price, unchanged by size.
  const sizePrice = product.sizePricing?.[size] || {
    price: product.price,
    oldPrice: product.oldPrice,
    discount: product.discount,
  }

  function handleAddToCart() {
    addToCart({ ...product, price: sizePrice.price, oldPrice: sizePrice.oldPrice, discount: sizePrice.discount }, size, qty, color)
  }

  function handleBuyNow() {
    addToCart({ ...product, price: sizePrice.price, oldPrice: sizePrice.oldPrice, discount: sizePrice.discount }, size, qty, color)
    navigate('/cart')
  }

  function zoomIn() {
    setZoomLevel((z) => Math.min(2, +(z + 0.5).toFixed(1)))
  }

  function zoomOut() {
    setZoomLevel((z) => {
      const next = Math.max(1, +(z - 0.5).toFixed(1))
      if (next === 1) {
        setPan({ x: 0, y: 0 })
        setLightboxPan({ x: 0, y: 0 })
      }
      return next
    })
  }

  function openLightbox() {
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
    setLightboxPan({ x: 0, y: 0 })
    setLightboxOpen(true)
  }

  function switchImage(i) {
    setActiveImage(i)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
  }

  // Steps the lightbox forward/back through the gallery (wrapping around at
  // either end), resetting zoom/pan so the new image always opens un-zoomed.
  function stepLightboxImage(direction) {
    const next = (safeActiveImage + direction + gallery.length) % gallery.length
    setActiveImage(next)
    setZoomLevel(1)
    setLightboxPan({ x: 0, y: 0 })
  }

  // Picking a new color swaps the gallery photos (see `gallery` above), so
  // jump back to the front-view thumbnail and reset any zoom/pan — otherwise
  // a shopper who was zoomed into the back view of "Black" would suddenly
  // see a zoomed-in back view of "White" instead of its front view.
  function switchColor(name) {
    setColor(name)
    setActiveImage(0)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
  }

  // Steps to the next/previous color in this product's swatch list (wrapping
  // around at either end) and swaps the main image over to it via
  // switchColor — same color-swap behavior as clicking a swatch directly,
  // just reachable from the arrows on the main image too.
  function cycleColor(direction) {
    if (!product?.colors || product.colors.length < 2) return
    const currentIndex = Math.max(0, product.colors.findIndex((c) => c.name === color))
    const nextIndex = (currentIndex + direction + product.colors.length) % product.colors.length
    switchColor(product.colors[nextIndex].name)
  }

  // Main image: press and drag to pan around while zoomed in.
  function handlePointerDown(e) {
    if (zoomLevel <= 1) return
    setIsDragging(true)
    dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e) {
    if (!isDragging) return
    const rect = imageFrameRef.current.getBoundingClientRect()
    const nextX = clampPan(dragOrigin.current.panX + (e.clientX - dragOrigin.current.x) * DRAG_SENSITIVITY, zoomLevel, rect.width)
    const nextY = clampPan(dragOrigin.current.panY + (e.clientY - dragOrigin.current.y) * DRAG_SENSITIVITY, zoomLevel, rect.height)
    setPan({ x: nextX, y: nextY })
  }
  function handlePointerUp(e) {
    setIsDragging(false)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Lightbox: same drag-to-pan pattern, independent state.
  function handleLightboxPointerDown(e) {
    if (zoomLevel <= 1) return
    setIsLightboxDragging(true)
    lightboxDragOrigin.current = { x: e.clientX, y: e.clientY, panX: lightboxPan.x, panY: lightboxPan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function handleLightboxPointerMove(e) {
    if (!isLightboxDragging) return
    const rect = lightboxFrameRef.current.getBoundingClientRect()
    const nextX = clampPan(lightboxDragOrigin.current.panX + (e.clientX - lightboxDragOrigin.current.x) * DRAG_SENSITIVITY, zoomLevel, rect.width)
    const nextY = clampPan(lightboxDragOrigin.current.panY + (e.clientY - lightboxDragOrigin.current.y) * DRAG_SENSITIVITY, zoomLevel, rect.height)
    setLightboxPan({ x: nextX, y: nextY })
  }
  function handleLightboxPointerUp(e) {
    setIsLightboxDragging(false)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <section className="pt-3 sm:pt-4 pb-16 md:pb-20 bg-white">
      <div className="container-app">
        {prevProduct && nextProduct && (
          <div className="flex items-center justify-between gap-3 mb-3 border border-thread rounded-xl px-3 py-2.5 bg-cream-dark/40">
            <button
              type="button"
              onClick={() => navigate(`/product/${prevProduct.id}`)}
              className="flex items-center gap-2 min-w-0 group"
              title={`Previous: ${prevProduct.name}`}
            >
              <span className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center shrink-0 group-hover:border-brand group-hover:text-brand text-ink-soft transition-colors">
                <ChevronLeft size={16} />
              </span>
              <span className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-[10px] uppercase tracking-wide text-ink-soft/70">Previous</span>
                <span className="text-xs font-medium text-ink truncate max-w-[140px]">{prevProduct.name}</span>
              </span>
            </button>

            <span className="text-xs text-ink-soft shrink-0 capitalize">
              {categoryIndex + 1} / {categoryProducts.length} in {product.category}
            </span>

            <button
              type="button"
              onClick={() => navigate(`/product/${nextProduct.id}`)}
              className="flex items-center gap-2 min-w-0 group"
              title={`Next: ${nextProduct.name}`}
            >
              <span className="hidden sm:flex flex-col items-end min-w-0">
                <span className="text-[10px] uppercase tracking-wide text-ink-soft/70">Next</span>
                <span className="text-xs font-medium text-ink truncate max-w-[140px]">{nextProduct.name}</span>
              </span>
              <span className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center shrink-0 group-hover:border-brand group-hover:text-brand text-ink-soft transition-colors">
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-10">
          <div className="flex gap-3 sm:gap-4">
            {/* Thumbnail rail — hover or click to switch the main image */}
            <div className="flex flex-col gap-3 shrink-0">
              {gallery.map((img, i) => (
                <button
                  key={img.label}
                  onMouseEnter={() => switchImage(i)}
                  onFocus={() => setActiveImage(i)}
                  onClick={() => switchImage(i)}
                  aria-label={img.label}
                  title={img.label}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-cream-dark border-2 transition-colors ${
                    safeActiveImage === i ? 'border-brand' : 'border-thread hover:border-brand/50'
                  }`}
                >
                  <img key={img.fallbackSeed} src={img.src} alt={img.label} onError={onImgError(img.fallbackSeed, 200, 200)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image — use the +/- controls to zoom, then click and drag to pan around */}
            <div
              ref={imageFrameRef}
              className="relative flex-1 rounded-xl overflow-hidden bg-cream-dark h-[420px] sm:h-[500px] select-none"
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => { if (zoomLevel <= 1) openLightbox() }}
            >
              <img
                key={gallery[safeActiveImage].fallbackSeed}
                src={gallery[safeActiveImage].src}
                alt={`${product.name} — ${gallery[safeActiveImage].label}`}
                className={`w-full h-full object-cover ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
                onError={onImgError(gallery[safeActiveImage].fallbackSeed)}
                style={{
                  transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
                }}
                draggable={false}
              />
              <span className="absolute bottom-3 left-3 bg-white/90 text-ink-soft text-xs font-medium px-2.5 py-1 rounded-full">
                {gallery[safeActiveImage].label}
              </span>
              {zoomLevel > 1 && (
                <span className="absolute top-3 left-3 flex items-center gap-1 bg-ink/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none">
                  <Move size={11} /> Drag to look around
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openLightbox() }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Open fullscreen view"
                title="Open fullscreen"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-ink-soft flex items-center justify-center hover:bg-white hover:text-brand transition-colors shadow-sm"
              >
                <Expand size={16} />
              </button>

              {/* Zoom in / zoom out controls */}
              <div
                className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 rounded-full p-1 shadow-sm"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                  disabled={zoomLevel <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[11px] font-medium text-ink-soft w-9 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                  disabled={zoomLevel >= 2}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>
          </div>

          {lightboxOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
            >
              {gallery.length > 1 && (
                <span className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {safeActiveImage + 1} / {gallery.length}
                </span>
              )}

              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Minimize view"
                  title="Minimize"
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <Minimize2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Close"
                  title="Close"
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 rounded-full p-1.5"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-40"
                  disabled={zoomLevel <= 1}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-white text-xs font-medium w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-40"
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); stepLightboxImage(-1) }}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Previous image"
                    title="Previous image"
                    className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); stepLightboxImage(1) }}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Next image"
                    title="Next image"
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <div
                ref={lightboxFrameRef}
                className="w-full h-full flex items-center justify-center overflow-hidden p-10 select-none"
                style={{ cursor: zoomLevel > 1 ? (isLightboxDragging ? 'grabbing' : 'grab') : 'default' }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={handleLightboxPointerDown}
                onPointerMove={handleLightboxPointerMove}
                onPointerUp={handleLightboxPointerUp}
                onPointerLeave={handleLightboxPointerUp}
              >
                {zoomLevel > 1 && (
                  <span className="absolute top-5 left-5 flex items-center gap-1 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
                    <Move size={12} /> Drag to look around
                  </span>
                )}
                <div
                  className="relative"
                  style={{
                    width: '600px',
                    transform: `scale(${zoomLevel}) translate(${lightboxPan.x / zoomLevel}px, ${lightboxPan.y / zoomLevel}px)`,
                  }}
                >
                  <img
                    key={gallery[safeActiveImage].fallbackSeed}
                    src={gallery[safeActiveImage].src}
                    alt={`${product.name} — ${gallery[safeActiveImage].label}`}
                    className={`block w-full ${isLightboxDragging ? '' : 'transition-transform duration-200'}`}
                    onError={onImgError(gallery[safeActiveImage].fallbackSeed)}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">{product.name}</h1>
            {product.inStock === false && (
              <span className="inline-block mb-2 bg-madras-light text-madras text-xs font-semibold px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            )}
            <StarRating rating={product.rating} count={product.ratingCount} size={15} />

            <div className="flex items-center gap-3 mt-4">
              <span className="text-2xl font-bold text-ink">{formatPrice(sizePrice.price)}</span>
              {sizePrice.oldPrice > sizePrice.price && (
                <>
                  <span className="text-ink-soft/60 line-through">{formatPrice(sizePrice.oldPrice)}</span>
                  <span className="text-brand font-semibold text-sm">{sizePrice.discount}% OFF</span>
                </>
              )}
            </div>

            {fabricType && (
              <p className="mt-4 text-sm">
                <span className="font-semibold text-ink">Fabric: </span>
                <span className="text-ink-soft capitalize">{fabricType}</span>
              </p>
            )}

            {product.colors?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-ink mb-2">
                  Select Color{color ? ` — ${color}` : ''}
                </h4>
                {/* flex-wrap + shrink-0 on each swatch keeps every dot a true
                    w-9 h-9 circle — without shrink-0 a long color list on a
                    narrow screen squeezes the buttons' width only (height
                    stays fixed), turning the circles into ovals/pills. */}
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => switchColor(c.name)}
                      aria-label={c.name}
                      title={c.name}
                      className={`shrink-0 w-9 h-9 rounded-full border-2 transition-all ${
                        color === c.name ? 'border-brand scale-110' : 'border-gray-300'
                      }`}
                      style={
                        c.topHex
                          ? { background: `conic-gradient(${c.topHex} 0deg 180deg, ${c.hex} 180deg 360deg)` }
                          : { backgroundColor: c.hex }
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-ink mb-2">
                Select Size{product.sizeUnit ? ` (${product.sizeUnit})` : ''}
              </h4>
              {/* Rounded, auto-width chips (not a rigid square grid) — each
                  size sits in its own soft rounded-corner box sized to fit
                  its label, wrapping onto a new row once a line fills up.
                  Matches the reference: comfortable padding, no forced
                  square/uniform sizing, just a clean row of pill-like
                  boxes. */}
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => {
                  const isSelected = size === s
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      aria-pressed={isSelected}
                      className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${
                        isSelected
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-ink border-gray-300 hover:border-brand'
                      }`}
                    >
                      {s}
                      {product.sizeUnit ? ` ${product.sizeUnit}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-ink mb-2">Quantity</h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:border-brand"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:border-brand"
                >
                  +
                </button>
              </div>
              {qty > 1 && (
                <p className="text-sm text-ink-soft mt-2">
                  Total ({qty} × {formatPrice(sizePrice.price)}):{' '}
                  <span className="font-semibold text-ink">{formatPrice(sizePrice.price * qty)}</span>
                </p>
              )}
            </div>

            {/* Disclaimer moved here (above Add to Cart / Buy Now) so shoppers
                see it before purchasing, not buried at the bottom of the page. */}
            <p className="mt-6 pt-4 border-t border-thread text-xs text-ink-soft leading-relaxed">
              <span className="font-semibold text-ink">Disclaimer: </span>
              {productDetails.disclaimer}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-lg font-medium transition-colors ${
                  product.inStock === false ? 'bg-gray-100 text-ink-soft/60 cursor-not-allowed' : 'btn-primary'
                }`}
              >
                <ShoppingBag size={17} /> {product.inStock === false ? 'Out of Stock' : 'Add To Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.inStock === false}
                className={`flex-1 py-3 text-sm rounded-lg font-medium transition-colors ${
                  product.inStock === false ? 'bg-gray-100 text-ink-soft/60 cursor-not-allowed' : 'btn-outline'
                }`}
              >
                Buy Now
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label="Toggle wishlist"
                className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:border-brand shrink-0"
              >
                <Heart size={19} className={wishlisted ? 'fill-brand text-brand' : 'text-ink-soft'} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-thread text-center">
              <div className="flex flex-col items-center gap-1.5">
                <Truck size={20} className="text-brand" />
                <span className="text-xs text-ink-soft">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RotateCcw size={20} className="text-brand" />
                <span className="text-xs text-ink-soft">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck size={20} className="text-brand" />
                <span className="text-xs text-ink-soft">Quality Assured</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-thread max-w-3xl">
          {product.description && (
            <p className="mb-6 text-sm text-ink-soft leading-relaxed">
              <span className="font-semibold text-ink">Description: </span>
              {product.description}
            </p>
          )}

          <ol className="space-y-5">
            {productDetails.sections.map((section, i) => (
              <li key={section.title}>
                <span className="font-semibold text-ink">
                  {i + 1}. {section.title}:
                </span>
                <ul className="mt-1.5 ml-5 list-disc space-y-1 text-sm text-ink-soft leading-relaxed">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm text-ink-soft leading-relaxed">{productDetails.closing}</p>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-ink mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
