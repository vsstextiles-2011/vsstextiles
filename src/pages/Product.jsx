import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, ZoomIn, ZoomOut, X, Expand, Minimize2, Move, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { onImgErrorChain } from '../utils/imgFallback.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import StarRating from '../components/common/StarRating.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import { getProductDetails, getFabricType } from '../data/productDetails.js'
import { sortByCatalogOrder } from '../utils/catalogOrder.js'

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

// How far a shopper can zoom in. Fixed at a single 200% level — zoom is
// now an on/off toggle (see zoomIn/zoomOut below), not a stepped range,
// so this constant is also the exact level the zoom button jumps to.
const MAX_ZOOM = 2

// Euclidean distance between two touch points, used to turn a pinch
// gesture into a zoom-level delta.
function touchDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// The color a product opens with, picked automatically so a shopper only
// ever has to choose a Size — never a Color, whether the product has one
// swatch or ten. Prefers the first color that's actually in stock (an
// explicit inStock: false), so nobody lands on a color they can't order;
// falls back to the first listed color if every color happens to be out of
// stock (matching how manually picking an OOS color already behaves —
// canOrder blocks checkout, but the swatch itself stays selectable).
function defaultColorFor(product) {
  if (!product?.colors?.length) return ''
  return (product.colors.find((c) => c.inStock !== false) || product.colors[0]).name
}

