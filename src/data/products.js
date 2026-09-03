// Central catalog for VSS Textiles.
//
// Policy note: Boys and Girls are separate top-level categories (no shared
// "Kids" grouping), each with Outerwear, Topwear, and Innerwear. Kids
// footwear has been discontinued and removed entirely.
//
// Each catalog item represents one product listing with 5 color
// variants (matching the store's "Category (Subtype) - Colors: ..."
// format), e.g. Boxers (Printed) - Colors: Red, White, Blue, Black, Grey.
//
// IMAGES: `image`, `imageSide`, and `imageBack` are written directly on each
// product below, and point to local files under `public/images/products/`.
// To update a product's photo, replace the matching file with your own
// image, keeping the exact same filename — see
// `public/images/products/README.md` for the full guide. If a file is
// missing, the <img> falls back to a guaranteed-working placeholder (see
// utils/imgFallback.js) instead of showing a broken image icon.

import { Wine } from "lucide-react"

export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Expands each catalog entry into several product *listings* of the same
// type — e.g. one "T-Shirts" entry becomes 3 separate T-Shirts products
// (the original, plus Classic Fit and Relaxed Fit) that all still answer to
// the same mega-menu "type" filter, since the sub-category slug is derived
// from the original (base) name rather than the suffixed variant name.
// Photos are reused across a type's variants by default. To give a specific
// variant its own dedicated photo instead, set `image`/`imageSide`/
// `imageBack` to an array (same position convention as `price`/`discount`:
// [base, Classic Fit, Relaxed Fit]) — see the Bras example below.
const VARIANT_SUFFIXES = [null, 'Classic Fit', 'Relaxed Fit']

// To remove just ONE variant card from just ONE product (e.g. drop only
// "RN – Relaxed Fit" but keep every other product's Relaxed Fit), add
// `excludeVariants: ['Relaxed Fit']` to that catalog entry — see the RN
// example a few lines below. `variantIndex` is still taken from the
// original position in VARIANT_SUFFIXES even after filtering, so an
// existing `price: [a, b, c]` / `discount: [a, b, c]` array on that entry
// keeps lining up correctly with whichever variants remain.
// To give one product's variants their own standalone names instead of the
// global 'Classic Fit'/'Relaxed Fit' suffix (e.g. Bras uses model names
// 'Jara' and 'Sponge Colours' instead), add `variantNames: [null, 'Jara',
// 'Sponge Colours']` to that catalog entry — see the Bras example below.
// Other products keep using the shared VARIANT_SUFFIXES untouched.
function withVariants(catalog) {
  return catalog.flatMap((entry) => {
    const suffixes = entry.variantNames || VARIANT_SUFFIXES
    return suffixes
      .map((suffix, variantIndex) => ({ suffix, variantIndex }))
      .filter(({ suffix }) => !suffix || !(entry.excludeVariants || []).includes(suffix))
      .map(({ suffix, variantIndex }) => ({
        ...entry,
        name: suffix ? (entry.variantNames ? suffix : `${entry.name} – ${suffix}`) : entry.name,
        baseName: entry.name,
        variantIndex,
        // Light variety between variants of the same type without needing new
        // photography: rotate which colors lead the swatch list.
        colors:
          variantIndex === 0
            ? entry.colors
            : [...entry.colors.slice(variantIndex), ...entry.colors.slice(0, variantIndex)],
      }))
  })
}

// Approximate swatch colors for rendering color-picker dots.
export const colorHex = {
  Red: '#DC2626',
  White: '#FFFFFF',
  Blue: '#2563EB',
  'Dark Blue': '#1E3A8A',
  'Light Blue': '#93C5FD',
  'Sky Blue': '#7DD3FC',
  'Aqua Mint': '#A8E9E5',
  Black: '#111827',
  Grey: '#9CA3AF',
  Navy: '#1E3A5F',
  Maroon: '#7F1D1D',
  Olive: '#556B2F',
  OliveKhaki:  '#8A7A4A',
  Green: '#16A34A',
  'Light Pink': '#F9A8D4',
  Pink: '#EC4899',
  Purple: '#9333EA',
  Hex : '#823258',
  Cream: '#FFF3D6',
  Brown: '#8B5E3C',
  Beige: '#D8C3A5',
  Khaki: '#C3B091',
  Skin: '#F1C27D',
  Yellow: '#FACC15',
  Mustard: '#D4AC0D',
  Gold: '#D4AF37',
  Checked: '#B08968',
  Print: '#E9A6C1',
  Coral: '#FF6F61',
  SoftMustardYellow : '#D8B24A',
  GoldenMustard : '#C98A2E',
  CherryRed : '#C6283A',
  PowderBlue:  '#6F8FB3', 
  BrightTealBlue: '#0D8CC3',
  PlumPurple: '#6D4A79',
  OliveGreen: '#5E7E45',
  BlushPink: '#E7A6C2',
  MauveBrown: '#7A5A63',
  BrightScarletRed: '#D62F3B',
  CoffeeBrown: '#6F4E37',
  DustyLavender: '#8E6A86',
  EmeraldGreen: '#006B4F',
  Wine: '#7A1E3A',
  PeacockBlue: '#006D8F',
  PastelLavender: '#D4C7E8',
  'Dusty Sage Green': '#A8C3BA',
  'Steel Blue':'#6E8FA3',
  Lavender:'#B9A3D5',
  'charcoal gray': '#36454F',
  'Dark Forest Green': '#1F4A42',
  'Cornflower Blue':' #6495ED',
  'Dusty Rose':'#BA797D',
  'Warm Cinnamon Brown': '#A85838',
  'light peach pink':'#F99584',
  'Dark Slate Blue':'#5B7C99',
  'Taupe Grey':'#8B8589',
  'Pastel Green':'#80EF80',
  'Soft Sage Green':'#A9B591',
  // Added for Kajol slip's 17-color chart (see colorImages on the Kajol
  // entry below) — kept distinct from the existing Navy/Dark Blue/Olive
  // entries above since the chart calls these out as separate shades.
  'Royal Blue': '#1F3FA0',
  'Navy Blue': '#14213D',
  'Dark Green': '#33472A',
  'Light Green': '#8BC34A',
  'Yellow Green': '#9ACD32',
  'Dark Pink': '#D6336C',
  'Baby Pink': '#F7C6D9',
  'Jomatto': '#FF4C29',
  'Peach': '#F4A88E',
  // Remaining colors used elsewhere in the catalog that weren't in this
  // map yet (were falling back to the generic gray swatch dot).
  'Orange': '#F97316',
  'Teal': '#0D9488',
  'Blue Print': '#3B82F6',
  'Pink Print': '#F472B6',
  'Light Lavender':'#76709D',
  'Coral Pink':'#EB595A',
  'Raspberry Purple':'#A30B73',
  teal:'#04BBB6',
  Violet:'#7F00FF',
  'Light Mint Green':'#CEE3DE',  
  'dusty navy blue':'#465E82',
  'light gray': '#D3D9DC',
  'Rust Orange' : '#D94820',
}

// Reliable placeholder used only if the local photo above fails to load —
// unique per product so it's at least visually distinct, not repeated.
function productFallbackSeed(category, name, variant) {
  return `vss-${category}-${toSlug(name)}-${variant}`
}

