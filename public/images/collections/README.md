# Collection Images (homepage grid sections)

This folder holds the per-item tile photos shown in the homepage
"Men's / Women's / Boys' / Girls' Collection" grid sections (T-Shirts,
Track Pant, Shorts, Briefs, Vest, etc.).

This folder is **completely separate** from `public/images/categories/`
(the big Men/Women/Boys/Girls banner tiles) — updating a photo here
never touches the banner images, and vice versa.

Each **section** has its own folder, and every item inside it has its
own dedicated image file. To change a photo, just **replace the file
with your own image, keeping the exact same filename** — no code
changes needed.

Recommended: square-ish or portrait photos, at least 600x800px, JPG or
PNG.

## men/ — Men's Collection tiles
- `tshirts.jpg`
- `track-pants.jpg`
- `shorts.jpg`
- `innerwear-men.jpg`
- `vests.jpg`
- `jeans.jpg` *(not currently shown on the homepage — available if you add it)*
- `jackets.jpg` *(not currently shown on the homepage — available if you add it)*
- `sweatshirts.jpg` *(not currently shown on the homepage — available if you add it)*

## women/ — Women's Collection tiles
- `t-shirts.jpg`
- `full-pant.jpg`
- `3-4th-pant.jpg`
- `shorts-set.jpg`
- `capri-set.jpg`
- `loungewear.jpg`
- `panties.jpg`
- `camisoles-and-slips.jpg`
- `boyshorts.jpg`
- `bras.jpg`
- `briefs.jpg`
- `cycling-shorts.jpg` *(not currently shown on the homepage — available if you add it)*

## boys/ — Boys' Collection tiles
- `t-shirts.jpg`
- `shirts.jpg`
- `shorts.jpg`
- `hoodies.jpg`
- `vests.jpg`
- `brief.jpg`

## girls/ — Girls' Collection tiles
- `t-shirts.jpg`
- `frock.jpg`
- `tops.jpg`
- `drawer.jpg`
- `panties.jpg`

Every file currently in these folders is either a placeholder image
labeled with the item name, or (for a few Men's/Women's items) a real
sample product photo already in place — either way, swap them out
whenever you're ready; the site will pick up the new photo
automatically the next time the page loads.

To add a brand-new tile: drop an image into the matching section
folder, then add an entry pointing to it in `src/data/collections.js`.
