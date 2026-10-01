import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '../../context/SiteContentContext.jsx'
import { startCursor } from './cursorEngine.js'

/**
 * Site-wide custom cursor. Whether it is on, and which of the four styles it
 * uses, is controlled from Admin -> Cursor (saved in Firestore at
 * siteContent/cursorSettings). The animation code lives in cursorEngine.js.
 *
 * Shows on devices with a mouse only, and never on the admin panel.
 */
const HIDE_SYSTEM_CURSOR = true // hide the normal arrow while the custom cursor is on

export default function CustomCursor() {
  const { pathname } = useLocation()
  const { cursorSettings } = useSiteContent()
  const { enabled, style } = cursorSettings
  // No cursor animation on the admin panel (/admin, /admin/login, /admin-login).
  const disabled = pathname.startsWith('/admin') || !enabled

  useEffect(() => {
    if (disabled) return
    return startCursor(style, { hideNative: HIDE_SYSTEM_CURSOR })
  }, [disabled, style])

  return null
}
