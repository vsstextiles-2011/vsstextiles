import { Link } from 'react-router-dom'
import { Heart, Eye, X } from 'lucide-react'
import { formatPrice } from '../../utils/formatPrice.js'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { onImgError } from '../../utils/imgFallback.js'

// disableQuickAdd is kept as an accepted (now unused) prop so existing
// callers that still pass it don't need to change — every card behaves the
// same way regardless: a "View Product" link, never a quick add-to-cart.
export default function ProductCard({ product, showRemoveFromWishlist = false, previewColor = null }) {
  const { isWishlisted, toggleWishlist, removeFromWishlist } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const outOfStock = product.inStock === false

  // When exactly one color is active in the Shop filter, try to show the
  // product actually wearing that color rather than its default photo —
  // e.g. filtering "Pink" should picture the pink T-shirt, not just any
  // T-shirt that happens to come in pink. Only kicks in if the product has
  // a real photo for that color (product.colorImages); there's no fake
  // tint fallback here, same principle as the product detail page — an
  // untinted default photo is more honest than a simulated color.
  const previewImg = previewColor ? product.colorImages?.[previewColor]?.image : null
  const cardImage = previewImg || product.image

  return (
    <div className="group flex flex-col border border-thread hover:border-ink/40 bg-white transition-colors duration-300">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`} className="block aspect-[4/5] overflow-hidden bg-cream-dark">
          <img
            src={cardImage}
            alt={previewImg ? `${product.name} — ${previewColor}` : product.name}
            loading="lazy"
            onError={onImgError(product.fallbackSeed || product.id)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {outOfStock && (
            <span className="absolute top-2 left-2 bg-ink text-white text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-sm">
              Out of Stock
            </span>
          )}
        </Link>

        {/* Quick-action rail — always visible on touch devices (no hover to
            reveal it on); on mice/trackpads it still slides in on hover so
            it doesn't clutter the card until needed. */}
        <div className="absolute top-0 right-0 flex flex-col transition-transform duration-300 translate-x-0 sm:translate-x-full sm:group-hover:translate-x-0">
          <button
            onClick={() => toggleWishlist(product)}
            aria-label="Toggle wishlist"
            className="w-9 h-9 bg-white/95 hover:bg-white flex items-center justify-center border-b border-l border-thread"
          >
            <Heart size={15} className={wishlisted ? 'fill-brand text-brand' : 'text-ink-soft'} />
          </button>
          <Link
            to={`/product/${product.id}`}
            aria-label="Quick view"
            className="w-9 h-9 bg-white/95 hover:bg-white flex items-center justify-center border-b border-l border-thread"
          >
            <Eye size={15} className="text-ink-soft" />
          </Link>
        </div>

        {/* Every card — every category, every section of the site — opens
            the product page from here instead of quick-adding to cart. A
            shopper always picks a color/size on the product page itself
            before anything goes in the cart. */}
        <Link
          to={`/product/${product.id}`}
          className="hidden sm:flex absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-ink hover:bg-brand text-white text-xs font-mono uppercase tracking-wider py-2.5 items-center justify-center gap-2"
        >
          <Eye size={14} /> View Product
        </Link>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="text-sm font-medium text-ink line-clamp-2 hover:text-brand transition-colors">
          {product.name}
        </Link>

        <div className="mt-2.5 flex items-center gap-2 font-mono">
          <span className="font-semibold text-ink text-[15px]">{formatPrice(product.price)}</span>
          {product.oldPrice > product.price && (
            <>
              <span className="text-xs text-ink-soft/60 line-through">{formatPrice(product.oldPrice)}</span>
              <span className="text-[11px] text-brand font-medium">
                {Math.round(100 - (product.price / product.oldPrice) * 100)}% off
              </span>
            </>
          )}
        </div>

        {/* Wishlist page only — a clearly labeled, always-visible remove
            button (not tucked behind a hover-only icon) so items can be
            taken off the list in one tap. */}
        {showRemoveFromWishlist && (
          <button
            onClick={() => removeFromWishlist(product.id)}
            className="mt-2.5 w-full py-2 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 border border-thread text-ink-soft hover:border-brand hover:text-brand transition-colors"
          >
            <X size={14} /> Remove
          </button>
        )}

        {/* Persistent footer button on touch/mobile where hover doesn't
            apply — same "View Product" link as the desktop hover bar. */}
        <Link
          to={`/product/${product.id}`}
          className="sm:hidden mt-3 w-full py-2.5 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors bg-ink text-white"
        >
          <Eye size={14} /> View Product
        </Link>
      </div>
    </div>
  )
}
