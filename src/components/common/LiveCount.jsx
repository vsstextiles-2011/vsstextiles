import { useEffect, useRef, useState } from 'react'

// Shows a number that comes from the live catalogue. Whenever the value
// changes (a product added / hidden / deleted in Admin, synced through
// Firestore's onSnapshot), the number briefly highlights so the update is
// noticeable. Renders plain text on first paint - no animation on load.
export default function LiveCount({ value }) {
  const prev = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (prev.current === value) return undefined
    prev.current = value
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 1200)
    return () => clearTimeout(t)
  }, [value])

  return (
    <span className={`inline-block transition-all duration-500 ${flash ? 'text-gold font-bold scale-125' : ''}`}>
      {value}
    </span>
  )
}
