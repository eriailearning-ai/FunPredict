'use client'
/**
 * Renders an ISO timestamp in the user's LOCAL browser timezone.
 * Use this in server-rendered pages instead of calling fmtTime() directly,
 * because fmtTime() on the server uses the server's timezone (UTC on Vercel).
 */
import { useEffect, useState } from 'react'

interface Props {
  iso: string
  className?: string
  color?: string        // CSS color value e.g. '#1e3a5f'
  /** Show "7:30 PM" style — default true */
  hour12?: boolean
}

export default function LocalTime({ iso, className, color, hour12 = true }: Props) {
  const [display, setDisplay] = useState<string>(() => {
    // Render a consistent UTC time on the server/initial pass to avoid hydration mismatch
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12, timeZone: 'UTC',
    }) + ' UTC'
  })

  useEffect(() => {
    // After hydration, replace with the user's local time (no timezone label needed)
    setDisplay(
      new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12 })
    )
  }, [iso, hour12])

  return <span className={className} style={color ? { color } : undefined}>{display}</span>
}
