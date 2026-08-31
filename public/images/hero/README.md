# Hero Slider Images

This folder holds the photos shown in the big homepage hero slider at
the very top of the site (New Arrival, Men's Edit, Women's Edit, Boys'
Edit, Girls' Edit, Limited Time Offer).

This folder is **completely separate** from `public/images/categories/`
(Shop by Category banner) and `public/images/collections/` (homepage
Collection grid sections) — updating a photo here never touches those,
and vice versa.

To change a photo, just **replace the file with your own image, keeping
the exact same filename**. No code changes needed.

Recommended: wide landscape photos, at least 1600x900px, JPG or PNG.

## Files
- `new-arrival.jpg`
- `men.jpg`
- `women.jpg`
- `boys.jpg`
- `girls.jpg`
- `offer.jpg`

Every file currently in this folder is a plain, blank colour-gradient
placeholder (no text or labels baked into the image) so the site
displays correctly out of the box and nothing shows through once you
swap in your own photo. Replace them whenever you're ready — the site
will pick up the new photo automatically the next time the page loads.

Note: the hero slider now shows only the photo plus a small "Shop"
button in the corner — the eyebrow/title/description text that used
to sit on top of the image has been removed, so the photo itself is
the whole ad.

To add a brand-new slide: drop an image into this folder, then add an
entry pointing to it in `src/data/heroSlides.js`.
