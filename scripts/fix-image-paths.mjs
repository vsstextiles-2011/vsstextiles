// Self-healing image path checker/fixer.
//
// Why this exists: a couple of products (Leo, GT-801) had their image paths
// in src/data/products.js pointing at a folder that didn't actually contain
// the photo -- the real file was one folder over, or one level deeper, than
// the path on record. The site's <img> tag would 404 and silently swap in
// the grey placeholder icon (see src/utils/imgFallback.js), which is
// confusing because nothing "errors" loudly -- it just looks broken.
//
// This script closes that loop automatically: every time the project is
// run or built, it re-checks every /images/products/... path referenced in
// products.js against what's actually on disk in public/images/products,
// and if a path is broken but there's exactly one file anywhere under
// public/images/products with that same filename, it rewrites the path in
// products.js to point at the real file. No manual Admin-panel editing
// needed for this class of mistake ever again.
//
// It deliberately does NOT guess when a filename doesn't exist anywhere, or
// exists in more than one place -- those are surfaced as clear warnings
// instead, because silently picking the wrong one of two candidates would
// just trade one invisible bug for another.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const IMAGES_ROOT = path.join(PUBLIC_DIR, 'images', 'products')
const PRODUCTS_FILE = path.join(ROOT, 'src', 'data', 'products.js')

// Matches any quoted string starting with /images/products/ and ending in a
// known image extension, in single or double quotes.
const IMAGE_PATH_RE = /(['"])(\/images\/products\/[^'"]+?\.(?:jpe?g|png|webp|gif|avif|bmp|tiff?))\1/g

function walkImageFiles(dir) {
  /** @type {Map<string, string[]>} lowercase basename -> list of "/images/products/..." paths */
  const byBasename = new Map()

  function walk(current) {
    let entries
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile()) {
        const relFromPublic = '/' + path.relative(PUBLIC_DIR, full).split(path.sep).join('/')
        const key = entry.name.toLowerCase()
        if (!byBasename.has(key)) byBasename.set(key, [])
        byBasename.get(key).push(relFromPublic)
      }
    }
  }

  walk(dir)
  return byBasename
}

export function fixImagePaths({ write = true, log = true } = {}) {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    return { fixed: [], missing: [], ambiguous: [] }
  }

  const byBasename = walkImageFiles(IMAGES_ROOT)
  let source = fs.readFileSync(PRODUCTS_FILE, 'utf8')

  const fixed = []
  const missing = []
  const ambiguous = []
  const seen = new Set()

  source = source.replace(IMAGE_PATH_RE, (match, quote, refPath) => {
    if (seen.has(refPath)) return match // already resolved this exact string once
    seen.add(refPath)

    const onDisk = path.join(PUBLIC_DIR, refPath.replace(/^\//, ''))
    if (fs.existsSync(onDisk)) return match // already correct, leave it alone

    const basename = path.basename(refPath).toLowerCase()
    const candidates = byBasename.get(basename) || []

    if (candidates.length === 1) {
      fixed.push({ from: refPath, to: candidates[0] })
      return match // handled via global replace below, once we know the mapping
    } else if (candidates.length === 0) {
      missing.push(refPath)
    } else {
      ambiguous.push({ path: refPath, candidates })
    }
    return match
  })

  // Apply the confirmed fixes as straight string replacements across the
  // whole file (a broken path can appear more than once, e.g. shared
  // between `image` and a colorImages entry).
  for (const { from, to } of fixed) {
    source = source.split(from).join(to)
  }

  if (write && fixed.length > 0) {
    fs.writeFileSync(PRODUCTS_FILE, source)
  }

  if (log) {
    if (fixed.length > 0) {
      console.log(`\n[fix-image-paths] Auto-corrected ${fixed.length} broken image path(s) in products.js:`)
      for (const { from, to } of fixed) {
        console.log(`  ${from}\n    -> ${to}`)
      }
    }
    if (missing.length > 0) {
      console.warn(`\n[fix-image-paths] WARNING: ${missing.length} image path(s) reference a file that doesn't exist anywhere under public/images/products. These need a real photo uploaded, not just a path fix:`)
      for (const m of missing) console.warn(`  ${m}`)
    }
    if (ambiguous.length > 0) {
      console.warn(`\n[fix-image-paths] WARNING: ${ambiguous.length} broken path(s) matched more than one file on disk, so nothing was auto-picked. Please choose the right one manually:`)
      for (const a of ambiguous) {
        console.warn(`  ${a.path}`)
        for (const c of a.candidates) console.warn(`    - ${c}`)
      }
    }
    if (fixed.length === 0 && missing.length === 0 && ambiguous.length === 0) {
      console.log('[fix-image-paths] All image paths in products.js check out.')
    }
  }

  return { fixed, missing, ambiguous }
}

// Allow running directly: `node scripts/fix-image-paths.mjs`
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  fixImagePaths()
}
