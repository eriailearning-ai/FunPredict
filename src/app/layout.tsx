import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorldCup 2026 Pool',
  description: 'Family & friends prediction pool for FIFA World Cup 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
