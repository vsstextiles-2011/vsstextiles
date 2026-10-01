import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { heroSlides as defaultHeroSlides } from '../data/heroSlides.js'
import { homeVideos as defaultHomeVideos } from '../data/videos.js'
import { CURSOR_STYLE_IDS, DEFAULT_CURSOR_STYLE } from '../components/common/cursorEngine.js'

// Editable homepage content that lives in Firestore instead of source code.
// Right now that's just the hero slider (document: siteContent/heroSlides),
// but any future "edit this from Admin" block can live in the same
// collection.
//
// `data/heroSlides.js` stays as the DEFAULT slides: what the site shows
// until an admin saves their own set, and what "Reset to defaults" in the
// Admin panel goes back to. Once a document exists in Firestore it is the
// single source of truth and every visitor sees admin edits live.
//
// Firestore rules (see firestore.rules): anyone can read siteContent, only a
// signed-in admin can write it.

const SiteContentContext = createContext(null)

const SITE_COLLECTION = 'siteContent'
const HERO_DOC_ID = 'heroSlides'
const HERO_CACHE_KEY = 'vss_hero_slides_cache_v1'
const VIDEOS_DOC_ID = 'homeVideos'
const VIDEOS_CACHE_KEY = 'vss_home_videos_cache_v1'
const CURSOR_DOC_ID = 'cursorSettings'
const CURSOR_CACHE_KEY = 'vss_cursor_settings_cache_v1'

// Storefront mouse-cursor settings (document: siteContent/cursorSettings).
// Edited from Admin -> Cursor: on/off plus which of the four animation
// styles to use. Until an admin saves something the cursor is ON with the
// default style.
const DEFAULT_CURSOR = { enabled: true, style: DEFAULT_CURSOR_STYLE }

function normalizeCursor(d) {
  return {
    enabled: d?.enabled !== false,
    style: CURSOR_STYLE_IDS.includes(d?.style) ? d.style : DEFAULT_CURSOR_STYLE,
  }
}

function loadCachedCursor() {
  try {
    const raw = localStorage.getItem(CURSOR_CACHE_KEY)
    return raw ? normalizeCursor(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

// Homepage "See How We Make It" videos (document: siteContent/homeVideos).
// data/videos.js holds the defaults, same pattern as the hero slides.
function normalizeVideo(v, i) {
  return {
    id: String(v?.id ?? `video-${i}-${Date.now().toString(36)}`),
    tag: v?.tag === 'Our Products' ? 'Our Products' : 'Our Factory',
    title: v?.title ?? '',
    desc: v?.desc ?? '',
    poster: v?.poster ?? '',
    src: v?.src ?? '',
    active: v?.active !== false,
  }
}
const DEFAULT_VIDEOS = defaultHomeVideos.map(normalizeVideo)

function loadCachedVideos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(VIDEOS_CACHE_KEY) || 'null')
    return Array.isArray(parsed) ? parsed.map(normalizeVideo) : null
  } catch {
    return null
  }
}

// Mirrors the last real Firestore value in this browser so the FIRST paint
// of the homepage already shows the admin's slides instead of flashing the
// built-in defaults for a moment (same idea as the products cache).
function loadCachedSlides() {
  try {
    const raw = localStorage.getItem(HERO_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    return null
  }
}

function cacheSlides(list) {
  try {
    localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(list))
  } catch {
    // Caching is a nicety only — ignore quota / private-mode errors.
  }
}

function clearCachedSlides() {
  try {
    localStorage.removeItem(HERO_CACHE_KEY)
  } catch {
    /* ignore */
  }
}

// Normalises one slide from either source (static file or Firestore) into
// the exact shape the storefront + admin editor both use.
function normalizeSlide(s, i) {
  const ctaTo = s?.ctaTo ?? s?.cta?.to ?? '/shop'
  const ctaLabel = s?.ctaLabel ?? s?.cta?.label ?? 'Shop Now'
  return {
    id: String(s?.id ?? `slide-${i}-${Date.now().toString(36)}`),
    title: s?.title ?? s?.eyebrow ?? '',
    image: s?.image ?? '',
    ctaLabel,
    ctaTo,
    // Only an explicit `false` hides a slide.
    active: s?.active !== false,
  }
}

const DEFAULT_SLIDES = defaultHeroSlides.map(normalizeSlide)

function friendlyWriteError(error) {
  if (error?.code === 'permission-denied') {
    return 'Firestore rejected that change -- you must be signed in as an active admin, and the updated firestore.rules (with the siteContent block) must be published.'
  }
  return error?.message || 'Something went wrong saving to Firestore.'
}

// Slides to show/preload on the very first paint, before Firestore answers:
// the cached admin set if there is one, otherwise the built-in defaults.
export function getInitialHeroSlides() {
  const cached = loadCachedSlides()
  const list = cached ? cached.map(normalizeSlide) : DEFAULT_SLIDES
  return list.filter((s) => s.active && s.image)
}

