import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Search, User, Heart, ShoppingBag, X, Menu, ChevronDown, ChevronRight } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useProducts } from '../../context/ProductContext.jsx'
import { buildMegaMenu } from '../../utils/menu.js'
import MegaMenu from './MegaMenu.jsx'
import logo from '../../assets/vss-logo.jpg'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Men', to: '/shop/men', gender: 'men' },
  { label: 'Women', to: '/shop/women', gender: 'women' },
  { label: 'Boys', to: '/shop/boys', gender: 'boys' },
  { label: 'Girls', to: '/shop/girls', gender: 'girls' },
  { label: 'Offers', to: '/offers' },
  { label: 'Contact', to: '/contact' },
]

// Small grace period before the mega menu closes, so briefly crossing a gap
// (moving from the "Men" link down into the panel, or over to "Women") never
// causes a flicker. Opening still happens instantly on hover.
const CLOSE_DELAY = 180

export default function Header() {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const inputRef = useRef(null)

  // Nav / mega menu state, folded in from the old separate nav bar so the
  // links now live in the same row as the logo and icons.
  const { products } = useProducts()
  const megaMenu = useMemo(() => buildMegaMenu(products), [products])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeGender, setActiveGender] = useState(null)
  const [expandedMobile, setExpandedMobile] = useState(null)
  const closeTimer = useRef(null)
  const headerRef = useRef(null)
  // One DOM ref per nav link (Men/Women/Boys/Girls) so the dropdown can be
  // positioned under whichever one is active, instead of always sitting at
  // the far left of the page.
  const linkRefs = useRef({})
  const menuPanelRef = useRef(null)
  const [menuLeft, setMenuLeft] = useState(0)

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = (gender) => {
    clearCloseTimer()
    setActiveGender(gender)
    setMenuOpen(true)
    // Line the dropdown up under the link that was just hovered/tapped,
    // rather than leaving it pinned to the left edge of the header.
    const linkEl = linkRefs.current[gender]
    const headerEl = headerRef.current
    if (linkEl && headerEl) {
      const linkRect = linkEl.getBoundingClientRect()
      const headerRect = headerEl.getBoundingClientRect()
      setMenuLeft(linkRect.left - headerRect.left)
    }
  }

  const closeMenu = () => {
    clearCloseTimer()
    setMenuOpen(false)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setMenuOpen(false), CLOSE_DELAY)
  }

  // Tapping a category (Men/Women/Boys/Girls) opens its dropdown to show the
  // products/categories inside — same as hovering does on desktop with a
  // mouse. Tapping the same category again (now that it's open) lets the tap
  // through so it navigates to that shop page as normal.
  const handleGenderClick = (e, gender) => {
    if (menuOpen && activeGender === gender) {
      closeMenu()
      return
    }
    e.preventDefault()
    openMenu(gender)
  }

  // Tapping anywhere outside the header / open dropdown closes it — the
  // touch equivalent of moving the mouse away.
  useEffect(() => {
    if (!menuOpen) return
    const handleOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [menuOpen, activeGender])

  useEffect(() => () => clearCloseTimer(), [])

  // Once the panel has rendered (and whenever it resizes/reflows), nudge it
  // back on-screen if lining up under a right-hand link like "Girls" would
  // otherwise push it past the edge of the viewport.
  useLayoutEffect(() => {
    if (!menuOpen || !activeGender) return
    const reposition = () => {
      const linkEl = linkRefs.current[activeGender]
      const headerEl = headerRef.current
      const panelEl = menuPanelRef.current
      if (!linkEl || !headerEl || !panelEl) return
      const linkRect = linkEl.getBoundingClientRect()
      const headerRect = headerEl.getBoundingClientRect()
      const desiredLeft = linkRect.left - headerRect.left
      const maxLeft = headerRect.width - panelEl.offsetWidth - 16
      setMenuLeft(Math.max(16, Math.min(desiredLeft, maxLeft)))
    }
    reposition()
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [menuOpen, activeGender, megaMenu])

  const linkClass = (activeOverride) => ({ isActive }) => {
    const active = activeOverride !== undefined ? activeOverride : isActive
    return `relative py-2 text-xs font-medium uppercase tracking-wide transition-colors hover:text-brand after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2px] after:rounded-full after:transition-all ${
      active ? 'text-brand after:bg-brand' : 'text-ink-soft after:bg-transparent hover:after:bg-brand/30'
    }`
  }

  // Focus the input as soon as the search bar opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  // Let people press Escape to close the search bar
  useEffect(() => {
    if (!searchOpen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  function handleSearch(e) {
    e.preventDefault()
    navigate(query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : '/shop')
    setSearchOpen(false)
  }

  return (
    <header
      ref={headerRef}
      className="relative sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-thread"
      onMouseLeave={scheduleClose}
    >
      <div className="container-app py-3.5 md:py-4 flex items-center gap-4 md:gap-8">
        {/* Mobile menu toggle — opens the link drawer below the header */}
        <button
          className="md:hidden flex items-center text-ink-soft"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo — the VSS Textiles mark, standing alone. Always takes you
            home; if you're already there (just scrolled down), it scrolls
            back to the top instead of doing nothing. */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center shrink-0"
        >
          <img src={logo} alt="VSS Textiles" className="h-11 sm:h-12 w-auto" />
        </Link>

        {/* Desktop nav links — moved up here from the old separate nav row */}
        <div className="hidden md:flex items-center gap-7 shrink-0">
          {links.map((link) => (
            <div
              key={link.label}
              ref={(el) => {
                if (link.gender) linkRefs.current[link.gender] = el
              }}
              onMouseEnter={() => (link.gender ? openMenu(link.gender) : scheduleClose())}
              onClick={(e) => link.gender && handleGenderClick(e, link.gender)}
            >
              <NavLink
                to={link.to}
                className={linkClass()}
                end={link.to === '/'}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.gender && (
                    <ChevronDown
                      size={13}
                      className={`mt-0.5 transition-transform duration-200 ${
                        menuOpen && activeGender === link.gender ? 'rotate-180 text-brand' : ''
                      }`}
                    />
                  )}
                </span>
              </NavLink>
            </div>
          ))}
        </div>

        {/* Search — collapsed by default; expands into the available space
            when the search icon (or the shortcut) is used, and tucks back
            away once someone submits, hits Escape, or clicks the icon again. */}
        <div className="hidden md:flex flex-1 items-center justify-end min-w-0">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative flex items-center">
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70 hover:text-ink transition-colors"
                >
                  <X size={15} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, brands and more"
                  className="w-full rounded-full border border-thread bg-cream-dark pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand hover:bg-brand-dark text-cream rounded-full p-2 transition-colors"
                >
                  <Search size={15} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center text-ink-soft hover:text-brand transition-colors p-2 -mr-2"
            >
              <Search size={21} />
            </button>
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4 sm:gap-6 md:pl-6 md:border-l md:border-thread ml-auto md:ml-0">
          <button
            type="button"
            aria-label="Open search"
            onClick={() => setSearchOpen((open) => !open)}
            className="md:hidden flex flex-col items-center text-ink-soft hover:text-brand transition-colors"
          >
            <Search size={22} />
            <span className="text-[11px] mt-0.5">Search</span>
          </button>
          <Link to="/account" className="hidden sm:flex flex-col items-center text-ink-soft hover:text-brand transition-colors">
            <User size={22} />
            <span className="text-[11px] mt-0.5">Login</span>
          </Link>
          <Link to="/wishlist" className="relative flex flex-col items-center text-ink-soft hover:text-brand transition-colors">
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
            <span className="hidden sm:block text-[11px] mt-0.5">Wishlist</span>
          </Link>
          <Link to="/cart" className="relative flex flex-col items-center text-ink-soft hover:text-brand transition-colors">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="hidden sm:block text-[11px] mt-0.5">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile search — hidden until the search icon above is tapped */}
      {searchOpen && (
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-full border border-thread bg-cream-dark pl-5 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand hover:bg-brand-dark text-cream rounded-full p-2 transition-colors"
            >
              <Search size={16} />
            </button>
          </div>
        </form>
      )}

      {/* Desktop mega menu: aligned under whichever nav link (Men/Women/
          Boys/Girls) is currently active, via the measured `menuLeft`
          offset, and nudged back on-screen if that would run off the right
          edge (see the positioning effect above). Always mounted (once a
          gender has been chosen) so opacity/transform can transition
          smoothly instead of the panel popping in and out. */}
      <div
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        onClick={closeMenu}
        style={{ left: `${menuLeft}px` }}
        className={`hidden md:block absolute top-full pt-3 z-40 transition-all duration-200 ease-out ${
          menuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div ref={menuPanelRef}>
          {activeGender && <MegaMenu gender={activeGender} columns={megaMenu[activeGender] || []} />}
        </div>
      </div>

      {/* Mobile link drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-thread bg-white max-h-[75vh] overflow-y-auto">
          <div className="container-app flex flex-col py-2">
            {links.map((link) =>
              link.gender ? (
                <div key={link.label} className="border-b border-thread/60 last:border-0">
                  <div className="flex items-center justify-between">
                    <NavLink
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex-1 py-3 text-sm font-medium ${isActive ? 'text-brand' : 'text-ink-soft'}`
                      }
                      end={false}
                    >
                      {link.label}
                    </NavLink>
                    <button
                      aria-label={`Toggle ${link.label} categories`}
                      onClick={() =>
                        setExpandedMobile((prev) => (prev === link.gender ? null : link.gender))
                      }
                      className="p-3 text-ink-soft/60"
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          expandedMobile === link.gender ? 'rotate-90 text-brand' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {expandedMobile === link.gender && (
                    <div className="pb-3 pl-2 grid grid-cols-2 gap-x-4 gap-y-4">
                      {(megaMenu[link.gender] || []).map((col) => (
                        <div key={col.heading}>
                          <p className="text-[10px] font-semibold text-ink-soft/60 tracking-[0.12em] uppercase mb-2">
                            {col.heading}
                          </p>
                          <ul className="space-y-2">
                            {col.items.map((item) => (
                              <li key={item.slug}>
                                <NavLink
                                  to={`/shop/${link.gender}?type=${item.slug}`}
                                  onClick={() => {
                                    setMobileMenuOpen(false)
                                    setExpandedMobile(null)
                                  }}
                                  className="text-sm text-ink-soft hover:text-brand"
                                >
                                  {item.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-3 text-sm font-medium border-b border-thread/60 last:border-0 ${
                      isActive ? 'text-brand' : 'text-ink-soft'
                    }`
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              )
            )}
          </div>
        </div>
      )}
    </header>
  )
}
