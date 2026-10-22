# VSS Textiles API (Express + MongoDB, with Firebase login)

Your website keeps running on **Firebase** (login, live updates, security rules). This server adds **MongoDB**:

- Products, orders, contact messages and **customer profiles (name, email, phone, saved addresses)** are **copied into MongoDB** automatically while the site runs.
- MongoDB powers **search, filters and sales reports** (Admin -> MongoDB tab).
- Login uses your existing Firebase accounts - the website sends its Firebase login token and the server verifies it. Admin rights come from the same Firestore `admins/{uid}` document as before. No service-account file is needed.

If the server is off, the website works exactly as before.

## 1. Get a MongoDB

- **Easiest (free): MongoDB Atlas** - create a free cluster, add a database user, allow your IP, then Connect -> Drivers -> copy the `mongodb+srv://...` string.
- Or install MongoDB Community locally and use `mongodb://127.0.0.1:27017`.

## 2. Run the server (Windows)

```
cd server
npm install
copy .env.example .env
```

Open `server\.env` and paste your connection string into `MONGODB_URI`. Then:

```
npm run dev
```

You should see `VSS Textiles API on http://localhost:5000/api/health (MongoDB connected)`.

## 3. Turn it on in the website

In the project's main `.env` file add:

```
VITE_MONGO_API_URL=http://localhost:5000/api
```

Restart `npm run dev`, sign in to `/admin`, open **MongoDB** (under Manage) and:

1. **Check connection**
2. **Sync all products** and **Sync all orders** (one-time first copy)
3. **Load report** for revenue, monthly sales, top states and best sellers

After that, every new/changed product, order status change and contact message is copied automatically.

## Endpoints

| Method | Path | Who |
|---|---|---|
| GET | /api/health | anyone |
| GET | /api/products (?category, type, q, inStock, minPrice, maxPrice, limit, skip), /api/products/:id | anyone |
| PUT / PATCH / DELETE | /api/products/:id, POST /api/products/sync | admin |
| PUT | /api/orders/:id | the order's owner, or admin |
| PATCH | /api/orders/:id/status | admin, or owner cancelling |
| GET | /api/orders/mine | signed-in user |
| GET | /api/orders (?status), POST /api/orders/sync | admin |
| PUT | /api/customers/:uid | the customer themself, or admin |
| GET | /api/customers (?q=search), /api/customers/:uid, POST /api/customers/sync | admin |
| POST | /api/messages | anyone |
| GET | /api/messages | admin |
| GET | /api/admin/reports/sales, /api/admin/check | admin |

To call protected endpoints from Postman, send the header `Authorization: Bearer <Firebase ID token>` (the token the website gets after login).

## Notes

- Firebase is still the source of truth. MongoDB is a copy: if they ever differ, press **Sync all** in Admin -> MongoDB.
- Photos/videos are still uploaded by the Vite dev server (`npm run dev`). A live host needs a file store such as Cloudinary or Firebase Storage.
- Put this server on a host such as Render or Railway for production, and set `CORS_ORIGINS` to your website address and `VITE_MONGO_API_URL` to the server's public address.
