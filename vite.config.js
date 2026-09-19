import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fixImagePaths } from './scripts/fix-image-paths.mjs'

// Where uploaded product photos get written to on disk. Anything saved
// here lands inside public/, so Vite serves it at /images/uploads/<file>
// immediately — no separate static file server needed.
const UPLOAD_DIR = path.resolve(__dirname, 'public/images/uploads')

// Runs on every `npm run dev` and `npm run build`: checks every image path
// referenced in src/data/products.js against what's actually on disk, and
// auto-corrects any that point at the wrong folder (this is what used to
// show up as a broken placeholder t-shirt icon on the site, e.g. the Leo
// and GT-801 products). No manual path-fixing in Admin needed for this —
// see scripts/fix-image-paths.mjs for exactly how it decides what's safe to
// auto-fix vs. what it just warns about.
fixImagePaths()

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/x-icon': '.ico',
  'image/heic': '.heic',
  'image/heif': '.heif',
}
// Recognised image extensions, used to trust the extension the file already
// has on disk rather than force-mapping from Content-Type. This means any
// image the browser reports as "image/*" gets saved even if its specific
// subtype isn't in EXT_BY_MIME above (heic, apng, whatever comes next).
const KNOWN_IMAGE_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif',
  '.bmp', '.tiff', '.tif', '.ico', '.heic', '.heif', '.jfif',
])

// Keeps the admin's original filename intact -- only strips characters that
// would break the filesystem or escape UPLOAD_DIR (path separators, null
// bytes, leading dots/slashes). Case, spaces, and punctuation are left as
// the admin typed them, so "Boys T-Shirt Leo Red.JPG" stays exactly that.
function sanitizeFilename(name) {
  const cleaned = String(name)
    .replace(/[\\/]/g, '-') // no path separators
    .replace(/\0/g, '') // no null bytes
    .replace(/^\.+/, '') // no leading dots (hidden files / ".." segments)
    .trim()
  return cleaned || 'photo'
}

function splitNameAndExt(filename) {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) return { base: filename, ext: '' }
  return { base: filename.slice(0, dot), ext: filename.slice(dot).toLowerCase() }
}

// Dev-only API: POST /api/upload with a raw image body (see fetch call in
// ImageUploadField) writes the file into public/images/uploads and returns
// its public path. This only runs while `npm run dev` / `vite preview` is
// active — it's Vite's own Node process handling the request, not a
// separate backend. A production static host (Netlify, Vercel static,
// GitHub Pages, etc.) has no Node process behind it, so this endpoint
// won't exist there; see the note in ImageUploadField's catch block.
function imageUploadPlugin() {
  return {
    name: 'vss-image-upload',
    configureServer(server) {
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const mime = req.headers['content-type'] || 'application/octet-stream'

        let rawName = 'photo'
        try {
          rawName = decodeURIComponent(req.headers['x-file-name'] || 'photo')
        } catch {
          // Malformed header (rare) -- fall back to the raw, un-decoded
          // value rather than failing the whole upload over a filename.
          rawName = req.headers['x-file-name'] || 'photo'
        }
        rawName = sanitizeFilename(rawName)

        const { base, ext: extFromName } = splitNameAndExt(rawName)
        // Trust the file's own extension when it's a recognised image type
        // (this is what keeps the saved file's name identical to what was
        // uploaded); only fall back to guessing from Content-Type when the
        // filename has no usable extension of its own. Never hard-reject --
        // an unrecognised type still gets saved (defaulting to .jpg) rather
        // than surfacing an error on the page.
        const ext = KNOWN_IMAGE_EXT.has(extFromName) ? extFromName : EXT_BY_MIME[mime] || '.jpg'

        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('error', () => {
          // Even on a stream error, respond with something the client's
          // fetch() can parse-fail-gracefully on rather than hanging --
          // ImageUploadField already falls back to an in-browser preview
          // if this endpoint doesn't return path: '...'.
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Upload stream failed' }))
        })
        req.on('end', () => {
          try {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true })

            let filename = `${base}${ext}`
            let counter = 1
            // Don't clobber an existing file with the same name -- keep
            // the exact original name, just add " (1)", " (2)", etc. right
            // before the extension until we land on a free filename.
            while (fs.existsSync(path.join(UPLOAD_DIR, filename))) {
              filename = `${base} (${counter})${ext}`
              counter += 1
            }

            fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.concat(chunks))

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: `/images/uploads/${filename}` }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Upload failed' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), imageUploadPlugin()],
})
