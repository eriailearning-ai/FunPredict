import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function PrivacyPage() {
  const [sidebarData, session] = await Promise.all([getSidebarData(), getSession().catch(() => null)])

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Privacy Policy</span>
        </nav>
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 prose prose-sm max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-sm text-gray-600">This Privacy Policy explains how WorldCup FIFAFun 2026 collects, uses, and protects your information when you use this site.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">What we collect</h2>
              <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Username, email address, and password (hashed — we never store plain passwords)</li>
                <li>Your full name (for admin review only — not shown publicly)</li>
                <li>Your chosen nickname and league</li>
                <li>Prediction scores you enter</li>
                <li>Session cookies to keep you logged in</li>
              </ul>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">How we use it</h2>
              <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>To create and manage your account</li>
                <li>To display leaderboards and your prediction history</li>
                <li>To send account verification emails</li>
                <li>For admin review and approval of new accounts</li>
              </ul>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">What we do not do</h2>
              <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>We do not sell your data to third parties</li>
                <li>We do not use your data for advertising</li>
                <li>We do not share your real name or email publicly</li>
              </ul>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Data retention</h2>
              <p className="text-sm text-gray-600">Your data is kept for the duration of the tournament. You may request deletion of your account at any time by contacting the admin.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Cookies</h2>
              <p className="text-sm text-gray-600">We use a single secure session cookie to keep you logged in. No tracking cookies are used.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Contact</h2>
              <p className="text-sm text-gray-600">Questions? Contact the site administrator directly.</p>

              <p className="text-xs text-gray-400 mt-6 italic">Last updated: May 2026</p>
            </div>
          </main>
          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
