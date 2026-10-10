// DEFAULT content for the About Us page (src/pages/About.jsx).
//
// This is what the page shows until an admin saves their own version from
// Admin -> About Us Page. "Reset to defaults" in Admin goes back to this.
//
// Text placeholders you can use in any text field:
//   {products}  -> live number of products in the shop (e.g. 338)
//   {fabrics}   -> the 3 most common fabrics (e.g. "rayon, cotton, cotton hosiery")
//
// Images: leave an image empty to let the page pick one automatically from
// your product catalogue. Nothing here needs the public/ folder to exist.
export const aboutDefaults = {
  hero: {
    eyebrow: 'Est. Pollachi, Tamil Nadu',
    title: 'Clothing for the whole family, made in Pollachi',
    text: "From everyday tops, nighties and innerwear to t-shirts, track pants and kids' wear, every product on VSS Textiles is made where the yarn is knit, cut and stitched, and sold to you without the extra markup.",
  },
  story: {
    eyebrow: 'Our story',
    title: "Good clothing shouldn't cost a fortune",
    paragraph1:
      "VSS Textiles started as a single garment shop and grew alongside Pollachi's knitwear industry. Today our range covers {products}+ styles across men's, women's, boys' and girls' wear, in fabrics like {fabrics} and more.",
    paragraph2:
      'Our team personally checks stitching and fabric quality before any product goes live, so you can shop with confidence.',
    image: '', // empty = automatic product photo
  },
  categories: {
    eyebrow: 'What we make',
    title: 'Something for everyone at home',
    // image / details empty = automatic (catalogue image, live list of types)
    items: [
      { id: 'men', image: '', details: '' },
      { id: 'women', image: '', details: '' },
      { id: 'boys', image: '', details: '' },
      { id: 'girls', image: '', details: '' },
    ],
  },
  range: {
    eyebrow: 'Our product range',
    title: "What you'll find on VSS Textiles",
    showFabrics: true,
    // Per product type overrides: { [typeLabel]: { image, hidden } }
    overrides: {},
  },
  process: {
    eyebrow: "How it's made",
    title: 'From yarn to your doorstep',
    steps: [
      { id: 'step-1', title: 'Yarn & Dye', desc: 'Cotton and cotton-blend yarns selected for softness, then dyed in small, controlled batches for consistent colour.' },
      { id: 'step-2', title: 'Knit & Cut', desc: 'Fabric is knit in-house and layer-cut to pattern, so every size in a run holds the same fit and finish.' },
      { id: 'step-3', title: 'Check & Pack', desc: 'Every piece is hand-checked for stitching and fabric flaws before it is folded, tagged and shipped.' },
    ],
  },
  // Video section: how we work, from production to your doorstep.
  // `src` can be a YouTube link or a video file path (e.g. '/videos/packing.mp4').
  // An empty `src` shows a "Video coming soon" card, so nothing breaks before
  // the videos are filmed or before a public/ folder exists.
  videos: {
    eyebrow: 'Inside VSS Textiles',
    title: 'See How We Work',
    subtitle: 'From our production floor to packing, the warehouse and the truck that brings it to you.',
    items: [
      { id: 'vid-company', tag: 'Our Company', title: 'About VSS Textiles', desc: 'Who we are, our people and how a Pollachi garment shop grew into a family clothing brand.', poster: '', src: '', active: true },
      { id: 'vid-production', tag: 'Production', title: 'How Our Products Are Made', desc: 'Knitting, cutting and stitching: watch a garment take shape on our production floor.', poster: '', src: '', active: true },
      { id: 'vid-quality', tag: 'Quality Check', title: 'Checking Every Piece', desc: 'Stitching and fabric are hand-checked before anything is folded and tagged.', poster: '', src: '', active: true },
      { id: 'vid-packing', tag: 'Packing', title: 'Packing Your Order', desc: 'Folding, tagging and carefully packing each order so it arrives fresh.', poster: '', src: '', active: true },
      { id: 'vid-warehouse', tag: 'Warehouse', title: 'Inside Our Warehouse', desc: 'Stock is sorted by style, size and colour so orders go out fast and right.', poster: '', src: '', active: true },
      { id: 'vid-transport', tag: 'Transportation', title: 'On the Road to You', desc: 'Loading, dispatch and delivery: how your parcel travels from Pollachi to your door.', poster: '', src: '', active: true },
    ],
  },
  // auto: 'products' | 'collections' | 'fabrics' | '' . With an auto type and an
  // empty value, the number is counted live from your catalogue.
  stats: [
    { id: 'stat-1', auto: 'products', value: '', label: 'Products in our range' },
    { id: 'stat-2', auto: 'collections', value: '', label: 'Collections: Men, Women, Boys, Girls' },
    { id: 'stat-3', auto: 'fabrics', value: '', label: 'Fabric types' },
    { id: 'stat-4', auto: '', value: '10+', label: 'Years in Pollachi' },
  ],
}
