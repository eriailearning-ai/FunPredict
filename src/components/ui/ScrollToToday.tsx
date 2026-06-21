'use client'
import { useEffect } from 'react'

/** Scrolls the page to #today section after mount */
export default function ScrollToToday() {
  useEffect(() => {
    const el = document.getElementById('today')
    if (el) {
      // Small delay so the page finishes painting first
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [])
  return null
}
