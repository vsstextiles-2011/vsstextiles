// Auto-generates the "Style / Material / Color Combination / Fit /
// Versatility" detail block + closing line + disclaimer shown on every
// product page (see Product.jsx), matching the layout used across
// reference storefronts: a numbered 5-point breakdown, a one-line summary,
// and a bold disclaimer about colour/lighting variance.
//
// HOW IT PICKS CONTENT FOR A PRODUCT:
// 1. If the catalog entry itself sets `fabric`, that exact fabric name is
//    used in the Material section instead of the type default below.
// 2. The right template is chosen by matching `menuParent` (falling back to
//    the product name for the handful of items with no menuParent, e.g.
//    "Trunks") against TYPE_TEMPLATES.
// 3. Anything that matches nothing gets GENERIC_TEMPLATE, so every single
//    product — current and future — always has a full details block and a
//    disclaimer, with no per-product data entry required.
//
// TO CUSTOMIZE ONE PRODUCT SPECIFICALLY (e.g. give "Dilse" its own unique
// copy instead of the shared Bras template), add a `details` object with
// the same shape to that catalog entry in products.js and it will be used
// as-is — see the Dilse entry for a worked example.

export const DISCLAIMER =
  'Actual product colour and design may vary slightly from the image shown, due to lighting conditions and photographic sources.'

