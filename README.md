# VSS Textiles

Garment e-commerce website built with React (Vite), Tailwind CSS, and React Router. Runs entirely client-side against the built-in product catalog — no backend/server required.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) in your browser.

`/admin` lets you add, edit, and delete products for your current session, but changes are held in memory only and reset on page reload, since there's no server to persist them to.

## Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/
    layout/       AnnouncementBar, Header, Navbar, MegaMenu, Footer
    home/         HeroSection, CategorySection, MenSection, WomenSection,
                   BoysSection, GirlsSection, FeaturedProducts, BestSellers,
                   OffersSection, WhyChooseUs, Testimonials, Newsletter
    common/       ProductCard, CategoryCard, SectionHeading, StarRating
  pages/          Home, Shop, Product, Cart, Wishlist, Account, Checkout,
                   OrderConfirmation, About, Contact, Admin, NotFound
  context/        CartContext, WishlistContext, ProductContext, OrderContext
  data/           products.js, categories.js, testimonials.js (built-in catalog)
  utils/          formatPrice.js, imgFallback.js, menu.js
  App.jsx         Route definitions
  main.jsx        App entry point
  index.css       Tailwind directives + shared utility classes
```

## Notes

- Cart, Wishlist, and Product state are held in React Context and reset on page reload (no backend/localStorage by design).
- Product images are local files under `public/images/`; swap `src/data/products.js` and `src/data/categories.js` with your real catalog and image assets when going live.
- `/admin` is a static demo dashboard (no auth, no persistent data store).
