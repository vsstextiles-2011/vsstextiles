import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProductProvider } from './context/ProductContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { heroSlides } from './data/heroSlides.js'
import './index.css'

// Warm the browser's image cache with every homepage hero photo right at
// app boot — before the shopper has even reached the homepage. The hero
// component itself only unmounts and remounts as they navigate away to
// another page and back, which used to mean each return visit re-fetched
// and re-decoded the photo from scratch, showing a blank flash of the
// section's background in the gap. Kicking these requests off once, up
// front, means every later visit to Home — first time or the hundredth —
// finds the image already cached and ready to paint immediately.
heroSlides.forEach((slide) => {
  const img = new Image()
  img.src = slide.image
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <App />
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)