function fmtColorList(colors) {
  const names = (colors || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
  if (names.length === 0) return 'multiple shades'
  if (names.length <= 4) return names.join(', ')
  return `${names.slice(0, 4).join(', ')} and ${names.length - 4} more shades`
}

// name -> { fabric, style: [..], colorCombination: [..], fit: [..], versatility: [..], closing }
const TYPE_TEMPLATES = {
  't-shirt': {
    fabric: 'high-quality cotton blend',
    style: [
      'Basic and timeless design for everyday wear.',
      'Classic neckline for a comfortable, versatile fit.',
    ],
    fit: ['Designed with a regular fit to suit all body types.', 'Provides ease of movement without compromising on style.'],
    versatility: ['Ideal for casual outings, gym sessions, or lounging at home.', 'A wardrobe essential for effortless, everyday styling.'],
    pairing: 'jeans, chinos, or shorts for various casual occasions',
    closingNoun: 't-shirt is the perfect blend of comfort, style, and practicality',
  },
  bras: {
    fabric: 'cotton-rich fabric with a touch of stretch',
    style: [
      'Everyday bra silhouette with soft, adjustable straps.',
      'Smooth inner lining designed for all-day, tag-free comfort.',
    ],
    fit: ['True-to-size fit with gentle, non-restrictive support.', 'Wide side wings and straps for a fit that stays put.'],
    versatility: ['Great as a daily essential under regular tops and outerwear.', 'Breathable enough for both everyday wear and warmer days.'],
    pairing: 'everyday tops, kurtis, and outerwear',
    closingNoun: 'bra is built for comfort, support, and all-day wearability',
  },
  panties: {
    fabric: 'soft cotton hosiery fabric',
    style: ['Simple, everyday panty design with a comfortable waistband.', 'Breathable construction made for daily wear.'],
    fit: ['Soft elastic waistband that sits comfortably without digging in.', 'Regular fit designed to suit all body types.'],
    versatility: ['Perfect for daily use under any outfit.', 'A dependable basic for every innerwear drawer.'],
    pairing: 'any outfit as an everyday basic',
    closingNoun: 'panty is made for comfort, breathability, and everyday reliability',
  },
  nighty: {
    fabric: 'soft rayon blend',
    style: ['Relaxed, loose-fit silhouette designed for restful sleep.', 'Easy pull-on styling for everyday comfort at home.'],
    fit: ['Generous, breathable fit that suits all body types.', 'Free movement with no tight or restrictive panels.'],
    versatility: ['Ideal for bedtime, lounging, or relaxed days at home.', 'A comfortable go-to for every season.'],
    pairing: 'a relaxed evening or night in',
    closingNoun: 'nighty is made for comfort, breathability, and a good night’s sleep',
  },
  slips: {
    fabric: 'soft cotton hosiery fabric',
    style: ['Simple camisole-style slip for everyday layering.', 'Lightweight fabric that sits smoothly under outerwear.'],
    fit: ['Regular, comfortable fit that suits all body types.', 'Soft straps designed for all-day wear.'],
    versatility: ['Perfect worn under sarees, kurtis, or as a base layer.', 'A daily essential for smooth, comfortable layering.'],
    pairing: 'sarees, kurtis, and everyday outerwear',
    closingNoun: 'slip is a comfortable, breathable everyday layering essential',
  },
  tights: {
    fabric: 'cotton-lycra stretch fabric',
    style: ['Snug, stretchable leggings-style design.', 'Elasticated waistband for a secure, comfortable fit.'],
    fit: ['Four-way stretch fabric that moves with you.', 'Regular fit designed to suit all body types.'],
    versatility: ['Great for everyday wear, travel, or under longer tops.', 'A practical basic for every season.'],
    pairing: 'kurtis, long tops, and tunics',
    closingNoun: 'tights are made for comfort, stretch, and everyday practicality',
  },
  'track pant': {
    fabric: 'cotton-blend fleece',
    style: ['Relaxed jogger-style fit with an elasticated drawstring waist.', 'Ribbed cuffs for a clean, sporty look.'],
    fit: ['Regular fit designed with ease of movement in mind.', 'Comfortable waistband that sits securely without pinching.'],
    versatility: ['Ideal for workouts, casual outings, or lounging at home.', 'Pairs easily with t-shirts, hoodies, or sweatshirts.'],
    pairing: 't-shirts, hoodies, and sweatshirts',
    closingNoun: 'track pant is built for comfort, movement, and everyday versatility',
  },
  shorts: {
    fabric: 'breathable cotton blend',
    style: ['Classic shorts silhouette with an elasticated waistband.', 'Side pockets designed for everyday convenience.'],
    fit: ['Regular fit that suits all body types.', 'Lightweight fabric that allows free movement.'],
    versatility: ['Ideal for casual outings, workouts, or lounging at home.', 'An easy everyday basic for warmer days.'],
    pairing: 't-shirts and casual tops',
    closingNoun: 'shorts are made for comfort, breathability, and everyday ease',
  },
  'full pant': {
    fabric: 'soft cotton blend',
    style: ['Straight-fit pant designed for everyday comfort.', 'Clean, versatile styling that works for multiple occasions.'],
    fit: ['Regular fit designed to suit all body types.', 'Comfortable waistband for all-day wear.'],
    versatility: ['Works equally well for daily wear or a relaxed outing.', 'Pairs easily with t-shirts, shirts, or kurtis.'],
    pairing: 't-shirts, shirts, and kurtis',
    closingNoun: 'pant is made for comfort, durability, and everyday versatility',
  },
  '3/4th': {
    fabric: 'soft cotton blend',
    style: ['Relaxed 3/4th-length fit for everyday comfort.', 'Elasticated waistband for easy, secure wear.'],
    fit: ['Regular fit designed to suit all body types.', 'Lightweight fabric that allows free movement.'],
    versatility: ['Great for daily wear, travel, or lounging at home.', 'Pairs easily with t-shirts and casual tops.'],
    pairing: 't-shirts and casual tops',
    closingNoun: 'pant is made for comfort, breathability, and everyday ease',
  },
  '3/4th set': {
    fabric: 'soft cotton blend',
    style: ['Coordinated top and 3/4th pant set for effortless dressing.', 'Simple, comfortable styling for everyday wear.'],
    fit: ['Regular fit designed to suit all body types.', 'Soft, stretchable waistband for all-day comfort.'],
    versatility: ['Perfect for lounging at home or casual outings.', 'A ready-made, no-fuss everyday outfit.'],
    pairing: 'sneakers or casual footwear for a complete look',
    closingNoun: 'set is made for comfort, convenience, and easy everyday styling',
  },
  'co-ords & shorts set': {
    fabric: 'soft, breathable cotton blend',
    style: ['Coordinated top and shorts set for effortless, ready-to-wear dressing.', 'Fun printed styling designed for everyday play.'],
    fit: ['Relaxed, easy fit suitable for babies, toddlers, and older kids alike.', 'Soft elasticated waistband for all-day comfort.'],
    versatility: ['Perfect for daily wear, playdates, or short outings — great for babies and young kids alike.', 'A ready-made outfit that pairs the top and shorts in one easy set.'],
    pairing: 'sandals or casual footwear for a complete look',
    closingNoun: 'co-ord set is made for comfort, convenience, and easy everyday styling for babies and kids alike',
  },
  tops: {
    fabric: 'soft cotton-lycra blend',
    style: ['Everyday top with a comfortable, flattering silhouette.', 'Simple detailing designed for versatile styling.'],
    fit: ['Regular fit that suits all body types.', 'Stretchable fabric that moves with you.'],
    versatility: ['Works for daily wear, casual outings, or layering.', 'Pairs easily with jeans, leggings, or 3/4th pants.'],
    pairing: 'jeans, leggings, or 3/4th pants',
    closingNoun: 'top is made for comfort, style, and everyday versatility',
  },
  'crop top': {
    fabric: 'soft cotton-lycra blend',
    style: ['Fitted crop silhouette with a modern, everyday look.', 'Soft stretch fabric designed for easy movement.'],
    fit: ['Fitted through the body with stretch for comfort.', 'Regular sizing designed to suit most body types.'],
    versatility: ['Great for casual outings or layered, everyday looks.', 'Pairs easily with jeans, skirts, or joggers.'],
    pairing: 'jeans, skirts, or joggers',
    closingNoun: 'crop top is made for comfort, stretch, and easy everyday styling',
  },
  hoodie: {
    fabric: 'cotton fleece',
    style: ['Classic hooded silhouette with a relaxed, everyday fit.', 'Ribbed cuffs and hem for a clean, snug finish.'],
    fit: ['Regular fit designed to suit all body types.', 'Soft fleece lining for extra warmth and comfort.'],
    versatility: ['Ideal for cooler days, travel, or lounging at home.', 'Pairs easily with track pants, jeans, or joggers.'],
    pairing: 'track pants, jeans, or joggers',
    closingNoun: 'hoodie is made for comfort, warmth, and everyday versatility',
  },
  'premium vest': {
    fabric: 'combed cotton',
    style: ['Classic vest silhouette designed as an everyday base layer.', 'Simple, breathable construction for daily comfort.'],
    fit: ['Regular fit that sits comfortably under outerwear.', 'Soft fabric that moves with you through the day.'],
    versatility: ['A daily essential worn under shirts or t-shirts.', 'Breathable enough for everyday, all-season wear.'],
    pairing: 'shirts and t-shirts as an inner layer',
    closingNoun: 'vest is made for comfort, breathability, and everyday reliability',
  },
  drawer: {
    fabric: 'combed cotton',
    style: ['Everyday drawer/brief silhouette with a comfortable waistband.', 'Breathable construction made for daily wear.'],
    fit: ['Soft elastic waistband that sits comfortably without digging in.', 'Regular fit designed to suit all body types.'],
    versatility: ['Perfect for daily use under any outfit.', 'A dependable basic for every innerwear drawer.'],
    pairing: 'any outfit as an everyday basic',
    closingNoun: 'is made for comfort, breathability, and everyday reliability',
  },
  jetty: {
    fabric: 'soft cotton blend',
    style: ['Relaxed, easy-wear silhouette designed for everyday comfort.', 'Elasticated waistband for a secure, comfortable fit.'],
    fit: ['Regular fit designed to suit all body types.', 'Lightweight fabric that allows free movement.'],
    versatility: ['Great for daily wear or lounging at home.', 'A comfortable, no-fuss everyday basic.'],
    pairing: 'a comfortable day at home',
    closingNoun: 'is made for comfort, breathability, and everyday ease',
  },
  trunks: {
    fabric: 'combed cotton',
    style: ['Classic trunk silhouette with a comfortable, snug fit.', 'Soft elastic waistband for everyday, all-day wear.'],
    fit: ['Regular fit designed to suit all body types.', 'Breathable fabric that moves with you through the day.'],
    versatility: ['A daily essential innerwear basic.', 'Breathable enough for everyday, all-season wear.'],
    pairing: 'any outfit as an everyday basic',
    closingNoun: 'trunk is made for comfort, breathability, and everyday reliability',
  },
  brief: {
    fabric: 'combed cotton',
    style: ['Classic brief silhouette with a comfortable, snug fit.', 'Soft elastic waistband for everyday, all-day wear.'],
    fit: ['Regular fit designed to suit all body types.', 'Breathable fabric that moves with you through the day.'],
    versatility: ['A daily essential innerwear basic.', 'Breathable enough for everyday, all-season wear.'],
    pairing: 'any outfit as an everyday basic',
    closingNoun: 'brief is made for comfort, breathability, and everyday reliability',
  },
}

const GENERIC_TEMPLATE = {
  fabric: 'premium quality fabric',
  style: ['Simple, everyday design made for comfortable daily wear.', 'Clean styling that works across casual occasions.'],
  fit: ['Regular fit designed to suit all body types.', 'Provides ease of movement without compromising on style.'],
  versatility: ['Ideal for everyday use at home or outdoors.', 'A dependable, easy-to-style wardrobe basic.'],
  pairing: 'the rest of your everyday wardrobe',
  closingNoun: 'piece is made for comfort, durability, and everyday practicality',
}

function normalize(str) {
  return (str || '').toLowerCase().trim()
}

// Returns just the fabric name for a product (e.g. "high-quality cotton
// blend") — the same value used inside the Material/Fabric section below,
// exposed on its own so it can be shown as its own standalone "Fabric"
// label on the product page (see Product.jsx), separate from the numbered
// detail list.
export function getFabricType(product) {
  if (product.details) {
    const materialSection = product.details.sections?.find(
      (s) => normalize(s.title) === 'material' || normalize(s.title) === 'fabric'
    )
    if (product.details.fabric) return product.details.fabric
    if (materialSection?.bullets?.[0]) return materialSection.bullets[0]
  }
  return product.fabric || pickTemplate(product).fabric
}

function pickTemplate(product) {
  const key = normalize(product.menuParent)
  if (key.includes('t-shirt')) return TYPE_TEMPLATES['t-shirt']
  if (TYPE_TEMPLATES[key]) return TYPE_TEMPLATES[key]

  // Handful of items (e.g. men's "Trunks") ship with no menuParent — match
  // on the product's own name instead.
  const name = normalize(product.baseName || product.name)
  if (name.includes('trunk')) return TYPE_TEMPLATES.trunks
  if (name.includes('brief')) return TYPE_TEMPLATES.brief
  if (name.includes('vest')) return TYPE_TEMPLATES['premium vest']

  return GENERIC_TEMPLATE
}

// Returns { sections: [{ title, bullets }], closing, disclaimer } — ready
// to render directly under the product description on the product page.
export function getProductDetails(product) {
  // A catalog entry can opt out of the generator entirely by providing its
  // own fully-formed `details` object (same shape) — used as-is.
  if (product.details) return { ...product.details, disclaimer: product.details.disclaimer || DISCLAIMER }

  const t = pickTemplate(product)
  const fabric = product.fabric || t.fabric
  const colorList = fmtColorList(product.colors)

  const sections = [
    { title: 'Style', bullets: t.style },
    {
      title: 'Fabric',
      bullets: [
        `Made from a ${fabric} for everyday comfort and durability.`,
        'Soft, lightweight construction ensures comfort throughout the day.',
      ],
    },
    {
      title: 'Color Combination',
      bullets: [
        `Available in ${colorList} — pick your favorite shade above.`,
        `Easy to pair with ${t.pairing}.`,
      ],
    },
    { title: 'Fit', bullets: t.fit },
    { title: 'Versatility', bullets: t.versatility },
  ]

  const closing = `This ${product.name} ${t.closingNoun}, making it a genuine wardrobe essential.`

  return { sections, closing, disclaimer: DISCLAIMER }
}
