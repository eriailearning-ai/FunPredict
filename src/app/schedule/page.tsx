import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export const revalidate = 300

export default async function SchedulePage() {
  const user = await getSession()
  if (!user || user.status !== 'approved') redirect('/auth/login')

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: 'asc' },
  })

  const byGroup: Record<string, typeof matches> = {}
  for (const m of matches) {
    if (!byGroup[m.group]) byGroup[m.group] = []
    byGroup[m.group].push(m)
  }

  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, role: user.role }} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1>📅 Match Schedule</h1>
          <Link href="/predictions" className="btn-ghost text-sm">← Predictions</Link>
        </div>
        {Object.entries(byGroup).map(([group, ms]) => (
          <div key={group} className="mb-8">
            <h2 className="text-gray-600 mb-3 font-semibold">{group.startsWith('R') || ['QF','SF','3rd','F'].includes(group) ? 'Knockout: ' + group : 'Group ' + group}</h2>
            <div className="space-y-2">
              {ms.map(m => (
                <div key={m.id} className="card flex items-center gap-3 py-3">
                  <span className="flex-1 text-right font-medium text-sm">{m.homeTeam.name}</span>
                  <div className="text-center min-w-[90px]">
                    {m.status === 'finished'
                      ? <span className="font-bold">{m.homeScore} – {m.awayScore}</span>
                      : <span className="text-xs text-gray-400">{new Date(m.matchDate).toLocaleString()}</span>}
                  </div>
                  <span className="flex-1 font-medium text-sm">{m.awayTeam.name}</span>
                  <span className={`badge ${m.status === 'finished' ? 'badge-green' : m.status === 'live' ? 'badge-red' : 'badge-gray'}`}>
                    {m.status === 'finished' ? 'FT' : m.status === 'live' ? 'LIVE' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(byGroup).length === 0 && <p className="text-center text-gray-400 py-12">Schedule not loaded yet — check back soon!</p>}
      </div>
    </div>
  )
}
