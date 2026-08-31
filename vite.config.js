import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Where uploaded product photos get written to on disk. Anything saved
// here lands inside public/, so Vite serves it at /images/uploads/<file>
// immediately — no separate static file server needed.
const UPLOAD_DIR = path.resolve(__dirname, 'public/images/uploads')

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'photo'
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
        const ext = EXT_BY_MIME[mime]
        if (!ext) {
          res.statusCode = 400
          res.end('Unsupported image type')
          return
        }

        const rawName = decodeURIComponent(req.headers['x-file-name'] || 'photo')
        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('error', () => {
          res.statusCode = 500
          res.end('Upload failed')
        })
        req.on('end', () => {
          try {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true })

            const base = slugify(rawName)
            let filename = `${base}${ext}`
            let counter = 1
            // Don't clobber an existing file with the same name — append
            // -2, -3, etc. until we land on a free filename.
            while (fs.existsSync(path.join(UPLOAD_DIR, filename))) {
              filename = `${base}-${counter}${ext}`
              counter += 1
            }

            fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.concat(chunks))

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ path: `/images/uploads/${filename}` }))
          } catch (err) {
            res.statusCode = 500
            res.end('Upload failed')
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), imageUploadPlugin()],
})
