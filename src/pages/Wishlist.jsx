import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext.jsx'
import ProductCard from '../components/common/ProductCard.jsx'

export default function Wishlist() {
  const { items } = useWishlist()

  if (items.length === 0) {
    return (
      <div className="container-app section-py text-center min-h-[50vh] flex flex-col items-center justify-center">
        <Heart size={56} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-ink mb-2">Your wishlist is empty</h2>
        <p className="text-ink-soft text-sm mb-6">Save items you love and find them here anytime.</p>
        <Link to="/shop" className="btn-primary px-6 py-3 text-sm">Explore Products</Link>
      </div>
    )
  }

  return (
    <section className="section-py bg-white min-h-[60vh]">
      <div className="container-app">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-8">My Wishlist</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showRemoveFromWishlist />
          ))}
        </div>
      </div>
    </section>
  )
}
