'use client'
/**
 * SiteBanner — full-width sliding banner shown on all public pages.
 * Includes the logo overlay straddling the navbar/banner boundary on the left.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Local banner images from /public/images/banners/
const SLIDES = [
  '/images/banners/banner-02.png',
  '/images/banners/banner-03.png',
  '/images/banners/banner-05.png',
  '/images/banners/banner-06.png',
  '/images/banners/banner-07.png',
  '/images/banners/banner-08.png',
  '/images/banners/banner-09.png',
  '/images/banners/banner-10.png',
  '/images/banners/banner-11.png',
  '/images/banners/banner-12.png',
  '/images/banners/banner-13.png',
  '/images/banners/banner-14.png',
  '/images/banners/banner-15.png',
  '/images/banners/banner-16.png',
  '/images/banners/banner-17.png',
  '/images/banners/banner-18.png',
  '/images/banners/banner-19.png',
  '/images/banners/banner-20.png',
  '/images/banners/banner-21.png',
  '/images/banners/banner-22.png',
  '/images/banners/banner-23.png',
  '/images/banners/banner-24.png',
  '/images/banners/banner-26.png',
  '/images/banners/banner-27.png',
]

interface Props {
  /** Banner height — defaults to match reference site (~350px) */
  height?: string
  /** Whether to show the logo overlay (default: true) */
  showLogo?: boolean
}

export default function SiteBanner({ height = 'clamp(260px,30vw,380px)', showLogo = true }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full overflow-visible" style={{ height }}>
      {/* Gradient fallback base */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}
      />

      {/* Slide images — no dark scrim so photos show clearly */}
      {SLIDES.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, backgroundImage: `url(${src})` }}
        />
      ))}

      {/* Light scrim just enough to keep dots readable */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />

      {/* ── Logo overlay — top-left, straddles navbar/banner boundary ── */}
      {showLogo && (
        <Link
          href="/"
          className="absolute"
          style={{ top: -48, left: 20, zIndex: 60 }}
          aria-label="Home"
        >
          <div
            className="bg-white shadow-2xl overflow-hidden flex items-center justify-center"
            style={{
              width: 150,
              height: 150,
              borderRadius: 16,
              border: '3px solid white',
              padding: 4,
            }}
          >
            <img
              src="/images/logo/cropped-worldcup-eagle-logo-1.png"
              alt="FIFAFun 2026"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </Link>
      )}

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
              background: i === current ? '#f5c518' : 'rgba(255,255,255,0.6)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