// heading = mega-menu column this belongs to (for reference only)
//
// Men Innerwear note: Premium Vest, Brief and Trunk are the three top-level
// Innerwear rows. Premium Vest isn't a sellable product itself — RN and RNS
// (set via menuParent) group underneath it and only surface in a flyout
// panel on hover, the same way T-Shirts' menuStyles below flyout into
// Disney & Marvel / Drop Shoulder / Polos / Solid / Printed Tees.
const menCatalog = [
  // T-Shirts note: Disney & Marvel, Drop Shoulder, Polos, Solid and Printed
  // Tees are now 5 separate sellable products grouped under a shared
  // "T-Shirts" flyout row (same menuParent approach as Track Pant / Shorts /
  // Premium Vest below), each with its own dedicated image files instead of
  // all sharing one photo. Drop your own photos in at these exact paths —
  // until then, the automatic fallback placeholder is shown per style.
  // T-Shirts, Track Pant and Shorts styles below are sourced from the
  // "MENS OUTER WEARS" sheet. Rates are given per size-band (S-M / L-XL /
  // XXL-3XL) rather than per single size, so each entry uses
  // `sizePriceGroups` to share one net rate across the sizes in that band —
  // same pattern as the RN/RNS vests below. sizePrices carry the MRP rate
  // (the site's selling price), with no discount applied.
  { name: 'T-Shirts MTC-901', fabric: 'Cotton', label: 'MTC-901', heading: 'Men Outerwear', menuParent: 'T-Shirts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'light gray', 'Blue', 'Red', 'Wine', 'Pink', 'Green', 'Dark Forest Green', 'charcoal gray', 'Navy'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [360, 360, 400, 400, 440, 440], price: 360, discount: 0, image: '/images/products/men/tshirt/colors/mt-901/mtc-901-black.jpg', imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-black-side.jpg', imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-black-back.jpg' ,
    // Per-color photos for MTC-901, same pattern as the Trunks colorImages
    // demo above. Drop your real front/side/back photo for each color into
    // public/images/products/men/tshirt/colors/ using these EXACT filenames
    // (case-sensitive) and it will show up automatically — no code changes
    // needed. Placeholder files are in there now so nothing breaks meanwhile.
    colorImages: {
      'light gray':   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-light gray.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-light gray-side.jpg', */  imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-light gray-back.jpg' },
      Red:    { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-red.jpg', /*    imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-red-side.jpg',   */  imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-red-back.jpg' },
      Blue:   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-Blue.jpg', /*   imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-Blue-side.jpg',  */  imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-Blue-back.jpg' },
      Black:  { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-black.jpg',/*  imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-black-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-black-back.jpg' },
      Wine: { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-Wine.jpg',/* imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-Wine-side.jpg',  */imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-Wine-back.jpg' },
      Pink:   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-pink.jpg',/*   imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-pink-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-pink-back.jpg' },
      Green:   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-green.jpg',/*   imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-green-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-green-back.jpg' },
      'Dark Forest Green':   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-Olivegreen.jpg',/*   imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-Olivegreen-side.jpg',   */imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-Olivegreen-back.jpg' },
      'charcoal gray':   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-charcolgrey.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-charcolgrey-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-charcolgrey-back.jpg' },
      Navy:   { image: '/images/products/men/tshirt/colors/mt-901/mtc-901-Navy.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-901/mtc-901-Navy-side.jpg', */  imageBack: '/images/products/men/tshirt/colors/mt-901/mtc-901-Navy-back.jpg' },
    },
  },
  { name: 'T-Shirts MTC-902', fabric: 'Cotton', label: 'MTC-902', heading: 'Men Outerwear', menuParent: 'T-Shirts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Grey', 'Olive', 'Navy', 'Black', 'Red', 'DustyLavender'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [518, 518, 558, 558, 598, 598], price: 518, discount: 0, image: '/images/products/men/tshirt/colors/mt-902/mtc-902-grey.jpg', imageSide: '/images/products/men/tshirt-printed-tees-side.jpg', imageBack: '/images/products/men/tshirt-printed-tees-back.jpg',  
    colorImages: {
      Grey:   { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-grey.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-grey-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-grey-back.jpg' },
      Red:    { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-red.jpg',  /*   imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-red-side.jpg',   */  imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-red-back.jpg' },
      Olive:   { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-olive.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-olive-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-olive-back.jpg' },
      Navy:   { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-navy.jpg',  /*  imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-navy-side.jpg',  */  imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-navy-back.jpg' },
      Black:  { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-black.jpg',/*  imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-black-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-black-back.jpg' },
      DustyLavender:   { image: '/images/products/men/tshirt/colors/mt-902/mtc-902-DustyLavender.jpg', /*  imageSide: '/images/products/men/tshirt/colors/mt-902/mtc-902-DustyLavender-side.jpg',  */ imageBack: '/images/products/men/tshirt/colors/mt-902/mtc-902-DustyLavender-back.jpg' },
    },
  },
  // Rolex — from the "LADIES OUTER WEARS" wholesale sheet, but listed
  // there as "ROLEX: MENS T-SHIRT" (similar cross-listing to GT-801, a
  // Women's item that appears on this sheet too). Moved here from
  // Women's; renamed XXL → 2XL to match this catalog's size convention
  // (sheet has no 3XL rate, so it stops at 2XL same as before).
  { name: 'T-Shirts Rolex', fabric: 'Cotton', label: 'Rolex', heading: 'Men Outerwear', menuParent: 'T-Shirts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Cream', 'Green', 'Brown', 'Aqua Mint', 'Black', 'Peach'], sizes: ['S', 'M', 'L', 'XL', '2XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', '2XL']], sizePrices: [302, 302, 302, 332, 332], price: 302, discount: 0, image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream.jpg', imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream-side.jpg', imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream-back.jpg'  ,
    colorImages: {
      Green: { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-green.jpg', /* imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-green-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-green-back.jpg' },
      Brown: { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-brown.jpg',/*  imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-brown-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-brown-back.jpg' },
      Black: { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Black.jpg',/*  imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Black-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Black-back.jpg' },
      Cream: { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream.jpg', /* imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Cream-back.jpg' },
      Peach: { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Peach.jpg', /* imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Peach-side.jpg',  */imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Peach-back.jpg' },
      'Aqua Mint': { image: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Aqua-Mint.jpg',/*  imageSide: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Aqua-Mint-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/rolex/tshirt-rolex-Aqua-Mint-back.jpg' },
    },
  },
  { name: 'T-Shirts MT-911', fabric: 'Cotton', label: 'MT-911', heading: 'Men Outerwear', menuParent: 'T-Shirts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender', 'Wine', 'Navy', 'Olive', 'Black', 'Grey'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [356, 356, 386, 386, 416, 416], price: 356, discount: 0,  image: '/images/products/men/tshirt/colors/mt-911/MT-911-DustyLavender.jpg', imageSide: '/images/products/men/tshirt/colors/MT-911-DustyLavender-side.jpg', imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-DustyLavender-back.jpg' ,
    colorImages: {
      Grey:   { image: '/images/products/men/tshirt/colors/mt-911/MT-911-grey.jpg',/*  imageSide: '/images/products/men/tshirt/colors/MT-911-grey-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-grey-back.jpg' },
      Wine:    { image: '/images/products/men/tshirt/colors/mt-911/MT-911-Wine.jpg', /* imageSide: '/images/products/men/tshirt/colors/MT-911-Wine-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-Wine-back.jpg' },
      Navy:   { image: '/images/products/men/tshirt/colors/mt-911/MT-911-navy.jpg', /* imageSide: '/images/products/men/tshirt/colors/MT-911-navy-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-navy-back.jpg' },
      Olive:   { image: '/images/products/men/tshirt/colors/mt-911/MT-911-olive.jpg', /* imageSide: '/images/products/men/tshirt/colors/MT-911-pink-olive-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-olive-back.jpg' },
      Black:  { image: '/images/products/men/tshirt/colors/mt-911/MT-911-black.jpg',/*  imageSide: '/images/products/men/tshirt/colors/MT-911-black-side.jpg', */ imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-black-back.jpg' },
      DustyLavender:   { image: '/images/products/men/tshirt/colors/mt-911/MT-911-DustyLavender.jpg',/*  imageSide: '/images/products/men/tshirt/colors/MT-911-DustyLavender-side.jpg',  */imageBack: '/images/products/men/tshirt/colors/mt-911/MT-911-DustyLavender-back.jpg' },
    },
  },
  
  // Track Pant note: Airforce, Pilot ("Piolet" on the sheet) and Classic are
  // the three styles sold under Track Pant — same grouping approach as
  // Premium Vest above (each sets menuParent so they flyout under a shared
  // "Track Pant" row instead of Track Pant being a sellable product on its
  // own). Names are prefixed for uniqueness (their subCategory slug is
  // derived from the full name), while `label` keeps the flyout text itself
  // short.
  { name: 'Track Pant Airforce', fabric: 'Polyester',  label: 'Airforce', heading: 'Men Outerwear', menuParent: 'Track Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Grey', 'Blue', 'Black', 'Wine','Olive'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [392, 392, 422, 422, 452, 452], price: 392, discount: 0, image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Grey.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Grey-back.jpg' ,
    colorImages: {
      Grey: { image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Grey.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Grey-back.jpg' },
      Blue: { image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Blue.jpg', imageSide: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Blue-side.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Wine-back.jpg' },
      Black: { image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Black.jpg', imageSide: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Black-side.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Black-back.jpg' },
      Wine: { image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Wine.jpg', imageSide: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Wine-side.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Dark Forest Green-back.jpg' },
      Olive: { image: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Olive.jpg', imageSide: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Olive-side.jpg', imageBack: '/images/products/men/Track-Pant/Airforce/Track-Pant Airforce-Olive-back.jpg' },
    },
   },
  { name: 'Track Pant Piolet', fabric: 'Polyester',  label: 'Piolet', heading: 'Men Outerwear', menuParent: 'Track Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Brown', 'Navy', 'Wine','Olive'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [324, 324, 344, 344, 364, 364], price: 324, discount: 0, image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy.jpg', imageSide: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy-side.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy-back.jpg' ,
     colorImages: {
      Black: { image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Black.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Black-back.jpg' },
      Brown: { image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Brown.jpg', imageSide: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Brown-side.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Brown-back.jpg' },
      Navy: { image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy.jpg', imageSide: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy-side.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Navy-back.jpg' },
      Wine: { image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Wine.jpg', imageSide: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Wine-side.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Dark Forest Green-back.jpg' },
      Olive: { image: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Olive.jpg', imageSide: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Olive-side.jpg', imageBack: '/images/products/men/Track-Pant/Piolet/Track Pant Piolet-Olive-back.jpg' },
    },
   },
  { name: 'Track Pant Turbo', fabric: 'Polyester',  label: 'Turbo', heading: 'Men Outerwear', menuParent: 'Track Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Wine', 'Black', 'BrightTealBlue', 'Grey', 'EmeraldGreen'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [368, 368, 398, 398, 428, 428], price: 368, discount: 0, image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Brown.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Brown-back.jpg' },
      Wine: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Wine.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Wine-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Wine-back.jpg' },
      Black: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Black-back.jpg' },
      BrightTealBlue: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-BrightTealBlue.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-BrightTealBlue-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-BrightTealBlue-back.jpg' },
      Grey: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Grey.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Grey-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-Grey-back.jpg' },
      EmeraldGreen: { image: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-EmeraldGreen.jpg', imageSide: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-EmeraldGreen-side.jpg', imageBack: '/images/products/men/Track-Pant/Turbo/Track Pant Turbo-EmeraldGreen-back.jpg' },
    },
   },
  // Shorts note: same Airforce / Pilot / Classic grouping, under a separate
  // "Shorts" parent row so it doesn't share a subcategory with Track Pant.
  { name: 'Shorts Airforce', fabric: 'Cotton',  label: 'Airforce', heading: 'Men Outerwear', menuParent: 'Shorts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Grey', 'Blue', 'Black', 'Wine','Olive'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [304, 304, 334, 334, 364, 364], price: 304, discount: 0, image: '/images/products/men/shorts/Airforce/Shorts Airforce-Grey.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Grey-back.jpg' ,
     colorImages: {
      Grey: { image: '/images/products/men/shorts/Airforce/Shorts Airforce-Grey.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Grey-back.jpg' },
      Blue: { image: '/images/products/men/shorts/Airforce/Shorts Airforce-Blue.jpg', imageSide: '/images/products/men/shorts/Airforce/Shorts Airforce-Blue-side.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Wine-back.jpg' },
      Black: { image: '/images/products/men/shorts/Airforce/Shorts Airforce-Black.jpg', imageSide: '/images/products/men/shorts/Airforce/Shorts Airforce-Black-side.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Black-back.jpg' },
      Wine: { image: '/images/products/men/shorts/Airforce/Shorts Airforce-Wine.jpg', imageSide: '/images/products/men/shorts/Airforce/Shorts Airforce-Wine-side.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Dark Forest Green-back.jpg' },
      Olive: { image: '/images/products/men/shorts/Airforce/Shorts Airforce-Olive.jpg', imageSide: '/images/products/men/shorts/Airforce/Shorts Airforce-Olive-side.jpg', imageBack: '/images/products/men/shorts/Airforce/Shorts Airforce-Olive-back.jpg' },
    },
   },
  { name: 'Shorts Piolet', fabric: 'Cotton',  label: 'Piolet', heading: 'Men Outerwear', menuParent: 'Shorts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Wine', 'Black', 'PlumPurple','Olive'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [270, 270, 290, 290, 310, 310], price: 270, discount: 0, image: '/images/products/men/shorts/Piolet/Shorts Piolet-PlumPurple.jpg', imageSide: '/images/products/men/shorts/Piolet/Shorts Piolet-PlumPurple-side.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Dark Forest Green-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/men/shorts/Piolet/Shorts Piolet-Brown.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Brown-back.jpg' },
      Wine: { image: '/images/products/men/shorts/Piolet/Shorts Piolet-Wine.jpg', imageSide: '/images/products/men/shorts/Piolet/Shorts Piolet-Wine-side.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Wine-back.jpg' },
      Black: { image: '/images/products/men/shorts/Piolet/Shorts Piolet-Black.jpg', imageSide: '/images/products/men/shorts/Piolet/Shorts Piolet-Black-side.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Black-back.jpg' },
      PlumPurple: { image: '/images/products/men/shorts/Piolet/Shorts Piolet-PlumPurple.jpg', imageSide: '/images/products/men/shorts/Piolet/Shorts Piolet-PlumPurple-side.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Dark Forest Green-back.jpg' },
      Olive: { image: '/images/products/men/shorts/Piolet/Shorts Piolet-Olive.jpg', imageSide: '/images/products/men/shorts/Piolet/Shorts Piolet-Olive-side.jpg', imageBack: '/images/products/men/shorts/Piolet/Shorts Piolet-Olive-back.jpg' },
    },
   },
  { name: 'Shorts Turbo', fabric: 'Cotton',  label: 'Turbo', heading: 'Men Outerwear', menuParent: 'Shorts', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Wine', 'Black', 'Dark Forest Green','Olive'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [290, 290, 320, 320, 350, 350], price: 290, discount: 0, image: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green.jpg', imageSide: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green-side.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green-back.jpg',
    colorImages: {
      Navy: { image: '/images/products/men/shorts/Turbo/Shorts Turbo-Navy.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Navy-back.jpg' },
      Wine: { image: '/images/products/men/shorts/Turbo/Shorts Turbo-Wine.jpg', imageSide: '/images/products/men/shorts/Turbo/Shorts Turbo-Wine-side.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Wine-back.jpg' },
      Black: { image: '/images/products/men/shorts/Turbo/Shorts Turbo-Black.jpg', imageSide: '/images/products/men/shorts/Turbo/Shorts Turbo-Black-side.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Black-back.jpg' },
      'Dark Forest Green': { image: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green.jpg', imageSide: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green-side.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Dark Forest Green-back.jpg' },
      Olive: { image: '/images/products/men/shorts/Turbo/Shorts Turbo-Olive.jpg', imageSide: '/images/products/men/shorts/Turbo/Shorts Turbo-Olive-side.jpg', imageBack: '/images/products/men/shorts/Turbo/Shorts Turbo-Olive-back.jpg' },
    },
   },
  
  // sizePriceGroups: sizes listed together share ONE price (the price that
  // the first size in each pair would have gotten from sizePriceStep/sizePrices).
  // Change the pairing here any time — e.g. group all 6 into 2 groups of 3,
  // or ungroup entirely by deleting the sizePriceGroups line.
  { name: 'RN', fabric: 'Cotton',  heading: 'Men Innerwear', menuParent: 'Premium Vest', colors: ['White'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [115, 128], price: 115, discount: 0, excludeVariants: ['Classic Fit', 'Relaxed Fit'], image: '/images/products/men/vest/Rn.jpg', imageSide: '/images/products/men/vest/Rn-vest-side.jpg', imageBack: '/images/products/men/vest/Rn-vest-back.jpg' },
  { name: 'RNS', fabric: 'Cotton',  heading: 'Men Innerwear', menuParent: 'Premium Vest', colors: ['White'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [144, 160], price: 144, discount: 0, excludeVariants: ['Classic Fit', 'Relaxed Fit'], image: '/images/products/men/vest/Rns.jpg', imageSide: '/images/products/men/vest/Rns-vest-side.jpg', imageBack: '/images/products/men/vest/Rns-vest-back.jpg' },
  { name: 'Trunks', fabric: 'Cotton',  heading: 'Men Innerwear', colors: ['Blue', 'White', 'Maroon','Grey'], sizes: ['S', 'M', 'L', 'XL', '2XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', '2XL']], sizePrices: [299, 299, 299, 329, 329], price: 299, discount: 0, excludeVariants: ['Classic Fit', 'Relaxed Fit'], image: '/images/products/men/trunk/colors/blue-trunk.jpg', imageBack: '/images/products/men/trunk/colors/colors/trunks-black-back.jpg' ,
    // Demo of the per-color photo feature — each entry below points to a
    // dedicated front/side/back photo for that color, so picking a swatch
    // on the product page shows a genuinely different picture (see
    // public/images/products/men/vest/colors/). Replace these placeholder
    // files with real photography whenever it's ready — same filenames,
    // no code changes needed. Add this same `colorImages` block to any
    // other product once you have real per-color photos for it.
    colorImages: {
      Blue: { image: '/images/products/men/trunk/colors/blue-trunk.jpg', imageBack: '/images/products/men/trunk/colors/colors/trunks-black-back.jpg' },
      White: { image: '/images/products/men/trunk/colors/trunks-white.jpg', imageSide: '/images/products/men/trunk/colors/trunks-white-side.jpg', imageBack: '/images/products/men/trunk/colors/trunks-white-back.jpg' },
      Maroon: { image: '/images/products/men/trunk/colors/trunks-maroon.jpg', imageSide: '/images/products/men/trunk/colors/trunks-maroon-side.jpg', imageBack: '/images/products/men/trunk/colors/trunks-maroon-back.jpg' },
      Grey: { image: '/images/products/men/trunk/colors/trunks-grey.jpg', imageSide: '/images/products/men/trunk/colors/trunks-grey-side.jpg', imageBack: '/images/products/men/trunk/colors/trunks-grey-back.jpg' },
    },  
  },
]

const womenCatalog = [
  // Women Outerwear is organized into four flyout groups, listed in this
  // order — T-Shirt, Pant, 3/4th, Shorts — each grouped via a shared
  // menuParent (same pattern as Nighty below and Men's Track Pant/Shorts
  // above). Catalog order below matches the menu order (T-Shirt entries
  // come first), since the mega menu lists items in the order their first
  // product appears in this file.
  // sizePrices carry the MRP rate (the site's selling price) per S-M-L /
  // XL-XXL / 3XL band, with no discount applied.
  { name: 'Sona', fabric: 'Cotton',  label: 'Sona', heading: 'Women Outerwear', menuParent: 'T-Shirt', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Forest Green', 'Wine', 'Pink', 'Black', 'Navy', 'Teal', 'Lavender', 'Brown', 'Grey', 'Light Pink'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL'], ['3XL']], sizePrices: [258, 258, 258, 288, 288, 318], price: 258, discount: 0, image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Dark Forest Green.jpg',  imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Dark Forest Green-side.jpg',  imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Dark Forest Green-back.jpg'  ,
    colorImages: {
      'Dark Forest Green':    { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Dark Forest Green.jpg',  imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Dark Forest Green-side.jpg',  imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Dark Forest Green-back.jpg' },
      Grey:   { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-grey.jpg',  imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-grey-side.jpg',  imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-grey-back.jpg' },
      Teal:    { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Teal.jpg',    imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Teal-side.jpg',    imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Teal-back.jpg' },
      Lavender: { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Lavender.jpg',   imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Lavender-side.jpg',   imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Lavender-back.jpg' },
      Black:  { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-black.jpg', imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-black-side.jpg', imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-black-back.jpg' },
      Pink:   { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-pink.jpg',  imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-pink-side.jpg',  imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-pink-back.jpg' },
      Brown:  { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-brown.jpg', imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-brown-side.jpg', imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-brown-back.jpg' },
      'Light Pink':  { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Light Pink.jpg', imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Light Pink-side.jpg', imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Light Pink-back.jpg' },
      Navy:  { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Navy.jpg', imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Navy-side.jpg', imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Navy-back.jpg' },
      Wine:  { image: '/images/products/women/tshirt/colors/sona/t-shirt-sona-Wine.jpg', imageSide: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Wine-side.jpg', imageBack: '/images/products/men/tshirt/colors/sona/t-shirt-sona-Wine-back.jpg' },
    },
   },
  // GT-801 keeps the adult S/M/L/XL/2XL/3XL size run and S-M / L-XL /
  // 2XL-3XL price tiers straight from the wholesale sheet (moved here from
  // Girls, where it had been miscategorized).
  { name: 'T-Shirt GT-801', fabric: 'Tencil', label: 'GT-801', heading: 'Women Outerwear', menuParent: 'T-Shirt', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Hex', 'Brown', 'Grey', 'Black', 'Purple'], sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], sizePriceGroups: [['S', 'M'], ['L', 'XL'], ['2XL', '3XL']], sizePrices: [356, 356, 386, 386, 416, 416], price: 356, discount: 0, image: '/images/products/women/tshirt/colors/GT-801-pink.jpg',  imageSide: '/images/products/men/tshirt/colors/GT-801-pink-side.jpg',  imageBack: '/images/products/men/tshirt/colors/GT-801-pink-back.jpg' ,
    colorImages: {
      Hex:    { image: '/images/products/women/tshirt/colors/GT-801-hex.jpg',  imageSide: '/images/products/men/tshirt/colors/GT-801-hex-side.jpg',  imageBack: '/images/products/men/tshirt/colors/GT-801-hex-back.jpg' },
      Grey:   { image: '/images/products/women/tshirt/colors/GT-801-grey.jpg',  imageSide: '/images/products/men/tshirt/colors/GT-801-grey-side.jpg',  imageBack: '/images/products/men/tshirt/colors/GT-801-grey-back.jpg' },
      Red:    { image: '/images/products/women/tshirt/colors/GT-801-red.jpg',    imageSide: '/images/products/men/tshirt/colors/GT-801-red-side.jpg',    imageBack: '/images/products/men/tshirt/colors/GT-801-red-back.jpg' },
      Purple: { image: '/images/products/women/tshirt/colors/GT-801-purple.jpg',   imageSide: '/images/products/men/tshirt/colors/GT-801-purple-side.jpg',   imageBack: '/images/products/men/tshirt/colors/GT-801-purple-back.jpg' },
      Black:  { image: '/images/products/women/tshirt/colors/GT-801-black.jpg', imageSide: '/images/products/men/tshirt/colors/GT-801-black-side.jpg', imageBack: '/images/products/men/tshirt/colors/GT-801-black-back.jpg' },
      Pink:   { image: '/images/products/women/tshirt/colors/GT-801-pink.jpg',  imageSide: '/images/products/men/tshirt/colors/GT-801-pink-side.jpg',  imageBack: '/images/products/men/tshirt/colors/GT-801-pink-back.jpg' },
      Brown:  { image: '/images/products/women/tshirt/colors/GT-801-brown.jpg', imageSide: '/images/products/men/tshirt/colors/GT-801-brown-side.jpg', imageBack: '/images/products/men/tshirt/colors/GT-801-brown-back.jpg' },
    },
  },

  { name: 'Sneha', fabric: 'Cotton', label: 'Sneha', heading: 'Women Outerwear', menuParent: 'Full Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Green', 'Red', 'Peach'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL'], ['3XL']], sizePrices: [560, 560, 560, 600, 600, 640], price: 560, discount: 0,  image: '/images/products/women/fullpant/sneha/full-pant-sneha-Pink.jpg', imageSide: '/images/products/men/fullpant/sneha/full-pant-sneha-Pink-side.jpg', imageBack: '/images/products/men/fullpant/sneha/full-pant-sneha-Pink-back.jpg' ,
    colorImages: {
      Green:   { image: '/images/products/women/fullpant/sneha/full-pant-sneha-Green.jpg',  imageSide: '/images/products/women/fullpant/sneha/full-pant-sneha-Green-side.jpg',  imageBack: '/images/products/women/fullpant/sneha/full-pant-sneha-Green-back.jpg' },
      Red:    { image: '/images/products/women/fullpant/sneha/full-pant-sneha-red.jpg',    imageSide: '/images/products/women/fullpant/sneha/full-pant-sneha-red-side.jpg',    imageBack: '/images/products/women/fullpant/sneha/full-pant-sneha-red-back.jpg' },
      Peach: { image: '/images/products/women/fullpant/sneha/full-pant-sneha-Peach.jpg',   imageSide: '/images/products/women/fullpant/sneha/full-pant-sneha-Peach-side.jpg',   imageBack: '/images/products/women/fullpant/sneha/full-pant-sneha-Peach-back.jpg' },
      Pink:  { image: '/images/products/women/fullpant/sneha/full-pant-sneha-Pink.jpg', imageSide: '/images/products/women/fullpant/sneha/full-pant-sneha-Pink-side.jpg', imageBack: '/images/products/women/fullpant/sneha/full-pant-sneha-Pink-back.jpg' },
    },
   },
  { name: 'Kajal', fabric: 'Cotton', label: 'Kajal', heading: 'Women Outerwear', menuParent: 'Full Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Green', 'Coral Pink', 'Pink', 'Sky Blue', 'Black'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL'], ['3XL']], sizePrices: [766, 766, 766, 826, 826, 886], price: 766, discount: 0, image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green.jpg',  imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green-side.jpg',  imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green-back.jpg' ,
    colorImages: {
      Green:   { image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green.jpg',  imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green-side.jpg',  imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Green-back.jpg' },
      'Coral Pink':    { image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Coral Pink.jpg',    imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Coral Pink-side.jpg',    imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Coral Pink-back.jpg' },
      Black: { image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Black.jpg',   imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Black-side.jpg',   imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Black-back.jpg' },
      Pink:  { image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Pink.jpg', imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Pink-side.jpg', imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Pink-back.jpg' },
      'Sky Blue':    { image: '/images/products/women/fullpant/kajal/full-pant-Kajal-Sky Blue.jpg',    imageSide: '/images/products/women/fullpant/kajal/full-pant-Kajal-Sky Blue-side.jpg',    imageBack: '/images/products/women/fullpant/kajal/full-pant-Kajal-Sky Blue-back.jpg' },
    },
  },
  { name: 'Divya', fabric: 'Cotton', label: 'Divya', heading: 'Women Outerwear', menuParent: 'Full Pant', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Forest Green', 'Jomatto', 'Pink', 'Pink Print', 'Khaki'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL'], ['3XL']], sizePrices: [576, 576, 576, 626, 626, 676], price: 576, discount: 0, image: '/images/products/women/fullpant/divya/full-pant-divya-Pink.jpg', imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Pink-side.jpg', imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Pink-back.jpg' ,
    colorImages: {
      'Dark Forest Green':   { image: '/images/products/women/fullpant/divya/full-pant-divya-Dark Forest Green.jpg',  imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Dark Forest Green-side.jpg',  imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Dark Forest Green-back.jpg' },
      'Jomatto':    { image: '/images/products/women/fullpant/divya/full-pant-divya-Jomatto.jpg',    imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Jomatto-side.jpg',    imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Coral Pink-back.jpg' },
      Khaki: { image: '/images/products/women/fullpant/divya/full-pant-divya-Khaki.jpg',   imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Khaki-side.jpg',   imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Khaki-back.jpg' },
      Pink:  { image: '/images/products/women/fullpant/divya/full-pant-divya-Pink.jpg', imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Pink-side.jpg', imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Pink-back.jpg' },
      'Pink Print':    { image: '/images/products/women/fullpant/divya/full-pant-divya-Pink Print.jpg',    imageSide: '/images/products/women/fullpant/divya/full-pant-divya-Pink Print-side.jpg',    imageBack: '/images/products/women/fullpant/divya/full-pant-divya-Pink Print-back.jpg' },
    },
   },
  // New Pant styles, added to round the group out.
  { name: 'Grace', fabric: 'Cotton', label: 'Grace', heading: 'Women Outerwear', menuParent: '3/4th', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Lavender', 'Teal', 'Yellow', 'Coral Pink'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL'], ['3XL']], sizePrices: [504, 504, 504, 554, 554, 604], price: 504, discount: 0, image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink.jpg',   imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink-side.jpg',   imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink-back.jpg' ,
    colorImages: {
      Teal:   { image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Teal.jpg',  imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Teal-side.jpg',  imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Teal-back.jpg' },
      Lavender:    { image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Lavender.jpg',    imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Lavender-side.jpg',    imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Lavender-back.jpg' },
      Pink: { image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink.jpg',   imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink-side.jpg',   imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Pink-back.jpg' },
      Yellow:  { image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Yellow.jpg', imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Yellow-side.jpg', imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Yellow-back.jpg' },
      'Coral Pink':  { image: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Coral Pink.jpg', imageSide: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Coral Pink-side.jpg', imageBack: '/images/products/women/3-4th-pant/grace-3-4th-pantset-Coral Pink-back.jpg' },
    },
   },
  // Tops note: 6 real models from the "TOPS RATE" wholesale sheet, grouped
  // under a shared "Tops" flyout row (same menuParent pattern as the other
  // Women Outerwear groups above). Rates are given per size-band (XS-2XL /
  // 3XL-5XL) rather than per single size, so each entry lists those two
  // bands directly as its sizes with the sheet's rate for each — same
  // approach used for the chest-measurement bands on the Slips/Panties
  // Innerwear models.  
  { name: 'Side Open Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/side-open-top.jpg', imageSide: '/images/products/women/tops/sideopen/side-open-top-side.jpg', imageBack: '/images/products/women/tops/sideopen/side-open-top-back.jpg' },
  { name: 'Maroon Butta Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['CoffeeBrown'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Maroon Butta Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Maroon Butta Side Open Long Top-side.jpg', imageBack: '/images/products/women/Maroon Butta Side Open Long Top-back.jpg' },
  { name: 'Teal Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Teal Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Teal Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Teal Floral Side Open Long Top-back.jpg' },
  { name: 'Pink Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Pink Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Pink Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Pink Floral Side Open Long Top-back.jpg' },
  { name: 'Black Butta Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Black Butta Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Black Butta Side Open Long Top-side.jpg', imageBack: '/images/products/women/Black Butta Side Open Long Top-back.jpg' },
  { name: 'Navy Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Navy Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Navy Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Navy Floral Side Open Long Top-back.jpg' },
  { name: 'Pink Butta Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Pink Butta Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Pink Butta Side Open Long Top-side.jpg', imageBack: '/images/products/women/Pink Butta Side Open Long Top-back.jpg' },
  { name: 'Blue Patchwork Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Blue Patchwork Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Blue Patchwork Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Blue Patchwork Floral Side Open Long Top-back.jpg' },
  { name: 'Maroon Leaf Print Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Maroon Leaf Print Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Maroon Leaf Print Side Open Long Top-side.jpg', imageBack: '/images/products/women/Maroon Leaf Print Side Open Long Top-back.jpg' },
  { name: 'Peach Vertical Stripe Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Peach Vertical Stripe Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Peach Vertical Stripe Side Open Long Top-side.jpg', imageBack: '/images/products/women/Peach Vertical Stripe Side Open Long Top-back.jpg' },
  { name: 'Purple Leaf Motif Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Purple Leaf Motif Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Purple Leaf Motif Side Open Long Top-side.jpg', imageBack: '/images/products/women/Purple Leaf Motif Side Open Long Top-back.jpg' },
  { name: 'Multicolor Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Multicolor Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Multicolor Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Multicolor Floral Side Open Long Top-back.jpg' },
  { name: 'Sky Blue Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Sky Blue Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Sky Blue Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Sky Blue Floral Side Open Long Top-back.jpg' },
  { name: 'Sage Abstract Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Sage Abstract Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Sage Abstract Side Open Long Top-side.jpg', imageBack: '/images/products/women/Sage Abstract Side Open Long Top-back.jpg' },
  { name: 'Crimson Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Crimson Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Crimson Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Crimson Floral Side Open Long Top-back.jpg' },
  { name: 'Plum Mini Print Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Plum Mini Print Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Plum Mini Print Side Open Long Top-side.jpg', imageBack: '/images/products/women/Plum Mini Print Side Open Long Top-back.jpg' },
  { name: 'Hot Pink Floral Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Hot Pink Floral Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Hot Pink Floral Side Open Long Top-side.jpg', imageBack: '/images/products/women/Hot Pink Floral Side Open Long Top-back.jpg' },
  { name: 'Mustard Geometric Side Open Long Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Mustard Geometric Side Open Long Top.jpg', imageSide: '/images/products/women/tops/sideopen/Mustard Geometric Side Open Long Top-side.jpg', imageBack: '/images/products/women/Mustard Geometric Side Open Long Top-back.jpg' },
  { name: 'Beige Floral Print Side Open Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Beige Floral Print Side Open Top.jpg', imageSide: '/images/products/women/tops/sideopen/Beige Floral Print Side Open Top-side.jpg', imageBack: '/images/products/women/Beige Floral Print Side Open Top-back.jpg' },
  { name: 'Lilac Leaf Print Side Open Top', fabric: 'Rayon', label: 'Side Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [210, 240], price: 210, discount: 0, image: '/images/products/women/tops/sideopen/Lilac Leaf Print Side Open Top.jpg', imageSide: '/images/products/women/tops/sideopen/Lilac Leaf Print Side Open Top-side.jpg', imageBack: '/images/products/women/Lilac Leaf Print Side Open Top-back.jpg' },


  { name: 'Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/princecut-longtop.jpg', imageSide: '/images/products/women/tops/princecut/princecut-longtop-side.jpg', imageBack: '/images/products/women/princecut-longtop-back.jpg' },
  { name: 'Coral Blossom Printed Prince cut', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Coral Blossom Printed Prince cut.jpg', imageSide: '/images/products/women/tops/princecut/Coral Blossom Printed Prince cut-side.jpg', imageBack: '/images/products/women/Coral Blossom Printed Prince cut-back.jpg' },
  { name: 'Plum Daisy Printed Prince Cut', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Plum Daisy Printed Prince Cut.jpg', imageSide: '/images/products/women/tops/princecut/Plum Daisy Printed Prince Cut-side.jpg', imageBack: '/images/products/women/Plum Daisy Printed Prince Cut-back.jpg' },
  { name: 'Blush Pink Floral Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Blush Pink Floral Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Blush Pink Floral Prince Cut Long Top-side.jpg', imageBack: '/images/products/women/Blush Pink Floral Prince Cut Long Top-back.jpg' },
  { name: 'Black Striped Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Black Striped Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Black Striped Prince Cut Long Top -side.jpg', imageBack: '/images/products/women/Black Striped Prince Cut Long Top -back.jpg' },
  { name: 'Teal Printed Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Teal Printed Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Teal Printed Prince Cut Long Top -side.jpg', imageBack: '/images/products/women/Teal Printed Prince Cut Long Top -back.jpg' },
  { name: 'Magenta Floral Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Magenta Floral Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Magenta Floral Prince Cut Long Top-side.jpg', imageBack: '/images/products/women/Magenta Floral Prince Cut Long Top-back.jpg' },
  { name: 'Brown Floral Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Brown Floral Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Brown Floral Prince Cut Long Top-side.jpg', imageBack: '/images/products/women/Brown Floral Prince Cut Long Top-back.jpg' },
  { name: 'Rose Pink Floral Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Rose Pink Floral Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Rose Pink Floral Prince Cut Long Top-side.jpg', imageBack: '/images/products/women/Rose Pink Floral Prince Cut Long Top-back.jpg' },
  { name: 'Aqua Swirl Prince Cut Long Top', fabric: 'Rayon', label: 'Prince Cut Long Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveKhaki'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [280, 310], price: 280, discount: 0, image: '/images/products/women/tops/princecut/Aqua Swirl Prince Cut Long Top.jpg', imageSide: '/images/products/women/tops/princecut/Aqua Swirl Prince Cut Long Top-side.jpg', imageBack: '/images/products/women/tAqua Swirl Prince Cut Long Top-back.jpg' },
  

  { name: '18 Kg Rayon Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['SoftMustardYellow'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/18kg-co-ord-set.jpg', imageSide: '/images/products/women/tops/co-ord-set/18kg-co-ord-set-side.jpg', imageBack: '/images/products/women/18kg-co-ord-set-back.jpg' },
  { name: '24 Kg Rayon Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['GoldenMustard'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/24kg-co-rd-set.jpg', imageSide: '/images/products/women/tops/co-ord-set/24kg-co-rd-set-side.jpg', imageBack: '/images/products/women/24kg-co-rd-set-back.jpg' },
  { name: 'Cherry Blossom Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['CherryRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Cherry Blossom Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Cherry Blossom Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Cherry Blossom Printed Co-Ord Set.jpg' },
  { name: 'Maroon Garden Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Maroon Garden Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Maroon Garden Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Maroon Garden Printed Co-Ord Set.jpg' },
  { name: 'Powder Blue Bloom Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PowderBlue'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Powder Blue Bloom Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Powder Blue Bloom Co-Ord Set-side.jpg', imageBack: '/images/products/women/Powder Blue Bloom Co-Ord Set.jpg' },
  { name: 'Teal Blossom Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightTealBlue'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Teal Blossom Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Teal Blossom Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Teal Blossom Printed Co-Ord Set-back.jpg' },
  { name: 'Plum Abstract Wave Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PlumPurple'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Plum Abstract Wave Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Plum Abstract Wave Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Plum Abstract Wave Printed Co-Ord Set-back.jpg' },
  { name: 'Olive Bloom Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveGreen'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Olive Bloom Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Olive Bloom Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Olive Bloom Printed Co-Ord Set-back.jpg' },
  { name: 'Blush Botanical Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BlushPink'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Blush Botanical Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Blush Botanical Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Blush Botanical Printed Co-Ord Set-back.jpg' },
  { name: 'Mauve Blossom Printed Co-Ord Set', fabric: 'Rayon', label: 'Cord Set', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['MauveBrown'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [360, 400], price: 360, discount: 0, image: '/images/products/women/tops/co-ord-set/Mauve Blossom Printed Co-Ord Set.jpg', imageSide: '/images/products/women/tops/co-ord-set/Mauve Blossom Printed Co-Ord Set-side.jpg', imageBack: '/images/products/women/Mauve Blossom Printed Co-Ord Set-back.jpg' },
 

  { name: 'Navy Ivory Blossom Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Navy Ivory Blossom Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Navy Ivory Blossom Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Navy Ivory Blossom Vertican Cord Plain Top-back.jpg' },
  { name: 'Olive Bloom Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Olive Bloom Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Olive Bloom Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Olive Bloom Vertican Cord Plain Top-back.jpg' },
  { name: 'Maroon Floral Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Maroon Floral Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Maroon Floral Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Maroon Floral Vertican Cord Plain Top-back.jpg' },
  { name: 'Mustard Floral Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Mustard Floral Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Mustard Floral Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Mustard Floral Vertican Cord Plain Top-back.jpg' },
  { name: 'Vibrant Red Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Vibrant Red Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Vibrant Red Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Vibrant Red Vertican Cord Plain Top-back.jpg' },
  { name: 'Elegant Green Floral Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Green Floral Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Green Floral Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Green Floral Vertican Cord Plain Top-back.jpg' },
  { name: 'Crimson Botanical Printed Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Crimson Botanical Printed Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Crimson Botanical Printed Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Crimson Botanical Printed Vertican Cord Plain Top-back.jpg' },
  { name: 'Elegant Black Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Black Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Black Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Elegant Black Vertican Cord Plain Top-back.jpg' },
  { name: 'Floral Navy Kurta Vertican Co-Ord Plain Top', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Floral Navy Kurta Vertican Cord Plain Top.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Floral Navy Kurta Vertican Cord Plain Top-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Plain/Floral Navy Kurta Vertican Cord Plain Top-back.jpg' },


  { name: 'Fuchsia Bloom Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Fuchsia Bloom Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Fuchsia Bloom Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Fuchsia Bloom Vertican Cord Top Print Set-back.jpg' },
  { name: 'Olive Paisley Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Olive Paisley Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Olive Paisley Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Olive Paisley Vertican Cord Top Print Set-back.jpg' },
  { name: 'Aqua Botanica Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Aqua Botanica Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Aqua Botanica Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Aqua Botanica Vertican Cord Top Print Set-back.jpg' },
  { name: 'Midnight Blossom Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Midnight Blossom Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Midnight Blossom Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Midnight Blossom Vertican Cord Top Print Set-back.jpg' },
  { name: 'Plum Trellis Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Plum Trellis Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Plum Trellis Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Plum Trellis Vertican Cord Top Print Set-back.jpg' },
  { name: 'Berry Garden Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Berry Garden Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Berry Garden Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Berry Garden Vertican Cord Top Print Set-back.jpg' },
  { name: 'Mustard Lily Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Mustard Lily Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Mustard Lily Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Mustard Lily Vertican Cord Top Print Set-back.jpg' },
  { name: 'Royal Plum Vine Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Royal Plum Vine Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Royal Plum Vine Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Royal Plum Vine Vertican Cord Top Print Set-back.jpg' },
  { name: 'Deep Teal Vine Vertican Co-Ord Top Print Set', fabric: 'Rayon', label: 'Vertican Cord Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OffWhite'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [530, 550], price: 530, discount: 0, image: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Deep Teal Vine Vertican Cord Top Print Set.jpg', imageSide: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Deep Teal Vine Vertican Cord Top Print Set-side.jpg', imageBack: '/images/products/women/tops/verticancord/Vertican Cord Top Print/Deep Teal Vine Vertican Cord Top Print Set-back.jpg' },


  // Vertican Open Top note: 7 real models from the "PREMIUM VERTICAN OPEN
  // TOP" VSS Textiles flyer -- v-neck/round-neck open-slit kurta tops,
  // fabric Vertican, size range M - XXL.
  { name: 'Crimson Bandhani Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['CherryRed'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Crimson Bandhani Vertican Open Top.jpg' },
  { name: 'Olive Floral Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['OliveGreen'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Olive Floral Vertican Open Top.jpg' },
  { name: 'Rust Floral Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Rust Floral Vertican Open Top.jpg' },
  { name: 'Teal Vine Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Teal Vine Vertican Open Top.jpg' },
  { name: 'Mustard Floral Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Mustard Floral Vertican Open Top.jpg' },
  { name: 'Purple Motif Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Purple'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Purple Motif Vertican Open Top.jpg' },
  { name: 'Peacock Floral Vertican Open Top', fabric: 'Vertican', label: 'Vertican Open Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [400, 430], price: 400, discount: 0, image: '/images/products/women/tops/verticanopen/Peacock Floral Vertican Open Top.jpg' },

  
  // Georgette Top note: 7 real models from the "GEORGETTE TOPS" VSS
  // Textiles flyer -- hand-embroidered georgette anarkali-style tops,
  // fabric Georgette, size range M - XXL.
  { name: 'Navy Blue Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Navy Blue Floral Embroidered Georgette Top.jpg' },
  { name: 'Rani Pink Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RaniPink'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Rani Pink Floral Embroidered Georgette Top.jpg' },
  { name: 'Peacock Blue Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Peacock Blue Floral Embroidered Georgette Top.jpg' },
  { name: 'Royal Purple Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RoyalPurple'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Royal Purple Floral Embroidered Georgette Top.jpg' },
  { name: 'Maroon Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Maroon Floral Embroidered Georgette Top.jpg' },
  { name: 'Bottle Green Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BottleGreen'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Bottle Green Floral Embroidered Georgette Top.jpg' },
  { name: 'Wine Floral Embroidered Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette/Wine Floral Embroidered Georgette Top.jpg' },

  
  // Georgette Top (Round Neck) note: 7 real models from the second
  // "GEORGETTE TOPS" VSS Textiles flyer -- round neck with a small
  // front keyhole slit and a horizontal floral-vine hand embroidered
  // band across the yoke (different neckline from the V-neck twin-motif
  // Georgette Top above), fabric Georgette, size range M - XXL.
  { name: 'Crimson Red Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Crimson Red Round Neck Floral Georgette Top.jpg' },
  { name: 'Bottle Green Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BottleGreen'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Bottle Green Round Neck Floral Georgette Top.jpg' },
  { name: 'Navy Blue Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Navy Blue Round Neck Floral Georgette Top.jpg' },
  { name: 'Violet Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RoyalPurple'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Violet Round Neck Floral Georgette Top.jpg' },
  { name: 'Peacock Blue Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Peacock Blue Round Neck Floral Georgette Top.jpg' },
  { name: 'Wine Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Wine Round Neck Floral Georgette Top.jpg' },
  { name: 'Rani Pink Round Neck Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RaniPink'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-roundneck/Rani Pink Round Neck Floral Georgette Top.jpg' },


  // Georgette Top (V-Neck, Gold Floral Frame) note: 7 real models from
  // the third "GEORGETTE TOPS" VSS Textiles flyer -- V-neckline with a
  // rectangular gold floral-vine embroidered border framing the yoke
  // plus scattered gold sequin dots on the chest (distinct from both the
  // twin-motif V-neck Georgette Top and the keyhole-slit Round Neck
  // Georgette Top above), fabric Georgette, size range M - XXL.
  { name: 'Rani Pink V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RaniPink'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Rani Pink V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Bottle Green V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BottleGreen'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Bottle Green V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Violet V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['RoyalPurple'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Violet V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Wine V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Wine V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Peacock Blue V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PeacockBlue'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Peacock Blue V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Maroon V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Maroon'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Maroon V-Neck Gold Floral Georgette Top.jpg' },
  { name: 'Navy Blue V-Neck Gold Floral Georgette Top', fabric: 'Georgette', label: 'Georgette Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy'], sizes: ['M - L', 'XL - XXL'], sizePriceGroups: [['M - L'], ['XL - XXL']], sizePrices: [550, 600], price: 550, discount: 0, image: '/images/products/women/tops/georgette-goldframe/Navy Blue V-Neck Gold Floral Georgette Top.jpg' },


  { name: 'Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/umbrella-cut-top.jpg', imageSide: '/images/products/women/tops/umbrella/umbrella-cut-top-side.jpg', imageBack: '/images/products/women/tops/umbrella/umbrella-cut-top-back.jpg' },
  { name: 'Orchid Purple Floral Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Orchid Purple Floral Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Orchid Purple Floral Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Orchid Purple Floral Umbrella Cut Top-back.jpg' },
  { name: 'Dark Indigo Printed Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Dark Indigo Printed Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Dark Indigo Printed Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Dark Indigo Printed Umbrella Cut Top-back.jpg' },
  { name: 'Peacock Blue Floral Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Peacock Blue Floral Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Peacock Blue Floral Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Peacock Blue Floral Umbrella Cut Top-back.jpg' },
  { name: 'Baby Pink Printed Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Baby Pink Printed Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Baby Pink Printed Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Baby Pink Printed Umbrella Cut Top-back.jpg' },
  { name: 'Charcoal Grey Floral Printed Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Charcoal Grey Floral Printed Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Charcoal Grey Floral Printed Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Charcoal Grey Floral Printed Umbrella Cut Top-back.jpg' },
  { name: 'Deep Maroon Gold Motif Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Deep Maroon Gold Motif Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Deep Maroon Gold Motif Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Deep Maroon Gold Motif Umbrella Cut Top-back.jpg' },
  { name: 'Deep Rose Leaf Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Deep Rose Leaf Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Deep Rose Leaf Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Deep Rose Leaf Print Umbrella Cut Top-back.jpg' },
  { name: 'Teal Blue Geometric Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Teal Blue Geometric Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Teal Blue Geometric Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Teal Blue Geometric Print Umbrella Cut Top-back.jpg' },
  { name: 'Blush Pink Polka Dot Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Blush Pink Polka Dot Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Blush Pink Polka Dot Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Blush Pink Polka Dot Umbrella Cut Top-back.jpg' },
  { name: 'Taupe Floral Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Taupe Floral Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Taupe Floral Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Taupe Floral Print Umbrella Cut Top-back.jpg' },
  { name: 'Olive Green Abstract Floral Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Olive Green Abstract Floral Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Olive Green Abstract Floral Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Olive Green Abstract Floral Umbrella Cut Top-back.jpg' },
  { name: 'Raspberry Pink Floral Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Raspberry Pink Floral Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Raspberry Pink Floral Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Raspberry Pink Floral Print Umbrella Cut Top-back.jpg' },
  { name: 'Plum Micro Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Plum Micro Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Plum Micro Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Plum Micro Print Umbrella Cut Top-back.jpg' },
  { name: 'Taupe Blossom Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Taupe Blossom Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Taupe Blossom Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Taupe Blossom Print Umbrella Cut Top-back.jpg' },
  { name: 'Lime Green Floral Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Lime Green Floral Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Lime Green Floral Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Lime Green Floral Print Umbrella Cut Top-back.jpg' },
  { name: 'Charcoal Grey Micro Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Charcoal Grey Micro Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Charcoal Grey Micro Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Charcoal Grey Micro Print Umbrella Cut Top-back.jpg' },
  { name: 'Blush Pink & Teal Abstract Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Blush Pink & Teal Abstract Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Blush Pink & Teal Abstract Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Blush Pink & Teal Abstract Print Umbrella Cut Top-back.jpg' },
  { name: 'Off White & Navy Patchwork Floral Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Off White & Navy Patchwork Floral Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Off White & Navy Patchwork Floral Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Off White & Navy Patchwork Floral Print Umbrella Cut Top-back.jpg' },
  { name: 'Plum Small Buti Print Umbrella Cut Top', fabric: 'Rayon', label: 'Umbrella Cut Top', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['BrightScarletRed'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [265, 295], price: 265, discount: 0, image: '/images/products/women/tops/umbrella/Plum Small Buti Print Umbrella Cut Top.jpg', imageSide: '/images/products/women/tops/umbrella/Plum Small Buti Print Umbrella Cut Top-side.jpg', imageBack: '/images/products/women/tops/umbrella/Plum Small Buti Print Umbrella Cut Top-back.jpg' },
  

  { name: 'Anarkali', fabric: 'Rayon', label: 'Anarkali',   heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/anarkali.jpg', imageSide: '/images/products/women/tops/anarkali/anarkali-side.jpg', imageBack: '/images/products/women/tops/anarkali/anarkali-back.jpg' },
  { name: 'Forest Green Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Forest Green Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Forest Green Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Forest Green Floral Print Anarkali Top-back.jpg' },
  { name: 'Deep Indigo Blue Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Deep Indigo Blue Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Deep Indigo Blue Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Deep Indigo Blue Leaf Print Anarkali Top-back.jpg' },
  { name: 'Mustard Yellow Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Mustard Yellow Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Mustard Yellow Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Mustard Yellow Leaf Print Anarkali Top-back.jpg' },
  { name: 'Slate Blue Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Slate Blue Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Slate Blue Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Slate Blue Floral Print Anarkali Top-back.jpg' },
  { name: 'Mustard Yellow & Maroon Stripe Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Mustard Yellow & Maroon Stripe Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Mustard Yellow & Maroon Stripe Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Mustard Yellow & Maroon Stripe Print Anarkali Top-back.jpg' },
  { name: 'Forest Green Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Forest Green Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Forest Green Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Forest Green Leaf Print Anarkali Top-back.jpg' },
  { name: 'Aqua Blue Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Aqua Blue Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Aqua Blue Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Aqua Blue Floral Print Anarkali Top-back.jpg' },
  { name: 'Crimson Red Multicolor Botanical Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Crimson Red Multicolor Botanical Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Crimson Red Multicolor Botanical Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Crimson Red Multicolor Botanical Print Anarkali Top-back.jpg' },
  { name: 'Wine Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Wine Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Wine Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Wine Floral Print Anarkali Top-back.jpg' },
  { name: 'Black Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Black Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Black Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Black Leaf Print Anarkali Top-back.jpg' },
  { name: 'Ruby Red Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Ruby Red Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Ruby Red Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Ruby Red Floral Print Anarkali Top-back.jpg' },
  { name: 'Navy Blue Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Navy Blue Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Navy Blue Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Navy Blue Floral Print Anarkali Top-back.jpg' },
  { name: 'Deep Crimson Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Deep Crimson Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Deep Crimson Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Deep Crimson Leaf Print Anarkali Top-back.jpg' },
  { name: 'Crimson Abstract Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Crimson Abstract Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Crimson Abstract Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Crimson Abstract Leaf Print Anarkali Top-back.jpg' },
  { name: 'Mustard Black Stripe Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Mustard Black Stripe Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Mustard Black Stripe Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Mustard Black Stripe Print Anarkali Top-back.jpg' },
  { name: 'Magenta Teal Stripe Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Magenta Teal Stripe Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Magenta Teal Stripe Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Magenta Teal Stripe Print Anarkali Top-back.jpg' },
  { name: 'Black Floral Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Black Floral Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Black Floral Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Black Floral Print Anarkali Top-back.jpg' },
  { name: 'Blue Leaf Print Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Blue Leaf Print Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Blue Leaf Print Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Blue Leaf Print Anarkali Top-back.jpg' },
  { name: 'Red Mustard Striped Anarkali Top', fabric: 'Rayon', label: 'Anarkali', heading: 'Women Outerwear', menuParent: 'Tops', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['DustyLavender'], sizes: ['XL - 2XL', '3XL - 5XL'], sizePriceGroups: [['XL - 2XL'], ['3XL - 5XL']], sizePrices: [499, 559], price: 499, discount: 0, image: '/images/products/women/tops/anarkali/Red Mustard Striped Anarkali Top.jpg', imageSide: '/images/products/women/tops/anarkali/Red Mustard Striped Anarkali Top-side.jpg', imageBack: '/images/products/women/tops/anarkali/Red Mustard Striped Anarkali Top-back.jpg' },

  
  // Nighty note: 13 real models from the "NIGHTY PRICE LIST" wholesale
  // sheet, grouped under a shared "Nighty" flyout row (same menuParent
  // pattern as Men's T-Shirts/Track Pant/Shorts above). Price shown on the
  // site is the MRP for each size band (L-XL-XXL share one price, 3XL is
  // priced separately where the sheet has a 3XL column) — no discount
  // applied. Two models (Rayan Embroidery, Rayan) aren't offered in 3XL on 
  // the sheet, so those two only list L/XL/XXL.
  { name: 'Nighty Full Open', label: 'Full Open', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Front-Open', pattern: 'Solid', colors: ['Purple', 'Pink', 'Blue', 'White', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/nighty-fullopen.jpg', imageSide: '/images/products/women/nighty/Nighty Full Open-side.jpg', imageBack: '/images/products/women/nighty/Nighty Full Open-back.jpg' },
  { name: 'Nighty Tulip', label: 'Tulip', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Beige', 'Black', 'Blue', 'Pink', 'White'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [419, 419, 419, 459], price: 419, discount: 0, image: '/images/products/women/nighty/nighty-tulip.jpg', imageSide: '/images/products/women/nighty/Nighty Tulip-side.jpg', imageBack: '/images/products/women/nighty/Nighty Tulip-back.jpg' },
  { name: 'Nighty Calandulla', label: 'Calandulla', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Navy', 'White', 'Blue', 'Pink', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [439, 439, 439, 479], price: 439, discount: 0, image: '/images/products/women/nighty/nighty-calandulla.jpg', imageSide: '/images/products/women/nighty/Nighty Calandulla-side.jpg', imageBack: '/images/products/women/nighty/Nighty Calandulla-back.jpg' },
  { name: 'Nighty Fleet Zip', label: 'Fleet Zip', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Front-Open', pattern: 'Solid', colors: ['Pink', 'White', 'Blue', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [449, 449, 449, 489], price: 449, discount: 0, image: '/images/products/women/nighty/nighty-fleetzip.jpg', imageSide: '/images/products/women/nighty/Nighty Fleet Zip-side.jpg', imageBack: '/images/products/women/nighty/Nighty Fleet Zip-back.jpg' },
  { name: 'Nighty Frock', label: 'Frock', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Full-Length', pattern: 'Solid', colors: ['Navy', 'White', 'Blue', 'Pink', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [409, 409, 409, 449], price: 409, discount: 0, image: '/images/products/women/nighty/nighty-frock.jpg', imageSide: '/images/products/women/nighty/Nighty Frock-side.jpg', imageBack: '/images/products/women/nighty/Nighty Frock-back.jpg' },
  { name: 'Nighty Front Fleet Zip', label: 'Front Fleet Zip', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Front-Open', pattern: 'Solid', colors: ['Maroon', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [459, 459, 459, 499], price: 459, discount: 0, image: '/images/products/women/nighty/front-fleet-zip.jpg', imageSide: '/images/products/women/nighty/Nighty Front Fleet Zip-side.jpg', imageBack: '/images/products/women/nighty/Nighty Front Fleet Zip-back.jpg' },
  { name: 'Nighty Snow Drop', label: 'Snow Drop', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Green', 'Orange', 'White', 'Pink', 'Blue'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [429, 429, 429, 469], price: 429, discount: 0, image: '/images/products/women/nighty/nighty-snowdrop.jpg', imageSide: '/images/products/women/nighty/Nighty Snow Drop-side.jpg', imageBack: '/images/products/women/nighty/Nighty Snow Drop-back.jpg' },
  { name: 'Nighty Elastic', label: 'Elastic', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Solid', colors: ['Black', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [399, 399, 399, 439], price: 399, discount: 0, image: '/images/products/women/nighty/nighty-elastic.jpg', imageSide: '/images/products/women/nighty/Nighty Elastic-side.jpg', imageBack: '/images/products/women/nighty/Nighty Elastic-back.jpg' },
  { name: 'Nighty Dairy Milk', label: 'Dairy Milk', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Pink', 'White', 'Blue', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [419, 419, 419, 459], price: 419, discount: 0, image: '/images/products/women/nighty/nighty-dairymilk.jpg', imageSide: '/images/products/women/nighty/Nighty Dairy Milk-side.jpg', imageBack: '/images/products/women/nighty/Nighty Dairy Milk-back.jpg' },
  { name: 'Nighty Irsi', label: 'Irsi', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Solid', colors: ['Brown', 'Navy', 'White', 'Pink', 'Blue'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [469, 469, 469, 509], price: 469, discount: 0, image: '/images/products/women/nighty/nighty-iris.jpg', imageSide: '/images/products/women/nighty/Nighty Irsi-side.jpg', imageBack: '/images/products/women/nighty/Nighty Irsi-back.jpg' },
  { name: 'Nighty Taitanic', label: 'Taitanic', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Maroon', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [449, 449, 449, 489], price: 449, discount: 0, image: '/images/products/women/nighty/nighty-titanic.jpg', imageSide: '/images/products/women/nighty/Nighty Taitanic-side.jpg', imageBack: '/images/products/women/nighty/Nighty Taitanic-back.jpg' },
  { name: 'Nighty Goat Model', label: 'Goat Model', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Purple', 'White', 'Pink', 'Blue', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [489, 489, 489, 529], price: 489, discount: 0, image: '/images/products/women/nighty/nighty-goatmodel.jpg', imageSide: '/images/products/women/nighty/Nighty Goat Model-side.jpg', imageBack: '/images/products/women/nighty/Nighty Goat Model-back.jpg' },
  { name: 'Nighty Alfine Emporiding', label: 'Alfine Emporiding', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Alfine', style: 'Pull-On', pattern: 'Printed', colors: ['Navy', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [459, 459, 459, 499], price: 459, discount: 0, image: '/images/products/women/nighty/nighty-alifine-emoriding.jpg', imageSide: '/images/products/women/nighty/Nighty Alfine Emporiding-side.jpg', imageBack: '/images/products/women/nighty/Nighty Alfine Emporiding-back.jpg' },
  { name: 'Nighty Collar', label: 'Collar', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Front-Open', pattern: 'Solid', colors: ['Green', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [439, 439, 439, 479], price: 439, discount: 0, image: '/images/products/women/nighty/nighty-collor.jpg', imageSide: '/images/products/women/nighty/Nighty Collar-side.jpg', imageBack: '/images/products/women/nighty/Nighty Collar-back.jpg' },
  { name: 'Nighty Embroidaring Kit Kat', label: 'Embroidaring Kit Kat', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Brown', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [479, 479, 479, 519], price: 479, discount: 0, image: '/images/products/women/nighty/nighty-embroidery.jpg', imageSide: '/images/products/women/nighty/Nighty Embroidaring Kit Kat-side.jpg', imageBack: '/images/products/women/nighty/Nighty Embroidaring Kit Kat-back.jpg' },
  { name: 'Nighty Orchid', label: 'Orchid', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Pull-On', pattern: 'Printed', colors: ['Olive', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [429, 429, 429, 469], price: 429, discount: 0, image: '/images/products/women/nighty/nighty-orchid.jpg', imageSide: '/images/products/women/nighty/Nighty Orchid-side.jpg', imageBack: '/images/products/women/nighty/Nighty Orchid-back.jpg' },
  { name: 'Nighty Fleet Zip Floral', label: 'Fleet Zip Floral', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Alfine', style: 'Front-Open', pattern: 'Printed', colors: ['Peach', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [449, 449, 449, 489], price: 449, discount: 0, image: '/images/products/women/nighty/nighty-fleeetzip.jpg', imageSide: '/images/products/women/nighty/Nighty Fleet Zip Floral-side.jpg', imageBack: '/images/products/women/nighty/Nighty Fleet Zip Floral-back.jpg' },
  { name: 'Nighty Rayon', label: 'Rayon', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Sky Blue', 'White', 'Pink', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [409, 409, 409, 449], price: 409, discount: 0, image: '/images/products/women/nighty/nighty-rayon.jpg', imageSide: '/images/products/women/nighty/Nighty Rayon-side.jpg', imageBack: '/images/products/women/nighty/Nighty Rayon-back.jpg' },
  { name: 'Nighty Piping', label: 'Piping', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Solid', colors: ['Maroon', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [419, 419, 419, 459], price: 419, discount: 0, image: '/images/products/women/nighty/nighty-piping.jpg', imageSide: '/images/products/women/nighty/Nighty Piping-side.jpg', imageBack: '/images/products/women/nighty/Nighty Piping-back.jpg' },
  { name: 'Nighty Piping Zip', label: 'Piping Zip', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Front-Open', pattern: 'Solid', colors: ['Orange', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [429, 429, 429, 469], price: 429, discount: 0, image: '/images/products/women/nighty/nighty-pipingzip.jpg', imageSide: '/images/products/women/nighty/Nighty Piping Zip-side.jpg', imageBack: '/images/products/women/nighty/Nighty Piping Zip-back.jpg' },
  { name: 'Nighty Single Frill', label: 'Single Frill', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Solid', colors: ['Green', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [449, 449, 449, 489], price: 449, discount: 0, image: '/images/products/women/nighty/nighty-singlefrill.jpg', imageSide: '/images/products/women/nighty/Nighty Single Frill-side.jpg', imageBack: '/images/products/women/nighty/Nighty Single Frill-back.jpg' },
  { name: 'Nighty Lily', label: 'Lily', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Purple', 'Pink', 'White', 'Blue', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [459, 459, 459, 499], price: 459, discount: 0, image: '/images/products/women/nighty/nighty-lily.jpg', imageSide: '/images/products/women/nighty/Nighty Lily-side.jpg', imageBack: '/images/products/women/nighty/Nighty Lily-back.jpg' },
  { name: 'Nighty Rose', label: 'Rose', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Teal', 'White', 'Pink', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [439, 439, 439, 479], price: 439, discount: 0, image: '/images/products/women//nighty/nighty-rose.jpg', imageSide: '/images/products/women/nighty/Nighty Rose-side.jpg', imageBack: '/images/products/women/nighty/Nighty Rose-back.jpg' },
  { name: 'Teal Blue Rayon Printed Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Teal Blue Rayon Printed Nighty.jpg', imageSide: '/images/products/women/nighty/Teal Blue Rayon Printed Nighty-side.jpg', imageBack: '/images/products/women/nighty/Teal Blue Rayon Printed Nighty-back.jpg' },
  { name: 'Sky Bloom Rayon Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Sky Bloom Rayon Nighty.jpg', imageSide: '/images/products/women/nighty/Sky Bloom Rayon Nighty-side.jpg', imageBack: '/images/products/women/nighty/Sky Bloom Rayon Nighty-back.jpg' },
  { name: 'Plum Blossom Floral Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Plum Blossom Floral Nighty.jpg', imageSide: '/images/products/women/nighty/Plum Blossom Floral Nighty-side.jpg', imageBack: '/images/products/women/nighty/Plum Blossom Floral Nighty-back.jpg' },
  { name: 'Teal Blossom Floral Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Teal Blossom Floral Nighty.jpg', imageSide: '/images/products/women/nighty/Teal Blossom Floral Nighty-side.jpg', imageBack: '/images/products/women/nighty/Teal Blossom Floral Nighty-back.jpg' },
  { name: 'Midnight Flight Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Midnight Flight Nighty.jpg', imageSide: '/images/products/women/nighty/Midnight Flight Nighty-side.jpg', imageBack: '/images/products/women/nighty/Midnight Flight Nighty-back.jpg' },
  { name: 'Ruby Motif Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Ruby Motif Nighty.jpg', imageSide: '/images/products/women/nighty/Ruby Motif Nighty-side.jpg', imageBack: '/images/products/women/nighty/Ruby Motif Nighty-back.jpg' },
  { name: 'Golden Mosaic Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Golden Mosaic Nighty.jpg', imageSide: '/images/products/women/nighty/Golden Mosaic Nighty-side.jpg', imageBack: '/images/products/women/nighty/Golden Mosaic Nighty-back.jpg' },
  { name: 'Plum Dusk Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Plum Dusk Nighty.jpg', imageSide: '/images/products/women/nighty/Plum Dusk Nighty-side.jpg', imageBack: '/images/products/women/nighty/Plum Dusk Nighty-back.jpg' },
  { name: 'Sage Blossom Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Sage Blossom Nighty.jpg', imageSide: '/images/products/women/nighty/Sage Blossom Nighty-side.jpg', imageBack: '/images/products/women/nighty/Sage Blossom Nighty-back.jpg' },
  { name: 'Cocoa Blossom Nighty', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty/Cocoa Blossom Nighty.jpg', imageSide: '/images/products/women/nighty/Cocoa Blossom Nighty-side.jpg', imageBack: '/images/products/women/nighty/Cocoa Blossom Nighty-back.jpg' },
  { name: 'Nighty Sathya', label: 'Sathya', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Pull-On', pattern: 'Solid', colors: ['Pink', 'Blue', 'Purple', 'Yellow', 'White'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [399, 399, 399, 437], price: 399, discount: 0, image: '/images/products/women/nighty/nighty-sathya.jpg', imageSide: '/images/products/women/nighty/Nighty Sathya-side.jpg', imageBack: '/images/products/women/nighty/Nighty Sathya-back.jpg' },
  { name: 'Nighty 3/4th Hand Sadha', label: '3/4th Hand Sadha', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Short-Sleeve', pattern: 'Solid', colors: ['Pink', 'Yellow', 'White', 'Blue', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [321, 321, 321, 352], price: 321, discount: 0, image: '/images/products/women/nighty/nighty-3-4th-hand.jpg', imageSide: '/images/products/women/nighty/Nighty 3-4th Hand Sadha-side.jpg', imageBack: '/images/products/women/nighty/Nighty 3-4th Hand Sadha-back.jpg' },
  { name: 'Nighty Alpine', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['White', 'Pink', 'Blue', 'Yellow', 'Purple'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [623, 623, 623, 669], price: 623, discount: 0, image: '/images/products/women/nighty/nighty-alpine.jpg', imageSide: '/images/products/women/nighty/Nighty Alpine-side.jpg', imageBack: '/images/products/women/nighty/Nighty Alpine-back.jpg' },
  { name: 'Maroon Wine Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Maroon Wine Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Maroon Wine Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Maroon Wine Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Lavender Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Lavender Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Lavender Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Lavender Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Mocha Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Mocha Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Mocha Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Mocha Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Misty Blue Leaf Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Misty Blue Leaf Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Misty Blue Leaf Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Misty Blue Leaf Printed Maxi Nighty-back.jpg' },
  { name: 'Emerald Green Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Emerald Green Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Emerald Green Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Emerald Green Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Deep Teal Paisley Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Deep Teal Paisley Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Deep Teal Paisley Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Deep Teal Paisley Printed Maxi Nighty-back.jpg' },
  { name: 'Powder Blue Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Powder Blue Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Powder Blue Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Powder Blue Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Wine Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Wine Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Wine Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Wine Floral Printed Maxi Nighty-back.jpg' },
  { name: 'Dusty Rose Floral Printed Maxi Nighty', label: 'Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty/Dusty Rose Floral Printed Maxi Nighty.jpg', imageSide: '/images/products/women/nighty/Dusty Rose Floral Printed Maxi Nighty-side.jpg', imageBack: '/images/products/women/nighty/Dusty Rose Floral Printed Maxi Nighty-back.jpg' },
  
  //{ name: 'Nighty Feeding', label: 'Feeding', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Front-Open', pattern: 'Printed', colors: ['Blue', 'Pink', 'White', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [437, 437, 437, 477], price: 437, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Feeding-side.jpg', imageBack: '/images/products/women/nighty/Nighty Feeding-back.jpg' },
  //{ name: 'Nighty Rayan Embroidery', label: 'Rayan Embroidery', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Printed', colors: ['Pink', 'Blue', 'Purple', 'White', 'Yellow'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [469, 469, 509], price: 469, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Rayan Embroidery-side.jpg', imageBack: '/images/products/women/nighty/Nighty Rayan Embroidery-back.jpg' },
  //{ name: 'Nighty Rayan', label: 'Rayan', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Rayon', style: 'Pull-On', pattern: 'Solid', colors: ['Blue', 'Pink', 'Yellow', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL'], sizePriceGroups: [['L', 'XL'], ['XXL']], sizePrices: [503, 503, 543], price: 503, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Rayan-side.jpg', imageBack: '/images/products/women/nighty/Nighty Rayan-back.jpg' },
  //{ name: 'Nighty Chudi Cut', label: 'Chudi Cut', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton Blend', style: 'Pull-On', pattern: 'Solid', colors: ['Purple', 'White', 'Pink', 'Blue', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [305, 305, 305, 337], price: 305, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Chudi Cut-side.jpg', imageBack: '/images/products/women/nighty/Nighty Chudi Cut-back.jpg' },
  //{ name: 'Nighty Cut', label: 'Nighty Cut', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton Blend', style: 'Pull-On', pattern: 'Solid', colors: ['Yellow', 'White', 'Purple', 'Pink', 'Blue'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [305, 305, 305, 337], price: 305, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Cut-side.jpg', imageBack: '/images/products/women/nighty/Nighty Cut-back.jpg' },
  //{ name: 'Nighty Manasi', label: 'Manasi', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Poly Viscose', style: 'Pull-On', pattern: 'Printed', colors: ['White', 'Purple', 'Yellow', 'Blue', 'Pink'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [312, 312, 312, 344], price: 312, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Manasi-side.jpg', imageBack: '/images/products/women/nighty/Nighty Manasi-back.jpg' },
  //{ name: 'Nighty 3/4th Alpine', label: '3/4th Alpine', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Short-Sleeve', pattern: 'Printed', colors: ['Blue', 'White', 'Pink', 'Purple', 'Yellow'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [578, 578, 578, 623], price: 578, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty 3-4th Alpine-side.jpg', imageBack: '/images/products/women/nighty/Nighty 3-4th Alpine-back.jpg' },
  //{ name: 'Nighty 3/4th Alpine Premium', label: '3/4th Alpine Premium', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Short-Sleeve', pattern: 'Printed', colors: ['Purple', 'Blue', 'White', 'Yellow', 'Pink'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [642, 642, 642, 692], price: 642, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty 3-4th Alpine Premium-side.jpg', imageBack: '/images/products/women/nighty/Nighty 3-4th Alpine Premium-back.jpg' },
  //{ name: 'Nighty Embroidery', label: 'Embroidery', heading: 'Women Outerwear', menuParent: 'Nighty', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Cotton', style: 'Pull-On', pattern: 'Printed', colors: ['Yellow', 'Pink', 'Blue', 'Purple', 'White'], sizes: ['L', 'XL', 'XXL', '3XL'], sizePriceGroups: [['L', 'XL', 'XXL'], ['3XL']], sizePrices: [462, 462, 462, 500], price: 462, discount: 0, image: '/images/products/women/nighty.jpg', imageSide: '/images/products/women/nighty/Nighty Embroidery-side.jpg', imageBack: '/images/products/women/nighty/Nighty Embroidery-back.jpg' }, 
         

  { name: 'Dilse', menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], fabric: 'Hosiery Cloth', colors: ['Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Violet', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [128, 137, 149], price: 128, discount: 0, image: '/images/products/women/brassier/Dilse/Dilse-Mustard.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Mustard-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Mustard-back.jpg' ,
    colorImages: {
      Red: { image: '/images/products/women/brassier/Dilse/Dilse-Red.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Red-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/Dilse/Dilse-Mustard.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Mustard-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Mustard-back.jpg' },
      Wine: { image: '/images/products/women/brassier/Dilse/Dilse-Wine.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Wine-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Wine-back.jpg' },
      Black: { image: '/images/products/women/brassier/Dilse/Dilse-Black.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Black-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/Dilse/Dilse-White.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-White-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-White-back.jpg' },
      Peach: { image: '/images/products/women/brassier/Dilse/Dilse-Peach.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Peach-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Peach-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Dilse/Dilse-Pink.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Pink-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Pink-back.jpg' },
      Violet: { image: '/images/products/women/brassier/Dilse/Dilse-Violet.jpg', imageSide: '/images/products/women/brassier/Dilse/Dilse-Violet-side.jpg', imageBack: '/images/products/women/brassier/Dilse/Dilse-Violet-back.jpg' },
    },
   },
  { name: 'Jara', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: [ 'Lavender', 'Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [137, 148], price: 137, discount: 0,  image: '/images/products/women/brassier/Jara/Jara-Lavender.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Lavender-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Lavender-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/Jara/Jara-wine.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-wine-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/Jara/Jara-Lavender.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Lavender-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/Jara/Jara-Black.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Black-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/Jara/Jara-White.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-White-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-White-back.jpg' },
      Peach: { image: '/images/products/women/brassier/Jara/Jara-Peach.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Peach-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Peach-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Jara/Jara-Pink.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Pink-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/Jara/Jara-Red.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Red-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/Jara/Jara-Mustard.jpg', imageSide: '/images/products/women/brassier/Jara/Jara-Mustard-side.jpg', imageBack: '/images/products/women/brassier/Jara/Jara-Mustard-back.jpg' },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
    },
   },
  { name: 'Sponge Colours', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Green', 'Lavender', 'Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [175, 185], price: 175, discount: 0,  image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green-back.jpg' ,
     colorImages: {
      Wine: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-wine.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-wine-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Lavender.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Lavender-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Black.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Black-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-White.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-White-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-White-back.jpg' },
      Green: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Green-back.jpg' },
      Pink: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Pink.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Pink-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Red.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Red-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Mustard.jpg', imageSide: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Mustard-side.jpg', imageBack: '/images/products/women/brassier/SPONGE COLOURS/SPONGE COLOURS-Mustard-back.jpg' },
    },
   },
  { name: 'Sports Fit', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'Wine', 'Checked', 'Pink', 'Light Pink'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [203, 216], price: 203, discount: 0, image: '/images/products/women/brassier/Sports Fit/Sports Fit-Red.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Red-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Red-back.jpg' ,
     colorImages: {
      Wine: { image: '/images/products/women/brassier/Sports Fit/Sports Fit-Wine.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Wine-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Wine-back.jpg' },
      Checked: { image: '/images/products/women/brassier/Sports Fit/Sports Fit-Checked.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Checked-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Checked-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Sports Fit/Sports Fit-Pink.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Pink-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/Sports Fit/Sports Fit-Red.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Red-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Red-back.jpg' },
      'Light Pink': { image: '/images/products/women/brassier/Sports Fit/Sports Fit-Light Pink.jpg', imageSide: '/images/products/women/brassier/Sports Fit/Sports Fit-Light Pink-side.jpg', imageBack: '/images/products/women/brassier/Sports Fit/Sports Fit-Light Pink-back.jpg' },
    },
   },
  { name: 'Sports Plus', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Soft Sage Green', 'Lavender', 'Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [189, 202], price: 189, discount: 0, image: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-wine.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-wine-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Lavender.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Lavender-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Black.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Black-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-White.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-White-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-White-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Mustard.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Mustard-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Mustard-back.jpg' },
      Pink: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Pink.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Red.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Red-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Red-back.jpg' },
      'Soft Sage Green': { image: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/sports-Plus/sports-Plus-Soft Sage Green-back.jpg' },
    },
   },
  { name: 'Strapless Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'Mustard', 'Wine', 'Black', 'Pink', 'Green', 'Violet', 'Peach'], sizes: ['75-90'], sizeUnit: 'cm', sizePriceGroups: [['75-90']], sizePrices: [94], price: 94, discount: 0, image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red-back.jpg' ,
    colorImages: {
      Red: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Mustard.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Mustard-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Mustard-back.jpg' },
      Wine: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Wine.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Wine-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Wine-back.jpg' },
      Black: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Black.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Black-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Black-back.jpg' },
      Green: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Green.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Green-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Green-back.jpg' },
      Peach: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Peach.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Peach-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Peach-back.jpg' },
      Pink: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Pink.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Pink-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Pink-back.jpg' },
      Violet: { image: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Violet.jpg', imageSide: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Violet-side.jpg', imageBack: '/images/products/women/brassier/STRAPLESS BRA/STRAPLESS BRA-Violet-back.jpg' },
    },
   },
  { name: 'T-Shirt Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Lavender', 'Green', 'Peach', 'Red', 'Wine', 'Black', 'Pink', 'White'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [212, 225], price: 212, discount: 0, image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender-back.jpg' ,
     colorImages: {
      Wine: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-wine.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-wine-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Black.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Black-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-White.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-White-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-White-back.jpg' },
      Green: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Green.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Green-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Green-back.jpg' },
      Pink: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Pink.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Pink-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Red.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Red-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Red-back.jpg' },
      Peach: { image: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Peach.jpg', imageSide: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Peach-side.jpg', imageBack: '/images/products/women/brassier/t-shirt-bra/t-shirt-bra-Peach-back.jpg' },
    },
   },
  { name: 'Teenage Smart', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Lavender', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [108, 117], price: 108, discount: 0,  image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Wine.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Wine-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Wine-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Mustard-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Lavender.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Lavender-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Black.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Black-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-White.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-White-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-White-back.jpg' },
      Green: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Green.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Green-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Green-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Pink.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Pink-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Red.jpg', imageSide: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Red-side.jpg', imageBack: '/images/products/women/brassier/Teenage Smart/Teenage Smart-Red-back.jpg' },
    },
   },
  { name: 'Roshini', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Peach', 'Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Lavender'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [148, 158, 171], price: 148, discount: 0,  image: '/images/products/women/brassier/roshini/roshini-Peach.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Peach-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Peach-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/roshini/roshini-wine.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-wine-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/roshini/roshini-Lavender.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Lavender-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/roshini/roshini-Black.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Black-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/roshini/roshini-White.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-White-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-White-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/roshini/roshini-Mustard.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Mustard-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Mustard-back.jpg' },
      Pink: { image: '/images/products/women/brassier/roshini/roshini-Pink.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Pink-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/roshini/roshini-Red.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Red-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Red-back.jpg' },
      Peach: { image: '/images/products/women/brassier/roshini/roshini-Peach.jpg', imageSide: '/images/products/women/brassier/roshini/roshini-Peach-side.jpg', imageBack: '/images/products/women/brassier/roshini/roshini-Peach-back.jpg' },
    },
   },
  { name: 'Aster', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Blue', 'Lavender', 'Wine', 'Red', 'Black', 'Pink', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [157, 167], price: 157, discount: 0, image: '/images/products/women/brassier/aster/aster-Blue.jpg', imageSide: '/images/products/women/brassier/aster/aster-Blue-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Blue-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/aster/aster-wine.jpg', imageSide: '/images/products/women/brassier/aster/aster-wine-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/aster/aster-Lavender.jpg', imageSide: '/images/products/women/brassier/aster/aster-Lavender-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/aster/aster-Black.jpg', imageSide: '/images/products/women/brassier/aster/aster-Black-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/aster/aster-White.jpg', imageSide: '/images/products/women/brassier/aster/aster-White-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/aster/aster-Pink.jpg', imageSide: '/images/products/women/brassier/aster/aster-Pink-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/aster/aster-Red.jpg', imageSide: '/images/products/women/brassier/aster/aster-Red-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Red-back.jpg' },
      Blue: { image: '/images/products/women/brassier/aster/aster-Blue.jpg', imageSide: '/images/products/women/brassier/aster/aster-Blue-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Blue-back.jpg' },
      Peach: { image: '/images/products/women/brassier/aster/aster-Peach.jpg', imageSide: '/images/products/women/brassier/aster/aster-Peach-side.jpg', imageBack: '/images/products/women/brassier/aster/aster-Peach-back.jpg' },
     },
   },
  { name: 'Lissy Print', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Blue Print', 'Pink Print', 'Black', 'White', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [157, 167], price: 157, discount: 0, image: '/images/products/women/brassier/lissy-print.jpg', imageSide: '/images/products/women/lissy-print-side.jpg', imageBack: '/images/products/women/lissy-print-back.jpg' },
  { name: 'Teenage Colours', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Lavender', 'Wine', 'Mustard', 'Red', 'Black', 'Pink', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [104, 113], price: 104, discount: 0,  image: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-wine.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-wine-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Black.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Black-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-White.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-White-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Pink.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Pink-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Red.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Red-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Mustard.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Mustard-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Mustard-back.jpg' },
      Peach: { image: '/images/products/women/brassier/teenage-colours/teenage-colours-Peach.jpg', imageSide: '/images/products/women/brassier/teenage-colours/teenage-colours-Peach-side.jpg', imageBack: '/images/products/women/brassier/teenage-colours/teenage-colours-Peach-back.jpg' },
     },
   },
  { name: 'Gym Fit', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Green','Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Lavender'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [108, 117], price: 108, discount: 0, image: '/images/products/women/brassier/gym-fit/gym-fit-Green.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Green-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Green-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/gym-fit/gym-fit-Wine.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Wine-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Wine-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/gym-fit/gym-fit-Mustard.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Mustard-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Mustard-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/gym-fit/gym-fit-Lavender.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Lavender-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/gym-fit/gym-fit-Black.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Black-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/gym-fit/gym-fit-White.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-White-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-White-back.jpg' },
      Green: { image: '/images/products/women/brassier/gym-fit/gym-fit-Green.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Green-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Green-back.jpg' },
      Pink: { image: '/images/products/women/brassier/gym-fit/gym-fit-Pink.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Pink-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/gym-fit/gym-fit-Red.jpg', imageSide: '/images/products/women/brassier/gym-fit/gym-fit-Red-side.jpg', imageBack: '/images/products/women/brassier/gym-fit/gym-fit-Red-back.jpg' },
    },
   },
  { name: 'Sports X', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Coral Pink', 'Brown'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [212, 225], price: 212, discount: 0, image: '/images/products/women/brassier/sports-x/sports-x-Pink.jpg', imageSide: '/images/products/women/brassier/sports-x/sports-x-Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-x/sports-x-Pink-back.jpg' ,
     colorImages: {
      Pink: { image: '/images/products/women/brassier/sports-x/sports-x-Pink.jpg', imageSide: '/images/products/women/brassier/sports-x/sports-x-Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-x/sports-x-Pink-back.jpg' },
      Brown: { image: '/images/products/women/brassier/sports-x/sports-x-Brown.jpg', imageSide: '/images/products/women/brassier/sports-x/sports-x-Brown-side.jpg', imageBack: '/images/products/women/brassier/sports-x/sports-x-Brown-back.jpg' },
      'Coral Pink': { image: '/images/products/women/brassier/sports-x/sports-x-Coral Pink.jpg', imageSide: '/images/products/women/brassier/sports-x/sports-x-Coral Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-x/sports-x-Coral Pink-back.jpg' },
    },
   },
  { name: 'Sports Free', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Print', 'Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Lavender'], sizes: ['75-90'], sizeUnit: 'cm', sizePriceGroups: [['75-90']], sizePrices: [112], price: 112, discount: 0, image: '/images/products/women/brassier/sports-free/sports-free-Print.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Print-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Print-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/sports-free/sports-free-Wine.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Wine-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Wine-back.jpg' },
      Print: { image: '/images/products/women/brassier/sports-free/sports-free-Print.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Print-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Print-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/sports-free/sports-free-Lavender.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Lavender-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/sports-free/sports-free-Black.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Black-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/sports-free/sports-free-White.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-White-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-White-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/sports-free/sports-free-Mustard.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Mustard-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Mustard-back.jpg' },
      Pink: { image: '/images/products/women/brassier/sports-free/sports-free-Pink.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/sports-free/sports-free-Red.jpg', imageSide: '/images/products/women/brassier/sports-free/sports-free-Red-side.jpg', imageBack: '/images/products/women/brassier/sports-free/sports-free-Red-back.jpg' },
    },  
   },
  { name: 'Priya Mould', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Lavender', 'Wine', 'Mustard', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [144, 155, 167], price: 144, discount: 0, image: '/images/products/women/brassier/priya-mould.jpg', imageSide: '/images/products/women/priya-mould-side.jpg', imageBack: '/images/products/women/priya-mould-back.jpg',
     colorImages: {
      Wine: { image: '/images/products/women/brassier/priya-mould/priya-mould-wine.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-wine-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-wine-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/priya-mould/priya-mould-Lavender.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-Lavender-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/priya-mould/priya-mould-Black.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-Black-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/priya-mould/priya-mould-White.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-White-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/priya-mould.jpg', imageSide: '/images/products/women/priya-mould-side.jpg', imageBack: '/images/products/women/priya-mould-back.jpg'},
      Red: { image: '/images/products/women/brassier/priya-mould/priya-mould-Red.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-Red-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-Red-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/priya-mould/priya-mould-Mustard.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-Mustard-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-Mustard-back.jpg' },
      Peach: { image: '/images/products/women/brassier/priya-mould/priya-mould-Peach.jpg', imageSide: '/images/products/women/brassier/priya-mould/priya-mould-Peach-side.jpg', imageBack: '/images/products/women/brassier/priya-mould/priya-mould-Peach-back.jpg' },
     },
   },
  { name: 'Honey Lite Pad', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Soft Sage Green', 'Wine', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [162, 175], price: 162, discount: 0, image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-wine.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-wine-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-wine-back.jpg' },
      'Soft Sage Green': { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Soft Sage Green-back.jpg' },
      Black: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Black.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Black-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-White.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-White-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Pink.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Pink-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Red.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Red-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Lavender.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Lavender-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Peach.jpg', imageSide: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Peach-side.jpg', imageBack: '/images/products/women/brassier/honey-lite-pad/honey-lite-pad-Peach-back.jpg' },
     },
   },
  { name: 'Mothers Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Beige', 'Skin'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [234, 247], price: 234, discount: 0, image: '/images/products/women/brassier/mothers-bra.jpg', imageSide: '/images/products/women/mothers-bra-side.jpg', imageBack: '/images/products/women/mothers-bra-back.jpg' },
  { name: 'Support Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Pink', 'Navy', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [216, 229], price: 216, discount: 0, image: '/images/products/women/brassier/support-bra/support-bra-Light Pink.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Light Pink-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Light Pink-back.jpg' ,
    colorImages: {
      'Light Pink': { image: '/images/products/women/brassier/support-bra/support-bra-Light Pink.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Light Pink-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Light Pink-back.jpg' },
      Navy: { image: '/images/products/women/brassier/support-bra/support-bra-navy.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-navy-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-navy-back.jpg' },
      Black: { image: '/images/products/women/brassier/support-bra/support-bra-Black.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Black-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/support-bra/support-bra-White.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-White-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/support-bra/support-bra-Pink.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Pink-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/support-bra/support-bra-Red.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Red-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/support-bra/support-bra-Lavender.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Lavender-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/support-bra/support-bra-Peach.jpg', imageSide: '/images/products/women/brassier/support-bra/support-bra-Peach-side.jpg', imageBack: '/images/products/women/brassier/support-bra/support-bra-Peach-back.jpg' },
     },
   },
  { name: 'Sports Colours', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Green','Mustard', 'Red', 'Wine', 'Black', 'Pink', 'White', 'Lavender'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [126, 135, 148], price: 126, discount: 0, image: '/images/products/women/brassier/sports-colours/sports-colours-Green.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Green-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Green-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/sports-colours/sports-colours-Wine.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Wine-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Wine-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/sports-colours/sports-colours-Mustard.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Mustard-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Mustard-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/sports-colours/sports-colours-Lavender.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Lavender-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Lavender-back.jpg' },
      Black: { image: '/images/products/women/brassier/sports-colours/sports-colours-Black.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Black-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/sports-colours/sports-colours-White.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-White-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-White-back.jpg' },
      Green: { image: '/images/products/women/brassier/sports-colours/sports-colours-Green.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Green-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Green-back.jpg' },
      Pink: { image: '/images/products/women/brassier/sports-colours/sports-colours-Pink.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Pink-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Pink-back.jpg' },
      Red: { image: '/images/products/women/brassier/sports-colours/sports-colours-Red.jpg', imageSide: '/images/products/women/brassier/sports-colours/sports-colours-Red-side.jpg', imageBack: '/images/products/women/brassier/sports-colours/sports-colours-Red-back.jpg' },
    },
   },
  { name: 'Safa C Cup', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Soft Sage Green', 'Coral Pink', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [207, 220, 236], price: 207, discount: 0,  image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green-back.jpg'  ,
    colorImages: {
     'Coral Pink': { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Coral Pink.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Coral Pink-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Coral Pink-back.jpg' },
      'Soft Sage Green': { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Soft Sage Green-back.jpg' },
      Black: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Black.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Black-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-White.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-White-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Pink.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Pink-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Red.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Red-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Lavender.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Lavender-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Peach.jpg', imageSide: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Peach-side.jpg', imageBack: '/images/products/women/brassier/safa-c-cup/safa-c-cup-Peach-back.jpg' },
     },
   },
  { name: 'Sweety Pad', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Soft Sage Green', 'Wine', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [193, 207, 225], price: 193, discount: 0,  image: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-wine.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-wine-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-wine-back.jpg' },
      'Soft Sage Green': { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Soft Sage Green-back.jpg' },
      Black: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Black.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Black-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-White.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-White-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Pink.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Pink-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Red.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Red-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Lavender.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Lavender-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/sweety-pad/sweety-pad-Peach.jpg', imageSide: '/images/products/women/brassier/sweety-pad/sweety-pad-Peach-side.jpg', imageBack: '/images/products/women/brassier/sweety-pad/sweety-pad-Peach-back.jpg' },
     },
   },
  { name: 'Teenage Mould', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Raspberry Purple', 'Wine', 'Mustard', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [144, 155], price: 144, discount: 0, image: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple-back.jpg',
    colorImages: {
      Wine: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-wine.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-wine-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-wine-back.jpg' },
      'Raspberry Purple': { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Raspberry Purple-back.jpg' },
      Black: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Black.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Black-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-White.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-White-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-White-back.jpg' },
      Mustard: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Mustard.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Mustard-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Mustard-back.jpg'},
      Red: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Red.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Red-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Lavender.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Lavender-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/teenage-mould/teenage-mould-Peach.jpg', imageSide: '/images/products/women/brassier/teenage-mould/teenage-mould-Peach-side.jpg', imageBack: '/images/products/women/brassier/teenage-mould/teenage-mould-Peach-back.jpg' },
     },
   },
  { name: 'Safa Salwar Kameez Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Wine', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [194, 207, 221], price: 194, discount: 0, image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-wine.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-wine-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-wine-back.jpg' },
      Brown: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Brown-back.jpg' },
      Black: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Black.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Black-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-White.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-White-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Pink.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Pink-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Red.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Red-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Lavender.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Lavender-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Peach.jpg', imageSide: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Peach-side.jpg', imageBack: '/images/products/women/brassier/Safa Salwar Kameez Bra/Safa Salwar Kameez Bra-Peach-back.jpg' },
     },
   },
  { name: 'Prestige', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Soft Sage Green', 'Pink', 'Lavender', 'Red', 'Black', 'White',  'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [315, 333], price: 315, discount: 0, image: '/images/products/women/brassier/Prestige/Prestige-Navy.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Navy-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Navy-back.jpg' ,
    colorImages: {
      Navy: { image: '/images/products/women/brassier/Prestige/Prestige-Navy.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Navy-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Navy-back.jpg' },
      'Soft Sage Green': { image: '/images/products/women/brassier/Prestige/Prestige-Soft Sage Green.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Soft Sage Green-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Soft Sage Green-back.jpg' },
      Black: { image: '/images/products/women/brassier/Prestige/Prestige-Black.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Black-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Black-back.jpg' },
      White: { image: '/images/products/women/brassier/Prestige/Prestige-White.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-White-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-White-back.jpg' },
      Pink: { image: '/images/products/women/brassier/Prestige/Prestige-Pink.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Pink-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Pink-back.jpg'},
      Red: { image: '/images/products/women/brassier/Prestige/Prestige-Red.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Red-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Red-back.jpg' },
      Lavender: { image: '/images/products/women/brassier/Prestige/Prestige-Lavender.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Lavender-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Lavender-back.jpg' },
      Peach: { image: '/images/products/women/brassier/Prestige/Prestige-Peach.jpg', imageSide: '/images/products/women/brassier/Prestige/Prestige-Peach-side.jpg', imageBack: '/images/products/women/brassier/Prestige/Prestige-Peach-back.jpg' },
     },
   },
  { name: 'Pinky Set', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [261, 288], price: 261, discount: 0, image: '/images/products/women/brassier/Pinky Set.jpg', imageSide: '/images/products/women/Pinky Set-side.jpg', imageBack: '/images/products/women/Pinky Set-back.jpg' },
  // { name: 'Push-Up Bra', fabric: 'Cotton-Spandex Blend',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Skin', 'Pink', 'White', 'Beige'], sizes: ['S', 'M', 'L', 'XL', '2XL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', '2XL']], sizePrices: [599, 599, 599, 639, 639], price: 599, discount: 0, image: '/images/products/women/push-up-bra.jpg', imageSide: '/images/products/women/push-up-bra-side.jpg', imageBack: '/images/products/women/push-up-bra-back.jpg' },


  // --- New bra models added from the 1.5.2026 Kerala price list (not previously
  // on the site). Colors are a reasonable default set (real photos not yet
  // available, so these fall back to a placeholder image via imgFallback.js —
  // drop a real photo at the path below, using the exact same filename, to replace it).
  // { name: 'Maya', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [99, 108, 121], price: 99, discount: 0, image: '/images/products/women/brassier/Maya.jpg', imageSide: '/images/products/women/Maya-side.jpg', imageBack: '/images/products/women/Maya-back.jpg' },
  // { name: 'Lexy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [103, 112], price: 103, discount: 0, image: '/images/products/women/brassier/Lexy.jpg', imageSide: '/images/products/women/Lexy-side.jpg', imageBack: '/images/products/women/Lexy-back.jpg' },
  // { name: 'Ruby', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [103, 112], price: 103, discount: 0, image: '/images/products/women/brassier/Ruby.jpg', imageSide: '/images/products/women/Ruby-side.jpg', imageBack: '/images/products/women/Ruby-back.jpg' },
  // { name: 'Angel', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [104, 113, 126], price: 104, discount: 0, image: '/images/products/women/brassier/Angel.jpg', imageSide: '/images/products/women/Angel-side.jpg', imageBack: '/images/products/women/Angel-back.jpg' },
  // { name: 'Rose Bra', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [104, 113, 126], price: 104, discount: 0, image: '/images/products/women/brassier/Rose Bra.jpg', imageSide: '/images/products/women/Rose Bra-side.jpg', imageBack: '/images/products/women/Rose Bra-back.jpg' },
  // { name: 'Angel F.O', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [119, 128, 140], price: 119, discount: 0, image: '/images/products/women/brassier/Angel F.O.jpg', imageSide: '/images/products/women/Angel F.O-side.jpg', imageBack: '/images/products/women/Angel F.O-back.jpg' },
  // { name: 'Jessy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [119, 128, 140], price: 119, discount: 0, image: '/images/products/women/brassier/Jessy.jpg', imageSide: '/images/products/women/Jessy-side.jpg', imageBack: '/images/products/women/Jessy-back.jpg' },
  // { name: 'Ikhlas', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [119, 128, 140], price: 119, discount: 0, image: '/images/products/women/brassier/Ikhlas.jpg', imageSide: '/images/products/women/Ikhlas-side.jpg', imageBack: '/images/products/women/Ikhlas-back.jpg' },
  // { name: 'Rupa', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [117, 126], price: 117, discount: 0, image: '/images/products/women/brassier/Rupa.jpg', imageSide: '/images/products/women/Rupa-side.jpg', imageBack: '/images/products/women/Rupa-back.jpg' },
  // { name: 'A.One', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [122, 131], price: 122, discount: 0, image: '/images/products/women/brassier/A.One.jpg', imageSide: '/images/products/women/A.One-side.jpg', imageBack: '/images/products/women/A.One-back.jpg' },
  // { name: 'Flora', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [119, 128, 140], price: 119, discount: 0, image: '/images/products/women/brassier/Flora.jpg', imageSide: '/images/products/women/Flora-side.jpg', imageBack: '/images/products/women/Flora-back.jpg' },
  // { name: 'Princy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [126, 135, 148], price: 126, discount: 0, image: '/images/products/women/brassier/Princy.jpg', imageSide: '/images/products/women/Princy-side.jpg', imageBack: '/images/products/women/Princy-back.jpg' },
  // { name: '707', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [151, 162, 175], price: 151, discount: 0, image: '/images/products/women/brassier/707.jpg', imageSide: '/images/products/women/707-side.jpg', imageBack: '/images/products/women/707-back.jpg' },
  // { name: 'Alfa', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [155, 166], price: 155, discount: 0, image: '/images/products/women/brassier/Alfa.jpg', imageSide: '/images/products/women/Alfa-side.jpg', imageBack: '/images/products/women/Alfa-back.jpg' },
  // { name: 'Mercy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [142, 153], price: 142, discount: 0, image: '/images/products/women/brassier/Mercy.jpg', imageSide: '/images/products/women/Mercy-side.jpg', imageBack: '/images/products/women/Mercy-back.jpg' },
  // { name: 'Queen', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [155, 166, 178], price: 155, discount: 0, image: '/images/products/women/brassier/Queen.jpg', imageSide: '/images/products/women/Queen-side.jpg', imageBack: '/images/products/women/Queen-back.jpg' },
  // { name: 'Glory', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [148, 158], price: 148, discount: 0, image: '/images/products/women/brassier/Glory.jpg', imageSide: '/images/products/women/Glory-side.jpg', imageBack: '/images/products/women/Glory-back.jpg' },
  // { name: 'Lotus', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [151, 162], price: 151, discount: 0, image: '/images/products/women/brassier/Lotus.jpg', imageSide: '/images/products/women/Lotus-side.jpg', imageBack: '/images/products/women/Lotus-back.jpg' },
  // { name: 'Lovely', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [153, 164], price: 153, discount: 0, image: '/images/products/women/brassier/Lovely.jpg', imageSide: '/images/products/women/Lovely-side.jpg', imageBack: '/images/products/women/Lovely-back.jpg' },
  // { name: '945', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [164, 175], price: 164, discount: 0, image: '/images/products/women/brassier/945.jpg', imageSide: '/images/products/women/945-side.jpg', imageBack: '/images/products/women/945-back.jpg' },
  // { name: 'Sofia', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [176, 187, 200], price: 176, discount: 0, image: '/images/products/women/brassier/Sofia.jpg', imageSide: '/images/products/women/Sofia-side.jpg', imageBack: '/images/products/women/Sofia-back.jpg' },
  // { name: 'Rosy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [178, 189, 202], price: 178, discount: 0, image: '/images/products/women/brassier/Rosy.jpg', imageSide: '/images/products/women/Rosy-side.jpg', imageBack: '/images/products/women/Rosy-back.jpg' },
  // { name: 'Snova', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110', '115'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110'], ['115']], sizePrices: [180, 191, 203, 221], price: 180, discount: 0, image: '/images/products/women/brassier/Snova.jpg', imageSide: '/images/products/women/Snova-side.jpg', imageBack: '/images/products/women/Snova-back.jpg' },
  // { name: 'Snova C Cup', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [187, 198, 211], price: 187, discount: 0, image: '/images/products/women/brassier/Snova C Cup.jpg', imageSide: '/images/products/women/Snova C Cup-side.jpg', imageBack: '/images/products/women/Snova C Cup-back.jpg' },
  // { name: 'Snova F.O', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [203, 218, 232], price: 203, discount: 0, image: '/images/products/women/brassier/Snova F.O.jpg', imageSide: '/images/products/women/Snova F.O-side.jpg', imageBack: '/images/products/women/Snova F.O-back.jpg' },
  // { name: 'Fairy', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [203, 218, 232], price: 203, discount: 0, image: '/images/products/women/brassier/Fairy.jpg', imageSide: '/images/products/women/Fairy-side.jpg', imageBack: '/images/products/women/Fairy-back.jpg' },
  // { name: 'Daisy Bra', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [196, 209, 223], price: 196, discount: 0, image: '/images/products/women/brassier/Daisy Bra.jpg', imageSide: '/images/products/women/Daisy Bra-side.jpg', imageBack: '/images/products/women/Daisy Bra-back.jpg' },
  // { name: 'Saree Bra', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [196, 209, 223], price: 196, discount: 0, image: '/images/products/women/brassier/Saree Bra.jpg', imageSide: '/images/products/women/Saree Bra-side.jpg', imageBack: '/images/products/women/Saree Bra-back.jpg' },
  // { name: 'Feeding Bra (Cotton)', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [225, 243, 261], price: 225, discount: 0, image: '/images/products/women/brassier/Feeding Bra (Cotton).jpg', imageSide: '/images/products/women/Feeding Bra (Cotton)-side.jpg', imageBack: '/images/products/women/Feeding Bra (Cotton)-back.jpg' },
  // { name: 'Dreams', fabric: 'Cotton Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [216, 234, 252], price: 216, discount: 0, image: '/images/products/women/brassier/Dreams.jpg', imageSide: '/images/products/women/Dreams-side.jpg', imageBack: '/images/products/women/Dreams-back.jpg' },
  // { name: 'Arya Cotton Colours', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [128, 137], price: 128, discount: 0, image: '/images/products/women/brassier/Arya Cotton Colours.jpg', imageSide: '/images/products/women/Arya Cotton Colours-side.jpg', imageBack: '/images/products/women/Arya Cotton Colours-back.jpg' },
  // { name: 'Sona Bra', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [148, 158], price: 148, discount: 0, image: '/images/products/women/brassier/Sona Bra.jpg', imageSide: '/images/products/women/Sona Bra-side.jpg', imageBack: '/images/products/women/Sona Bra-back.jpg' },
  // { name: 'Beauty', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [153, 164], price: 153, discount: 0, image: '/images/products/women/brassier/Beauty.jpg', imageSide: '/images/products/women/Beauty-side.jpg', imageBack: '/images/products/women/Beauty-back.jpg' },
  // { name: 'Snova Colours', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [187, 198, 211], price: 187, discount: 0, image: '/images/products/women/brassier/Snova Colours.jpg', imageSide: '/images/products/women/Snova Colours-side.jpg', imageBack: '/images/products/women/Snova Colours-back.jpg' },
  // { name: 'Dreams Colours', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [225, 243, 261], price: 225, discount: 0, image: '/images/products/women/brassier/Dreams Colours.jpg', imageSide: '/images/products/women/Dreams Colours-side.jpg', imageBack: '/images/products/women/Dreams Colours-back.jpg' },
  // { name: 'Saree Bra Colours', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [205, 218, 232], price: 205, discount: 0, image: '/images/products/women/brassier/Saree Bra Colours.jpg', imageSide: '/images/products/women/Saree Bra Colours-side.jpg', imageBack: '/images/products/women/Saree Bra Colours-back.jpg' },
  // { name: 'Daisy Colours', fabric: 'Cotton Cloth Colours',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'White', 'Skin', 'Black', 'Pink', 'Beige', 'Blue', 'Purple', 'Green', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [205, 218, 232], price: 205, discount: 0, image: '/images/products/women/brassier/Daisy Colours.jpg', imageSide: '/images/products/women/Daisy Colours-side.jpg', imageBack: '/images/products/women/Daisy Colours-back.jpg' },
  // { name: 'Teenage Bra', fabric: 'Hosiery Cloth',  menuParent: 'Bras', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [104, 113], price: 104, discount: 0, image: '/images/products/women/brassier/Teenage Bra.jpg', imageSide: '/images/products/women/Teenage Bra-side.jpg', imageBack: '/images/products/women/Teenage Bra-back.jpg' },
  // sheet, grouped under a shared "Panties" flyout row — same chest-band
  // sizing pattern as the Slips models above. Price shown on the site is
  // the sheet's M.R.P column (not the factory rate), no discount applied.
  // Leo IE Print and Leo IE Plain aren't offered in the 105-110 band on
  // the sheet (shown as "-"), so those two only list 75-90 / 95-100.
  // Slips note: 8 real models from the "SLIPS PRICE LIST" wholesale sheet,
  // grouped under a shared "Slips" flyout row (same menuParent pattern as
  // Nighty/T-Shirt above). Sizes are chest-measurement bands (cm) rather
  // than S/M/L, same approach as the men's RN/RNS vests — price shown on
  // the site is the sheet's M.R.P column (not the factory rate), no
  // discount applied. Jasmine, Lamis, Breeze, Julle 6 Pcs, Daisy and
  // Saniya 6 Pcs aren't offered in the 105-110 band on the sheet (shown as
  // "-"), so those only list the 75-90 / 95-100 sizes.
  { name: 'Jasmine', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Green', 'White', 'Black', 'Skin', 'Royal Blue', 'Sky Blue', 'Navy Blue', 'Light Green', 'Red', 'Yellow Green', 'Dark Pink', 'Baby Pink', 'Maroon', 'Jomatto', 'Violet', 'Purple', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [119, 131], price: 119, discount: 0, image: '/images/products/women/slips/colors/jasmine/jasmine-Dark Green.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-Dark Green-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/jasmine/jasmine-white.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/jasmine/jasmine-skin.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/jasmine/jasmine-black.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-black-back.jpg' },
      'Royal Blue': { image: '/images/products/women/slips/colors/jasmine/jasmine-royal-blue.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-royal-blue-back.jpg' },
      'Sky Blue':   { image: '/images/products/women/slips/colors/jasmine/jasmine-Sky Blue.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-Sky Blue-back.jpg' },
      'Navy Blue':  { image: '/images/products/women/slips/colors/jasmine/jasmine-navy-blue.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-navy-blue-back.jpg' },
      'Dark Green': { image: '/images/products/women/slips/colors/jasmine/jasmine-Dark Green.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-Dark Green-back.jpg' },
      'Light Green':{ image: '/images/products/women/slips/colors/jasmine/jasmine-light-green.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-light-green-back.jpg' },
      'Yellow Green':{ image: '/images/products/women/slips/colors/jasmine/jasmine-yellow-green.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-yellow-green-back.jpg' },
      'Dark Pink':  { image: '/images/products/women/slips/colors/jasmine/jasmine-dark-pink.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-dark-pink-back.jpg' },
      'Baby Pink':  { image: '/images/products/women/slips/colors/jasmine/jasmine-baby-pink.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-baby-pink-back.jpg' },
      Red:          { image: '/images/products/women/slips/colors/jasmine/jasmine-red.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-red-back.jpg' },
      Maroon:       { image: '/images/products/women/slips/colors/jasmine/jasmine-maroon.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-maroon-back.jpg' },
      Jomatto:      { image: '/images/products/women/slips/colors/jasmine/jasmine-jomatto.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-jomatto-back.jpg' },
      Violet:       { image: '/images/products/women/slips/colors/jasmine/jasmine-violet.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-violet-back.jpg' },
      Purple:       { image: '/images/products/women/slips/colors/jasmine/jasmine-purple.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-purple-back.jpg' },
      Peach:        { image: '/images/products/women/slips/colors/jasmine/jasmine-peach.jpg', imageBack: '/images/products/women/slips/colors/jasmine/jasmine-peach-back.jpg' },
    },
  },
 { name: 'Kajol', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'White', 'Black', 'Skin', 'Royal Blue', 'Navy Blue', 'Dark Green', 'Light Green', 'Red', 'Yellow Green', 'Dark Pink', 'Baby Pink', 'Maroon', 'Jomatto', 'Violet', 'Purple', 'Peach'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [122, 135, 162], price: 122, discount: 0, image: '/images/products/women/slips/colors/kajol/kajol-Sky Blue.jpg', imageBack: '/images/products/women/slips/colors/kajol/Kajol-Sky Blue-back.jpg' ,
    colorImages: {
      White:        { image: '/images/products/women/slips/colors/kajol/kajol-white.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-white-back.jpg' },
      Black:        { image: '/images/products/women/slips/colors/kajol/kajol-black.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-black-back.jpg' },
      Skin:         { image: '/images/products/women/slips/colors/kajol/kajol-skin.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-skin-back.jpg' },
      'Royal Blue': { image: '/images/products/women/slips/colors/kajol/kajol-royal-blue.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-royal-blue-back.jpg' },
      'Sky Blue':   { image: '/images/products/women/slips/colors/kajol/kajol-Sky Blue.jpg', imageBack: '/images/products/women/slips/colors/kajol/Kajol-Sky Blue-back.jpg' },
      'Navy Blue':  { image: '/images/products/women/slips/colors/kajol/kajol-navy-blue.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-navy-blue-back.jpg' },
      'Dark Green': { image: '/images/products/women/slips/colors/kajol/kajol-dark-green.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-dark-green-back.jpg' },
      'Light Green':{ image: '/images/products/women/slips/colors/kajol/kajol-light-green.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-light-green-back.jpg' },
      'Yellow Green':{ image: '/images/products/women/slips/colors/kajol/kajol-yellow-green.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-yellow-green-back.jpg' },
      'Dark Pink':  { image: '/images/products/women/slips/colors/kajol/kajol-dark-pink.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-dark-pink-back.jpg' },
      'Baby Pink':  { image: '/images/products/women/slips/colors/kajol/kajol-baby-pink.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-baby-pink-back.jpg' },
      Red:          { image: '/images/products/women/slips/colors/kajol/kajol-red.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-red-back.jpg' },
      Maroon:       { image: '/images/products/women/slips/colors/kajol/kajol-maroon.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-maroon-back.jpg' },
      Jomatto:      { image: '/images/products/women/slips/colors/kajol/kajol-jomatto.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-jomatto-back.jpg' },
      Violet:       { image: '/images/products/women/slips/colors/kajol/kajol-violet.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-violet-back.jpg' },
      Purple:       { image: '/images/products/women/slips/colors/kajol/kajol-purple.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-purple-back.jpg' },
      Peach:        { image: '/images/products/women/slips/colors/kajol/kajol-peach.jpg', imageBack: '/images/products/women/slips/colors/kajol/kajol-peach-back.jpg' },
    },
  },
  { name: 'Julle', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'White', 'Skin', 'Black', 'Royal Blue', 'Sky Blue', 'Navy Blue', 'Dark Green', 'Light Green', 'Yellow Green', 'Dark Pink', 'Baby Pink', 'Maroon', 'Jomatto', 'Violet', 'Purple', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [184, 202], price: 184, discount: 0, image: '/images/products/women/slips/colors/julle/julle-Red.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-Red-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/julle/julle-white.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/julle/julle-skin.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/julle/julle-black.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-black-back.jpg' },
      'Royal Blue': { image: '/images/products/women/slips/colors/julle/julle-royal-blue.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-royal-blue-back.jpg' },
      'Sky Blue':   { image: '/images/products/women/slips/colors/julle/julle-Sky Blue.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-Sky Blue-back.jpg' },
      'Navy Blue':  { image: '/images/products/women/slips/colors/julle/julle-navy-blue.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-navy-blue-back.jpg' },
      'Dark Green': { image: '/images/products/women/slips/colors/julle/julle-dark-green.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-dark-green-back.jpg' },
      'Light Green':{ image: '/images/products/women/slips/colors/julle/julle-light-green.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-light-green-back.jpg' },
      'Yellow Green':{ image: '/images/products/women/slips/colors/julle/julle-yellow-green.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-yellow-green-back.jpg' },
      'Dark Pink':  { image: '/images/products/women/slips/colors/julle/julle-dark-pink.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-dark-pink-back.jpg' },
      'Baby Pink':  { image: '/images/products/women/slips/colors/julle/julle-baby-pink.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-baby-pink-back.jpg' },
      Red: { image: '/images/products/women/slips/colors/julle/julle-Red.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-Red-back.jpg' },
      Maroon:{ image: '/images/products/women/slips/colors/julle/julle-maroon.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-maroon-back.jpg' },
      Jomatto:{ image: '/images/products/women/slips/colors/julle/julle-jomatto.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-jomatto-back.jpg' },
      Violet:{ image: '/images/products/women/slips/colors/julle/julle-violet.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-violet-back.jpg' },
      Purple:{ image: '/images/products/women/slips/colors/julle/julle-purple.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-purple-back.jpg' },
      Peach:{ image: '/images/products/women/slips/colors/julle/julle-peach.jpg', imageBack: '/images/products/women/slips/colors/julle/julle-peach-back.jpg' },
    },
  },
  { name: 'Lamis', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Baby Pink', 'White', 'Skin', 'Black', 'Royal Blue', 'Sky Blue', 'Navy Blue', 'Dark Green', 'Light Green', 'Yellow Green', 'Dark Pink', 'Red',  'Maroon', 'Jomatto', 'Violet', 'Purple', 'Peach'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [158, 173], price: 158, discount: 0, image: '/images/products/women/slips/colors/lamis/lamis-Baby Pink.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-Baby Pink-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/lamis/lamis-white.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/lamis/lamis-skin.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/lamis/lamis-black.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-black-back.jpg' },
      'Royal Blue': { image: '/images/products/women/slips/colors/lamis/lamis-royal-blue.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-royal-blue-back.jpg' },
      'Sky Blue':   { image: '/images/products/women/slips/colors/lamis/lamis-Sky Blue.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-Sky Blue-back.jpg' },
      'Navy Blue':  { image: '/images/products/women/slips/colors/lamis/lamis-navy-blue.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-navy-blue-back.jpg' },
      'Dark Green': { image: '/images/products/women/slips/colors/lamis/lamis-dark-green.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-dark-green-back.jpg' },
      'Light Green':{ image: '/images/products/women/slips/colors/lamis/lamis-light-green.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-light-green-back.jpg' },
      'Yellow Green':{ image: '/images/products/women/slips/colors/lamis/lamis-yellow-green.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-yellow-green-back.jpg' },
      'Dark Pink':  { image: '/images/products/women/slips/colors/lamis/lamis-dark-pink.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-dark-pink-back.jpg' },
      'Baby Pink': { image: '/images/products/women/slips/colors/lamis/lamis-Baby Pink.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-Baby Pink-back.jpg' },
      Red: { image: '/images/products/women/slips/colors/lamis/lamis-Red.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-Red-back.jpg' },
      Maroon:{ image: '/images/products/women/slips/colors/lamis/lamis-maroon.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-maroon-back.jpg' },
      Jomatto:{ image: '/images/products/women/slips/colors/lamis/lamis-jomatto.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-jomatto-back.jpg' },
      Violet:{ image: '/images/products/women/slips/colors/lamis/lamis-violet.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-violet-back.jpg' },
      Purple:{ image: '/images/products/women/slips/colors/lamis/lamis-purple.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-purple-back.jpg' },
      Peach:{ image: '/images/products/women/slips/colors/lamis/lamis-peach.jpg', imageBack: '/images/products/women/slips/colors/lamis/lamis-peach-back.jpg' },
    },
  },
  { name: 'Breeze', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Skin', 'Black', 'White', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [122, 135], price: 122, discount: 0, image: '/images/products/women/slips/colors/breeze/breeze-Skin.jpg', imageBack: '/images/products/women/slips/colors/breeze/breeze-Skin-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/breeze/breeze-white.jpg', imageBack: '/images/products/women/slips/colors/breeze/breeze-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/breeze/breeze-Skin.jpg', imageBack: '/images/products/women/slips/colors/breeze/breeze-Skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/breeze/breeze-black.jpg', imageBack: '/images/products/women/slips/colors/breeze/breeze-black-back.jpg' },
    },
  },
  { name: 'Lily', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'White', 'Skin', 'Black', 'Olive', 'Pink'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [126, 139, 166], price: 126, discount: 0, image: '/images/products/women/slips/lily.jpg', imageBack: '/images/products/women/slips/lily-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/lily/lily-white.jpg', imageBack: '/images/products/women/slips/colors/lily/lily-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/lily/lily-skin.jpg', imageBack: '/images/products/women/slips/colors/lily/lily-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/lily/lily-black.jpg', imageBack: '/images/products/women/slips/colors/lily/lily-black-back.jpg' },
      Red: { image: '/images/products/women/slips/colors/lily/lily-Red.jpg', imageBack: '/images/products/women/slips/colors/lily/lily-Red-back.jpg' },
      Olive: { image: '/images/products/women/slips/lily.jpg', imageBack: '/images/products/women/slips/lily-back.jpg' },
    },
  },
  { name: 'Daisy', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Skin', 'White', 'Pink', 'Beige'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [155, 167], price: 155, discount: 0, image: '/images/products/women/slips/daisy.jpg', imageBack: '/images/products/women/slips/daisy-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/daisy/daisy-white.jpg', imageBack: '/images/products/women/slips/colors/daisy/daisy-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/daisy/daisy-skin.jpg', imageBack: '/images/products/women/slips/colors/daisy/daisy-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/daisy.jpg', imageBack: '/images/products/women/slips/daisy-back.jpg' },
    },
  },
  { name: 'Saniya', fabric: 'Cotton Hosiery',  menuParent: 'Slips', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Skin', 'White', 'Black'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [212, 230], price: 212, discount: 0, image: '/images/products/women/slips/saniya.jpg', imageBack: '/images/products/women/slips/saniya-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/women/slips/colors/saniya/saniya-white.jpg', imageBack: '/images/products/women/slips/colors/saniya/saniya-white-back.jpg' },
      Skin:  { image: '/images/products/women/slips/colors/saniya/saniya-skin.jpg', imageBack: '/images/products/women/slips/colors/saniya/saniya-skin-back.jpg' },
      Black: { image: '/images/products/women/slips/colors/saniya/saniya-black.jpg', imageBack: '/images/products/women/slips/colors/saniya/saniya-black-back.jpg' },
    },
  },
  { name: 'Leo IE Print', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PlumPurple', 'Navy', 'Brown', 'Black', 'CoffeeBrown', 'Raspberry Purple', 'Wine', 'Royal Blue', 'Dark Green', 'Light Lavender', 'Pink', 'Dark Pink', 'Blue', 'Red'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [113, 126], price: 113, discount: 0, image: '/images/products/women/panties/Leo IE Print/Leo IE Print-PlumPurple.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-PlumPurple-back.jpg' ,
    colorImages: {
      PlumPurple: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-PlumPurple.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-PlumPurple-back.jpg' },
      Navy: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Navy.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Navy-back.jpg' },
      Brown: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Brown.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Brown-back.jpg' },
      Black:  { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Black.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Black-back.jpg' },
      CoffeeBrown: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-CoffeeBrown.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-CoffeeBrown-back.jpg' },
      'Raspberry Purple': { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Raspberry Purple.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Raspberry Purple-back.jpg' },
      Wine: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Wine.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Wine-back.jpg' },
      'Royal Blue': { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Royal Blue.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Royal Blue-back.jpg' },
      'Dark Green': { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Dark Green.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Dark Green-back.jpg' },
      'Light Lavender': { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Light Lavender.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Light Lavender-back.jpg' },
      Pink: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Pink.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Pink-back.jpg' },
      'Dark Pink': { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Dark Pink.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Dark Pink-back.jpg' },
      Blue: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Blue.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Blue-back.jpg' },
      Red: { image: '/images/products/women/panties/Leo IE Print/Leo IE Print-Red.jpg', imageBack: '/images/products/women/panties/Leo IE Print/Leo IE Print-Red-back.jpg' },
    },
   },
  { name: 'Leo IE Plain', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Green', 'Brown', 'Black', 'Coral Pink', 'PlumPurple', 'Dark Green', 'Red', 'Dark Pink', 'Purple', 'Blue'], sizes: ['75-90', '95-100'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100']], sizePrices: [103, 113], price: 103, discount: 0, image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Green.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Green-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Brown.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Brown-back.jpg' },
      Green: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Green.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Green-back.jpg' },
      Black: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Black.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Black -back.jpg' },
      'Coral Pink': { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Coral Pink.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Coral Pink-back.jpg' },
      PlumPurple: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-PlumPurple.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-PlumPurple-back.jpg' },
      'Dark Green': { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Dark Green.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Dark Green-back.jpg' },
      Red: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Red.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Red-back.jpg' },
      'Dark Pink': { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Dark Pink.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Dark Pink-back.jpg' },
      Purple: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Purple.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Purple-back.jpg' },
      Blue: { image: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Blue.jpg', imageBack: '/images/products/women/panties/Leo IE Plain/Leo IE Plain-Blue-back.jpg' },
    },
   },
  { name: 'Lady Care Print O.E', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Blue', 'Grey', 'Red', 'Pink', 'Wine', 'Brown', 'Black', 'Purple', 'Dark Forest Green', 'CherryRed', 'PastelLavender', 'Dark Green'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [92, 99, 110], price: 92, discount: 0, image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Light Blue.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Light Blue-back.jpg' ,
    colorImages:{
     'Light Blue': { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Light Blue.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Light Blue-back.jpg' },
     Red: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Red.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Red-back.jpg' },
     Grey: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Grey.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Grey-back.jpg' },
     Pink: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Pink.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Pink-back.jpg' },
     Wine: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Wine.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Wine-back.jpg' },
     Brown: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Brown.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Brown-back.jpg' },
     Black: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Black.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Black-back.jpg' },
     Purple: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Purple.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Purple-back.jpg' },
     'Dark Forest Green': { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Dark Forest Green.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Dark Forest Green-back.jpg' },
     CherryRed: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-CherryRed.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-CherryRed-back.jpg' },
     PastelLavender: { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-PastelLavender.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-PastelLavender-back.jpg' },
     'Dark Green': { image: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Dark Green.jpg', imageBack: '/images/products/women/panties/Lady Care Print O.E/Lady Care Print O.E-Dark Green-back.jpg' },
    },
   },
  { name: 'Lady Care Plain O.E', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Violet', 'Dark Green', 'Light Lavender', 'Wine', 'Blue', 'Coral', 'Brown', 'Red', 'Light Blue', 'Black', 'Green', 'Royal Blue'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [81, 88, 99], price: 81, discount: 0, image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Violet.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Violet-back.jpg'  ,
     colorImages:{
      Violet: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Violet.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Violet-back.jpg' },
      'Dark Green': { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Dark Green.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Dark Green-back.jpg' },
      'Light Lavender': { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Light Lavender.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Light Lavender-back.jpg' },
      Wine: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Wine.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Wine-back.jpg' },
      Blue: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Blue.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Blue-back.jpg' },
      Coral: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Coral.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Coral-back.jpg' }, 
      Brown: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Brown.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Brown-back.jpg' },
      Red: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Red.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Red-back.jpg' },
      'Light Blue': { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Light Blue.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Light Blue-back.jpg' },
      Black: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Black.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Black-back.jpg' },
      Green: { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Green.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Green-back.jpg' },
      'Royal Blue': { image: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Royal Blue.jpg', imageBack: '/images/products/women/panties/Lady Care Plain O.E/Lady Care Plain O.E-Royal Blue-back.jpg' },
    },
   },
  { name: 'Lotus I.E', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Coral Pink', 'Violet', 'Maroon', 'Dark Green', 'Black', 'Sky Blue', 'Royal Blue', 'Dark Pink', 'Light Lavender', 'Red'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [71, 78, 89], price: 71, discount: 0, image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Coral Pink.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Coral Pink-back.jpg'  ,
    colorImages:{
      Violet: { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Violet.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Violet-back.jpg' },
      Maroon: { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Maroon.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Maroon-back.jpg' },  
      'Dark Green': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Dark Green.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Dark Green-back.jpg' },  
      Black: { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Black.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Black-back.jpg' },  
      'Sky Blue': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Sky Blue.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Sky Blue-back.jpg' },  
      'Royal Blue': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Royal Blue.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Royal Blue-back.jpg' },  
      'Dark Pink': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Dark Pink.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Dark Pink-back.jpg' },  
      'Light Lavender': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Light Lavender.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Light Lavender-back.jpg' },  
      Red: { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Red.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Red-back.jpg' },  
      'Coral Pink': { image: '/images/products/women/panties/Lotus I.E/Lotus I.E-Coral Pink.jpg', imageBack: '/images/products/women/panties/Lotus I.E/Lotus I.E-Coral Pink-back.jpg' },  
    },
   },
  { name: 'Lotus O.E', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Lavender', 'Violet', 'Coral Pink', 'Maroon', 'Dark Green', 'Black', 'Royal Blue', 'Navy Blue', 'Dark Pink', 'Red'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [81, 88, 99], price: 81, discount: 0, image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Light Lavender.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Light Lavender-back.jpg' ,
    colorImages:{
      Violet: { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Violet.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Violet-back.jpg' },
      Maroon: { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Maroon.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Maroon-back.jpg' },  
      'Dark Green': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Dark Green.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Dark Green-back.jpg' },  
      Black: { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Black.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Black-back.jpg' },  
      'Royal Blue': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Royal Blue.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Royal Blue-back.jpg' },  
      'Navy Blue': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Navy Blue.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Navy Blue-back.jpg' },  
      'Dark Pink': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Dark Pink.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Dark Pink-back.jpg' },  
      'Light Lavender': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Light Lavender.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Light Lavender-back.jpg' },  
      Red: { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Red.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Red-back.jpg' },  
      'Coral Pink': { image: '/images/products/women/panties/Lotus O.E/Lotus O.E-Coral Pink.jpg', imageBack: '/images/products/women/panties/Lotus O.E/Lotus O.E-Coral Pink-back.jpg' },  
    },
   },
  { name: 'Lovely I.E Print', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Pink', 'Dark Blue',  'Black', 'Maroon', 'Dark Forest Green', 'Brown', 'Blue', 'Hex', 'Jomatto', 'Green', 'PlumPurple', 'Purple', 'Raspberry Purple', 'Violet'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [83, 90, 101], price: 83, discount: 0, image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Pink.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Pink-back.jpg' ,
    colorImages:{
      'Dark Pink': { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Pink.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Pink-back.jpg' },
      Black: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Black.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Black-back.jpg' },
      Maroon: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Maroon.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Maroon-back.jpg' },
      'Dark Forest Green': { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Forest Green.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Forest Green-back.jpg' },
      'Dark Blue': { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Blue.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Dark Blue-back.jpg' },
      Brown: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Brown.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Brown-back.jpg' },
      Blue: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Blue.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Blue-back.jpg' },
      Hex: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Hex.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Hex-back.jpg' },
      'Jomatto': { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Jomatto.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Jomatto-back.jpg' },
      Green: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Green.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Green-back.jpg' },
      PlumPurple: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-PlumPurple.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-PlumPurple-back.jpg' },
      Purple: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Purple.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Purple-back.jpg' },
      'Raspberry Purple': { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Raspberry Purple.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Raspberry Purple-back.jpg' },
      Violet: { image: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Violet.jpg', imageBack: '/images/products/women/panties/Lovely I.E Print/Lovely I.E Print-Violet-back.jpg' },
    },
   },
  { name: 'Lovely O.E Print', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Blue', 'Violet', 'Dark Forest Green', 'Dark Pink', 'PlumPurple', 'Dark Slate Blue', 'Brown', 'Maroon', 'Purple', 'PeacockBlue', 'CherryRed'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [92, 99, 110], price: 92, discount: 0, image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Blue.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Blue-back.jpg'  ,   
    colorImages:{
      Blue: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Blue.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Blue-back.jpg' },
      Violet: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Violet.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Violet-back.jpg' },
      'Dark Forest Green': { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Forest Green.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Forest Green-back.jpg' },
      'Dark Pink': { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Pink.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Pink-back.jpg' },
      PlumPurple: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-PlumPurple.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-PlumPurple-back.jpg' },
      'Dark Slate Blue': { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Slate Blue.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Dark Slate Blue-back.jpg' },  
      DustyLavender: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-DustyLavender.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-DustyLavender-back.jpg' },
      Brown: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Brown.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Brown-back.jpg' },
      Maroon: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Maroon.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Maroon-back.jpg' },
      Purple: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Purple.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-Purple-back.jpg' },
      PeacockBlue: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-PeacockBlue.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-PeacockBlue-back.jpg' },
      CherryRed: { image: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-CherryRed.jpg', imageBack: '/images/products/women/panties/Lovely O.E Print/Lovely O.E Print-CherryRed-back.jpg' },
    },
   },
  { name: 'Aster IE Print', fabric: 'Cotton Hosiery',  menuParent: 'Panties', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Pink', 'Red', 'Brown', 'Black', 'Wine', 'Navy', 'EmeraldGreen', 'CherryRed', 'PlumPurple', 'Maroon', 'Blue', 'Dark Forest Green'], sizes: ['75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['75-90'], ['95-100'], ['105-110']], sizePrices: [85, 92, 103], price: 85, discount: 0, image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Light Pink.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Light Pink-back.jpg' ,
     colorImages:{
     'Light Pink': { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Light Pink.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Light Pink-back.jpg' },
     Brown: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Brown.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Brown-back.jpg' },
     Red: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Red.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Red-back.jpg' },
     Black: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Black.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Black-back.jpg' },
     Wine: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Wine.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Wine-back.jpg' },
     Navy: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Navy.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Navy-back.jpg' },
     EmeraldGreen: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-EmeraldGreen.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-EmeraldGreen-back.jpg' },   
     CherryRed: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-CherryRed.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-CherryRed-back.jpg' },
     PlumPurple: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-PlumPurple.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-PlumPurple-back.jpg' },
     Maroon: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Maroon.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Maroon-back.jpg' },
     Blue: { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Blue.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Blue-back.jpg' },
     'Dark Forest Green': { image: '/images/products/women/panties/Aster IE Print/Aster IE Print-Dark Forest Green.jpg', imageBack: '/images/products/women/panties/Aster IE Print/Aster IE Print-Dark Forest Green-back.jpg' },
    },
  }, 

  // Tights note: the Tights section now carries only genuine tights
  // Tights note: the Tights section now carries only genuine tights
  // products (menuParent: 'Tights') — the shorts-style items that used to
  // sit alongside them (Shorts, Boyshort, Cotton Shorts, Seamless Shorts,
  // Lace Trim Shorts, High Waist Shorts) have been removed from this row.
  //
  // Tights — real models from the "TIGHTS PRICE LIST" wholesale sheet.
  // Sizes are chest/hip-measurement bands (cm), same pattern as Slips
  // above. Price shown on the site is the sheet's M.R.P column (not the
  // factory rate), no discount applied. WSB (White/Skin/Black) is now
  // three separate single-color products instead of one product with a
  // 3-color swatch, so each colorway gets its own product card; Colours
  // remains the assorted-shade option.
  { name: 'Tights White', fabric: 'Cotton Lycra',  label: 'Tights White', menuParent: 'Tights', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White'], sizes: ['50-55', '60-70', '75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-90'], ['95-100'], ['105-110']], sizePrices: [88, 99, 122, 133, 144], price: 88, discount: 0, image: '/images/products/women/tights/colors/tights-white.jpg', imageSide: '/images/products/women/tights/colors/tights-white-side.jpg', imageBack: '/images/products/women/tights/colors/tights-white-back.jpg' },
  { name: 'Tights Skin', fabric: 'Cotton Lycra',  label: 'Tights Skin', menuParent: 'Tights', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Skin'], sizes: ['50-55', '60-70', '75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-90'], ['95-100'], ['105-110']], sizePrices: [88, 99, 122, 133, 144], price: 88, discount: 0, image: '/images/products/women/tights/colors/tights-skin.jpg', imageSide: '/images/products/women/tights/colors/tights-skin-side.jpg', imageBack: '/images/products/women/tights/colors/tights-skin-back.jpg' },
  { name: 'Tights Black', fabric: 'Cotton Lycra',  label: 'Tights Black', menuParent: 'Tights', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black'], sizes: ['50-55', '60-70', '75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-90'], ['95-100'], ['105-110']], sizePrices: [88, 99, 122, 133, 144], price: 88, discount: 0, image: '/images/products/women/tights/colors/tights-black.jpg', imageSide: '/images/products/women/tights/colors/tights-black-side.jpg', imageBack: '/images/products/women/tights/colors/tights-black-back.jpg' },
  { name: 'Tights Colours', fabric: 'Cotton Lycra',  label: 'Tights Colours', menuParent: 'Tights', heading: 'Women Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Violet', 'Dark Pink', 'Dark Green', 'Navy', 'Sky Blue', 'Royal Blue', 'Red', 'Maroon', 'Jomatto', 'CoffeeBrown', 'Wine'], sizes: ['50-55', '60-70', '75-90', '95-100', '105-110'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-90'], ['95-100'], ['105-110']], sizePrices: [88, 99, 122, 133, 144], price: 88, discount: 0, image: '/images/products/women/tights/colors/tights-Violet.jpg', imageSide: '/images/products/women/tights/colors/tights-Violet-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Violet-back.jpg' ,
    // Same image folder shared with the Tights White/Skin/Black products above.
    colorImages: {
      Violet: { image: '/images/products/women/tights/colors/tights-Violet.jpg', imageSide: '/images/products/women/tights/colors/tights-Violet-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Violet-back.jpg' },
      'Dark Pink': { image: '/images/products/women/tights/colors/tights-Dark Pink.jpg', imageSide: '/images/products/women/tights/colors/tights-Dark Pink-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Dark Pink-back.jpg' },
      'Dark Green': { image: '/images/products/women/tights/colors/tights-Dark Green.jpg', imageSide: '/images/products/women/tights/colors/tights-Dark Green-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Dark Green-back.jpg' },
      Navy: { image: '/images/products/women/tights/colors/tights-Navy.jpg', imageSide: '/images/products/women/tights/colors/tights-Navy-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Navy-back.jpg' },
      'Sky Blue': { image: '/images/products/women/tights/colors/tights-Sky Blue.jpg', imageSide: '/images/products/women/tights/colors/tights-Sky Blue-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Sky Blue-back.jpg' },
      'Royal Blue': { image: '/images/products/women/tights/colors/tights-Royal Blue.jpg', imageSide: '/images/products/women/tights/colors/tights-Royal Blue-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Royal Blue-back.jpg' },    
      Red: { image: '/images/products/women/tights/colors/tights-Red.jpg', imageSide: '/images/products/women/tights/colors/tights-Red-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Red-back.jpg' },
      Maroon: { image: '/images/products/women/tights/colors/tights-Maroon.jpg', imageSide: '/images/products/women/tights/colors/tights-Maroon-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Maroon-back.jpg' },
      'Jomatto': { image: '/images/products/women/tights/colors/tights-Jomatto.jpg', imageSide: '/images/products/women/tights/colors/tights-Jomatto-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Jomatto-back.jpg' },
      CoffeeBrown: { image: '/images/products/women/tights/colors/tights-CoffeeBrown.jpg', imageSide: '/images/products/women/tights/colors/tights-CoffeeBrown-side.jpg', imageBack: '/images/products/women/tights/colors/tights-CoffeeBrown-back.jpg' },
      Wine: { image: '/images/products/women/tights/colors/tights-Wine.jpg', imageSide: '/images/products/women/tights/colors/tights-Wine-side.jpg', imageBack: '/images/products/women/tights/colors/tights-Wine-back.jpg' },
    },
  },
]

// Boys and Girls product names are prefixed with "Boys "/"Girls " so that
// items with the same on-screen label (e.g. "T-Shirts", "Disney & Marvel",
// "Hoodies") still resolve to distinct products per section — see utils/menu.js,
// which derives the nav structure live from this catalog.
const kidsBoysCatalog = [ 
  // Data sourced from V.S.S Textiles wholesale price list (Outer Wear).
  // Sizes are the manufacturer's size bands (not S/M/L); price shown on
  // the site is the MRP for each size band, with no discount applied.
  { name: 'Boys Print T-Shirt – Bison', fabric: 'Cotton', label: 'Bison', menuParent: 'T-Shirt', price: 285, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Cornflower Blue', 'OliveGreen', 'Wine', 'Dusty Rose', 'Brown'], sizes: ['45', '55', '65', '75'], sizePriceGroups: [['45'], ['55'], ['65'], ['75']], sizePrices: [285, 305, 325, 345], discount: 0, image: '/images/products/boys/tshirt/tshirt-bison-12.jpg',  imageBack: '/images/products/boys/tshirt/tshirt-bison-back.jpg' ,
    colorImages: {
      OliveGreen: { image: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-OliveGreen.jpg', imageBack: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-OliveGreen-back.jpg' },
      'Cornflower Blue': { image: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Cornflower Blue.jpg', imageBack: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Cornflower Blue-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Wine.jpg', imageBack: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Wine-back.jpg' },
      'Dusty Rose': { image: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Dusty Rose.jpg', imageBack: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Dusty Rose-back.jpg' },
      Brown: { image: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/bison/t-shirt-bison-Brown-back.jpg' },
    },
  },
  { name: 'Boys T-Shirt – Rado', fabric: 'Fancy', label: 'Rado', menuParent: 'T-Shirt', price: 198, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Aqua Mint', 'Coral Pink', 'Green', 'Wine', 'Navy', 'Grey'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [198, 198, 198, 218, 218, 218, 238, 258, 278], discount: 0, image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint-back.jpg' ,
    colorImages: {
      Green: { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-green.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-green-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-green-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Wine.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Wine-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Wine-back.jpg' },
      Navy: { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Navy.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Navy-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Navy-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Grey.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Grey-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Grey-back.jpg' },
      'Coral Pink': { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Coral Pink.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Coral Pink-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Coral Pink-back.jpg' },
      'Aqua Mint': { image: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint.jpg', imageSide: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint-side.jpg', imageBack: '/images/products/boys/tshirt/colors/rado/t-shirt-rado-Aqua-Mint-back.jpg' },
    },
   },
  // New product — no dedicated photo yet, so it falls back to a
  // placeholder image on the site until a real one is added. Drop the
  // real photos in public/images/products/boys/tshirt/ (e.g.
  // t-shirt-hero.jpg / -side.jpg / -back.jpg) and update the three image
  // paths below to match.
  { name: 'Boys T-Shirt – Hero', fabric: 'Cotton', label: 'Hero', menuParent: 'T-Shirt', price: 220, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Black', 'Brown', 'BlushPink', 'Grey', 'PeacockBlue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [220, 220, 220, 240, 240, 240, 260, 280, 300], discount: 0, image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-wine.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
    colorImages: {
      Brown: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-Brown-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-Black-back.jpg' },
      BlushPink: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-BlushPink.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-BlushPink-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-grey.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-grey-back.jpg' },
      PeacockBlue: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-PeacockBlue.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-PeacockBlue-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/hero/t-shirt-bt-hero-wine-back.jpg' },
      },
   },
  { name: 'Boys T-Shirt – Leo', fabric: 'Tencil', label: 'Leo', menuParent: 'T-Shirt', price: 250, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'Blue', 'Black', 'White', 'Green'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [250, 250, 250, 270, 270, 270, 290, 310, 330], discount: 0, image: '/images/products/boys/tshirt/t-shirt-leo.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg' },
  { name: 'Boys Print T-Shirt – Surya', fabric: 'Fancy', label: 'Surya', menuParent: 'T-Shirt', price: 158, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy Blue', 'Taupe Grey', 'Wine', 'Black', 'Royal Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [158, 158, 158, 170, 170, 170, 194, 218, 242], discount: 0, image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Navy Blue.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Navy Blue-back.jpg' ,
    colorImages: {
      'Navy Blue': { image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Navy Blue.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Navy Blue-back.jpg' },
      'Royal Blue': { image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Royal Blue.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Royal Blue-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Black-back.jpg' },
      'Taupe Grey': { image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Taupe Grey.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-Taupe Grey-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/surya/t-shirt-bt-surya-wine-back.jpg' },
      },
   },
  { name: 'Boys Collar T-Shirt – BTC Jetly', fabric: 'Tencil', label: 'BTC Jetly', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dusty Rose', 'Brown', 'Black', 'dusty navy blue', 'Wine', 'Navy'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [310, 310, 310, 340, 340, 340, 370, 370, 400, 400], price: 310, discount: 0, image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Dusty Rose.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Dusty Rose-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Brown-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Black-back.jpg' },
      'dusty navy blue': { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-dusty navy blue.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-dusty navy blue-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Wine.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Wine-back.jpg' },
      'Dusty Rose': { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Dusty Rose.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Dusty Rose-back.jpg' },
      Navy: { image: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Navy.jpg', imageBack: '/images/products/boys/tshirt/colors/Jetly/t-shirt-Jetly-Navy-back.jpg' },
      },
   },
  { name: 'Boys Round Neck T-Shirt – Jawan', fabric: 'Cotton', label: 'Jawan', menuParent: 'T-Shirt', price: 220, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Navy Blue', 'Jomatto', 'EmeraldGreen', 'Yellow', 'Black'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [220, 220, 220, 244, 244, 244, 268, 292, 316], discount: 0, image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine-back.jpg' ,
    colorImages: {
      'Navy Blue': { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Navy Blue.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Navy Blue-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Navy Blue-back.jpg' },
      Jomatto: { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Jomatto.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Jomatto-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Jomatto-back.jpg' },
      EmeraldGreen: { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-EmeraldGreen.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-EmeraldGreen-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-EmeraldGreen-back.jpg' },
      Wine : { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Wine-back.jpg' },
      Yellow: { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Yellow.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Yellow-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Yellow-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Black.jpg', imageSide: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Black-side.jpg', imageBack: '/images/products/boys/tshirt/colors/jawan/t-shirt-jawan-Black-back.jpg' },
    }
   },
  { name: 'Boys Round Neck T-Shirt – Royal', fabric: 'Cotton', label: 'Royal', menuParent: 'T-Shirt', price: 174, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Black', 'Grey', 'Blue', 'Red'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [174, 174, 174, 186, 186, 186, 210, 234, 258], discount: 0, image: '/images/products/boys/tshirt/t-shirt-royal.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg' },
  { name: 'Boys Round Neck Full Hand T-Shirt – Vijay', fabric: 'Fancy', label: 'Vijay', menuParent: 'T-Shirt', price: 244, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Pink', 'Peach', 'Aqua Mint', 'Dark Green', 'Grey', 'Rust Orange'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [244, 244, 244, 264, 264, 264, 284, 304, 324], discount: 0, image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink-back.jpg' ,
    colorImages: {
      'Dark Green': { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Green.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Green-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Green-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Grey.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Grey-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Grey-back.jpg' },
      Peach: { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Peach.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Peach-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Peach-back.jpg' },
      'Aqua Mint': { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Aqua-Mint.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Aqua-Mint-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Aqua-Mint-back.jpg' },
      'Dark Pink': { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Dark Pink-back.jpg' },
      'Rust Orange': { image: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Rust Orange.jpg', imageSide: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Rust Orange-side.jpg', imageBack: '/images/products/boys/tshirt/colors/vijay/t-shirt-vijay-Rust Orange-back.jpg' },
    }
   },
  { name: 'Kids Five Sleeve T-Shirt – Jackson', fabric: 'Tencil', label: 'Jackson', menuParent: 'T-Shirt', price: 290, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['PastelLavender', 'Black', 'DustyLavender', 'Navy', 'PowderBlue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [290, 290, 290, 320, 320, 320, 350, 380, 410], discount: 0, image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PastelLavender.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PastelLavender-back.jpg' ,
    colorImages: {
      PastelLavender: { image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PastelLavender.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PastelLavender-back.jpg' },
      Navy: { image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-Navy.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-Navy-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-Black-back.jpg' },
      PowderBlue: { image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PowderBlue.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-PowderBlue-back.jpg' },
      DustyLavender: { image: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-DustyLavender.jpg', imageBack: '/images/products/boys/tshirt/colors/jackson/t-shirt-jackson-DustyLavender-back.jpg' },
    },
  },
  { name: 'Boys Full Hand T-Shirt – Venus', fabric: 'Cotton', label: 'Venus', menuParent: 'T-Shirt', price: 210, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Grey', 'Black', 'Blue', 'Maroon'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [210, 210, 210, 230, 230, 230, 250, 270, 290], discount: 0, image: '/images/products/boys/tshirt/t-shirt-venus.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg' },
  { name: 'Boys T-Shirt – Rio Set (5 Pcs)', fabric: 'Cotton', label: 'Rio Set (5 Pcs)', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Lavender', 'Grey', 'Checked', 'Aqua Mint'], sizes: ['45', '55', '65', '75', '80', '85'], sizePriceGroups: [['45'], ['55'], ['65'], ['75'], ['80'], ['85']], sizePrices: [120, 130, 140, 150, 160, 170], price: 120, discount: 0, image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Brown.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Brown.jpg' },
      Lavender: { image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Lavender.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Lavender.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-grey.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-grey.jpg' },
      Checked: { image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Checked.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-Checked.jpg' },
      'Aqua Mint': { image: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-aquamint.jpg', imageBack: '/images/products/boys/tshirt/colors/Rio/t-shirt-bt-Rio-aquamint.jpg' },
      },
   },
   { name: 'Boys Print T-Shirt – Jony', fabric: 'Cotton', label: 'Jony', menuParent: 'T-Shirt', price: 295, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'DustyLavender', 'Brown', 'Wine', 'Black'], sizes: ['45', '55', '65', '75', '80'], sizePriceGroups: [['45'], ['55'], ['65'], ['75'], ['80']], sizePrices: [295, 315, 335, 355, 375], discount: 0, image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Navy.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Navy-back.jpg' ,
    colorImages: {
      DustyLavender: { image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-DustyLavender.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-DustyLavender-back.jpg' },
      Navy: { image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Navy.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Navy-back.jpg' },
      Brown: { image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Brown.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Brown-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Wine.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Wine-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/Jony/t-shirt-bt-Jony-Black-back.jpg' },
      },
    },

  { name: 'Boys Round Neck T-Shirt – BT-206 RNS', fabric: 'Fancy', label: 'BT-206 RNS', menuParent: 'T-Shirt', price: 310, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Black', 'Print', 'Cream', 'PowderBlue', 'Steel Blue'], sizes: ['45', '55', '65', '75', '80', '85'], sizePriceGroups: [['45'], ['55'], ['65'], ['75'], ['80'], ['85']], sizePrices: [310, 330, 350, 370, 390, 410], discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-wine.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
     colorImages: {
      Print: { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-Print.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-Print-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-wine-back.jpg' },
      PowderBlue: { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-PowderBlue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-PowderBlue-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-black-back.jpg' },
      Cream: { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-Cream.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-Cream-back.jpg' },
      'Steel Blue': { image: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-steelblue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-206/t-shirt-bt-206-steelblue-back.jpg' },
    },
   },
  { name: 'Boys Round Neck T-Shirt – BT-208 RNS', fabric: 'Fancy', label: 'BT-208 RNS', menuParent: 'T-Shirt', price: 320, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Dark Slate Blue', 'Taupe Grey', 'Grey', 'Wine', 'Green'], sizes: ['45', '55', '65', '75', '80', '85'], sizePriceGroups: [['45'], ['55'], ['65'], ['75'], ['80'], ['85']], sizePrices: [320, 340, 360, 380, 400, 420], discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-darkslateblue.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
      colorImages: {
      'Taupe Grey': { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-taupegrey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-taupegrey-back.jpg' },
      Olive: { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Olive.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Olive-back.jpg' },
      'Dark Slate Blue': { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-darkslateblue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-darkslateblue-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Grey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Grey-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Black-back.jpg' },
      Green: { image: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Green.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-208/t-shirt-bt-208-Green-back.jpg' },
    },
   },
  { name: 'Boys Round Neck T-Shirt – BT-209 RNS', fabric: 'Fancy', label: 'BT-209 RNS', menuParent: 'T-Shirt', price: 300, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Blue', 'Checked', 'Khaki', 'charcoal gray', 'Olive', 'PowderBlue','DustyLavender'], sizes: ['45', '55', '65', '75', '80', '85'], sizePriceGroups: [['45'], ['55'], ['65'], ['75'], ['80'], ['85']], sizePrices: [300, 320, 340, 360, 380, 400], discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-CharcolGrey.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
    colorImages: {
      Khaki: { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Khaki.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Khaki-back.jpg' },
      Olive: { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Olive.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Olive-back.jpg' },
      Checked: { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Checked.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-Checked-back.jpg' },
     'charcoal gray': { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-CharcolGrey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-CharcolGrey-back.jpg' },
      'Light Blue': { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-lightblue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-lightblue-back.jpg' },
      PowderBlue: { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-PowderBlue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-PowderBlue-back.jpg' },
      DustyLavender: { image: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-DustyLavender.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-209/t-shirt-bt-209-DustyLavender-back.jpg' },
    },
   },
    // only carries 3 sizes.
  { name: 'Boys T-Shirt – BT-211', fabric: 'Fancy', label: 'BT-211', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['light peach pink', 'Wine','Steel Blue', 'PlumPurple', 'Dusty Sage Green'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [136, 136, 136, 148, 148, 148, 160, 172, 184], price: 136, discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-lihtpeachpink.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
    colorImages: {
      'light peach pink': { image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-lihtpeachpink.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-lihtpeachpink-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-wine-back.jpg' },
      PlumPurple: { image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-lavender.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-lavender-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-dustysagegreen.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-dustysagegreen-back.jpg' },
      'Steel Blue': { image: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-steelblue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-211/t-shirt-bt-211-steelblue-back.jpg' },
    },
   },
  { name: 'Boys T-Shirt – BT-212', fabric: 'Fancy', label: 'BT-212', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Black', 'OliveGreen', 'charcoal gray', 'Brown', 'Warm Cinnamon Brown'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [156, 156, 156, 168, 168, 168, 180, 192, 204], price: 156, discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-warmbrown.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
    colorImages: {
      OliveGreen: { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-olivegreen.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-olivegreen-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-wine-back.jpg' },
      Brown: { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-brown.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-brown-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-black-back.jpg' },
      'charcoal gray': { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-charcolgrey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-charcolgrey-back.jpg' },
      'Warm Cinnamon Brown': { image: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-warmbrown.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-212/t-shirt-bt-212-warmbrown-back.jpg' },
    },
   },
  { name: 'Boys T-Shirt – BT-214', fabric: 'JACQUARD', label: 'BT-214', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'OliveGreen', 'Wine','Grey','Black'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [156, 156, 156, 168, 168, 168, 180, 192, 204], price: 156, discount: 0, image: '/images/products/boys/tshirt/t-shirt-bt-214.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg',
    colorImages: {
      OliveGreen: { image: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-olivegeen.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-olivegeen-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-wine-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-grey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-grey-back.jpg' },
      Brown: { image: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-brown.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-brown-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-214/t-shirt-bt-214-Black-back.jpg' },
    },
   },
  { name: 'Boys T-Shirt – BTC-213 RNS', fabric: 'Fancy', label: 'BTC-213 RNS', menuParent: 'T-Shirt', price: 360, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Black', 'Grey', 'Steel Blue', 'OliveGreen','Beige'], sizes: ['45', '55', '65', '75'], sizePriceGroups: [['45'], ['55'], ['65'], ['75']], sizePrices: [360, 380, 400, 420], discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-grey.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg',
    colorImages: {
      OliveGreen: { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-olivegeen.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-olivegeen-back.jpg' },
      Wine: { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-wine.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-wine-back.jpg' },
      Grey: { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-grey.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-grey-back.jpg' },
      Black: { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-Black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-Black-back.jpg' },
      'Steel Blue': { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-steelblue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-steelblue-back.jpg' },
      Beige: { image: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-Beige.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-213/t-shirt-bt-213-Beige-back.jpg' },
    },
   }, 
  // "BOYS T SHIRT RNS" wholesale sheet — a separate, lower-priced batch
  // that happens to reuse some of the same model numbers as the BT-2xx
  // RNS items above (e.g. BT-211/BT-212/BT-214), just from a different
  // rate card. Kept as distinct catalog entries rather than overwriting
  // the existing ones, same 45-55/60-70/75/80/85 size run. BT-213 has no
  // wholesale/MRP rate for 80 or 85 on the sheet (shown as "-"), so it
  
  { name: 'Boys T-Shirt – BTC-215', fabric: 'Fancy', label: 'BTC-215', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: [ 'Khaki', 'Steel Blue' , 'Light Pink' , 'Black','Dusty Sage Green','Red'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [210, 210, 210, 230, 230, 230, 250, 270, 290], price: 210, discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-khaki.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg',
    colorImages: {
      'Light Pink': { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-pink.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-pink-back.jpg' },
      Black : { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-black-back.jpg' },
      Khaki: { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-khaki.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-khaki-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Dusty Sage Green.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Dusty Sage Green-back.jpg' },
      'Steel Blue': { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Steel Blue.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Steel Blue-back.jpg' },
      Red : { image: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Red.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-215/t-shirt-215-Red-back.jpg' },
    },
   },
  // Second "BOYS T-SHIRT RNS" sheet — uses the 4 cm size bands
  // (45-55/60-70/75-80/85-90) like the Girls GT-501 batch, rather than
  // the plain 5-size run just above. "BTC" = collar-style tee (matches
  // the existing "Boys Collar T-Shirt – Rahul" naming); "BT" = regular
  // tee. Some codes (BT-206 through BT-210, "Jony") already exist above
  // under different names/prices from other sheets — kept as separate
  // entries rather than merged, same as the BT-211/212/214 batch. BT
  // Jony has no wholesale/MRP rate for 85-90 on the sheet ("-"), so it
  // only carries 3 sizes.
  { name: 'Boys Collar T-Shirt – BTC-216', fabric: 'Fancy', label: 'BTC-216', menuParent: 'T-Shirt', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Print' ,'Dusty Sage Green', 'Red', 'Black','Navy','Lavender'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [240, 240, 240, 260, 260, 260, 280, 280, 300, 300], price: 240, discount: 0, image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-print.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg',
    colorImages: {
      Red: { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-red.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-red-back.jpg' },
      Black : { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-black.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-black-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Dusty Sage Green.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Dusty Sage Green-back.jpg' },
      Navy : { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Navy.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Navy-back.jpg' },
      Lavender : { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Lavender.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-Lavender-back.jpg' },
      Print : { image: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-print.jpg', imageBack: '/images/products/boys/tshirt/colors/tshirt-216/t-shirt-216-print-back.jpg' },
    },
   },

  { name: 'Boys Summer Shorts – Jack', fabric: 'Cotton', label: 'Jack', menuParent: 'Shorts', price: 138, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Purple', 'Beige', 'Black', 'Olive', 'Navy', 'PlumPurple',  'CherryRed', 'EmeraldGreen', 'Red', 'CoffeeBrown'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [138, 138, 138, 150, 150, 150, 162, 178, 194], discount: 0,  image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Purple.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Purple-back.jpg' ,
    colorImages: {
      Red: { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-red.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-red-back.jpg' },
      Black : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-black.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-black-back.jpg' },
      Olive: { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Olive.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Olive-back.jpg' },
      Navy : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Navy.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Navy-back.jpg' },
      Beige : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Beige.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Beige-back.jpg' },
      Purple : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Purple.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-Purple-back.jpg' },
      PlumPurple : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-PlumPurple.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-PlumPurple-back.jpg' },
      CherryRed : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-CherryRed.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-CherryRed-back.jpg' },
      EmeraldGreen : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-EmeraldGreen.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-EmeraldGreen-back.jpg' },
      CoffeeBrown : { image: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-CoffeeBrown.jpg', imageBack: '/images/products/boys/shorts/colors/Jack/Boys Summer Shorts-Jack-CoffeeBrown-back.jpg' },
    },
  },
  // "KIDS OUTER WEARS (NET RATE)" wholesale sheet — Mass and Don are Kids
  // Shorts Set (5 Pcs) rows, so they land in Boys Outerwear. Both are
  // grouped under the existing "Co-Ords & Shorts Set" flyout (same one
  // used by the Leo Lilly sets below) rather than the plain "Shorts" row,
  // since these are two-piece sets, not standalone shorts. The sheet's
  // size run starts at 40 (below the usual 45), so a leading '40' size is
  // added ahead of the standard bands.
  { name: 'Boys Shorts Set – Don', fabric: 'Cotton', label: 'Don', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'Navy', 'Grey', 'Beige', 'Cornflower Blue', 'Black'], sizes: ['40', '45', '50', '55', '60', '65', '70', '75'], sizePriceGroups: [['40'], ['45', '50', '55'], ['60', '65', '70'], ['75']], sizePrices: [134, 149, 149, 149, 164, 164, 164, 179], price: 134, discount: 0, image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-red.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-red-back.jpg' ,
    colorImages: {
      Red: { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-red.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-red-back.jpg' },
      Navy : { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Navy.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Navy-back.jpg' },
      Beige : { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Beige.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Beige-back.jpg' },
      Grey : { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Grey.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Grey-back.jpg' },
      Black : { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Black.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Black-back.jpg' },
      'Cornflower Blue' : { image: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Cornflower Blue.jpg', imageBack: '/images/products/boys/shorts/colors/Don/Boys Shorts Set-Don-Cornflower Blue-back.jpg' },
    },  
   },
 { name: 'Boys Shorts Set – Mass', fabric: 'Cotton', label: 'Mass', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Dark Green', 'Grey', 'Orange', 'Black'], sizes: ['40', '45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['40'], ['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [130, 145, 145, 145, 160, 160, 160, 175, 190, 205], price: 130, discount: 0, image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Orange.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Orange-back.jpg' ,
  colorImages: {
      Wine: { image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Wine.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Wine-back.jpg' },
      'Dark Green' : { image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Dark Green.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Dark Green-back.jpg' },
      Grey : { image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Grey.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Grey-back.jpg' },
      Black : { image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Black.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Black-back.jpg' },
      'Orange' : { image: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Orange.jpg', imageBack: '/images/products/boys/shorts/colors/Mass/Boys Shorts Set - Mass-Orange-back.jpg' },
    },
  },
  // Additional models added from the V.S.S Textiles wholesale price list
  // (Outer Wear sheets 2 & 3). Same pattern as the Outerwear items above —
  // sizePrices carry the MRP rate for each size band, no discount applied.

  // { name: 'Boys Coat Model Full Hand T-Shirt – Raja', fabric: 'Cotton', label: 'Raja (Full Hand)', menuParent: 'T-Shirt', price: 326, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Black', 'Maroon', 'Grey', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [326, 326, 326, 356, 356, 356, 386, 416, 446], discount: 0, image: '/images/products/boys/casual-shirt.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg' },
  // { name: 'Boys Full Hand T-Shirt – Hunter', fabric: 'Cotton', label: 'Hunter', menuParent: 'T-Shirt', price: 218, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Blue', 'Maroon'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [218, 218, 218, 238, 238, 238, 258, 278, 298], discount: 0, image: '/images/products/boys/casual-shirt.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg' },
  // { name: 'Boys Plain T-Shirt – Rockey', fabric: 'Cotton', label: 'Rockey', menuParent: 'T-Shirt', price: 144, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Black', 'Navy', 'Grey', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [144, 144, 144, 156, 156, 156, 180, 204, 228], discount: 0, image: '/images/products/boys/printed-t-shirt.jpg', imageSide: '/images/products/boys/printed-t-shirt-side.jpg', imageBack: '/images/products/boys/printed-t-shirt-back.jpg' },
  // { name: 'Boys Coat Model Half Hand T-Shirt – Rock', fabric: 'Cotton', label: 'Rock (Half Hand)', menuParent: 'T-Shirt', price: 296, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Maroon', 'Grey', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [296, 296, 296, 326, 326, 326, 356, 386, 416], discount: 0, image: '/images/products/boys/casual-shirt.jpg', imageSide: '/images/products/boys/casual-shirt-side.jpg', imageBack: '/images/products/boys/casual-shirt-back.jpg' },
  // Hoodie — from the "BOYS T SHIRT HOODIE" wholesale price list. Sizes are
  // the sheet's chest-measurement bands (cm), same pattern as the other
  // Boys items above. Price shown on the site is the sheet's MRP column
  // (not the wholesale rate), no discount applied.
  { name: 'Hoodie Sigma', fabric: 'Cotton', label: 'Sigma', menuParent: 'Hoodie', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Blue', 'Maroon'], sizes: ['50-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-80']], sizePrices: [360, 380, 400], price: 360, discount: 0, image: '/images/products/boys/tshirt/hoodlie-sigma.jpg', imageSide: '/images/products/boys/hoodie-side.jpg', imageBack: '/images/products/boys/hoodie-back.jpg' },
  { name: 'POLO HOOD RNS', fabric: 'Fancy', label: 'POLO HOOD', menuParent: 'Hoodie', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Blue', 'Maroon'], sizes: ['50-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['50-55'], ['60-70'], ['75-80']], sizePrices: [360, 380, 400], price: 360, discount: 0, image: '/images/products/boys/tshirt/hoodlie-polo.jpg', imageSide: '/images/products/boys/hoodie-side.jpg', imageBack: '/images/products/boys/hoodie-back.jpg' },
  
  // V-Max branded T-Shirts — added from the V-Max catalog sheet. Sizes are
  // the manufacturer's size bands (cm), same sizePrices pattern as the rest
  // of the Outerwear items above. No dedicated V-Max product photos exist
  // yet, so these reuse the existing boys T-Shirt photography until real
  // shots are dropped in under public/images/products/boys/.
     
  { name: 'Boys 3/4th Set – Ultra', fabric: 'Cotton', label: 'Ultra', menuParent: '3/4th Set', price: 330, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Mustard', 'Brown', 'Grey', 'Blue', 'Pink'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [330, 330, 330, 360, 360, 360, 390, 420, 450], discount: 0, image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Mustard.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Mustard-back.jpg' ,
    colorImages: {
      Mustard: { image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Mustard.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Mustard-back.jpg' },
      Brown : { image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Brown.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Brown-back.jpg' },
      Grey : { image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Grey.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Grey-back.jpg' },
      Pink : { image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Pink.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Pink-back.jpg' },
      Blue : { image: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Blue.jpg', imageBack: '/images/products/boys/3-4th/Ultra/3-4thset-ultra-Blue-back.jpg' },
    }, 
   },
  { name: 'Boys 3/4th Set – Leader', fabric: 'Cotton', label: 'Leader', menuParent: '3/4th Set', price: 334, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Khaki', 'Wine', 'Teal', 'Mustard', 'Black'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [334, 334, 334, 364, 364, 364, 394, 424, 468], discount: 0, image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Khaki.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Khaki-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Wine.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Wine-back.jpg' },
      Teal : { image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Teal.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Teal-back.jpg' },
      Mustard : { image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Mustard.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Mustard-back.jpg' },
      Black : { image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Black.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Black-back.jpg' },
      Khaki : { image: '/images/products/boys/3-4th/Leader/3-4thset-leader-Khaki.jpg', imageBack: '/images/products/boys/3-4th/Leader/3-4thset-leader-Khaki-back.jpg' },
    },
   },
  
  { name: 'Boys Full Pant Set – Rider', fabric: 'Cotton', label: 'Rider', menuParent: 'Full Pant', price: 350, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Blue', 'Green'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [350, 350, 350, 380, 380, 380, 410, 440, 470], discount: 0, image: '/images/products/boys/fullpant/fullpant-rider.jpg', imageSide: '/images/products/boys/jeans-side.jpg', imageBack: '/images/products/boys/jeans-back.jpg' },
  //{ name: 'Boys Print Full Pant – Remo', fabric: 'Cotton', label: 'Remo', menuParent: 'Full Pant', price: 278, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Black', 'Grey', 'Khaki', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [278, 278, 278, 298, 298, 298, 318, 338, 358], discount: 0, image: '/images/products/boys/jeans.jpg', imageSide: '/images/products/boys/jeans-side.jpg', imageBack: '/images/products/boys/jeans-back.jpg' },
  //{ name: 'Boys Plain Full Pant – Sanjay', fabric: 'Cotton', label: 'Sanjay', menuParent: 'Full Pant', price: 222, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Khaki', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [222, 222, 222, 242, 242, 242, 262, 282, 302], discount: 0, image: '/images/products/boys/jeans.jpg', imageSide: '/images/products/boys/jeans-side.jpg', imageBack: '/images/products/boys/jeans-back.jpg' },
  //{ name: 'Boys Full Pant – Roshan', fabric: 'Cotton', label: 'Roshan', menuParent: 'Full Pant', price: 242, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Navy', 'Grey', 'Blue', 'Green'], sizes: ['45-55', '60-70', '75', '80'], sizePriceGroups: [['45-55'], ['60-70'], ['75'], ['80']], sizePrices: [242, 262, 282, 302], discount: 0, image: '/images/products/boys/jeans.jpg', imageSide: '/images/products/boys/jeans-side.jpg', imageBack: '/images/products/boys/jeans-back.jpg' },
  { name: 'Boys Pant – Campus', fabric: 'Cotton', label: 'Campus', menuParent: 'Full Pant', price: 212, heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Wine', 'Dark Green', 'Grey', 'Navy Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [212, 212, 212, 232, 232, 232, 252, 272, 292], discount: 0, image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Brown.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Brown-back.jpg' ,
    colorImages: {
      Wine: { image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Wine.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Wine-back.jpg' },
      'Dark Green' : { image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Dark Green.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Dark Green-back.jpg' },
      Grey : { image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Grey.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Grey-back.jpg' },
      'Navy Blue' : { image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Navy Blue.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Navy Blue-back.jpg' },
      Brown : { image: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Brown.jpg', imageBack: '/images/products/boys/fullpant/Campus/Track-Pant-Campus-Brown-back.jpg' },
    },
   },

  // Co-Ords & Shorts Set — from the "KIDS WEAR SET RNS" wholesale price
  // list. Sized as S-M-L / XL-XXL bands (site price is the sheet's MRP
  // column for each band, no discount applied) — 3XL isn't offered for
  // this style, matching the sheet's blank "-" column. Comfortable,
  // relaxed-fit co-ord sets that suit babies and toddlers just as well as
  // older kids — see the product page's Fit/Versatility notes. Same
  // 5-model line ("701"–"704") is listed under both Boys and Girls so it
  // shows up in either section; reuses the existing nightwear-set photos
  // as a placeholder until dedicated co-ord photography is added — see
  // public/images/products/README.md.
  { name: 'Boys Leo Lilly Co-Ord Set – 701', fabric: 'Fancy', label: 'Leo Lilly 701 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'light peach pink', 'Pink Print', 'Cream', 'Coral', 'Light Pink'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [196, 196, 196, 220, 220], price: 196, discount: 0, image: '/images/products/boys/co&ords/701/leo-lily-701-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Sky Blue-back.jpg' ,
    colorImages: {
      'Sky Blue': { image: '/images/products/boys/co&ords/701/leo-lily-701-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Sky Blue-back.jpg' },
      'light peach pink': { image: '/images/products/boys/co&ords/701/leo-lily-701-light peach pink.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-light peach pink-back.jpg' },
      'Pink Print': { image: '/images/products/boys/co&ords/701/leo-lily-701-Pink Print.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Pink Print-back.jpg' },
      Cream: { image: '/images/products/boys/co&ords/701/leo-lily-701-Cream.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Cream-back.jpg' },
      Coral: { image: '/images/products/boys/co&ords/701/leo-lily-701-Coral.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Coral-back.jpg' },
      'Light Pink': { image: '/images/products/boys/co&ords/701/leo-lily-701-Light Pink.jpg', imageBack: '/images/products/boys/co&ords/701/leo-lily-701-Light Pink-back.jpg' },
      },
   },
  { name: 'Boys Leo Lilly Tencil Co-Ord Set – 702', fabric: 'Tencil', label: 'Leo Lilly Tencil 702 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['SoftMustardYellow', 'Brown', 'EmeraldGreen', 'PlumPurple', 'Black', 'Wine'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [278, 278, 278, 298, 298], price: 278, discount: 0, image: '/images/products/boys/co&ords/702/leo-lily-702-SoftMustardYellow.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-SoftMustardYellow-back.jpg' ,
    colorImages: {
      SoftMustardYellow: { image: '/images/products/boys/co&ords/702/leo-lily-702-SoftMustardYellow.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-SoftMustardYellow-back.jpg' },
      Brown: { image: '/images/products/boys/co&ords/702/leo-lily-702-Brown.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-Brown-back.jpg' },
      EmeraldGreen: { image: '/images/products/boys/co&ords/702/leo-lily-702-EmeraldGreen.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-EmeraldGreen-back.jpg' },
      PlumPurple: { image: '/images/products/boys/co&ords/702/leo-lily-702-PlumPurple.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-PlumPurple-back.jpg' },
      Black: { image: '/images/products/boys/co&ords/702/leo-lily-702-Black.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-Black-back.jpg' },
      Wine: { image: '/images/products/boys/co&ords/702/leo-lily-702-Wine.jpg', imageBack: '/images/products/boys/co&ords/702/leo-lily-702-Wine-back.jpg' },
      },
   },
  { name: 'Boys Leo Lilly Print Co-Ord Set – 703', fabric: 'Fancy', label: 'Leo Lilly Print 703 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Khaki', 'Dusty Sage Green', 'Light Lavender', 'Sky Blue', 'Checked', 'Grey'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [240, 240, 240, 260, 260], price: 240, discount: 0,  image: '/images/products/boys/co&ords/703/leo-lily-703-Khaki.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Khaki-back.jpg' ,
    colorImages: {
      Khaki: { image: '/images/products/boys/co&ords/703/leo-lily-703-Khaki.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Khaki-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/boys/co&ords/703/leo-lily-703-Dusty Sage Green.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Dusty Sage Green-back.jpg' },
      'Light Lavender': { image: '/images/products/boys/co&ords/703/leo-lily-703-Light Lavender.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Light Lavender-back.jpg' },
      'Sky Blue': { image: '/images/products/boys/co&ords/703/leo-lily-703-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Sky Blue-back.jpg' },
      Checked: { image: '/images/products/boys/co&ords/703/leo-lily-703-Checked.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Checked-back.jpg' },
      Grey: { image: '/images/products/boys/co&ords/703/leo-lily-703-Grey.jpg', imageBack: '/images/products/boys/co&ords/703/leo-lily-703-Grey-back.jpg' },
      },
   },
  { name: 'Boys Leo Lilly Print Co-Ord Set – 704', fabric: 'Fancy', label: 'Leo Lilly Print 704 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'Dusty Rose', 'CoffeeBrown', 'Grey', 'PowderBlue', 'Dusty Sage Green'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [156, 156, 156, 180, 180], price: 156, discount: 0, image: '/images/products/boys/co&ords/704/leo-lily-704-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-Sky Blue-back.jpg' ,
    colorImages: {
      'Sky Blue'  : { image: '/images/products/boys/co&ords/704/leo-lily-704-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-Sky Blue-back.jpg' },
      'Dusty Rose': { image: '/images/products/boys/co&ords/704/leo-lily-704-Dusty Rose.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-Dusty Rose-back.jpg' },
      CoffeeBrown: { image: '/images/products/boys/co&ords/704/leo-lily-704-CoffeeBrown.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-CoffeeBrown-back.jpg' },
      Grey: { image: '/images/products/boys/co&ords/704/leo-lily-704-Grey.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-Grey-back.jpg' },
      PowderBlue: { image: '/images/products/boys/co&ords/704/leo-lily-704-PowderBlue.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-PowderBlue-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/boys/co&ords/704/leo-lily-704-Dusty Sage Green.jpg', imageBack: '/images/products/boys/co&ords/704/leo-lily-704-Dusty Sage Green-back.jpg' },
      },
   },
  { name: 'Boys Leo Lilly Print Co-Ord Set – 705', fabric: 'Cotton Hosiery', label: 'Leo Lilly Print 705 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Boys Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Red', 'Sky Blue', 'Olive', 'Green', 'Navy', 'Wine'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [156, 156, 156, 180, 180], price: 156, discount: 0, image: '/images/products/boys/co&ords/705/leo-lily-705-Wine.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Wine-back.jpg' ,
    colorImages: {
      Red: { image: '/images/products/boys/co&ords/705/leo-lily-705-Red.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Red-back.jpg' },
      'Sky Blue': { image: '/images/products/boys/co&ords/705/leo-lily-705-Sky Blue.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Sky Blue-back.jpg' },
      Olive: { image: '/images/products/boys/co&ords/705/leo-lily-705-Olive.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Olive-back.jpg' },
      Green: { image: '/images/products/boys/co&ords/705/leo-lily-705-Green.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Green-back.jpg' },
      Navy: { image: '/images/products/boys/co&ords/705/leo-lily-705-Navy.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Navy-back.jpg' },
      Wine: { image: '/images/products/boys/co&ords/705/leo-lily-705-Wine.jpg', imageBack: '/images/products/boys/co&ords/705/leo-lily-705-Wine-back.jpg' },
      },
   },

  // Innerwear — placeholder items for now (not yet in the wholesale price
  // list); swap in real names/sizes/prices once available, same pattern
  // as the Outerwear items above.
  // Kids Inner Wears — sourced from the "KIDS INNER WEARS" wholesale rate
  // card. Site price is the MRP for each size band (45-55 / 60-70 /
  // 75-80), no discount applied — same pattern as the Outerwear items
  // above. Print/Plain Jetty styles group under a shared "Jetty" flyout
  // row; Print/Plain/Dora Drawer styles group under "Drawer" — same
  // menuParent approach as Men's Premium Vest.
  { name: 'Baby Print Jetty', fabric: 'Cotton Hosiery', label: 'Baby Print Jetty', menuParent: 'Jetty', heading: 'Boys Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Print', 'Blue', 'Grey'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [59, 63, 68], price: 59, discount: 0, image: '/images/products/boys/Jetty/baby-print-jetty.jpg', imageSide: '/images/products/boys/Jetty/baby-print-jetty-side.jpg', imageBack: '/images/products/boys/Jetty/baby-print-jetty-back.jpg' },
  { name: 'Baby Plain Jetty', fabric: 'Cotton Hosiery', label: 'Baby Plain Jetty', menuParent: 'Jetty', heading: 'Boys Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Blue', 'Grey', 'Black'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [56, 59, 65], price: 56, discount: 0, image: '/images/products/boys/Jetty/baby-plain-jetty.jpg', imageSide: '/images/products/boys/Jetty/baby-plain-jetty-side.jpg', imageBack: '/images/products/boys/Jetty/baby-plain-jetty-back.jpg' },
  { name: 'Baby Print Drawer', fabric: 'Cotton Hosiery', label: 'Baby Print Drawer', menuParent: 'Drawer', heading: 'Boys Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Print', 'Blue', 'Grey'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [61, 65, 70], price: 61, discount: 0, image: '/images/products/boys/Drawer/baby-print-drawer.jpg', imageSide: '/images/products/boys/Drawer/baby-print-drawer-side.jpg', imageBack: '/images/products/boys/Drawer/baby-print-drawer-back.jpg' },
  { name: 'Baby Plain Drawer', fabric: 'Cotton Hosiery', label: 'Baby Plain Drawer', menuParent: 'Drawer', heading: 'Boys Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Blue', 'Grey', 'Black'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [58, 61, 67], price: 58, discount: 0, image: '/images/products/boys/Drawer/baby-plain-drawer.jpg', imageSide: '/images/products/boys/Drawer/baby-plain-drawer-side.jpg', imageBack: '/images/products/boys/Drawer/baby-plain-drawer-back.jpg' },
  { name: 'Dora Print Drawer', fabric: 'Cotton Hosiery', label: 'Dora Print Drawer', menuParent: 'Drawer', heading: 'Boys Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Blue', 'Green', 'Yellow', 'White', 'Print'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [67, 70, 76], price: 67, discount: 0, image: '/images/products/boys/Drawer/dora-print-drawer.jpg', imageSide: '/images/products/boys/Drawer/dora-print-drawer-side.jpg', imageBack: '/images/products/boys/Drawer/dora-print-drawer-back.jpg' },
]

const kidsGirlsCatalog = [
  { name: 'Girls Round Neck T-Shirt – Hasna', fabric: 'Cotton', label: 'Hasna', menuParent: 'T-Shirt', price: 156, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Light Pink', 'Pink', 'Blue', 'Light Mint Green', 'Wine', 'Beige', 'Grey', 'Black', 'BrightTealBlue', 'Lavender'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [156, 156, 156, 168, 168, 168, 192, 216, 240], discount: 0,  image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink-back.jpg' ,
     colorImages: {
       'Light Pink':   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Pink-back.jpg' },
      Pink:   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-pink.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-pink-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-pink-back.jpg' },
      Blue:   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Blue.jpg',   imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Blue-side.jpg',   imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Blue-back.jpg' },
      'Light Mint Green':   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Mint Green.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Mint Green-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Light Mint Green-back.jpg' },
      Wine: { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Wine.jpg',imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Wine-side.jpg',imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Wine-back.jpg' },
      Beige:    { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Beige.jpg',    imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Beige-side.jpg',    imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Beige-back.jpg' },
      Grey:   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-grey.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-grey-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-grey-back.jpg' },
      Black:  { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-black.jpg', imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-black-side.jpg', imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-black-back.jpg' },
      BrightTealBlue:   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-BrightTealBlue.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-BrightTealBlue-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-BrightTealBlue-back.jpg' },
      Lavender:   { image: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Lavender.jpg',  imageSide: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Lavender-side.jpg',  imageBack: '/images/products/girls/tshirt/colours/Hasna/tshirt-hasna-Lavender-back.jpg' },
    },
   },
  { name: 'Girls Full Pant Set – Angel', fabric: 'Cotton', label: 'Angel', menuParent: 'Full Pant', price: 312, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Brown', 'Black', 'Grey', 'Wine'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [312, 312, 312, 342, 342, 342, 372, 402, 432], discount: 0,  image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Brown.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Brown-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Brown-back.jpg' },
      Black: { image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Black.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Black-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Black-back.jpg' },
      Pink: { image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Pink-back.jpg' },
      Grey: { image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Grey.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Grey-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Grey-back.jpg' },
      Wine: { image: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Wine.jpg', imageSide: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Wine-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Angel/fullpant-Angel-Wine-back.jpg' },
    },
   },
  // "KIDS OUTER WEARS (NET RATE)" wholesale sheet — Super Heroin is the
  // Kids Full Pant Print Set (5 Pcs) row, so it lands in Girls Outerwear
  // alongside the other Full Pant models. Sheet has no 80/85 rate, so
  // sizes stop at 75, and the run starts at 40 like the Mass/Don shorts.
  // { name: 'Girls Full Pant Print Set – Super Heroin', fabric: 'Cotton', label: 'Super Heroin', menuParent: 'Full Pant', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Purple', 'White', 'Yellow', 'Blue'], sizes: ['40', '45', '50', '55', '60', '65', '70', '75'], sizePriceGroups: [['40'], ['45', '50', '55'], ['60', '65', '70'], ['75']], sizePrices: [165, 190, 190, 190, 215, 215, 215, 240], price: 165, discount: 0, image: '/images/products/girls/fullpant/Girls Full Pant Print Set – Super Heroin.jpg', imageSide: '/images/products/girls/Girls Full Pant Print Set – Super Heroin-side.jpg', imageBack: '/images/products/girls/Girls Full Pant Print Set – Super Heroin-back.jpg' },
  // Additional models added from the V.S.S Textiles wholesale price list
  // (Outer Wear sheets 2 & 3). Same pattern as the Outerwear items above —
  // sizePrices carry the MRP rate for each size band, no discount applied.
  { name: 'Girls 3/4th Set – Sakshi', fabric: 'Cotton', label: 'Sakshi', menuParent: '3/4th Set', price: 300, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Blue', 'Dark Pink', 'Wine', 'Mustard', 'Black'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [300, 300, 300, 330, 330, 330, 360, 390, 420], discount: 0, image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Blue.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Blue-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Blue-back.jpg' ,
    colorImages: {
      'Dark Pink': { image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Dark Pink.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Dark Pink-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Dark Pink-back.jpg' },
      Wine: { image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Wine.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Wine-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Wine-back.jpg' },
      Blue: { image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Blue.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Blue-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Blue-back.jpg' },
      Mustard: { image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Mustard.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Mustard-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Mustard-back.jpg' },
      Black: { image: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Black.jpg', imageSide: '/images/products/girls/3-4th-set/Sakshi/Sakshi-3-4th-Black-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Sakshi/Sakshi-3-4th-Black-back.jpg' },
    },
   },
  { name: 'Girls 3/4th Set – Saji', fabric: 'Cotton', label: 'Saji', menuParent: '3/4th Set', price: 328, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Light Pink', 'Grey', 'Teal', 'Violet'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [328, 328, 328, 358, 358, 358, 388, 418, 448], discount: 0, image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Light pink.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Light pink-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-Light pink-back.jpg'  ,
    colorImages: {
      Pink: { image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-pink.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-pink-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-pink-back.jpg' },
      'Light Pink': { image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Light pink.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Light pink-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-Light pink-back.jpg' },
      Grey: { image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Grey.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Grey-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-Grey-back.jpg' },
      'Teal': { image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Teal.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Teal-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-Teal-back.jpg' },
      Violet: { image: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Violet.jpg', imageSide: '/images/products/girls/3-4th-set/Saji/Saji-3-4th-Violet-side.jpg', imageBack: '/images/products/girls/tshirt/colors/Saji/Saji-3-4th-Violet-back.jpg' },
    },
  },
  { name: 'Girls Full Pant Set – Sana Pyjama', fabric: 'Cotton', label: 'Sana Pyjama', menuParent: 'Full Pant', price: 498, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Navy', 'Mustard', 'Brown', 'Wine', 'Red'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [498, 498, 498, 528, 528, 528, 558, 588, 618], discount: 0, image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy-back.jpg' ,
     colorImages: {
      Brown: { image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Brown.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Brown-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Brown-back.jpg' },
      Navy: { image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Navy-back.jpg' },
      Wine: { image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Wine.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Wine-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Wine-back.jpg' },
      Mustard: { image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Mustard.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Mustard-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Mustard-back.jpg' },
      Red: { image: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Red.jpg', imageSide: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Red-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Sana/fullpant-Sana-Red-back.jpg' },
    },
   },
  { name: 'Girls Full Pant Set – Flora', fabric: 'Cotton', label: 'Flora', menuParent: 'Full Pant', price: 342, heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Brown', 'Pink', 'Light Mint Green', 'light peach pink', 'Blue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [342, 342, 342, 372, 372, 372, 402, 432, 462], discount: 0, image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown-back.jpg' ,
    colorImages: {
      Brown: { image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Brown-back.jpg' },
      Pink: { image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Pink.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Pink-back.jpg' },
      'Light Mint Green': { image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Light Mint Green.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Light Mint Green-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Light Mint Green-back.jpg' },
      'light peach pink': { image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-light peach pink.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-light peach pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-light peach pink-back.jpg' },
      Blue: { image: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Blue.jpg', imageSide: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Blue-side.jpg', imageBack: '/images/products/girls/fullpant/colours/Flora/fullpant-Flora-Blue-back.jpg' },
    },
   },
  // "GIRLS T-SHIRT RNS" wholesale sheet — this batch uses 4 cm size bands
  // (45-55/60-70/75-80/85-90) rather than the 5-size run above, so it gets
  // its own sizeUnit: 'cm' the same way the innerwear items further down
  // do. GT-504 has no 85-90 wholesale/MRP rate on the sheet (shown as
  // "-"), so it only carries 3 sizes.
  { name: 'Girls T-Shirt GT-501', fabric: 'Fancy', label: 'GT-501', menuParent: 'T-Shirt', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Red', 'Green', 'Blue', 'Navy'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [136, 136, 136, 148, 148, 148, 160, 160, 172, 172], price: 136, discount: 0, image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-green.jpg', imageSide: '/images/products/girls/printed-t-shirt-side.jpg', imageBack: '/images/products/girls/printed-t-shirt-back.jpg',
    colorImages: {
      Red: { image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-red.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-red-back.jpg' },
      Green: { image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-green.jpg',  imageBack: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-green-back.jpg' },
      Navy: { image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Navy.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Navy-back.jpg' },
      Wine: { image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Wine.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Wine-back.jpg' },
      Blue: { image: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Blue.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-501/tshirt-501-Blue-back.jpg' },
    },
   },
   { name: 'Girls Crop Top GT-505', fabric: 'Fancy', label: 'GT-505', menuParent: 'Crop Top', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Pink', 'Blue', 'Yellow', 'Purple'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [180, 180, 180, 200, 200, 200, 220, 220, 240, 240], price: 180, discount: 0, image: '/images/products/girls/casual-top.jpg', imageSide: '/images/products/girls/casual-top-side.jpg', imageBack: '/images/products/girls/casual-top-back.jpg' },

  { name: 'Girls T-Shirt GT-506', fabric: 'Fancy', label: 'GT-506', menuParent: 'T-Shirt', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'Wine', 'Black', 'Dusty Sage Green', 'Pink'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [144, 144, 144, 156, 156, 156, 168, 168, 180, 180], price: 144, discount: 0, image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Sky Blue.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Sky Blue-back.jpg' ,
    colorImages: {
      Black: { image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Black.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Black-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Dusty Sage Green.jpg',  imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Dusty Sage Green-back.jpg' },
      'Sky Blue': { image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Sky Blue.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Sky Blue-back.jpg' },
      Wine: { image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Wine.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Wine-back.jpg' },
      Pink: { image: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Pink.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-506/tshirt-506-Pink-back.jpg' },
    },
   },
  // Same "GIRLS T-SHIRT RNS" sheet, later rows — these three use the
  // plain 45-55/60-70/75/80/85 size run (not the 4 cm bands above), so no
  // sizeUnit here, matching the Hasna/Sana items further up.
  { name: 'Girls T-Shirt – GT-507', fabric: 'Fancy', label: 'GT-507', menuParent: 'T-Shirt', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Lavender', 'Pink', 'Checked', 'Navy','Dusty Sage Green'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [156, 156, 156, 168, 168, 168, 180, 192, 204], price: 156, discount: 0, image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-green.jpg', imageSide: '/images/products/girls/printed-t-shirt-side.jpg', imageBack: '/images/products/girls/printed-t-shirt-back.jpg',
     colorImages: {
      Lavender: { image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Lavender.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Lavender-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-green.jpg',  imageBack: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-green-back.jpg' },
      Navy: { image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Navy.jpg',  imageBack: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Navy-back.jpg' },
      Checked: { image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Checked.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-Checked-back.jpg' },
      Pink: { image: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-pink.jpg',  imageBack: '/images/products/girls/tshirt/colours/gt-507/tshirt-507-pink-back.jpg' },
    },
   },
  { name: 'Girls T-Shirt – GT-508', fabric: 'Fancy', label: 'GT-508', menuParent: 'T-Shirt', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Grey', 'Pink', 'Brown', 'Blue', 'Navy','Green'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [156, 156, 156, 168, 168, 168, 180, 192, 204], price: 156, discount: 0, image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-pink.jpg', imageSide: '/images/products/girls/printed-t-shirt-side.jpg', imageBack: '/images/products/girls/printed-t-shirt-back.jpg',
    colorImages: {
      Grey: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Grey.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Grey-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Grey-back.jpg' },
      Green: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-green.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-green-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-green-back.jpg' },
      Navy: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Navy.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Navy-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Navy-back.jpg' },
      Brown: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-brown.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-brown-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-brown-back.jpg' },
      Blue: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Blue.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Blue-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-Blue-back.jpg' },
      Pink: { image: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-pink.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-pink-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-508/tshirt-508-pink-back.jpg' },
    },
   },
   { name: 'Girls T-Shirt GT-509', fabric: 'Fancy', label: 'GT-509', menuParent: 'T-Shirt', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Dark Forest Green','Checked'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85', '90'], sizeUnit: 'cm', sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75', '80'], ['85', '90']], sizePrices: [196, 196, 196, 216, 216, 216, 236, 236, 256, 256], price: 196, discount: 0, image: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Dark Forest Green.jpg', imageSide: '/images/products/girls/printed-t-shirt-side.jpg', imageBack: '/images/products/girls/printed-t-shirt-back.jpg',
    colorImages: {
      Checked: { image: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Checked.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Checked-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Checked-back.jpg' },
      'Dark Forest Green': { image: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Dark Forest Green.jpg', imageSide: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Dark Forest Green-side.jpg', imageBack: '/images/products/girls/tshirt/colours/gt-509/tshirt-509-Dark Forest Green-back.jpg' },
    },
   },
  { name: 'Girls Full Pant Set – Sara', fabric: 'Cotton', label: 'Sara', menuParent: 'Full Pant', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Dark Forest Green', 'Checked', 'Wine', 'Pink', 'PowderBlue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [250, 250, 250, 270, 270, 270, 290, 310, 330], price: 250, discount: 0, image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black-back.jpg' ,
    colorImages: {
      'Dark Forest Green': { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Dark Forest Green.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Dark Forest Green-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Dark Forest Green-back.jpg' },
      Checked: { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Checked.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Checked-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Checked-back.jpg' },
      PowderBlue: { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-PowderBlue.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-PowderBlue-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-PowderBlue-back.jpg' },
      Wine: { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Wine.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Wine-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Wine-back.jpg' },
      Black: { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-Black-back.jpg' },
      Pink: { image: '/images/products/girls/fullpant/colours/sara/fullpant-sara-pink.jpg', imageSide: '/images/products/girls/fullpant/colours/sara/fullpant-sara-pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/sara/fullpant-sara-pink-back.jpg' },
    },
   },
  { name: 'Girls Full Pant Set – Maya', fabric: 'Cotton', label: 'Maya', menuParent: 'Full Pant', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Black', 'Dark Forest Green', 'Cream', 'Wine', 'Pink', 'PowderBlue'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [250, 250, 250, 270, 270, 270, 290, 310, 330], price: 250, discount: 0, image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Black.jpg', imageSide: '/images/products/girls/kurti-leggings-set-side.jpg', imageBack: '/images/products/girls/kurti-leggings-set-back.jpg',
    colorImages: {
      'Dark Forest Green': { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Dark Forest Green.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Dark Forest Green-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Dark Forest Green-back.jpg' },
      Cream: { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Cream.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Cream-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Cream-back.jpg' },
      PowderBlue: { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-PowderBlue.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-PowderBlue-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-PowderBlue-back.jpg' },
      Wine: { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Wine.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Wine-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Wine-back.jpg' },
      Black: { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Black.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Black-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-Black-back.jpg' },
      Pink: { image: '/images/products/girls/fullpant/colours/maya/fullpant-maya-pink.jpg', imageSide: '/images/products/girls/fullpant/colours/maya/fullpant-maya-pink-side.jpg', imageBack: '/images/products/girls/fullpant/colours/maya/fullpant-maya-pink-back.jpg' },
    },
   },
   { name: 'Girls Full Pant Set – Jara', fabric: 'Cotton', label: 'Jara', menuParent: 'Full Pant', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink Print', 'Dark Slate Blue', 'Checked', 'Blue', 'Black','PlumPurple'], sizes: ['45', '50', '55', '60', '65', '70', '75', '80', '85'], sizePriceGroups: [['45', '50', '55'], ['60', '65', '70'], ['75'], ['80'], ['85']], sizePrices: [125, 125, 125, 135, 135, 135, 145, 155, 165], price: 125, discount: 0, image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print-back.jpg' ,
    colorImages: {
      'Dark Slate Blue': { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Dark Slate Blue.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Dark Slate Blue-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Dark Slate Blue-back.jpg' },
      Checked: { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Checked.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Checked-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Checked-back.jpg' },
      PlumPurple: { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-PlumPurple.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-PlumPurple-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-PlumPurple-back.jpg' },
      Blue: { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Blue.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Blue-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Blue-back.jpg' },
      Black: { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Black.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Black-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Black-back.jpg' },
      'Pink Print': { image: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print.jpg', imageSide: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print-side.jpg', imageBack: '/images/products/girls/fullpant/colours/jara/fullpant-jara-Pink Print-back.jpg' },
    },
   },
  // Co-Ords & Shorts Set — from the "KIDS WEAR SET RNS" wholesale price
  // list, same models/prices as the Boys section below (see the comment
  // there for the full sourcing note). Comfortable, relaxed-fit co-ord
  // sets that suit babies and toddlers just as well as older kids.
  { name: 'Girls Leo Lilly Co-Ord Set – 701', fabric: 'Fancy', label: 'Leo Lilly 701 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'light peach pink', 'Pink Print', 'Cream', 'Coral', 'Light Pink'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [196, 196, 196, 220, 220], price: 196, discount: 0, image: '/images/products/girls/co-ords/701/leo-lily-701-Light Pink.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Light Pink-back.jpg' ,
    colorImages: {
      'Sky Blue': { image: '/images/products/girls/co-ords/701/leo-lily-701-Sky Blue.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Sky Blue-back.jpg' },
      'light peach pink': { image: '/images/products/girls/co-ords/701/leo-lily-701-light peach pink.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-light peach pink-back.jpg' },
      'Pink Print': { image: '/images/products/girls/co-ords/701/leo-lily-701-Pink Print.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Pink Print-back.jpg' },
      Cream: { image: '/images/products/girls/co-ords/701/leo-lily-701-Cream.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Cream-back.jpg' },
      Coral: { image: '/images/products/girls/co-ords/701/leo-lily-701-Coral.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Coral-back.jpg' },
      'Light Pink': { image: '/images/products/girls/co-ords/701/leo-lily-701-Light Pink.jpg', imageBack: '/images/products/girls/co-ords/701/leo-lily-701-Light Pink-back.jpg' },
      },
   },
  { name: 'Girls Leo Lilly Tencil Co-Ord Set – 702', fabric: 'Tencil', label: 'Leo Lilly Tencil 702 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['SoftMustardYellow', 'Brown', 'EmeraldGreen', 'PlumPurple', 'Black', 'Wine'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [278, 278, 278, 298, 298], price: 278, discount: 0,  image: '/images/products/girls/co-ords/702/leo-lily-702-EmeraldGreen.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-EmeraldGreen-back.jpg' ,
    colorImages: {
      SoftMustardYellow: { image: '/images/products/girls/co-ords/702/leo-lily-702-SoftMustardYellow.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-SoftMustardYellow-back.jpg' },
      Brown: { image: '/images/products/girls/co-ords/702/leo-lily-702-Brown.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-Brown-back.jpg' },
      EmeraldGreen: { image: '/images/products/girls/co-ords/702/leo-lily-702-EmeraldGreen.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-EmeraldGreen-back.jpg' },
      PlumPurple: { image: '/images/products/girls/co-ords/702/leo-lily-702-PlumPurple.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-PlumPurple-back.jpg' },
      Black: { image: '/images/products/girls/co-ords/702/leo-lily-702-Black.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-Black-back.jpg' },
      Wine: { image: '/images/products/girls/co-ords/702/leo-lily-702-Wine.jpg', imageBack: '/images/products/girls/co-ords/702/leo-lily-702-Wine-back.jpg' },
      },
   },
  { name: 'Girls Leo Lilly Print Co-Ord Set – 703', fabric: 'Fancy', label: 'Leo Lilly Print 703 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Khaki', 'Dusty Sage Green', 'Light Lavender', 'Sky Blue', 'Checked', 'Grey'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [240, 240, 240, 260, 260], price: 240, discount: 0, image: '/images/products/girls/co-ords/703/leo-lily-703-Sky Blue.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Sky Blue-back.jpg' ,
    colorImages: {
      Khaki: { image: '/images/products/girls/co-ords/703/leo-lily-703-Khaki.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Khaki-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/girls/co-ords/703/leo-lily-703-Dusty Sage Green.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Dusty Sage Green-back.jpg' },
      'Light Lavender': { image: '/images/products/girls/co-ords/703/leo-lily-703-Light Lavender.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Light Lavender-back.jpg' },
      'Sky Blue': { image: '/images/products/girls/co-ords/703/leo-lily-703-Sky Blue.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Sky Blue-back.jpg' },
      Checked: { image: '/images/products/girls/co-ords/703/leo-lily-703-Checked.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Checked-back.jpg' },
      Grey: { image: '/images/products/girls/co-ords/703/leo-lily-703-Grey.jpg', imageBack: '/images/products/girls/co-ords/703/leo-lily-703-Grey-back.jpg' },
      },
   },
  { name: 'Girls Leo Lilly Print Co-Ord Set – 704', fabric: 'Fancy', label: 'Leo Lilly Print 704 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Sky Blue', 'Dusty Rose', 'CoffeeBrown', 'Grey', 'PowderBlue', 'Dusty Sage Green'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [156, 156, 156, 180, 180], price: 156, discount: 0, image: '/images/products/girls/co-ords/704/leo-lily-704-PowderBlue.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-PowderBlue-back.jpg' ,
    colorImages: {
      'Sky Blue'  : { image: '/images/products/girls/co-ords/704/leo-lily-704-Sky Blue.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-Sky Blue-back.jpg' },
      'Dusty Rose': { image: '/images/products/girls/co-ords/704/leo-lily-704-Dusty Rose.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-Dusty Rose-back.jpg' },
      CoffeeBrown: { image: '/images/products/girls/co-ords/704/leo-lily-704-CoffeeBrown.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-CoffeeBrown-back.jpg' },
      Grey: { image: '/images/products/girls/co-ords/704/leo-lily-704-Grey.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-Grey-back.jpg' },
      PowderBlue: { image: '/images/products/girls/co-ords/704/leo-lily-704-PowderBlue.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-PowderBlue-back.jpg' },
      'Dusty Sage Green': { image: '/images/products/girls/co-ords/704/leo- lily-704-Dusty Sage Green.jpg', imageBack: '/images/products/girls/co-ords/704/leo-lily-704-Dusty Sage Green-back.jpg' },
      },
   },
  { name: 'Girls Leo Lilly Print Co-Ord Set – 705', fabric: 'Cotton Hosiery', label: 'Leo Lilly Print 705 (5 Pcs)', menuParent: 'Co-Ords & Shorts Set', heading: 'Girls Outerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Wine', 'Red', 'Sky Blue', 'Olive', 'Green', 'Navy'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], sizePriceGroups: [['S', 'M', 'L'], ['XL', 'XXL']], sizePrices: [156, 156, 156, 180, 180], price: 156, discount: 0, image: '/images/products/girls/co-ords/705/leo-lily-705-Wine.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Wine-back.jpg'  ,
    colorImages: {
      Wine: { image: '/images/products/girls/co-ords/705/leo-lily-705-Wine.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Wine-back.jpg' },
      Red: { image: '/images/products/girls/co-ords/705/leo-lily-705-Red.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Red-back.jpg' },
      'Sky Blue': { image: '/images/products/girls/co-ords/705/leo-lily-705-Sky Blue.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Sky Blue-back.jpg' },
      Olive: { image: '/images/products/girls/co-ords/705/leo-lily-705-Olive.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Olive-back.jpg' },
      Green: { image: '/images/products/girls/co-ords/705/leo-lily-705-Green.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Green-back.jpg' },
      Navy: { image: '/images/products/girls/co-ords/705/leo-lily-705-Navy.jpg', imageBack: '/images/products/girls/co-ords/705/leo-lily-705-Navy-back.jpg' },
      },
   },
  // Innerwear — placeholder items for now (not yet in the wholesale price
  // list); swap in real names/sizes/prices once available, same pattern
  // as the Outerwear items above.
  // Kids Inner Wears — sourced from the "KIDS INNER WEARS" wholesale rate
  // card. Site price is the MRP for each size band (45-55 / 60-70 /
  // 75-80), no discount applied — same pattern as the Outerwear items
  // above. Print/Plain Jetty styles group under a shared "Jetty" flyout
  // row; Print/Plain/Dora Drawer styles group under "Drawer" — same
  // menuParent approach as Men's Premium Vest.
  { name: 'Baby Print Jetty', fabric: 'Cotton Hosiery', label: 'Baby Print Jetty', menuParent: 'Jetty', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Pink', 'Print', 'Purple'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [59, 63, 68], price: 59, discount: 0, image: '/images/products/girls/Jetty/baby-print-jetty.jpg', imageSide: '/images/products/girls/Jetty/baby-print-jetty-side.jpg', imageBack: '/images/products/girls/Jetty/baby-print-jetty-back.jpg' },
  { name: 'Baby Plain Jetty', fabric: 'Cotton Hosiery', label: 'Baby Plain Jetty', menuParent: 'Jetty', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Pink', 'Purple', 'Yellow'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [56, 59, 65], price: 56, discount: 0, image: '/images/products/girls/Jetty/baby-plain-jetty.jpg', imageSide: '/images/products/girls/Jetty/baby-plain-jetty-side.jpg', imageBack: '/images/products/girls/Jetty/baby-plain-jetty-back.jpg' },
  { name: 'Baby Print Drawer', fabric: 'Cotton Hosiery', label: 'Baby Print Drawer', menuParent: 'Drawer', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Pink', 'Print', 'Purple'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [61, 65, 70], price: 61, discount: 0, image: '/images/products/girls/Drawer/baby-print-drawer.jpg', imageSide: '/images/products/girls/Drawer/baby-print-drawer-side.jpg', imageBack: '/images/products/girls/Drawer/baby-print-drawer-back.jpg' },
  { name: 'Baby Plain Drawer', fabric: 'Cotton Hosiery', label: 'Baby Plain Drawer', menuParent: 'Drawer', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Pink', 'Purple', 'Yellow'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [58, 61, 67], price: 58, discount: 0, image: '/images/products/girls/Drawer/baby-plain-drawer.jpg', imageSide: '/images/products/girls/Drawer/baby-plain-drawer-side.jpg', imageBack: '/images/products/girls/Drawer/baby-plain-drawer-back.jpg' },
  { name: 'Dora Print Drawer', fabric: 'Cotton Hosiery', label: 'Dora Print Drawer', menuParent: 'Drawer', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['Pink', 'Purple', 'Yellow', 'White', 'Print'], sizes: ['45-55', '60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['45-55'], ['60-70'], ['75-80']], sizePrices: [67, 70, 76], price: 67, discount: 0, image: '/images/products/girls/Drawer/dora-print-drawer.jpg', imageSide: '/images/products/girls/Drawer/dora-print-drawer-side.jpg', imageBack: '/images/products/girls/Drawer/dora-print-drawer-back.jpg' },
  // Kids Slips — sourced from the "KIDS SLIPS PRICE LIST" wholesale rate
  // card. Site price is the MRP for each size band (60-70 / 75-80), no
  // discount applied — same pattern as the Kids Inner Wears Jetty/Drawer
  // items above. Both styles group under a shared "Slips" flyout row.
  { name: 'Baby Slips', fabric: 'Cotton Hosiery', label: 'Baby Slips', menuParent: 'Slips', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Blue'], sizes: ['60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['60-70'], ['75-80']], sizePrices: [92, 99], price: 92, discount: 0, image: '/images/products/girls/slips/baby-slips/baby-slips-Blue.jpg', imageSide: '/images/products/girls/slips/baby-slips/baby-slips-Blue-side.jpg', imageBack: '/images/products/girls/slips/baby-slips/baby-slips-Blue-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/girls/slips/baby-slips/baby-slips-White.jpg', imageSide: '/images/products/girls/slips/baby-slips/baby-slips-White-side.jpg', imageBack: '/images/products/girls/slips/baby-slips/baby-slips-White-back.jpg' },
      Black: { image: '/images/products/girls/slips/baby-slips/baby-slips-Black.jpg', imageSide: '/images/products/girls/slips/baby-slips/baby-slips-Black-side.jpg', imageBack: '/images/products/girls/slips/baby-slips/baby-slips-Black-back.jpg' },
      Skin: { image: '/images/products/girls/slips/baby-slips/baby-slips-Skin.jpg', imageSide: '/images/products/girls/slips/baby-slips/baby-slips-Skin-side.jpg', imageBack: '/images/products/girls/slips/baby-slips/baby-slips-Skin-back.jpg' },
      Blue: { image: '/images/products/girls/slips/baby-slips/baby-slips-Blue.jpg', imageSide: '/images/products/girls/slips/baby-slips/baby-slips-Blue-side.jpg', imageBack: '/images/products/girls/slips/baby-slips/baby-slips-Blue-back.jpg' },
     },
   },
  { name: 'Ammu Slips', fabric: 'Cotton Hosiery', label: 'Ammu Slips', menuParent: 'Slips', heading: 'Girls Innerwear', excludeVariants: ['Classic Fit', 'Relaxed Fit'], colors: ['White', 'Skin', 'Black', 'Red'], sizes: ['60-70', '75-80'], sizeUnit: 'cm', sizePriceGroups: [['60-70'], ['75-80']], sizePrices: [95, 103], price: 95, discount: 0, image: '/images/products/girls/slips/ammu-slips/ammu-slips-Black.jpg', imageSide: '/images/products/girls/slips/ammu-slips/ammu-slips-Black-side.jpg', imageBack: '/images/products/girls/slips/ammu-slips/ammu-slips-Black-back.jpg' ,
    colorImages: {
      White: { image: '/images/products/girls/slips/ammu-slips/ammu-slips-White.jpg', imageSide: '/images/products/girls/slips/ammu-slips/ammu-slips-White-side.jpg', imageBack: '/images/products/girls/slips/ammu-slips/ammu-slips-White-back.jpg' },
      Black: { image: '/images/products/girls/slips/ammu-slips/ammu-slips-Black.jpg', imageSide: '/images/products/girls/slips/ammu-slips/ammu-slips-Black-side.jpg', imageBack: '/images/products/girls/slips/ammu-slips/ammu-slips-Black-back.jpg' },
      Skin: { image: '/images/products/girls/slips/ammu-slips/ammu-slips-Skin.jpg', imageSide: '/images/products/girls/slips/ammu-slips/ammu-slips-Skin-side.jpg', imageBack: '/images/products/girls/slips/ammu-slips/ammu-slips-Skin-back.jpg' },
      Red: { image: '/images/products/girls/slips/ammu-slips/ammu-slips-Red.jpg', imageSide: '/images/products/girls/slips/ammu-slips/ammu-slips-Red-side.jpg', imageBack: '/images/products/girls/slips/ammu-slips/ammu-slips-Red-back.jpg' },
     },
   },
]

function resolveOverride(value, variantIndex, fallback) {
  if (value === undefined) return fallback
  if (Array.isArray(value)) return value[variantIndex] ?? value[value.length - 1] ?? fallback
  return value
}

// Per-size pricing: for measurement-based sizes (e.g. vests sized 75–100cm
// chest), a bigger size uses more fabric and should cost a little more —
// unlike letter sizes (S/M/L/XL) where the store keeps one flat price.
// Two ways to opt a catalog entry in:
//   1. `sizePriceStep: 7` — each successive size in the `sizes` array adds
//      that many rupees on top of the entry's base `price` (75cm = base,
//      80cm = base + 7, 85cm = base + 14, and so on).
//   2. `sizePrices: [115, 122, 129, 136, 143, 150]` — exact price per size,
//      same order as `sizes`, for full manual control instead of a flat step.
// Neither field is set → sizePricing stays null and the size buttons don't
// affect price at all (today's default behavior for normal apparel sizing).
//
// Optional `sizePriceGroups: [['75','80'], ['85','90'], ['95','100']]` —
// every size inside one group shares a single price instead of each size
// getting its own. That shared price is whatever the FIRST size listed in
// the group would have priced to under sizePriceStep/sizePrices above.
// To change which sizes are paired, just edit the group arrays here (any
// group size works, not just pairs — e.g. ['75','80','85'] groups three).
// Remove/omit sizePriceGroups to go back to one price per size.
function buildSizePricing(entry, sizeList, basePrice, discount) {
  if (!entry.sizePrices && !entry.sizePriceStep) return null

  // price a single size would get on its own, before any grouping
  const soloPrice = (s) => {
    const idx = sizeList.indexOf(s)
    return entry.sizePrices ? entry.sizePrices[idx] ?? basePrice : basePrice + idx * entry.sizePriceStep
  }

  // map each size -> the size whose price it should borrow (itself, unless grouped)
  const representativeFor = {}
  sizeList.forEach((s) => { representativeFor[s] = s })
  ;(entry.sizePriceGroups || []).forEach((group) => {
    const [lead] = group
    group.forEach((s) => { representativeFor[s] = lead })
  })

  const pricing = {}
  sizeList.forEach((s) => {
    const p = soloPrice(representativeFor[s])
    pricing[s] = { price: p, oldPrice: Math.round(p / (1 - discount / 100)), discount }
  })
  return pricing
}

// Chest/body-measurement products (sizeUnit: 'cm') are written above as a
// compact "band" per size — e.g. sizes: ['75-90'] — since that's a quick
// way to enter the wholesale price list. But a band isn't something a
// shopper can actually pick against their own measurement, so every band
// gets expanded into its individual 5cm steps before it reaches the size
// picker: '75-90' -> 75, 80, 85, 90; '95-100' -> 95, 100; and so on. A lone
// figure with no dash (e.g. '115') is left as a single size. Every step
// inside one band keeps sharing that band's price from `sizePrices` — the
// same "several sizes, one price" idea already used for letter sizes via
// sizePriceGroups, just pre-expanded here so buildSizePricing below needs
// no changes to handle it.
function expandCmBand(band) {
  const match = /^(\d+)\s*-\s*(\d+)$/.exec(band)
  if (!match) return [band]
  const start = Number(match[1])
  const end = Number(match[2])
  const steps = []
  for (let v = start; v < end; v += 5) steps.push(String(v))
  steps.push(String(end))
  return steps
}

function expandCmSizes(entry) {
  if (entry.sizeUnit !== 'cm' || !entry.sizes) return entry
  const sizes = []
  const sizePrices = entry.sizePrices ? [] : undefined
  entry.sizes.forEach((band, i) => {
    expandCmBand(band).forEach((step) => {
      sizes.push(step)
      if (sizePrices) sizePrices.push(entry.sizePrices[i])
    })
  })
  return { ...entry, sizes, ...(sizePrices ? { sizePrices } : {}) }
}

function buildCategory(catalog, category) {
  // Two different products can legitimately share the same style name
  // (e.g. a Nighty called "Lily" and a completely separate Slip also
  // called "Lily") — subCategory is just toSlug(name), so without extra
  // disambiguation both would collide on the exact same id. That made
  // them indistinguishable everywhere ids are used as a unique key
  // (product page lookup, cart/wishlist, React list rendering), so one
  // "Lily" would silently stand in for the other — e.g. wishlisting one
  // marked both as wishlisted, and the product-detail link for either
  // card always opened whichever one happened to be first in the catalog.
  // Folding the menuParent group (e.g. "nighty" vs "slips") into the id
  // keeps ids unique across groups; a numeric suffix is added as a last
  // resort if a collision still somehow slips through within the same
  // group.
  const seenIds = new Set()
  return catalog.map((rawEntry, i) => {
    const entry = expandCmSizes(rawEntry)
    const subCategory = toSlug(entry.baseName || entry.name)
    const variantSuffix = entry.variantIndex ? `-v${entry.variantIndex}` : ''
    const variantIndex = entry.variantIndex || 0
    const groupPart = entry.menuParent ? `${toSlug(entry.menuParent)}-` : ''
    let id = `${category}-${groupPart}${subCategory}${variantSuffix}`
    if (seenIds.has(id)) {
      let n = 2
      while (seenIds.has(`${id}-${n}`)) n += 1
      id = `${id}-${n}`
    }
    seenIds.add(id)
    // Auto-generated defaults so every product has a sensible price out of
    // the box. To set a real price, add `price` (and optionally `discount`)
    // directly on the catalog entry above — a plain number applies to every
    // variant of that item, or an array like `price: [1626, 1763, 1900]`
    // gives the base product, Classic Fit, and Relaxed Fit each their own
    // price (matched up by position by the variant order).
    const price = resolveOverride(entry.price, variantIndex, 349 + ((i * 137) % 1600))
    const discount = resolveOverride(entry.discount, variantIndex, [10, 15, 20, 25, 30, 40][i % 6])
    const oldPrice = Math.round(price / (1 - discount / 100))
    return {
      id,
      name: entry.name,
      baseName: entry.baseName || entry.name,
      category,
      subCategory,
      subCategoryLabel: entry.label || entry.baseName || entry.name,
      menuHeading: entry.heading,
      menuParent: entry.menuParent,
      // Exact fabric for THIS product, e.g. 'Cotton', 'Poly Viscose',
      // 'Cotton-Spandex Blend' — set per catalog entry above. Falls back to
      // the type-level default inside getProductDetails() only if a product
      // genuinely has no fabric set here. Every catalog entry below has been
      // given its own specific fabric value, so this should always be set.
      fabric: entry.fabric,
      // Optional full custom "Style / Material / Color Combination / Fit /
      // Versatility" override — see getProductDetails() in productDetails.js.
      details: entry.details,
      // Slugified version of menuParent (e.g. 'Track Pant' -> 'track-pant') so
      // clicking the group label in the mega menu can filter to "every
      // product under this group" the same way `type` filters to one
      // subcategory — see Shop.jsx's type-matching logic.
      groupSlug: entry.menuParent ? toSlug(entry.menuParent) : undefined,
      menuStyles: entry.menuStyles,
      genderTag: entry.gender || undefined,
      image: resolveOverride(entry.image, variantIndex, entry.image),
      fallbackSeed: productFallbackSeed(category, entry.name, 'a'),
      // "Side view" image — shown between front and back in the product gallery.
      imageSide: resolveOverride(entry.imageSide, variantIndex, entry.imageSide),
      fallbackSeedSide: productFallbackSeed(category, entry.name, 's'),
      // "Back view" image — second angle shown in the product gallery/admin preview.
      imageBack: resolveOverride(entry.imageBack, variantIndex, entry.imageBack),
      fallbackSeedBack: productFallbackSeed(category, entry.name, 'b'),
      // Optional `entry.colorTop` = [[topColorName, pantColorName], ...] lets
      // a swatch render as a two-tone circle (top half = top garment color,
      // bottom half = pant color) instead of one flat color — used when we
      // don't have a real photo per color but still want the swatch to hint
      // at the actual top+pant combo. An array of pairs (not an object) so
      // the same top color can appear more than once without keys colliding.
      // A pant color left out of colorTop just renders as a plain flat dot.
      colors: entry.colors.map((name) => {
        const pair = entry.colorTop?.find(([, pantName]) => pantName === name)
        return {
          name,
          hex: colorHex[name] || '#CBD5E1',
          topHex: pair ? colorHex[pair[0]] || undefined : undefined,
        }
      }),
      // Optional { [colorName]: { image, imageSide, imageBack } } map — set
      // this on a catalog entry above to show a different photo set when a
      // shopper picks that color on the product page. Any color left out of
      // the map just keeps using the product's normal image/imageSide/
      // imageBack (today's default for every existing product).
      colorImages: entry.colorImages,
      price,
      oldPrice,
      discount,
      rating: (3.5 + (i % 3) * 0.5).toFixed(1),
      ratingCount: 20 + i * 7,
      isFeatured: entry.isFeatured !== undefined ? entry.isFeatured : i % 2 === 0,
      // Real values are assigned just below, from bestSellerPicks /
      // newArrivalPicks — not per-product here. Placeholders for now.
      isBestSeller: false,
      isNew: false,
      // In stock by default — actual stock levels are managed per-product
      // through the Admin panel's "In Stock" checkbox, not assigned
      // randomly here. Set `inStock: false` directly on a catalog entry
      // above only if you want it to always start out of stock.
      inStock: entry.inStock !== undefined ? entry.inStock : true,
      sizes: entry.sizes || (i % 7 === 0 ? ['S', 'M', 'L', 'XL', '2XL', '3XL'] : ['S', 'M', 'L', 'XL', '2XL']),
      // Unit label shown next to each size button (e.g. 'cm' for vests sized
      // by chest measurement). Left undefined for normal letter sizing.
      sizeUnit: entry.sizeUnit,
      // { [size]: { price, oldPrice, discount } } or null — see
      // buildSizePricing above for how this gets populated.
      sizePricing: buildSizePricing(entry, entry.sizes || [], price, discount),
      description:
        'Made from premium quality fabric for everyday comfort and durability. Easy to maintain and perfect for all-day wear. Available in multiple colors — pick your favorite shade above.',
    }
  })
}

export const allProducts = [
  ...buildCategory(withVariants(menCatalog), 'men'),
  ...buildCategory(withVariants(womenCatalog), 'women'),
  ...buildCategory(withVariants(kidsBoysCatalog), 'boys'),
  ...buildCategory(withVariants(kidsGirlsCatalog), 'girls'),
]

// To put a product in "Best Sellers" or "New Arrivals", just add it here —
// you don't need to go find and tag the product itself. Match by category +
// its exact `name` from the catalog above (e.g. the `name: 'Bras'` line).
// Remove a line to take a product back out of that section.
export const bestSellerPicks = [
  { category: 'men', name: 'T-Shirts MT-911' },
  { category: 'women', name: 'Sona' },
  { category: 'boys', name: 'Boys T-Shirt – BT-212' },
  { category: 'girls', name: 'Girls T-Shirt – GT-507' },
]

// New Arrivals — just a flat list of exact product `name`s (same style as
// homepageTopsPicks below), no category needed since names are unique
// across the whole catalog. Add/remove/reorder names here to change what
// shows in the homepage New Arrivals grid — every name listed here shows
// (no per-category limit), in the EXACT order you list them below,
// left-to-right / top-to-bottom in the grid. No automatic regrouping by
// category — the order here IS the order on the site.
export const newArrivalPicks = [
  'T-Shirts Rolex',
  'T-Shirt GT-801',
  'Boys T-Shirt – Hero',
  'Girls Full Pant Set – Jara',
  'Kids Five Sleeve T-Shirt – Jackson',
  'Divya',
  'Boys T-Shirt – Rio Set (5 Pcs)',
  'Girls Full Pant Set – Maya',
]

function isPicked(picks, product) {
  return picks.some((pick) =>
    typeof pick === 'string'
      ? pick === product.name
      : pick.category === product.category && pick.name === product.name
  )
}

allProducts.forEach((p) => {
  p.isBestSeller = isPicked(bestSellerPicks, p)
  p.isNew = isPicked(newArrivalPicks, p)
})

// ─────────────────────────────────────────────────────────────────────────
// Homepage "Women's Collections" row picks — Nighty / Bras / Panties /
// Slips / Tights (the section on the homepage right below Best Sellers /
// New Arrivals, where each row shows a set of style cards + a "View All"
// button).
//
// Works exactly like bestSellerPicks / newArrivalPicks above: list the
// styles you want to show, in the order you want them to appear, using
// each product's exact `label` (or `name` if it has no separate label).
// Add a line to show a style, remove a line to hide it, reorder lines to
// reorder the row. No other file needs to change — WomensInnerwearShowcase.jsx
// reads straight from these lists (homepageTightsPicks feeds the Tights row,
// formerly the Shorts row — the Women Innerwear "Shorts" category was
// removed and its styles folded into Tights).
//
// Current catalog options for reference (spelled exactly as they must be
// typed here):
//   Nighty:   Sathya, Full Open, Front Fleet Zip, Embroidery, Calandulla,
//             Fleet Zip, Dairy Milk, Piping, Rose, Rayon, Feeding, Alpine,
//             Rayan Embroidery, Rayan, Chudi Cut, Nighty Cut, Manasi,
//             3/4th Hand Sadha, 3/4th Alpine, 3/4th Alpine Premium, Tulip,
//             Frock, Snow Drop, Elastic, Irsi, Taitanic, Goat Model,
//             Alfine Emporiding, Collar, Embroidaring Kit Kat, Orchid,
//             Fleet Zip Floral, Piping Zip, Single Frill, Lily
//   Bras:     Dilse, Jara, Sponge Colours, Padded Bra, Sports Bra,
//             T-Shirt Bra, Strapless Bra, Push-Up Bra, Roshini, Aster,
//             Mothers Bra, Safa C Cup, Support Bra, Sweety Pad,
//             Lissy Print, Teenage Colours, Teenage Smart, Gym Fit,
//             Sports Plus, Sports Colours, Sports X, Sports Free,
//             Teenage Mould, Priya Mould, Honey Lite Pad
//   Panties:  Lotus I.E (M.Box), Lotus O.E (M.Box), Lovely I.E Print
//             (M.Box), Lovely O.E Print (M.Box), Lotus I.E (S.Box),
//             Lotus O.E (S.Box), Lovely I.E Print (S.Box), Lovely Print
//             O.E (S.Box), Lady Care Plain O.E (M.Box), Lady Care Print
//             O.E (M.Box), Lady Care Plain O.E (S.Box), Lady Care Print
//             O.E (S.Box), Leo IE Print (S.Box), Leo IE Plain (S.Box),
//             Aster IE (S.Box)
//   Slips:    Jasmine, Kajol, Lily, Lamis, Breeze, Julle 6 Pcs, Daisy,
//             Saniya 6 Pcs
//   Tights:   Tights White, Tights Skin, Tights Black, Tights Colours
//   Tops:     Side Open Top, Maroon Butta Side Open Long Top, Teal Floral
//             Side Open Long Top, Pink Floral Side Open Long Top, Black
//             Butta Side Open Long Top, Navy Floral Side Open Long Top,
//             Plum Floral Side Open Long Top, Pink Butta Side Open Long
//             Top, Blue Patchwork Floral Side Open Long Top, Maroon Leaf
//             Print Side Open Long Top, Peach Vertical Stripe Side Open
//             Long Top, Purple Leaf Motif Side Open Long Top,
//             SMulticolor Floral Side Open Long Top, Aqua Swirl Print
//             Side Open Long Top, Sky Blue Floral Side Open Long Top,
//             Dusty Mauve Floral Side Open Long Top, Sage Abstract Side
//             Open Long Top, Crimson Floral Side Open Long Top, Plum
//             Mini Print Side Open Long Top, Hot Pink Floral Side Open
//             Long Top, Mustard Geometric Side Open Long Top, Dusty Rose
//             Mini Print Side Open Long Top, Prince Cut Long Top, Coral
//             Blossom Printed Prince cut, Plum Daisy Printed Prince Cut,
//             Blush Pink Floral Prince Cut Long Top, Black Striped
//             Prince Cut Long Top, Teal Printed Prince Cut Long Top,
//             Magenta Floral Prince Cut Long Top, Brown Floral Prince
//             Cut Long Top, Rose Pink Floral Prince Cut Long Top, Aqua
//             Swirl Prince Cut Long Top, 18 Kg Rayon Co-Ord Set, 24 Kg
//             Rayon Co-Ord Set, Cherry Blossom Printed Kurta Set, Maroon
//             Garden Printed Kurta Set, Powder Blue Bloom Kurta Set,
//             Teal Blossom Printed Kurta Set, Plum Abstract Wave Printed
//             Kurta Set, Olive Bloom Printed Kurta Set, Blush Botanical
//             Printed Kurta Set, Mauve Blossom Printed Kurta Set,
//             Umbrella Cut Top, Anarkali
//
//   Note: unlike the other rows, Tops picks are matched by each product's
//   exact `name` (several Tops share one style `label`, e.g. many prints
//   are all labeled "Side Open Top" — matching by name keeps only the
//   ones actually listed below instead of pulling in every color/print).
// ─────────────────────────────────────────────────────────────────────────
// Each entry must match a product's exact `name` in products.js below (the
// Nighty entries are named like "Nighty Calandulla", "Nighty Full Open",
// etc — not just "Calandulla" / "Full Open"). Search this file for the
// name to double check before adding it here.
export const homepageNightyPicks = [
  'Nighty Calandulla',
  'Nighty Single Frill',
  'Nighty Taitanic',
  'Nighty Frock',
  'Nighty Fleet Zip',
  'Nighty Goat Model',
  'Nighty 3/4th Hand Sadha',
  'Nighty Rose',
]
export const homepageTopsPicks = [
  'Hot Pink Floral Side Open Long Top',
  'Fuchsia Bloom Vertican Co-Ord Top Print Set',
  'Plum Small Buti Print Umbrella Cut Top',
  'Anarkali',
  'Prince Cut Long Top',
  'Rani Pink Floral Embroidered Georgette Top',
  'Blush Botanical Printed Co-Ord Set',
  'Royal Purple Floral Embroidered Georgette Top',
]

export const homepageBraPicks = [
  'Dilse',
  'Jara',
  'Sponge Colours',
  'Sports Fit',
  'Sports Plus',
  'T-Shirt Bra',
  'Strapless Bra',
  'Teenage Smart',
]

export const homepagePantiesPicks = [
  'Leo IE Print',
  'Leo IE Plain',
  'Lady Care Print O.E',
  'Lady Care Plain O.E',
  'Lotus I.E',
  'Lovely I.E Print',
  'Lotus O.E',
  'Lovely O.E Print',
  
]

export const homepageSlipsPicks = [
  'Kajol',
  'Jasmine',
  'Lamis',
  'Julle',
]

export const homepageTightsPicks = [
  'Tights White',
  'Tights Skin',
  'Tights Black',
  'Tights Colours',
]

export const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 8)
export const bestSellerProducts = allProducts.filter((p) => p.isBestSeller).slice(0, 8)

// ─────────────────────────────────────────────────────────────────────────
// Offers page picks — powers BOTH the dedicated Offers page (/offers,
// src/pages/Offers.jsx) and the "Special Offers" row under the banner on
// the homepage (src/components/home/OffersSection.jsx). Nothing here is
// driven by each product's `discount` field — this list is the only thing
// that controls which products show up as offers, so you have full control
// over exactly what appears.
//
// Works exactly like bestSellerPicks above: add a line to feature a
// product, remove a line to drop it, reorder lines to reorder it within
// its category's row. Match each entry's `category` + exact `name` from
// the catalog above. Products are grouped into Men / Women / Boys / Girls
// sections automatically based on `category` — you don't need to sort them
// yourself, just list every product you want to feature, in any order.
export const offerPicks = [
  { category: 'men', name: 'Trunks' },
  { category: 'men', name: 'T-Shirts MTC-901' },
  { category: 'men', name: 'Track Pant Airforce' },
  { category: 'men', name: 'Shorts Piolet' },
  { category: 'women', name: 'Dilse' },
  { category: 'women', name: 'Sona' },
  { category: 'women', name: 'Sneha' },
  { category: 'women', name: 'Kajal' },
  { category: 'boys', name: 'Boys T-Shirt – BT-212' },
  { category: 'boys', name: 'Boys Round Neck T-Shirt – Royal' },
  { category: 'boys', name: 'Boys Shorts Set – Don' },
  { category: 'boys', name: 'Boys Full Pant Set – Rider' },
  { category: 'girls', name: 'Girls T-Shirt – GT-507' },
  { category: 'girls', name: 'Girls Full Pant Set – Flora' },
  { category: 'girls', name: 'Girls Full Pant Set – Angel' },
  { category: 'girls', name: 'Girls 3/4th Set – Sakshi' },
]

export function getProductById(id) {
  return allProducts.find((p) => p.id === id)
}

export function getProductsByCategory(category) {
  if (!category || category === 'all') return allProducts
  return allProducts.filter((p) => p.category === category)
}

export function getProductsBySubCategory(subCategory) {
  if (!subCategory) return allProducts
  return allProducts.filter((p) => p.subCategory === subCategory)
}

