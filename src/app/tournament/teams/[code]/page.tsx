import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SiteBanner from '@/components/ui/SiteBanner'
import FlagImg from '@/components/ui/FlagImg'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toIso2 } from '@/lib/flags'
import { fmtDate, CONFEDERATION } from '@/lib/fmt'
import LocalTime from '@/components/ui/LocalTime'
import { getSquadByPosition } from '@/lib/squads'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// ─── Static team notes ──────────────────────────────────────────────────────

const TEAM_NOTES: Record<string, { note: string; star?: string }> = {
  CAN: { note: 'Fast, direct style.', star: 'Alphonso Davies' },
  USA: { note: 'Home nation with world-class midfield.', star: 'Christian Pulisic' },
  MEX: { note: 'Passionate crowd advantage. Azteca faithful.', star: 'Santiago Giménez' },
  ARG: { note: 'Defending World Champions.', star: 'Lionel Messi' },
  BRA: { note: 'Five-time champions looking to reclaim glory.', star: 'Vinicius Jr.' },
  FRA: { note: '2018 champions with supreme talent.', star: 'Kylian Mbappé' },
  ENG: { note: 'Looking to end 60 years of hurt.', star: 'Jude Bellingham' },
  ESP: { note: 'Euro 2024 champions, fluid possession football.', star: 'Lamine Yamal' },
  GER: { note: 'Traditional powerhouse. Host in spirit.', star: 'Florian Wirtz' },
  POR: { note: 'Generational talent ready to shine.', star: 'Cristiano Ronaldo' },
  NED: { note: 'Total football legacy.', star: 'Virgil van Dijk' },
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface Props { params: { code: string } }

export default async function TeamDetailPage({ params }: Props) {
  const code = params.code.toUpperCase()
  const session = await getSession().catch(() => null)

  const [team, allMatches] = await Promise.all([
    prisma.team.findFirst({ where: { code } }).catch(() => null),
    prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { code } },
          { awayTeam: { code } },
        ],
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: 'asc' },
    }).catch(() => []),
  ])

  if (!team) notFound()

  const iso2     = toIso2(code)
  const squad    = getSquadByPosition(code)
  const confed   = CONFEDERATION[code] ?? '—'
  const notes    = TEAM_NOTES[code] ?? {}
  const teamSlug = team.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />
      <SiteBanner />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/tournament" className="hover:underline">Matches</Link>
          <span className="mx-2">→</span>
          <Link href="/tournament/teams" className="hover:underline">Teams</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">{team.name}</span>
        </nav>

        {/* Team header card */}
        <div
          className="rounded-2xl p-5 sm:p-8 text-white mb-6"
          style={{ background: 'linear-gradient(135deg,#0d1b3e,#1e3a5f,#8b1c2c)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <FlagImg iso2={iso2} name={team.name} size="lg" className="shadow-lg" />
            <div>
              <p className="text-xs font-bold text-yellow-400 tracking-widest uppercase">{confed}</p>
              <h1 className="text-2xl sm:text-3xl font-black">{team.name}</h1>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Stage</p>
              <p className="font-bold">Group {team.group}</p>
            </div>
            {notes.star && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Player to watch</p>
                <p className="font-bold">{notes.star}</p>
              </div>
            )}
            {notes.note && (
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Note</p>
                <p className="font-medium text-gray-200">{notes.note}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">

          {/* Squad */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-0.5">
                Squad {squad.total > 0 ? `(${squad.total})` : ''}
              </h2>
              {squad.total > 0 ? (
                <>
                  <p className="text-xs text-gray-400 mb-4">
                    Players named for the 2026 FIFA World Cup (from published squad lists).
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                      const players = squad[pos]
                      if (players.length === 0) return null
                      const labels: Record<string, string> = { GK: 'GOALKEEPERS', DEF: 'DEFENDERS', MID: 'MIDFIELDERS', FWD: 'FORWARDS' }
                      return (
                        <div key={pos}>
                          <p className="text-[10px] font-black text-gray-500 tracking-widest mb-1.5 uppercase">{labels[pos]}</p>
                          <ul className="space-y-1">
                            {players.map(p => (
                              <li key={p.name} className="text-xs text-gray-700">{p.name}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-3">Squad details not yet available for this team.</p>
              )}
            </div>
          </div>

          {/* Matches + venue info */}
          <div className="md:col-span-2 space-y-4">

            {/* Team image */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
              <div className="relative" style={{ background: 'linear-gradient(135deg,#0d1b3e,#1e3a5f)' }}>
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">🌍</div>
                <img
                  src={`/images/teams/${teamSlug}.jpg`}
                  alt={team.name}
                  className="relative w-full h-40 object-cover"
                />
              </div>
              <div className="p-3 text-xs text-gray-500 space-y-1.5">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-700 w-20">plays in:</span>
                  <span className="font-bold" style={{ color: '#1e3a5f' }}>Group {team.group}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-700 w-20">confederation:</span>
                  <span>{confed}</span>
                </div>
              </div>
            </div>

            {/* Group Matches */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Matches</h3>
              {allMatches.length === 0 ? (
                <p className="text-xs text-gray-400">No matches found. Seed the DB first.</p>
              ) : (
                <div className="space-y-2">
                  {allMatches.map((m: any) => {
                    const isHome = m.homeTeam?.code?.toUpperCase() === code
                    const opp = isHome ? m.awayTeam : m.homeTeam
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs border-b border-gray-50 pb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FlagImg iso2={toIso2(m.homeTeam?.code ?? '')} name={m.homeTeam?.name ?? ''} size="sm" />
                            <span className="text-gray-700 font-medium truncate">{m.homeTeam?.name}</span>
                            <span className="text-gray-400 font-bold mx-0.5">
                              {m.status === 'finished' ? `${m.homeScore}–${m.awayScore}` : 'vs'}
                            </span>
                            <span className="text-gray-700 font-medium truncate">{m.awayTeam?.name}</span>
                            <FlagImg iso2={toIso2(m.awayTeam?.code ?? '')} name={m.awayTeam?.name ?? ''} size="sm" />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {fmtDate(m.matchDate)} · <LocalTime iso={m.matchDate.toString()} />
                            {m.venue ? ` · ${m.venue}` : ''}
                          </p>
                        </div>
                        {m.status === 'finished' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: '#374151' }}>FT</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
