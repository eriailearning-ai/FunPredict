import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CODE3_TO_ISO2 } from '@/lib/flags'
import Link from 'next/link'

export const revalidate = 3600

export default async function TeamsPage() {
  const [sidebarData, session, teams] = await Promise.all([
    getSidebarData(),
    getSession().catch(() => null),
    prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }).catch(() => []),
  ])

  function isoFlag(code: string) { return CODE3_TO_ISO2[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2) }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/tournament" className="hover:underline">Matches</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Teams</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Teams</h1>
            <p className="text-sm text-gray-500 mb-5">All 48 nations at FIFA World Cup 2026.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {teams.map(t => (
                <div key={t.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                  <FlagImg iso2={isoFlag(t.code)} name={t.name} size="lg" />
                  <p className="text-xs font-semibold text-gray-800 text-center">{t.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1e3a5f' }}>
                    Group {t.group}
                  </span>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="col-span-4 text-center py-12 text-gray-400">
                  <p>Teams not yet loaded.</p>
                  <p className="text-xs mt-1">Import via the admin panel.</p>
                </div>
              )}
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