export default function Product() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { getVisibleProductById, storeProducts: allProducts } = useProducts()
  const product = getVisibleProductById(productId)
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  // Size starts unselected on purpose — a shopper must actively tap a size
  // chip before Add to Cart / Buy Now become clickable (see canOrder
  // below). Color is different: it's auto-picked (see defaultColorFor
  // above) for every product, single-color or multi-color alike, so
  // Color is never something the shopper has to actively choose — they
  // can still switch swatches if they want a different one, but nothing
  // blocks on it.
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [color, setColor] = useState(() => defaultColorFor(product))
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

  // Tracks every pointer currently touching the main image / lightbox, so a
  // second finger touching down turns a drag into a pinch-to-zoom instead of
  // a pan. pinchRef/lightboxPinchRef record the zoom level and finger
  // spacing at the moment the second finger landed, so the zoom scales
  // relative to that starting point rather than jumping.
  const activePointers = useRef(new Map())
  const pinchRef = useRef(null)
  const lightboxActivePointers = useRef(new Map())
  const lightboxPinchRef = useRef(null)

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
  // for the *previous* product.
  //
  // IMPORTANT: this reset must happen DURING render, not in a useEffect.
  // An effect only runs *after* the first render with the new product has
  // been painted, so for one frame the page showed the NEW product with
  // the OLD product's color (e.g. "Maroon Floral" titled page still on
  // "MUSTARD"), which has no matching photos -> blank gallery + wrong
  // color label flashing on every Prev/Next click. Adjusting state while
  // rendering makes React discard that render and immediately re-render
  // with the correct values, before anything is painted.
  const [renderedProductId, setRenderedProductId] = useState(productId)
  if (renderedProductId !== productId) {
    setRenderedProductId(productId)
    setSize('')
    setQty(1)
    setColor(defaultColorFor(product))
    setActiveImage(0)
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
    setLightboxPan({ x: 0, y: 0 })
    setLightboxOpen(false)
  }

  // Scroll back to the top when a different product is opened. Skipped on
  // the very first render so simply loading a product page doesn't jump/
  // animate.
  const isFirstProductRender = useRef(true)
  useEffect(() => {
    if (isFirstProductRender.current) {
      isFirstProductRender.current = false
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [productId])

  // Block the browser's own Ctrl+scroll / trackpad-pinch page zoom while the
  // cursor is over the product image or the fullscreen viewer — that native
  // browser zoom (which jumps in its own steps: 150%, 200%, 250%... up to
  // 400%/500%) is what was blowing the image up past any usable size, and
  // it's separate from this component's own zoomLevel state entirely.
  //
  // This has to be a real, manually-attached DOM listener with
  // { passive: false } — React's onWheel prop registers its one shared
  // listener as passive, so calling preventDefault() from a normal onWheel
  // handler is silently ignored by the browser and can't stop native zoom.
  // Only ctrlKey wheel events (the signal for both Ctrl+scroll and pinch)
  // are blocked, so ordinary scrolling over the image still scrolls the
  // page like anywhere else.
  useEffect(() => {
    function blockBrowserZoom(e) {
      if (e.ctrlKey) e.preventDefault()
    }
    const imageEl = imageFrameRef.current
    const lightboxEl = lightboxFrameRef.current
    imageEl?.addEventListener('wheel', blockBrowserZoom, { passive: false })
    lightboxEl?.addEventListener('wheel', blockBrowserZoom, { passive: false })
    return () => {
      imageEl?.removeEventListener('wheel', blockBrowserZoom)
      lightboxEl?.removeEventListener('wheel', blockBrowserZoom)
    }
  }, [lightboxOpen])

  // Freeze the page behind the fullscreen lightbox — without this, a
  // scroll/swipe while the lightbox is open scrolls the underlying product
  // page (visible once the lightbox closes, jumped to wherever the
  // background happened to scroll to) instead of doing nothing. Restored
  // on close/unmount so normal page scrolling comes back.
  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [lightboxOpen])

  if (!product) {
    return (
      <div className="container-app py-20 text-center">
        <h2 className="text-xl font-semibold text-ink mb-3">Product not found</h2>
        <Link to="/shop" className="text-brand hover:underline">Back to Shop</Link>
      </div>
    )
  }

  const related = sortByCatalogOrder(
    allProducts.filter((p) => p.category === product.category && p.id !== product.id && p.inStock !== false)
  ).slice(0, 4)
  // Full same-category list (including this product) used to power the
  // Prev/Next product navigator below — order follows the site's normal
  // product listing order (the order products are defined in
  // data/products.js), not whatever order Firestore's onSnapshot happens
  // to hand back. Without this re-sort, Prev/Next would step through
  // products in a near-alphabetical-by-id order instead of stepping
  // through, say, all ten "Side Open Top" colors one after another, and
  // wraps around at either end.
  const categoryProducts = sortByCatalogOrder(
    allProducts.filter((p) => p.category === product.category)
  )
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
  // Before a shopper actively taps a color swatch, show the product in its
  // first listed color rather than a separately-uploaded generic photo —
  // "first place" color is what leads the swatch row, so it should lead
  // the gallery too. Once they do pick a color, that pick always wins.
  const displayColor = color || product.colors?.[0]?.name || ''
  // If this product defines real photos per color (product.colorImages),
  // use whichever set matches displayColor. A color with no dedicated
  // photos just keeps showing the product's normal photography — we never
  // simulate a color with a tint/filter, only with real photos.
  const colorImg = product.colorImages?.[displayColor]
  const frontSrc = colorImg?.image || product.image
  // A "back" photo that is literally the same file as the front photo isn't a
  // real back shot -- older Admin saves filled an empty Back field with a copy
  // of the front, which showed up here as a duplicate second thumbnail. Treat
  // it as no back photo at all so removing a back photo really removes it.
  const rawBackSrc = colorImg ? colorImg.imageBack : product.imageBack
  const backSrc = rawBackSrc && rawBackSrc !== frontSrc ? rawBackSrc : undefined
  // Every Women's Top gets a Side View slot ONLY when a real photo has
  // actually been added in Admin — no "coming soon" placeholder thumbnail
  // otherwise. This matches how Back View already behaves: no photo means
  // no thumbnail at all, rather than a slot that's always there just to
  // show a stand-in graphic. Adding a photo in Admin makes the thumbnail
  // appear; removing it there makes it disappear again.
  const isWomenTops = product.category === 'women' && product.menuParent === 'Tops'
  const rawSideSrc = isWomenTops ? (colorImg ? colorImg.imageSide : product.imageSide) : undefined
  const realSideSrc = rawSideSrc && rawSideSrc !== frontSrc ? rawSideSrc : undefined
  const sideSrc = isWomenTops ? realSideSrc : undefined
  const gallery = [
    {
      label: 'Front View',
      src: frontSrc,
      fallbackSeed: `${product.fallbackSeed || `${product.id}-a`}-${displayColor}`,
      // Nothing more "real" to recover to than the front photo itself —
      // a broken front image drops straight to the generic placeholder.
      recoverSrc: null,
    },
    // Back only shows up when the product (or the active color, if it has
    // its own colorImages entry) actually has a photo for it — remove
    // `imageBack` (at the product level, or inside a specific color's
    // block in `colorImages`) in src/data/products.js to drop that
    // thumbnail entirely, instead of it silently reappearing. If the file
    // that IS listed there fails to load (shot never taken / wrong
    // filename), recover to the product's own Front photo — a real,
    // correct picture of the same item — rather than a generic placeholder.
    ...(backSrc
      ? [{
          label: 'Back View',
          src: backSrc,
          fallbackSeed: `${product.fallbackSeedBack || `${product.id}-b`}-${displayColor}`,
          recoverSrc: frontSrc,
        }]
      : []),
    // Side View: Women's Tops only, and only once a real photo has been
    // added in Admin for the active color (see sideSrc above) — no
    // placeholder thumbnail when one hasn't been uploaded yet.
    ...(sideSrc
      ? [{
          label: 'Side View',
          src: sideSrc,
          fallbackSeed: `${product.fallbackSeed || `${product.id}-c`}-${displayColor}`,
          recoverSrc: frontSrc,
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

  // A color is only "out of stock" when its own entry was explicitly
  // unchecked in Admin (inStock: false) — colors saved before this feature
  // existed, or with no per-color stock info at all, read as in stock, same
  // `!== false` convention as the whole-product inStock flag.
  const selectedColorObj = product.colors?.find((c) => c.name === color)
  const colorOutOfStock = selectedColorObj ? selectedColorObj.inStock === false : false

  // A product only requires a choice where it actually offers one — a
  // product with no color list at all shouldn't block checkout waiting for
  // a color that was never offered. Where a list exists, though, picking
  // one is mandatory before this counts as orderable.
  const colorRequired = (product.colors?.length || 0) > 0
  const sizeRequired = (product.sizes?.length || 0) > 0
  const colorMissing = colorRequired && !color
  const sizeMissing = sizeRequired && !size
  const canOrder = product.inStock !== false && !colorOutOfStock && !colorMissing && !sizeMissing

  // Carry the actually-selected color's photo (frontSrc, already computed
  // above from colorImg) into the cart item as its `image` -- otherwise the
  // cart/checkout always show the product's plain default photo no matter
  // which color was picked here.
  function handleAddToCart() {
    addToCart(
      { ...product, image: frontSrc, price: sizePrice.price, oldPrice: sizePrice.oldPrice, discount: sizePrice.discount },
      size,
      qty,
      color
    )
  }

  function handleBuyNow() {
    addToCart(
      { ...product, image: frontSrc, price: sizePrice.price, oldPrice: sizePrice.oldPrice, discount: sizePrice.discount },
      size,
      qty,
      color
    )
    navigate('/cart')
  }

  // Zoom steps up in 50% increments — 100% -> 150% -> 200% — capped at
  // MAX_ZOOM, rather than jumping straight from 100% to 200%. No
  // scroll-wheel zoom: mouse-wheel zooming used to hijack page scrolling
  // the moment the cursor was over the image (and could run the zoom level
  // up far past anything usable), so it's been removed — scrolling over the
  // product image now just scrolls the page normally, and zoom only ever
  // changes via these +/- buttons (or the double-click shortcut below).
  function zoomIn() {
    setZoomLevel((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)))
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

  // Double-click / double-tap toggles between fully zoomed out and the
  // fixed 200% zoom — the fastest way to zoom without hunting for the
  // +/- buttons.
  function handleLightboxDoubleClick(e) {
    e.stopPropagation()
    setZoomLevel((z) => {
      if (z > 1) {
        setLightboxPan({ x: 0, y: 0 })
        return 1
      }
      return MAX_ZOOM
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

  // Main image: press and drag to pan around while zoomed in. A second
  // finger touching down mid-drag switches to pinch-to-zoom instead.
  function handlePointerDown(e) {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)

    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values())
      pinchRef.current = { startDist: touchDistance(a, b), startZoom: zoomLevel }
      setIsDragging(false)
      return
    }

    if (zoomLevel <= 1) return
    setIsDragging(true)
    dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }
  function handlePointerMove(e) {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (activePointers.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(activePointers.current.values())
      const { startDist, startZoom } = pinchRef.current
      const nextZoom = Math.max(1, Math.min(MAX_ZOOM, +(startZoom * (touchDistance(a, b) / startDist)).toFixed(2)))
      setZoomLevel(nextZoom)
      if (nextZoom === 1) setPan({ x: 0, y: 0 })
      return
    }

    if (!isDragging) return
    const rect = imageFrameRef.current.getBoundingClientRect()
    const nextX = clampPan(dragOrigin.current.panX + (e.clientX - dragOrigin.current.x) * DRAG_SENSITIVITY, zoomLevel, rect.width)
    const nextY = clampPan(dragOrigin.current.panY + (e.clientY - dragOrigin.current.y) * DRAG_SENSITIVITY, zoomLevel, rect.height)
    setPan({ x: nextX, y: nextY })
  }
  function handlePointerUp(e) {
    activePointers.current.delete(e.pointerId)
    if (activePointers.current.size < 2) pinchRef.current = null
    setIsDragging(false)
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Lightbox: same drag-to-pan + pinch-to-zoom pattern, independent state.
  function handleLightboxPointerDown(e) {
    lightboxActivePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)

    if (lightboxActivePointers.current.size === 2) {
      const [a, b] = Array.from(lightboxActivePointers.current.values())
      lightboxPinchRef.current = { startDist: touchDistance(a, b), startZoom: zoomLevel }
      setIsLightboxDragging(false)
      return
    }

    if (zoomLevel <= 1) return
    setIsLightboxDragging(true)
    lightboxDragOrigin.current = { x: e.clientX, y: e.clientY, panX: lightboxPan.x, panY: lightboxPan.y }
  }
  function handleLightboxPointerMove(e) {
    if (lightboxActivePointers.current.has(e.pointerId)) {
      lightboxActivePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (lightboxActivePointers.current.size === 2 && lightboxPinchRef.current) {
      const [a, b] = Array.from(lightboxActivePointers.current.values())
      const { startDist, startZoom } = lightboxPinchRef.current
      const nextZoom = Math.max(1, Math.min(MAX_ZOOM, +(startZoom * (touchDistance(a, b) / startDist)).toFixed(2)))
      setZoomLevel(nextZoom)
      if (nextZoom === 1) setLightboxPan({ x: 0, y: 0 })
      return
    }

    if (!isLightboxDragging) return
    const rect = lightboxFrameRef.current.getBoundingClientRect()
    const nextX = clampPan(lightboxDragOrigin.current.panX + (e.clientX - lightboxDragOrigin.current.x) * DRAG_SENSITIVITY, zoomLevel, rect.width)
    const nextY = clampPan(lightboxDragOrigin.current.panY + (e.clientY - lightboxDragOrigin.current.y) * DRAG_SENSITIVITY, zoomLevel, rect.height)
    setLightboxPan({ x: nextX, y: nextY })
  }
  function handleLightboxPointerUp(e) {
    lightboxActivePointers.current.delete(e.pointerId)
    if (lightboxActivePointers.current.size < 2) lightboxPinchRef.current = null
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
                  <img key={img.fallbackSeed} src={img.src} alt={img.label} onError={onImgErrorChain(img.recoverSrc, img.fallbackSeed, 200, 200)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image — use the +/- controls to zoom, then click and drag to pan around */}
            <div
              ref={imageFrameRef}
              className="relative flex-1 rounded-xl overflow-hidden bg-cream-dark h-[420px] sm:h-[500px] select-none"
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in', touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={() => { if (zoomLevel <= 1) openLightbox() }}
            >
              <img
                key={gallery[safeActiveImage].fallbackSeed}
                src={gallery[safeActiveImage].src}
                alt={`${product.name} — ${gallery[safeActiveImage].label}`}
                className={`w-full h-full object-cover ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
                onError={onImgErrorChain(gallery[safeActiveImage].recoverSrc, gallery[safeActiveImage].fallbackSeed)}
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
                  disabled={zoomLevel >= MAX_ZOOM}
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
                <span className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {safeActiveImage + 1} / {gallery.length}
                </span>
              )}

              <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
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

              {/* Zoom controls live at the top, next to Close — never at the
                  bottom, where mobile browser chrome / OS nav bars can cover
                  a bottom-anchored toolbar and make it un-clickable. */}
              <div
                className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-white/10 rounded-full p-1.5"
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
                  disabled={zoomLevel >= MAX_ZOOM}
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
                    className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); stepLightboxImage(1) }}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Next image"
                    title="Next image"
                    className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <div
                ref={lightboxFrameRef}
                className="w-full h-full flex items-center justify-center overflow-hidden select-none"
                style={{ cursor: zoomLevel > 1 ? (isLightboxDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleLightboxDoubleClick}
                onPointerDown={handleLightboxPointerDown}
                onPointerMove={handleLightboxPointerMove}
                onPointerUp={handleLightboxPointerUp}
                onPointerLeave={handleLightboxPointerUp}
                onPointerCancel={handleLightboxPointerUp}
              >
                {zoomLevel > 1 && (
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
                    <Move size={12} /> Drag to look around
                  </span>
                )}
                {zoomLevel <= 1 && (
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
                    Pinch or use +/− to zoom · double-click to toggle
                  </span>
                )}
                {/* The image itself carries the zoom transform now, not a
                    small fixed-width wrapper around it — sizing the image
                    to fill most of the frame (via max-w/max-h) means that
                    scaling it up overflows the frame's edges and gets
                    cropped by this frame's own overflow-hidden, so zooming
                    reads as "getting closer to the product" instead of
                    just inflating the whole photo (product + surrounding
                    white space) while it all stays fully visible. */}
                <img
                  key={gallery[safeActiveImage].fallbackSeed}
                  src={gallery[safeActiveImage].src}
                  alt={`${product.name} — ${gallery[safeActiveImage].label}`}
                  className={`block max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain select-none ${isLightboxDragging ? '' : 'transition-transform duration-200 ease-out'}`}
                  onError={onImgErrorChain(gallery[safeActiveImage].recoverSrc, gallery[safeActiveImage].fallbackSeed)}
                  draggable={false}
                  style={{
                    transform: `scale(${zoomLevel}) translate(${lightboxPan.x / zoomLevel}px, ${lightboxPan.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            {/* Purchase panel — styled with the site's own brand language:
                mono for prices/labels (same as the product cards), the
                `eyebrow` label style, brand red for selections + the primary
                CTA, near-black as the contrast CTA, sharp corners, and the
                stitch-divider / swing-tag signatures. */}
            {product.category && <p className="eyebrow text-brand mb-2 capitalize">{product.category}</p>}
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight mb-2">{product.name}</h1>
            {product.inStock === false && (
              <span className="inline-block mb-2 bg-madras-light text-madras font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-sm">
                Out of Stock
              </span>
            )}
            <StarRating rating={product.rating} count={product.ratingCount} size={15} />

            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mt-5 font-mono">
              <span className="text-3xl font-semibold text-ink">{formatPrice(sizePrice.price)}</span>
              {sizePrice.oldPrice > sizePrice.price && (
                <>
                  <span className="text-sm text-ink-soft/60 line-through">{formatPrice(sizePrice.oldPrice)}</span>
                  <span className="swing-tag bg-brand text-white text-[11px] font-medium uppercase tracking-wider pl-5 pr-3 py-1">
                    {sizePrice.discount}% off
                  </span>
                </>
              )}
            </div>

            {fabricType && (
              <p className="mt-4 flex items-baseline gap-3">
                <span className="eyebrow">Fabric</span>
                <span className="font-mono text-sm text-ink capitalize">{fabricType}</span>
              </p>
            )}

            <div className="stitch-divider mt-6" />

            {product.sizes?.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="eyebrow text-ink">
                    Size
                    {product.sizeUnit ? ` (${product.sizeUnit})` : ''}
                  </span>
                  {size && (
                    <>
                      <span className="text-ink-soft/40">—</span>
                      <span className="font-mono text-xs text-brand uppercase tracking-wider">{size}</span>
                    </>
                  )}
                </div>
                {/* Square boxes in a row (no pill shapes). Boxes are at least
                    w-16 but grow to fit longer labels like "3XL - 5XL" on ONE
                    line (whitespace-nowrap) instead of wrapping. Every size
                    this product offers is selectable/in-stock (there's no
                    per-size availability flag in the data model), so none
                    render in a crossed-out "unavailable" state. The selected
                    size is filled brand red. */}
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s) => {
                    const isSelected = size === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        aria-pressed={isSelected}
                        className={`min-w-[4rem] h-12 px-4 flex items-center justify-center whitespace-nowrap border rounded-sm font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                          isSelected
                            ? 'border-brand bg-brand text-white'
                            : 'border-thread bg-white text-ink hover:border-brand hover:text-brand'
                        }`}
                      >
                        {s}
                        {product.sizeUnit ? ` ${product.sizeUnit}` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="eyebrow text-ink">Color</span>
                  {color && (
                    <>
                      <span className="text-ink-soft/40">—</span>
                      <span className="font-mono text-xs text-brand uppercase tracking-wider">{color}</span>
                    </>
                  )}
                  {colorOutOfStock && (
                    <span className="ml-1 bg-madras-light text-madras font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
                {/* flex-wrap + shrink-0 on each swatch keeps every dot a true
                    w-10 h-10 circle. The diagonal strike is reserved for
                    "out of stock" only — selection is shown with its own
                    distinct treatment (a ring + a small check badge) so the
                    two states can never be confused for each other. An
                    out-of-stock color stays clickable — a shopper can still
                    preview its photos — but is dimmed and struck through,
                    and picking it disables Add to Cart / Buy Now below
                    (see canOrder) until they switch to an in-stock color. */}
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c) => {
                    const outOfStock = c.inStock === false
                    const isSelected = color === c.name
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => switchColor(c.name)}
                        aria-label={outOfStock ? `${c.name} (out of stock)` : c.name}
                        title={outOfStock ? `${c.name} — Out of stock` : c.name}
                        className={`relative shrink-0 w-10 h-10 rounded-full border-2 transition-all ${
                          isSelected ? 'border-white ring-2 ring-brand' : 'border-gray-300 hover:border-ink/50'
                        } ${outOfStock ? 'opacity-35' : ''}`}
                        style={
                          c.topHex
                            ? { background: `conic-gradient(${c.topHex} 0deg 180deg, ${c.hex} 180deg 360deg)` }
                            : { backgroundColor: c.hex }
                        }
                      >
                        {outOfStock && (
                          <span
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{ background: 'linear-gradient(to top right, transparent 46%, #dc2626 48%, #dc2626 52%, transparent 54%)' }}
                          />
                        )}
                        {isSelected && !outOfStock && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center border-2 border-white pointer-events-none">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-7">
              <span className="eyebrow text-ink block mb-3">Quantity</span>
              {/* One bordered box holding minus / count / plus, matching the
                  reference's single-outline stepper (rather than three
                  separate boxes). */}
              <div className="inline-flex items-center border border-thread rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-11 h-11 flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors"
                >
                  −
                </button>
                <span className="w-11 h-11 flex items-center justify-center font-mono font-medium border-x border-thread">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="w-11 h-11 flex items-center justify-center text-ink-soft hover:bg-brand-light hover:text-brand transition-colors"
                >
                  +
                </button>
              </div>
              {qty > 1 && (
                <p className="text-sm text-ink-soft mt-2 font-mono">
                  Total ({qty} × {formatPrice(sizePrice.price)}):{' '}
                  <span className="font-semibold text-brand">{formatPrice(sizePrice.price * qty)}</span>
                </p>
              )}
            </div>

            {/* Disclaimer moved here (above Add to Cart / Buy Now) so shoppers
                see it before purchasing, not buried at the bottom of the page. */}
            <p className="mt-7 bg-cream-dark border-l-2 border-brand px-4 py-3 text-xs text-ink-soft leading-relaxed">
              <span className="eyebrow text-brand mr-1.5">Disclaimer</span>
              {productDetails.disclaimer}
            </p>

            {/* The primary button's own label carries the missing-selection
                prompt (e.g. "Please Select a Size") instead of a separate
                helper line above it — matching the reference, where the CTA
                itself states what's still needed. */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={!canOrder}
                className={`flex-1 h-[52px] px-4 rounded-sm flex items-center justify-center gap-2 font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                  canOrder
                    ? 'btn-primary'
                    : product.inStock === false || colorOutOfStock
                      ? 'bg-cream-dark border border-thread text-ink-soft/70 cursor-not-allowed'
                      : 'bg-brand-light border border-brand-soft text-brand-dark cursor-not-allowed'
                }`}
              >
                {product.inStock === false || colorOutOfStock ? (
                  'Out of Stock'
                ) : sizeMissing && colorMissing ? (
                  'Please Select Color & Size'
                ) : sizeMissing ? (
                  'Please Select a Size'
                ) : colorMissing ? (
                  'Please Select a Color'
                ) : (
                  <>
                    <ShoppingBag size={17} /> Add To Cart
                  </>
                )}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label="Toggle wishlist"
                className="w-[52px] h-[52px] rounded-sm border border-thread flex items-center justify-center hover:border-brand hover:bg-brand-light transition-colors shrink-0"
              >
                <Heart size={19} className={wishlisted ? 'fill-brand text-brand' : 'text-ink-soft'} />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={!canOrder}
              className={`w-full mt-3 h-[52px] rounded-sm font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                canOrder
                  ? 'bg-ink hover:bg-brand text-white'
                  : 'bg-cream-dark border border-thread text-ink-soft/70 cursor-not-allowed'
              }`}
            >
              Buy It Now
            </button>

            <div className="stitch-divider mt-8 opacity-40" />
            <div className="grid grid-cols-3 gap-4 pt-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="swing-tag w-10 h-10 bg-brand-light text-brand flex items-center justify-center">
                  <Truck size={19} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="swing-tag w-10 h-10 bg-brand-light text-brand flex items-center justify-center">
                  <RotateCcw size={19} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="swing-tag w-10 h-10 bg-brand-light text-brand flex items-center justify-center">
                  <ShieldCheck size={19} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Quality Assured</span>
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