import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DisclaimerPage() {
  const [sidebarData, session] = await Promise.all([getSidebarData(), getSession().catch(() => null)])

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Disclaimer</span>
        </nav>
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 prose prose-sm max-w-none">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Important notice</h1>
              <p className="text-gray-600"><strong>This website and FIFAFun are provided strictly for fun, entertainment, and friendly competition among family and friends.</strong> They are not a gambling service, betting platform, lottery, or contest operated for commercial gain.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">No real-money gambling</h2>
              <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                <li>Participation is <strong>free</strong> unless your group organizer clearly states otherwise in a private, offline arrangement.</li>
                <li>No entry fees, wagers, or cash prizes are offered or managed through this website.</li>
                <li>Predictions, points, and rankings are for amusement only and have <strong>no monetary value</strong>.</li>
              </ul>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">No warranties</h2>
              <p className="text-sm text-gray-600">Match schedules, scores, team names, and statistics may contain errors or delays. The site is provided <strong>"as is"</strong> without warranties of any kind. The organizers do not guarantee uninterrupted access or accurate results.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Limitation of liability</h2>
              <p className="text-sm text-gray-600">To the fullest extent permitted by applicable law, the site owners, administrators, and hosts of WorldCup Fun are <strong>not liable</strong> for any direct, indirect, incidental, or consequential damages arising from use of this site or participation in FIFAFun—including disputes between participants, lost data, or reliance on predictions or rankings.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Your responsibility</h2>
              <p className="text-sm text-gray-600">You participate voluntarily. You are responsible for ensuring that your use of this site complies with laws in your location. If you are under the age required to use online services in your country, you may use this site only with permission from a parent or guardian.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">No official affiliation</h2>
              <p className="text-sm text-gray-600">FIFAFun is an unofficial, private fan activity. It is <strong>not affiliated with, endorsed by, or sponsored by</strong> FIFA, any national football association, or the World Cup tournament organizers. All trademarks and names belong to their respective owners.</p>

              <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">Changes</h2>
              <p className="text-sm text-gray-600">We may update this disclaimer at any time. Continued use of the site after changes are posted means you accept the revised terms.</p>

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
