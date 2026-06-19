'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import FlagImg from '@/components/ui/FlagImg'
import Link from 'next/link'

// ─── Static mappings ────────────────────────────────────────────────────────

const HOST_CODES = ['MEX', 'CAN', 'USA']
const HOST_COLORS: Record<string, string> = {
  MEX: '#166534',   // green
  CAN: '#991b1b',   // red
  USA: '#1e3a5f',   // navy
}

const CONFEDERATION: Record<string, string> = {
  MEX:'CONCACAF', ZAF:'CAF',   KOR:'AFC',     CZE:'UEFA',
  CAN:'CONCACAF', BIH:'UEFA',  QAT:'AFC',     SUI:'UEFA',
  HTI:'CONCACAF', SCO:'UEFA',  BRA:'CONMEBOL',MAR:'CAF',
  USA:'CONCACAF', PRY:'CONMEBOL',AUS:'AFC',   TUR:'UEFA',
  GER:'UEFA',     CUW:'CONCACAF',CIV:'CAF',   ECU:'CONMEBOL',
  NED:'UEFA',     JPN:'AFC',   SWE:'UEFA',    TUN:'CAF',
  IRN:'AFC',      NZL:'OFC',   BEL:'UEFA',    EGY:'CAF',
  KSA:'AFC',      URY:'CONMEBOL',ESP:'UEFA',  CPV:'CAF',
  FRA:'UEFA',     SEN:'CAF',   IRQ:'AFC',     NOR:'UEFA',
  ARG:'CONMEBOL', ALG:'CAF',   AUT:'UEFA',    JOR:'AFC',
  POR:'UEFA',     COD:'CAF',   UZB:'AFC',     COL:'CONMEBOL',
  GHA:'CAF',      PAN:'CONCACAF',ENG:'UEFA',  CRO:'UEFA',
}

const CODE_TO_ISO2: Record<string, string> = {
  MEX:'mx', ZAF:'za', KOR:'kr', CZE:'cz',
  CAN:'ca', BIH:'ba', QAT:'qa', SUI:'ch',
  HTI:'ht', SCO:'gb-sct', BRA:'br', MAR:'ma',
  USA:'us', PRY:'py', AUS:'au', TUR:'tr',
  GER:'de', CUW:'cw', CIV:'ci', ECU:'ec',
  NED:'nl', JPN:'jp', SWE:'se', TUN:'tn',
  IRN:'ir', NZL:'nz', BEL:'be', EGY:'eg',
  KSA:'sa', URY:'uy', ESP:'es', CPV:'cv',
  FRA:'fr', SEN:'sn', IRQ:'iq', NOR:'no',
  ARG:'ar', ALG:'dz', AUT:'at', JOR:'jo',
  POR:'pt', COD:'cd', UZB:'uz', COL:'co',
  GHA:'gh', PAN:'pa', ENG:'gb-eng', CRO:'hr',
}

const CONFEDS = ['ALL', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA']

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const [confed, setConfed] = useState('ALL')
  const [teams, setTeams]   = useState<any[]>([])

  useEffect(() => {
    fetch('/api/tournament/teams')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTeams(d) })
      .catch(() => {})
  }, [])

  const visible = teams.filter(t =>
    confed === 'ALL' || CONFEDERATION[t.code?.toUpperCase()] === confed
  )

  const hosts    = visible.filter(t => HOST_CODES.includes(t.code?.toUpperCase()))
  const qualified = visible.filter(t => !HOST_CODES.includes(t.code?.toUpperCase()))

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={null} />

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

            {/* Confederation filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {CONFEDS.map(c => (
                <button
                  key={c}
                  onClick={() => setConfed(c)}
                  className="px-3 py-1 rounded text-xs font-bold border transition-colors"
                  style={{
                    background: confed === c ? '#1e3a5f' : '#fff',
                    color: confed === c ? '#fff' : '#374151',
                    borderColor: confed === c ? '#1e3a5f' : '#d1d5db',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {teams.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p>Teams not yet loaded.</p>
                <p className="text-xs mt-1">Import via the admin panel → Seed DB.</p>
              </div>
            ) : (
              <>
                {/* Host countries */}
                {hosts.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Host country</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {hosts.map((t: any) => {
                        const code = t.code?.toUpperCase()
                        const iso2 = CODE_TO_ISO2[code] ?? ''
                        const bg   = HOST_COLORS[code] ?? '#1e3a5f'
                        return (
                          <Link key={t.id} href={`/tournament/teams/${code}`}>
                            <div
                              className="rounded-xl p-5 text-white cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ background: bg }}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <FlagImg iso2={iso2} name={t.name} size="md" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Host country</span>
                              </div>
                              <p className="text-xl font-black">{t.name}</p>
                              <div className="mt-3 text-xs text-gray-300 space-y-1">
                                <div className="flex justify-between">
                                  <span>Stage</span>
                                  <span className="font-semibold text-white">Group {t.group}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Confederation</span>
                                  <span className="font-semibold text-white">{CONFEDERATION[code] ?? '—'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Qualified teams */}
                {qualified.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Qualified teams</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {qualified.sort((a:any,b:any) => a.name.localeCompare(b.name)).map((t: any) => {
                        const code = t.code?.toUpperCase()
                        const iso2 = CODE_TO_ISO2[code] ?? ''
                        return (
                          <Link key={t.id} href={`/tournament/teams/${code}`}>
                            <div
                              className="rounded-xl p-4 text-white cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ background: '#111827' }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <FlagImg iso2={iso2} name={t.name} size="sm" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                  {CONFEDERATION[code] ?? ''}
                                </span>
                              </div>
                              <p className="text-sm font-bold leading-tight">{t.name}</p>
                              <div className="mt-2 text-[10px] text-gray-400 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>Stage</span>
                                  <span className="text-gray-200 font-semibold">Group {t.group}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Sidebar - static for client component */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center mb-4">
              <p className="text-sm text-gray-500 mb-3">Join the fun — predict every match!</p>
              <div className="flex flex-col gap-2">
                <Link href="/auth/register" className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>Register free</Link>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700">Log in</Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Tournament</h3>
              <div className="space-y-1.5 text-sm">
                <Link href="/tournament" className="block text-blue-600 hover:underline">Matches</Link>
                <Link href="/tournament/groups" className="block text-gray-600 hover:underline">Groups</Link>
                <Link href="/tournament/teams" className="block font-semibold" style={{ color: '#8b1c2c' }}>Teams</Link>
                <Link href="/tournament/venues" className="block text-gray-600 hover:underline">Venues</Link>
                <Link href="/schedule" className="block text-gray-600 hover:underline">Full Schedule</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
