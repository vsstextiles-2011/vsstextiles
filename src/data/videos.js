// Homepage "Inside VSS" video section (src/components/home/FactoryVideos.jsx).
//
// HOW TO ADD YOUR VIDEOS
//  - Own file:  drop an .mp4 into `public/videos/` and set  src: '/videos/factory-tour.mp4'
//  - YouTube:   paste the normal link, e.g. src: 'https://www.youtube.com/watch?v=XXXXXXXXXXX'
//  - poster:    the thumbnail shown before play (any image under public/images/...)
// Entries with an empty `src` show a "Video coming soon" card, so the section
// looks complete even before every video is filmed. The first entry is the
// big featured player.
export const homeVideos = [
  {
    id: 'factory-tour',
    tag: 'Our Factory',
    title: 'A Walk Through the VSS Factory',
    desc: 'From yarn to finished garment — see where every VSS piece is knitted, cut and stitched.',
    poster: '/images/hero/everyday-essentials.jpg',
    src: '',
  },
  {
    id: 'knitting-cutting',
    tag: 'Our Factory',
    title: 'Knitting & Cutting Floor',
    desc: 'Fabric is checked and cut with care before it reaches the stitching line.',
    poster: '/images/hero/shop-by-categorie.jpg',
    src: '',
  },
  {
    id: 'tshirt-collection',
    tag: 'Our Products',
    title: 'T-Shirt Collection',
    desc: 'Fit, fabric and finish of our everyday tees, up close.',
    poster: '/images/hero/tshirt-collection.jpg',
    src: '',
  },
  {
    id: 'innerwear-collection',
    tag: 'Our Products',
    title: 'Innerwear & Slips',
    desc: 'Soft, comfortable essentials made for all-day wear.',
    poster: '/images/hero/slip-collection.jpg',
    src: '',
  },
]
