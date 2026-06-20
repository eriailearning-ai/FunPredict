import type { Metadata } from 'next'
import './globals.css'
import VisitTracker from '@/components/ui/VisitTracker'

export const metadata: Metadata = {
  title: 'FIFAFun Predict 2026',
  description: 'Family & friends prediction pool for FIFA World Cup 2026',
  icons: {
    icon: '/images/logo/cropped-worldcup-eagle-logo-1.png',
    apple: '/images/logo/cropped-worldcup-eagle-logo-1.png',
    shortcut: '/images/logo/cropped-worldcup-eagle-logo-1.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VisitTracker />
        {children}
      </body>
    </html>
  )
}