export function SiteContentProvider({ children }) {
  const [slides, setSlides] = useState(() => {
    const cached = loadCachedSlides()
    return cached ? cached.map(normalizeSlide) : DEFAULT_SLIDES
  })
  // True when an admin has saved their own set (a Firestore doc exists).
  const [isCustomized, setIsCustomized] = useState(false)
  const [videos, setVideos] = useState(() => loadCachedVideos() || DEFAULT_VIDEOS)
  const [videosCustomized, setVideosCustomized] = useState(false)
  const [cursorSettings, setCursorSettings] = useState(() => loadCachedCursor() || DEFAULT_CURSOR)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, SITE_COLLECTION, CURSOR_DOC_ID),
      (snap) => {
        // An empty answer from the local cache isn't proof that nothing is saved
        // (it just means Firestore hasn't reached the server yet) — keep what we have.
        if (!snap.exists() && snap.metadata.fromCache) return
        const next = snap.exists() ? normalizeCursor(snap.data()) : DEFAULT_CURSOR
        setCursorSettings(next)
        try {
          localStorage.setItem(CURSOR_CACHE_KEY, JSON.stringify(next))
        } catch {
          /* cache is a nicety only */
        }
      },
      (error) => console.error('Firestore cursorSettings listener failed:', error),
    )
    return unsubscribe
  }, [])

  const saveCursorSettings = useCallback(async (next) => {
    const clean = normalizeCursor(next)
    try {
      await setDoc(doc(db, SITE_COLLECTION, CURSOR_DOC_ID), { ...clean, updatedAt: serverTimestamp() })
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, SITE_COLLECTION, VIDEOS_DOC_ID),
      (snap) => {
        const data = snap.exists() ? snap.data() : null
        try {
          if (data && Array.isArray(data.videos)) {
            const next = data.videos.map(normalizeVideo)
            setVideos(next)
            setVideosCustomized(true)
            localStorage.setItem(VIDEOS_CACHE_KEY, JSON.stringify(next))
          } else {
            setVideos(DEFAULT_VIDEOS)
            setVideosCustomized(false)
            localStorage.removeItem(VIDEOS_CACHE_KEY)
          }
        } catch {
          /* cache is a nicety only */
        }
      },
      (error) => console.error('Firestore homeVideos listener failed:', error),
    )
    return unsubscribe
  }, [])

  const saveHomeVideos = useCallback(async (next) => {
    const clean = next.map((v, i) => {
      const n = normalizeVideo(v, i)
      return { ...n, title: n.title.trim(), desc: n.desc.trim(), poster: n.poster.trim(), src: n.src.trim() }
    })
    try {
      await setDoc(doc(db, SITE_COLLECTION, VIDEOS_DOC_ID), { videos: clean, updatedAt: serverTimestamp() })
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  const resetHomeVideos = useCallback(async () => {
    try {
      await deleteDoc(doc(db, SITE_COLLECTION, VIDEOS_DOC_ID))
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, SITE_COLLECTION, HERO_DOC_ID),
      (snap) => {
        const data = snap.exists() ? snap.data() : null
        if (data && Array.isArray(data.slides)) {
          const next = data.slides.map(normalizeSlide)
          setSlides(next)
          setIsCustomized(true)
          cacheSlides(next)
        } else {
          setSlides(DEFAULT_SLIDES)
          setIsCustomized(false)
          clearCachedSlides()
        }
      },
      (error) => {
        // Not fatal — keep whatever we're already showing (cache/defaults).
        console.error('Firestore siteContent listener failed:', error)
      },
    )
    return unsubscribe
  }, [])

  // Replaces the whole slide list. The list is small (a handful of slides),
  // so one document holding the ordered array keeps reordering atomic.
  const saveHeroSlides = useCallback(async (nextSlides) => {
    const clean = nextSlides.map((s, i) => {
      const n = normalizeSlide(s, i)
      return {
        id: n.id,
        title: n.title.trim(),
        image: n.image.trim(),
        ctaLabel: n.ctaLabel.trim(),
        ctaTo: n.ctaTo.trim(),
        active: n.active,
      }
    })
    try {
      await setDoc(doc(db, SITE_COLLECTION, HERO_DOC_ID), {
        slides: clean,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  // Deletes the saved document so the site falls back to data/heroSlides.js.
  const resetHeroSlides = useCallback(async () => {
    try {
      await deleteDoc(doc(db, SITE_COLLECTION, HERO_DOC_ID))
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  const value = useMemo(
    () => ({
      // Everything saved (including hidden slides) — what Admin edits.
      allHeroSlides: slides,
      // What the storefront actually shows: only slides that are switched
      // on and actually have a photo.
      heroSlides: slides.filter((s) => s.active && s.image),
      defaultHeroSlides: DEFAULT_SLIDES,
      heroIsCustomized: isCustomized,
      saveHeroSlides,
      resetHeroSlides,
      // Homepage videos: everything saved (Admin) vs. what shoppers see.
      allHomeVideos: videos,
      homeVideos: videos.filter((v) => v.active && (v.src || v.poster)),
      homeVideosCustomized: videosCustomized,
      saveHomeVideos,
      resetHomeVideos,
      // Storefront mouse cursor: { enabled, style } — edited in Admin -> Cursor.
      cursorSettings,
      saveCursorSettings,
    }),
    [slides, isCustomized, saveHeroSlides, resetHeroSlides, videos, videosCustomized, saveHomeVideos, resetHomeVideos, cursorSettings, saveCursorSettings],
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used within a SiteContentProvider')
  return ctx
}
