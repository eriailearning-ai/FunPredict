'use client'
/**
 * SiteBanner — compact sliding banner shown on all public pages.
 * Use <SiteBanner /> on non-home pages (no hero text).
 * The home page uses <BannerCarousel> directly with custom hero text.
 */
import { useState, useEffect } from 'react'

const SLIDES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a5c59e4b4f9?w=1600&q=80',
  'https://images.unsplash.com/photo-1560272564-d939234316cf?w=1600&q=80',
  'https://images.unsplash.com/photo-1551280841-3c359f7d04c5?w=1600&q=80',
  'https://images.unsplash.com/photo-1529411495602-6f34b9edea1b?w=1600&q=80',
]

interface Props {
  /** Compact height for sub-pages; defaults to 180px */
  height?: string
}

export default function SiteBanner({ height = 'clamp(140px,18vw,200px)' }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Gradient base */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}
      />

      {/* Slide images */}
      {SLIDES.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, backgroundImage: `url(${src})` }}
        />
      ))}

      {/* Dark scrim */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

      {/* Logo overlay — top-left white box */}
      <div
        className="absolute hidden sm:flex items-end justify-center bg-white shadow-lg"
        style={{
          left: 24, top: 0, zIndex: 20,
          borderRadius: '0 0 18px 18px',
          padding: '5px 12px 12px',
          minWidth: 120,
        }}
      >
        <img
          src="/images/logo/cropped-worldcup-eagle-logo-1.png"
          alt="FIFAFun 2026"
          style={{ height: 90, width: 'auto' }}
        />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: 8, height: 8,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === current ? '#f5c518' : 'rgba(255,255,255,0.45)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
