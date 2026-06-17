'use client'
import { useState } from 'react'

interface Props {
  iso2: string      // 2-letter ISO country code (lowercase), e.g. "mx", "gb-sct"
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'w-5 h-4', md: 'w-8 h-6', lg: 'w-12 h-9' }

// Build the CDN URL — flagcdn.com is free, reliable, supports subdivisions
function cdnUrl(iso2: string) {
  return `https://flagcdn.com/48x36/${iso2.toLowerCase()}.png`
}
// Local override — place your own PNGs in public/images/flags/{code}.png
function localUrl(iso2: string) {
  return `/images/flags/${iso2.toLowerCase()}.png`
}

export default function FlagImg({ iso2, name = '', size = 'md', className = '' }: Props) {
  // Strategy: try local file first (user-supplied high-res), fall back to CDN, then hide
  const [src, setSrc] = useState(localUrl(iso2))
  const [tried, setTried] = useState<'local' | 'cdn' | 'failed'>('local')

  function handleError() {
    if (tried === 'local') {
      // Local file missing → try CDN
      setSrc(cdnUrl(iso2))
      setTried('cdn')
    } else {
      // CDN also failed → hide
      setTried('failed')
    }
  }

  if (tried === 'failed') {
    // Placeholder initials box when both sources fail
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-gray-200 text-gray-500 text-xs font-bold flex-shrink-0 ${SIZES[size]} ${className}`}
        title={name}
      >
        {iso2.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      onError={handleError}
      className={`object-cover rounded-sm inline-block flex-shrink-0 ${SIZES[size]} ${className}`}
      loading="lazy"
    />
  )
}
