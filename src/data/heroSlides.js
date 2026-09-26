// Homepage hero slider data for VSS Textiles.
//
// This is SEPARATE from `categories.js` (Shop by Category banner) and
// `collections.js` (homepage Collection grid sections) — the hero slider
// has its own dedicated image folder, so editing one never affects the
// others.
//
// IMAGES: every image below points to a local file under
// `public/images/hero/...`. To update a slide photo, just replace the
// matching file with your own image (keep the same filename) — see
// `public/images/hero/README.md` for the full guide.
//
// To add a new slide: drop an image into `public/images/hero/`, then add
// an entry here.
//
// DISPLAY: every slide's image fills the banner edge-to-edge (object-cover,
// centred) — no letterbox bars, no blurred backdrop copy — with just the
// CTA button underneath. No eyebrow/title/description text is rendered on
// top of the photo. Because the fill is centre-cropped rather than
// letterboxed, keep the main subject of each photo reasonably centred in
// the frame so it isn't cut off on narrower/shorter screens.
export const heroSlides = [
  {
    id: 'men',
    eyebrow: 'Shop By Categorie',
    title: 'Shop By Categorie',
    description: 'Shirts, tees, denim and innerwear made for all-day comfort — new colours just dropped.',
    image: '/images/hero/shop-by-categorie.jpg',
    cta: { label: 'Shop By Category', to: '/#shop-by-category' },
  },
  {
    id: 'women',
    eyebrow: 'Everyday Essentials',
    title: 'Everyday Essentials',
    description: 'From loungewear to everyday outerwear, curated pieces for every mood and moment.',
    image: '/images/hero/everyday-essentials.jpg',
    cta: { label: 'Shop Daily Essentials', to: '/daily-essentials' },
  },
  {
    id: 'boys',
    eyebrow: 'Brassier',
    title: 'Brassier',
    description: 'Soft, comfortable bras in everyday and sports styles, made to move with you.',
    image: '/images/hero/brassier.jpg',
    cta: { label: 'Shop Brassiers', to: '/shop/women?type=bras' },
  },
  {
    id: 'girls',
    eyebrow: 'T-shirt Collection',
    title: 'T-shirt Collection',
    description: 'T-shirts for the whole family — Men, Women, Boys and Girls, all in one place.',
    image: '/images/hero/tshirt-collection.jpg',
    cta: { label: 'Shop T-Shirts', to: '/t-shirts' },
  },
  {
    id: 'offer',
    eyebrow: 'Slip Collection',
    title: 'Slip Collection',
    description: "Soft, everyday slips for Women and Girls — all styles, one place.",
    image: '/images/hero/slip-collection.jpg',
    cta: { label: 'Shop Slips', to: '/slips' },
  },
  {
    id: 'shop-all',
    eyebrow: 'Panties Collection',
    title: 'Panties Collection',
    description: 'Men, women, boys and girls — browse the entire collection in one place and filter down to exactly what you need.',
    image: '/images/hero/panties-collection.jpg',
    cta: { label: 'Shop Panties', to: '/panties' },
  },
]
