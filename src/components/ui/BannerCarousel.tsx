'use client'
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
  children?: React.ReactNode
  /** Tailwind / CSS height string, e.g. "clamp(220px,40vw,400px)" */
  height?: string
}

export default function BannerCarousel({ children, height = 'clamp(240px,42vw,420px)' }: Props) {
  const [current, setCurrent] = useState(0)

  // Auto-advance every 5 s
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative overflow-hidden w-full" style={{ height }}>
      {/* Gradient base — visible if images don't load */}
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

      {/* Dark scrim so text / logo stay readable */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.42)' }} />

      {/* Slot for overlaid content (hero text, CTA, etc.) */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 z-10">
          {children}
        </div>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: 10, height: 10,
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
