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

- Cart, Wishlist, Product (admin overrides), and Order state are held in React Context and mirrored to `localStorage`, so they survive a page reload on the same browser/device. There's no shared backend, so none of this syncs across different browsers or devices.
- Product images are local files under `public/images/`; swap `src/data/products.js` and `src/data/categories.js` with your real catalog and image assets when going live.
- `/admin` now requires an admin login (see **Authentication** below) — it's no longer open to anyone who knows the URL.

## Authentication (Firebase)

Login/signup for customers, and the admin gate on `/admin`, run on **Firebase Authentication** + **Firestore**. Setup:

### 1. Get your Firebase project's web config

In the [Firebase Console](https://console.firebase.google.com/): open your project → gear icon → **Project settings** → **General** → scroll to "Your apps" → add/select the **Web app** → copy the values under "SDK setup and configuration".

Copy `.env.example` to `.env` in the project root and paste them in:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env` is git-ignored — never commit your real keys.

### 2. Turn on Email/Password sign-in

Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.

### 3. Create a Firestore database

Firebase Console → **Firestore Database** → **Create database** → start in production mode (rules below lock it down properly).

### 4. Set Firestore security rules

Firebase Console → **Firestore Database** → **Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Every signed-in user can read/write only their own profile doc.
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Admins collection: anyone signed in can READ it (so the app can
    // check "am I an admin?"), but it can only be written to by hand from
    // the Firebase Console — never from client code.
    match /admins/{userId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### 5. Create your first admin account

1. Run the app (`npm run dev`), go to `/account`, sign up like a normal customer.
2. Firebase Console → **Authentication** → **Users** → copy that account's **User UID**.
3. Firebase Console → **Firestore Database** → **Start collection** → collection ID `admins` → **Document ID**: paste the UID → add any field, e.g. `role: "admin"` → Save.
4. Log out and back in on the site (or just refresh) — that account can now open `/admin`.

Repeat step 2–3 for any other staff account you want to give admin access to. Everyone else who signs up is a regular customer with no admin document, so `/admin` redirects them home.

### How it works in the code

- `src/firebase.js` — initializes the Firebase app from your `.env` values.
- `src/context/AuthContext.jsx` — `signup()`, `login()`, `logout()`, current `user`, and `isAdmin` (looked up from the `admins` Firestore collection whenever someone signs in).
- `src/components/auth/ProtectedRoute.jsx` — `<AdminRoute>` guards `/admin`; wrap any other route in `<ProtectedRoute>` if you want it to require login only (no admin check).
- `src/pages/Account.jsx` — the login/signup form, and the signed-in account panel with a Log Out button.

## Admin authentication fix

The admin login checks `admins/{FirebaseAuthUID}` in Cloud Firestore and requires:

- `role` = `admin`
- `active` = `true`
- optional `email` field matching the signed-in account

A safe Firestore rules file is included as `firestore.rules`.

To publish it with Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

Or copy the `match /admins/{adminId}` rule from `firestore.rules` into Firebase Console → Firestore Database → Rules and click **Publish**.

Both `/admin/login` and `/admin-login` open the admin login page.
