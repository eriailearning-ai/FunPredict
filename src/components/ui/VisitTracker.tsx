'use client'
import { useEffect } from 'react'

/** Invisible component — fires a visit tracking ping once per page mount */
export default function VisitTracker() {
  useEffect(() => {
    fetch('/api/track-visit', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
