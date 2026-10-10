import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AnnouncementBar from './components/layout/AnnouncementBar.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import PageTransition from './components/layout/PageTransition.jsx'

import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import DailyEssentials from './pages/DailyEssentials.jsx'
import TShirts from './pages/TShirts.jsx'
import Slips from './pages/Slips.jsx'
import Panties from './pages/Panties.jsx'
import Offers from './pages/Offers.jsx'
import TrendingPage from './pages/TrendingPage.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Account from './pages/Account.jsx'
import Profile from './pages/Profile.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import About from './pages/About.jsx'
import ProductType from './pages/ProductType.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import NotFound from './pages/NotFound.jsx'
import { AdminRoute, ProtectedRoute } from './components/auth/ProtectedRoute.jsx'

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

  // Clicking a link to the page you're already on (e.g. "Home" in the footer
  // while on the homepage) doesn't change the route, so the effect above never
  // runs. Catch that click and smooth-scroll back to the top instead.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return
      const url = new URL(a.href, window.location.href)
      if (url.origin === window.location.origin && url.pathname === pathname && !url.hash && !hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
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
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/daily-essentials" element={<DailyEssentials />} />
            <Route path="/t-shirts" element={<TShirts />} />
            <Route path="/slips" element={<Slips />} />
            <Route path="/panties" element={<Panties />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/new-arrivals" element={<TrendingPage sectionId="new-arrivals" />} />
            <Route path="/best-sellers" element={<TrendingPage sectionId="best-seller" />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/about" element={<About />} />
            <Route path="/types/:typeSlug" element={<ProductType />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}