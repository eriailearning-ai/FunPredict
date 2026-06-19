import FlagImg from '@/components/ui/FlagImg'

export type StandingTeam = {
  flag: string; name: string
  mp: number; w: number; d: number; l: number
  gf: number; ga: number; gd: number; pts: number
}
export type StandingGroup = { group: string; teams: StandingTeam[] }

function GroupTable({ group, teams }: StandingGroup) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Group header */}
      <div className="px-4 py-2.5" style={{ background: '#1e3a5f' }}>
        <span className="text-sm font-bold text-white tracking-wide">Group {group}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-gray-100" style={{ background: '#f9fafb' }}>
              <th className="w-8 px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase">#</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase">Team</th>
              {['MP','W','D','L','GF','GA','GD'].map(h => (
                <th key={h} className="px-2 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase">{h}</th>
              ))}
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase" style={{ color: '#1e3a5f' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.name}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                style={{ borderLeft: i < 2 ? '4px solid #16a34a' : '4px solid transparent' }}>
                <td className="px-3 py-3 text-[11px] text-gray-400 font-medium">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <FlagImg iso2={t.flag} name={t.name} size="sm" />
                    <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{t.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.mp}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.w}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.d}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.l}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.gf}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.ga}</td>
                <td className="px-2 py-3 text-center text-xs text-gray-600">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="px-2 py-3 text-center text-xs font-black" style={{ color: '#1e3a5f' }}>{t.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function StandingsTabs({ groups }: { groups: StandingGroup[] }) {
  return (
    <div>
      {/* Hero header */}
      <div className="px-6 py-6 rounded-xl mb-5" style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1e3a5f 60%,#8b1c2c 100%)' }}>
        <p className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-1">FIFA World Cup 2026™</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Group Standings</h1>
        <p className="text-sm text-gray-300 mt-1">Top 2 teams from each group advance to the Round of 32</p>
      </div>

      {/* All 12 groups — 2 columns on md+, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(g => <GroupTable key={g.group} {...g} />)}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: '#16a34a' }} />
        <span className="text-xs text-gray-500">Advance to Round of 32</span>
      </div>
    </div>
  )
}
