import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminMatchesPage() {
  const matches: any[] = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>📅 Match Schedule ({matches.length} matches)</h1>
        <Link href="/admin/results" className="btn-primary text-sm">Enter Results →</Link>
      </div>
      {matches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No matches loaded yet.</p>
          <p className="text-sm text-gray-400">Run <code className="bg-gray-100 px-2 py-1 rounded">npm run db:seed</code> to load the WC2026 schedule.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-center">Group</th>
                <th className="px-4 py-3 text-center">Date</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={m.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">{m.homeTeam.name} vs {m.awayTeam.name}</td>
                  <td className="px-4 py-3 text-center"><span className="badge badge-blue">{m.group}</span></td>
                  <td className="px-4 py-3 text-center text-gray-500">{new Date(m.matchDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center font-bold">{m.homeScore !== null ? `${m.homeScore} – ${m.awayScore}` : '–'}</td>
                  <td className="px-4 py-3 text-center"><span className={`badge ${m.status === 'finished' ? 'badge-green' : 'badge-gray'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
