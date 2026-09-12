import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Eye, X } from 'lucide-react'
import { formatPrice } from '../../utils/formatPrice.js'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { onImgError } from '../../utils/imgFallback.js'

export default function ProductCard({ product, showRemoveFromWishlist = false, previewColor = null }) {
  const { addToCart } = useCart()
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

        {/* Add to cart — a bar that slides up over the image on hover (desktop),
            always visible on touch devices via the persistent footer button below */}
        {!outOfStock && (
          <button
            onClick={() => addToCart(product)}
            className="hidden sm:flex absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-ink hover:bg-brand text-white text-xs font-mono uppercase tracking-wider py-2.5 items-center justify-center gap-2"
          >
            <ShoppingBag size={14} /> Add to Cart
          </button>
        )}
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

        {/* Persistent footer button on touch/mobile where hover doesn't apply */}
        <button
          onClick={() => !outOfStock && addToCart(product)}
          disabled={outOfStock}
          className={`sm:hidden mt-3 w-full py-2.5 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
            outOfStock ? 'bg-gray-100 text-ink-soft/60 cursor-not-allowed' : 'bg-ink text-white'
          }`}
        >
          <ShoppingBag size={14} />
          {outOfStock ? 'Out of Stock' : 'Add To Cart'}
        </button>
      </div>
    </div>
  )
}
