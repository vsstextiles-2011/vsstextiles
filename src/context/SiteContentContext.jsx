import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { heroSlides as defaultHeroSlides } from '../data/heroSlides.js'
import { homeVideos as defaultHomeVideos } from '../data/videos.js'
import { aboutDefaults } from '../data/aboutDefaults.js'

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

// ---- About Us page (document: siteContent/aboutPage) ----------------------
// Same pattern as the hero slider / videos: data/aboutDefaults.js is the
// default, a saved Firestore document replaces it. normalizeAbout() merges
// whatever was saved over the defaults, so a missing or older field can never
// crash the page.
const ABOUT_DOC_ID = 'aboutPage'
const ABOUT_CACHE_KEY = 'vss_about_page_cache_v1'

const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback)
const uid = (prefix, i) => `${prefix}-${i}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function normalizeAbout(raw) {
  const d = aboutDefaults
  const r = raw && typeof raw === 'object' ? raw : {}
  const list = (v, fallback) => (Array.isArray(v) ? v : fallback)
  return {
    hero: {
      eyebrow: str(r.hero?.eyebrow, d.hero.eyebrow),
      title: str(r.hero?.title, d.hero.title),
      text: str(r.hero?.text, d.hero.text),
    },
    story: {
      eyebrow: str(r.story?.eyebrow, d.story.eyebrow),
      title: str(r.story?.title, d.story.title),
      paragraph1: str(r.story?.paragraph1, d.story.paragraph1),
      paragraph2: str(r.story?.paragraph2, d.story.paragraph2),
      image: str(r.story?.image, d.story.image),
    },
    categories: {
      eyebrow: str(r.categories?.eyebrow, d.categories.eyebrow),
      title: str(r.categories?.title, d.categories.title),
      items: d.categories.items.map((def) => {
        const saved = list(r.categories?.items, []).find((x) => x?.id === def.id)
        return { id: def.id, image: str(saved?.image), details: str(saved?.details) }
      }),
    },
    range: {
      eyebrow: str(r.range?.eyebrow, d.range.eyebrow),
      title: str(r.range?.title, d.range.title),
      showFabrics: r.range?.showFabrics !== false,
      overrides: r.range?.overrides && typeof r.range.overrides === 'object' ? r.range.overrides : {},
    },
    process: {
      eyebrow: str(r.process?.eyebrow, d.process.eyebrow),
      title: str(r.process?.title, d.process.title),
      steps: list(r.process?.steps, d.process.steps).map((s, i) => ({
        id: str(s?.id) || uid('step', i),
        title: str(s?.title),
        desc: str(s?.desc),
      })),
    },
    videos: {
      eyebrow: str(r.videos?.eyebrow, d.videos.eyebrow),
      title: str(r.videos?.title, d.videos.title),
      subtitle: str(r.videos?.subtitle, d.videos.subtitle),
      items: list(r.videos?.items, d.videos.items).map((v, i) => ({
        id: str(v?.id) || uid('vid', i),
        tag: str(v?.tag),
        title: str(v?.title),
        desc: str(v?.desc),
        poster: str(v?.poster),
        src: str(v?.src),
        active: v?.active !== false,
      })),
    },
    stats: list(r.stats, d.stats).map((s, i) => ({
      id: str(s?.id) || uid('stat', i),
      auto: ['products', 'collections', 'fabrics'].includes(s?.auto) ? s.auto : '',
      value: str(s?.value),
      label: str(s?.label),
    })),
  }
}

const DEFAULT_ABOUT = normalizeAbout(null)

function loadCachedAbout() {
  try {
    const raw = localStorage.getItem(ABOUT_CACHE_KEY)
    return raw ? normalizeAbout(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

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
  const [about, setAbout] = useState(() => loadCachedAbout() || DEFAULT_ABOUT)
  const [aboutCustomized, setAboutCustomized] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, SITE_COLLECTION, ABOUT_DOC_ID),
      (snap) => {
        const data = snap.exists() ? snap.data() : null
        try {
          if (data) {
            const next = normalizeAbout(data.content ?? data)
            setAbout(next)
            setAboutCustomized(true)
            localStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify(next))
          } else {
            setAbout(DEFAULT_ABOUT)
            setAboutCustomized(false)
            localStorage.removeItem(ABOUT_CACHE_KEY)
          }
        } catch {
          /* cache is a nicety only */
        }
      },
      (error) => console.error('Firestore aboutPage listener failed:', error),
    )
    return unsubscribe
  }, [])

  const saveAboutContent = useCallback(async (next) => {
    try {
      const clean = normalizeAbout(next)
      await setDoc(doc(db, SITE_COLLECTION, ABOUT_DOC_ID), { content: clean, updatedAt: serverTimestamp() })
    } catch (error) {
      throw new Error(friendlyWriteError(error))
    }
  }, [])

  const resetAboutContent = useCallback(async () => {
    try {
      await deleteDoc(doc(db, SITE_COLLECTION, ABOUT_DOC_ID))
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
      // About Us page content (Admin -> About Us Page).
      aboutContent: about,
      aboutCustomized,
      saveAboutContent,
      resetAboutContent,
    }),
    [slides, isCustomized, saveHeroSlides, resetHeroSlides, videos, videosCustomized, saveHomeVideos, resetHomeVideos, about, aboutCustomized, saveAboutContent, resetAboutContent],
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used within a SiteContentProvider')
  return ctx
}
