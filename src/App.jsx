import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AnnouncementBar from './components/layout/AnnouncementBar.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'

import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import DailyEssentials from './pages/DailyEssentials.jsx'
import TShirts from './pages/TShirts.jsx'
import Slips from './pages/Slips.jsx'
import Panties from './pages/Panties.jsx'
import Offers from './pages/Offers.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Account from './pages/Account.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // If the link included a #anchor (e.g. the hero's "Shop By Category"
    // slide pointing at /#shop-by-category), smooth-scroll to that section
    // instead of jumping to the top of the page — and keep retrying for a
    // moment in case the target section hasn't mounted/laid out yet.
    if (hash) {
      const id = hash.slice(1)
      let attempts = 0
      const tryScroll = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (attempts < 20) {
          attempts += 1
          requestAnimationFrame(tryScroll)
        }
      }
      tryScroll()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/daily-essentials" element={<DailyEssentials />} />
          <Route path="/t-shirts" element={<TShirts />} />
          <Route path="/slips" element={<Slips />} />
          <Route path="/panties" element={<Panties />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Admin panel disabled for now — route removed, Admin.jsx kept
              in src/pages/ so it's a one-line add-back when it's needed. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
