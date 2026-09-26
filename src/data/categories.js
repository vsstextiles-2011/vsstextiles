// "Shop by Category" banner data for VSS Textiles (the 4 big tiles near
// the top of the homepage: Men / Women / Boys / Girls).
//
// This is SEPARATE from `collections.js`, which powers the homepage
// "Men's / Women's / Boys' / Girls' Collection" grid sections further
// down the page. Editing one never affects the other.
//
// IMAGES: every image below points to a local file under
// `public/images/categories/main/...` instead of a hotlinked Unsplash
// photo. To update a banner photo, just replace the matching file with
// your own image (keep the same filename) — see
// `public/images/categories/README.md` for the full guide.
//
// If a local file is ever missing, the <img> falls back to a
// guaranteed-working placeholder (see `onImgError` from
// `utils/imgFallback.js`) instead of showing a broken image icon.
export const shopByCategory = [
  {
    id: 'men',
    title: 'Men',
    image: '/images/categories/main/men.jpg',
    link: '/shop/men',
  },
  {
    id: 'women',
    title: 'Women',
    image: '/images/categories/main/women.jpg',
    link: '/shop/women',
  },
  {
    id: 'boys',
    title: 'Boys',
    image: '/images/categories/main/boys.jpg',
    link: '/shop/boys',
  },
  {
    id: 'girls',
    title: 'Girls',
    image: '/images/categories/main/girls.jpg',
    link: '/shop/girls',
  },
]
