/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
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
