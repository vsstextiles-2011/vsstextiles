import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProductProvider } from './context/ProductContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { SiteContentProvider, getInitialHeroSlides } from './context/SiteContentContext.jsx'
import './index.css'

// Warm the browser's image cache with every homepage hero photo at app boot,
// in slide order and one after another: slide 1 gets the whole connection
// first (it's what the shopper sees), then slide 2 (needed next), and so on.
// Fetching all six at once made them fight for bandwidth, so the *next*
// slide could arrive late. Each is also decoded up front so the first time
// it's shown there's no decode hitch.
;(async () => {
  for (const slide of getInitialHeroSlides()) {
    const img = new Image()
    img.src = slide.image
    try {
      await (img.decode ? img.decode() : Promise.resolve())
    } catch {
      /* a failed warm-up is harmless — the slider handles its own errors */
    }
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <SiteContentProvider>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <App />
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
          </SiteContentProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)