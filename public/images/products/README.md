# Product Images

This folder holds the photos for every individual product listing.

Images are grouped into subfolders by section -- `men/`, `women/`, `boys/`,
and `girls/` -- matching the same layout used for
`public/images/collections/`.

Each product uses **three files** inside its section folder, named after its
product id (without the section prefix, since that's now the folder name):

- `<section>/<id>.jpg` -- front / main photo (shown on product cards and shop grid)
- `<section>/<id>-side.jpg` -- side-view photo (shown in the product gallery, between front and back)
- `<section>/<id>-back.jpg` -- back / rear photo (shown in the product gallery)

To update a product's photo, replace the matching file with your own image,
keeping the exact same filename and folder. No code changes needed.

Recommended: square photos, at least 600x600px, JPG or PNG.

## Removing the Side or Back view for one product

By default every product shows three gallery thumbnails: Front, Side, Back.
To drop the Side and/or Back thumbnail for just one product (e.g. it only
has a front photo), open that product's entry in `src/data/products.js` and
delete the `imageSide` and/or `imageBack` field(s) from it entirely --
don't leave them as `''` or `null`, remove the key/value pair itself. If
that product also has a `colorImages` block, do the same inside each
color's entry there.

The product page picks this up automatically: any view with no photo
defined for it just disappears from the thumbnail rail and the gallery,
instead of duplicating the front photo. Leave `imageSide`/`imageBack` in
place on every other product and their galleries are unaffected.

## Full list of product ids, grouped by category

Images are grouped first by section (Men / Women / Boys / Girls), then by
product type within that section (e.g. Topwear & Bottomwear like t-shirts,
shirts, and pants vs. Innerwear like vests, briefs, and trunks).

### Men

#### Outerwear

- **T-Shirts** -> `men/round-neck-t-shirt.jpg` + `men/round-neck-t-shirt-side.jpg` + `men/round-neck-t-shirt-back.jpg`
- **Track Pant** -> `men/track-pants.jpg` + `men/track-pants-side.jpg` + `men/track-pants-back.jpg`
- **Shorts** -> `men/casual-shorts.jpg` + `men/casual-shorts-side.jpg` + `men/casual-shorts-back.jpg`

#### Innerwear

- **Trunks** -> `men/trunks.jpg` + `men/trunks-side.jpg` + `men/trunks-back.jpg`
- **RN** -> `men/vests.jpg` + `men/vests-side.jpg` + `men/vests-back.jpg`
- **RNS** -> `men/vests.jpg` + `men/vests-side.jpg` + `men/vests-back.jpg`
- **Briefs** -> `men/briefs.jpg` + `men/briefs-side.jpg` + `men/briefs-back.jpg`
- **Boxers** -> `men/solid-boxers.jpg` + `men/solid-boxers-side.jpg` + `men/solid-boxers-back.jpg`

### Women

#### Outerwear

- **T-Shirts** -> `women/t-shirts.jpg` + `women/t-shirts-side.jpg` + `women/t-shirts-back.jpg`
- **Full Pant** -> `women/full-pant.jpg` + `women/full-pant-side.jpg` + `women/full-pant-back.jpg`
- **3/4th Pant** -> `women/3-4th-pant.jpg` + `women/3-4th-pant-side.jpg` + `women/3-4th-pant-back.jpg`
- **Shorts Set** -> `women/shorts-set.jpg` + `women/shorts-set-side.jpg` + `women/shorts-set-back.jpg`
- **Nighty** -> `women/nighty.jpg` + `women/nighty-side.jpg` + `women/nighty-back.jpg`

#### Innerwear

- **Panties** -> `women/panties.jpg` + `women/panties-side.jpg` + `women/panties-back.jpg`
- **Camisoles And Slips** -> `women/camisoles-and-slips.jpg` + `women/camisoles-and-slips-side.jpg` + `women/camisoles-and-slips-back.jpg`
- **Boyshorts** -> `women/boyshorts.jpg` + `women/boyshorts-side.jpg` + `women/boyshorts-back.jpg`
- **Bras** -> `women/bras.jpg` + `women/bras-side.jpg` + `women/bras-back.jpg`
- **Briefs** -> `women/briefs.jpg` + `women/briefs-side.jpg` + `women/briefs-back.jpg`

### Boys

#### Outerwear

- **Boys T-Shirts** -> `boys/printed-t-shirt.jpg` + `boys/printed-t-shirt-side.jpg` + `boys/printed-t-shirt-back.jpg`
- **Boys Shirts** -> `boys/casual-shirt.jpg` + `boys/casual-shirt-side.jpg` + `boys/casual-shirt-back.jpg`
- **Boys Co Ords & Shorts Set** -> `boys/nightwear-set.jpg` + `boys/nightwear-set-side.jpg` + `boys/nightwear-set-back.jpg`
- **Boys Set Items** -> `boys/kurta-pyjama.jpg` + `boys/kurta-pyjama-side.jpg` + `boys/kurta-pyjama-back.jpg`
- **Boys Full Pants** -> `boys/jeans.jpg` + `boys/jeans-side.jpg` + `boys/jeans-back.jpg`
- **Boys 3/4th Pants** -> `boys/track-pants.jpg` + `boys/track-pants-side.jpg` + `boys/track-pants-back.jpg`
- **Boys Shorts** -> `boys/casual-shorts.jpg` + `boys/casual-shorts-side.jpg` + `boys/casual-shorts-back.jpg`
- **Boys Hoodie** -> `boys/hoodie.jpg` + `boys/hoodie-side.jpg` + `boys/hoodie-back.jpg`

#### Innerwear

- **Boys Vests** -> `boys/vests.jpg` + `boys/vests-side.jpg` + `boys/vests-back.jpg`
- **Boys Drawer** -> `boys/drawer.jpg` + `boys/drawer-side.jpg` + `boys/drawer-back.jpg`
- **Boys Brief** -> `boys/brief.jpg` + `boys/brief-side.jpg` + `boys/brief-back.jpg`
- **Boys Trunks** -> `boys/trunks.jpg` + `boys/trunks-side.jpg` + `boys/trunks-back.jpg`
- **Boys Jetty** -> `boys/jetty.jpg` + `boys/jetty-side.jpg` + `boys/jetty-back.jpg`

### Girls

#### Outerwear

- **Girls T-Shirts** -> `girls/printed-t-shirt.jpg` + `girls/printed-t-shirt-side.jpg` + `girls/printed-t-shirt-back.jpg`
- **Girls Full Pant Set** -> `girls/kurti-leggings-set.jpg` + `girls/kurti-leggings-set-side.jpg` + `girls/kurti-leggings-set-back.jpg`
- **Girls 3/4th Set** -> `girls/skirt-top-set.jpg` + `girls/skirt-top-set-side.jpg` + `girls/skirt-top-set-back.jpg`
- **Girls Co Ords & Shorts Set** -> `girls/casual-shorts.jpg` + `girls/casual-shorts-side.jpg` + `girls/casual-shorts-back.jpg`
- **Girls 3/4th Pant** -> `girls/leggings.jpg` + `girls/leggings-side.jpg` + `girls/leggings-back.jpg`
- **Girls Tops** -> `girls/casual-top.jpg` + `girls/casual-top-side.jpg` + `girls/casual-top-back.jpg`
- **Girls Frock** -> `girls/frock.jpg` + `girls/frock-side.jpg` + `girls/frock-back.jpg`

#### Innerwear

- **Girls Drawer** -> `girls/drawer.jpg` + `girls/drawer-side.jpg` + `girls/drawer-back.jpg`
- **Girls Panties** -> `girls/panties.jpg` + `girls/panties-side.jpg` + `girls/panties-back.jpg`
- **Girls Slips** -> `girls/slips.jpg` + `girls/slips-side.jpg` + `girls/slips-back.jpg`

Every file currently in this folder is a placeholder image labeled with the
product name so the site displays correctly out of the box. Swap them out
one at a time whenever you have the real photo ready -- the site will pick up
the new photo automatically the next time the page loads.

## Giving one product different photos per color

By default every color of a product shares the same three photos above --
picking a color swatch on the product page doesn't change the picture.

To make a specific color show its own real photo instead, add a
`colorImages` block to that product's entry in `src/data/products.js`:

```js
{
  name: 'Trunks',
  colors: ['Black', 'Navy', 'Grey', 'White', 'Maroon'],
  image: '/images/products/men/vest/trunks.jpg',
  // ...other existing fields stay as they are...
  colorImages: {
    Black: { image: '/images/products/men/vest/colors/trunks-black.jpg', imageSide: '...-side.jpg', imageBack: '...-back.jpg' },
    Navy:  { image: '/images/products/men/vest/colors/trunks-navy.jpg',  imageSide: '...-side.jpg', imageBack: '...-back.jpg' },
    // any color left out just keeps using the product's normal photo above
  },
}
```

Then drop the matching JPG/PNG files in a `colors/` subfolder next to that
product's normal photos (see `men/vest/colors/` for a working example on
the Trunks product). `imageSide` and `imageBack` are optional per color --
leave one out and that color's Side or Back thumbnail just disappears from
the gallery for that color, the same as removing `imageSide`/`imageBack`
at the product level (see "Removing the Side or Back view for one product"
above). It never falls back to reusing that color's own front photo.

This only ever swaps in a real photo you provide -- there's no tint, filter,
or simulated recoloring. A color with no `colorImages` entry simply keeps
showing the product's normal photos.
