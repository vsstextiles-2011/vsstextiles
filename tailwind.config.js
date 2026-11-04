/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Foldable-phone / foldable-laptop screens. Use as variants, e.g.
      // `fold-cover:grid-cols-1`, `fold-open:grid-cols-4`.
      screens: {
        // Phones (anything narrower than Tailwind's `sm`, incl. folded cover screens).
        phone: { max: '639px' },
        // Folded cover screens (Galaxy Z Fold ~280-344px wide).
        'fold-cover': { raw: '(max-width: 359px)' },
        // Unfolded inner screens: big but near-square (Galaxy Z Fold, Pixel Fold,
        // Surface Duo single pane...) - too wide for the phone layout, too
        // squat for the desktop one.
        'fold-open': { raw: '(min-width: 600px) and (max-width: 1023px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4)' },
        // Foldable laptops (Asus Zenbook Fold 1280x853, 3:2): desktop layout
        // but with less height to work with.
        'fold-laptop': { raw: '(min-width: 1024px) and (max-width: 1440px) and (max-aspect-ratio: 3/2)' },
        // Dual-screen devices with a hinge (Surface Duo, Edge/Chrome spanning).
        'fold-dual': { raw: '(horizontal-viewport-segments: 2)' },
        // Hinge across the middle (top screen / bottom screen).
        'fold-dual-v': { raw: '(vertical-viewport-segments: 2)' },
      },
      fontFamily: {
        // Body copy: a quiet humanist sans — deliberately not the geometric
        // Poppins look that most Tirupur garment-brand sites default to.
        poppins: ['Inter', 'sans-serif'],
        // Display: an editorial serif with real personality, used big and
        // with restraint (headlines, pull quotes) rather than everywhere.
        display: ['Fraunces', 'serif'],
        // Utility face for anything that reads like a spec: prices, SKU
        // codes, GSM/fabric composition, order numbers — the "spec sheet"
        // register of a manufacturer, not a boutique.
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        // Primary — the VSS signature red, lifted straight from the logo.
        brand: {
          DEFAULT: '#EC3237',
          dark: '#C21F26',
          darker: '#8B1015',
          light: '#FDECEC',
          soft: '#F9C9CA',
        },
        // Accent — near-black, used for contrast badges/CTAs against the red.
        gold: {
          DEFAULT: '#1A1A1A',
          dark: '#000000',
          light: '#F2F2F2',
        },
        // Tertiary — deep maroon, sits between red and black for sale tags.
        madras: {
          DEFAULT: '#8B1015',
          light: '#FBE2E2',
        },
        // Base canvas — clean white instead of warm ivory.
        cream: {
          DEFAULT: '#FFFFFF',
          dark: '#F7F7F7',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#5C5C5C',
        },
        thread: '#E8E8E8',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
}
