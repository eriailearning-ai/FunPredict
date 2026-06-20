'use client'
import FlagImg from '@/components/ui/FlagImg'
import type { MatchRow } from './TournamentTabs'

// ── Bracket seedings (2026 World Cup R32 draw) ─────────────────────────────
const L_R32 = [
  { game: 73, t1: '2nd Group A', t2: '2nd Group B' },
  { game: 74, t1: '1st Group E', t2: '3rd (A/B/C/D/F)' },
  { game: 75, t1: '1st Group F', t2: '3rd (D/E/G/H/I)' },
  { game: 76, t1: '2nd Group F', t2: '2nd Group C' },
  { game: 77, t1: '1st Group D', t2: '3rd (E/F/I/J/K)' },
  { game: 78, t1: '1st Group B', t2: '3rd (C/G/H/J/L)' },
  { game: 79, t1: '1st Group A', t2: '3rd (A/B/C/D)' },
  { game: 80, t1: '2nd Group D', t2: '3rd (B/E/F/K/L)' },
]
const R_R32 = [
  { game: 81, t1: '1st Group G', t2: '3rd (D/E/I/J/L)' },
  { game: 82, t1: '2nd Group J', t2: '2nd Group I' },
  { game: 83, t1: '1st Group H', t2: '3rd (A/B/C/F/G)' },
  { game: 84, t1: '2nd Group K', t2: '2nd Group L' },
  { game: 85, t1: '1st Group C', t2: '3rd (H/I/J/K/L)' },
  { game: 86, t1: '1st Group K', t2: '2nd Group G' },
  { game: 87, t1: '1st Group J', t2: '2nd Group H' },
  { game: 88, t1: '1st Group L', t2: '1st Group I' },
]
const L_R16 = [
  { game: 89, t1: 'Winner Match 73', t2: 'Winner Match 74' },
  { game: 90, t1: 'Winner Match 75', t2: 'Winner Match 76' },
  { game: 91, t1: 'Winner Match 77', t2: 'Winner Match 78' },
  { game: 92, t1: 'Winner Match 79', t2: 'Winner Match 80' },
]
const R_R16 = [
  { game: 93, t1: 'Winner Match 81', t2: 'Winner Match 82' },
  { game: 94, t1: 'Winner Match 83', t2: 'Winner Match 84' },
  { game: 95, t1: 'Winner Match 85', t2: 'Winner Match 86' },
  { game: 96, t1: 'Winner Match 87', t2: 'Winner Match 88' },
]
const L_QF = [
  { game: 97, t1: 'Winner Match 89', t2: 'Winner Match 90' },
  { game: 98, t1: 'Winner Match 91', t2: 'Winner Match 92' },
]
const R_QF = [
  { game: 99,  t1: 'Winner Match 93', t2: 'Winner Match 94' },
  { game: 100, t1: 'Winner Match 95', t2: 'Winner Match 96' },
]
const L_SF = { game: 101, t1: 'Winner Match 97',  t2: 'Winner Match 98' }
const R_SF = { game: 102, t1: 'Winner Match 99',  t2: 'Winner Match 100' }
const FINAL  = { game: 104, t1: 'Winner Match 101', t2: 'Winner Match 102' }
const BRONZE = { game: 103, t1: 'Loser Match 101',  t2: 'Loser Match 102' }

// ── Sub-components ─────────────────────────────────────────────────────────

/** Compact match slot rendered inside a flex-1 container */
function MatchBox({
  game, t1, t2, liveMatch,
  highlight = false,
}: {
  game: number; t1: string; t2: string
  liveMatch?: MatchRow
  highlight?: boolean
}) {
  const label1 = liveMatch?.homeTeam.name || t1
  const label2 = liveMatch?.awayTeam.name || t2
  const flag1  = liveMatch?.homeTeam.flag
  const flag2  = liveMatch?.awayTeam.flag
  const score  = liveMatch
    ? liveMatch.status === 'finished'
      ? `${liveMatch.homeScore}–${liveMatch.awayScore}`
      : liveMatch.status === 'live' ? '●' : ''
    : ''

  return (
    <div
      className="rounded-md overflow-hidden text-xs flex-shrink-0"
      style={{
        background: highlight ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.07)',
        border: highlight ? '1px solid #f5c518' : '1px solid rgba(255,255,255,0.12)',
        width: '100%',
      }}
    >
      {/* Game label */}
      <div className="px-2 py-0.5 font-bold tracking-wider text-[9px]"
        style={{ background: highlight ? '#f5c518' : 'rgba(255,255,255,0.1)', color: highlight ? '#0d1b3e' : '#94a3b8' }}>
        GAME {game}{score ? ` · ${score}` : ''}
      </div>
      {/* Team 1 */}
      <div className="flex items-center gap-1 px-2 py-1">
        {flag1 && <FlagImg iso2={flag1} size="sm" />}
        <span className="truncate text-white leading-tight" style={{ fontSize: 10 }}>{label1}</span>
      </div>
      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
      {/* Team 2 */}
      <div className="flex items-center gap-1 px-2 py-1">
        {flag2 && <FlagImg iso2={flag2} size="sm" />}
        <span className="truncate text-white leading-tight" style={{ fontSize: 10 }}>{label2}</span>
      </div>
    </div>
  )
}

/** A bracket column with N evenly-spaced match slots */
function BracketCol({
  items, liveMatches, colWidth = 128, colLabel, highlight = false,
}: {
  items: { game: number; t1: string; t2: string }[]
  liveMatches: Map<number, MatchRow>
  colWidth?: number
  colLabel?: string
  highlight?: boolean
}) {
  const BRACKET_H = 576
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: colWidth, height: BRACKET_H }}>
      {colLabel && (
        <div className="text-center text-[9px] font-bold tracking-widest uppercase mb-1 flex-shrink-0"
          style={{ color: '#94a3b8' }}>
          {colLabel}
        </div>
      )}
      <div className="flex flex-col flex-1 gap-1">
        {items.map(item => (
          <div key={item.game} className="flex-1 flex items-center">
            <MatchBox
              game={item.game}
              t1={item.t1}
              t2={item.t2}
              liveMatch={liveMatches.get(item.game)}
              highlight={highlight}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Group panel showing teams extracted from match data */
function GroupPanel({
  letter, matches,
}: {
  letter: string; matches: MatchRow[]
}) {
  const seen = new Set<string>()
  const teams: { name: string; flag: string }[] = []
  for (const m of matches) {
    if (m.stage === 'group' && m.group === letter) {
      if (!seen.has(m.homeTeam.name)) { seen.add(m.homeTeam.name); teams.push(m.homeTeam) }
      if (!seen.has(m.awayTeam.name)) { seen.add(m.awayTeam.name); teams.push(m.awayTeam) }
    }
  }

  return (
    <div className="rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="text-center py-1 text-[9px] font-bold tracking-widest"
        style={{ background: '#f5c518', color: '#0d1b3e' }}>
        ★ GROUP {letter} ★
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)' }}>
        {teams.length === 0 ? (
          <div className="px-3 py-2 text-[10px] text-gray-500 italic">–</div>
        ) : teams.map(t => (
          <div key={t.name} className="flex items-center gap-1.5 px-2 py-1">
            <FlagImg iso2={t.flag} name={t.name} size="sm" />
            <span className="text-[10px] text-gray-200 truncate flex-1">{t.name}</span>
            <span className="text-[9px] text-gray-500">–</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** All groups stacked in the bracket height */
function GroupsCol({
  letters, matches, side,
}: {
  letters: string[]; matches: MatchRow[]; side: 'left' | 'right'
}) {
  return (
    <div className="flex flex-col flex-shrink-0 gap-1" style={{ width: 145, height: 576 }}>
      <div className="text-center text-[9px] font-bold tracking-widest uppercase mb-1 flex-shrink-0"
        style={{ color: '#94a3b8' }}>
        {side === 'left' ? 'Groups A–F' : 'Groups G–L'}
      </div>
      <div className="flex flex-col flex-1 gap-1">
        {letters.map(g => (
          <div key={g} className="flex-1 flex flex-col justify-center">
            <GroupPanel letter={g} matches={matches} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Center Final + Bronze column */
function FinalCol({
  final, bronze, liveMatches,
}: {
  final: { game: number; t1: string; t2: string }
  bronze: { game: number; t1: string; t2: string }
  liveMatches: Map<number, MatchRow>
}) {
  return (
    <div className="flex flex-col flex-shrink-0 items-center justify-center gap-4"
      style={{ width: 148, height: 576 }}>
      <div>
        <div className="text-center text-[9px] font-bold tracking-widest uppercase mb-2"
          style={{ color: '#f5c518' }}>
          ⚽ FINAL
        </div>
        <div className="rounded-xl overflow-hidden"
          style={{ border: '2px solid #f5c518', minWidth: 140 }}>
          <div className="px-2 py-1 text-center text-[9px] font-black tracking-wider"
            style={{ background: '#f5c518', color: '#0d1b3e' }}>
            GAME {final.game}
          </div>
          <div className="px-3 py-2 space-y-1.5" style={{ background: '#0d2555' }}>
            <div className="flex items-center gap-1.5">
              {liveMatches.get(final.game)?.homeTeam.flag
                ? <FlagImg iso2={liveMatches.get(final.game)!.homeTeam.flag} size="sm" />
                : <span className="text-lg">🏆</span>}
              <span className="text-xs font-semibold text-white truncate">
                {liveMatches.get(final.game)?.homeTeam.name || final.t1}
              </span>
            </div>
            <div style={{ height: 1, background: 'rgba(245,197,24,0.3)' }} />
            <div className="flex items-center gap-1.5">
              {liveMatches.get(final.game)?.awayTeam.flag
                ? <FlagImg iso2={liveMatches.get(final.game)!.awayTeam.flag} size="sm" />
                : <span className="text-lg">🏆</span>}
              <span className="text-xs font-semibold text-white truncate">
                {liveMatches.get(final.game)?.awayTeam.name || final.t2}
              </span>
            </div>
          </div>
          <div className="text-center py-1.5 text-[10px] font-black tracking-widest"
            style={{ background: '#f5c518', color: '#0d1b3e' }}>
            🏆 CHAMPION
          </div>
        </div>
      </div>
      <div>
        <div className="text-center text-[9px] font-bold tracking-widest uppercase mb-1.5"
          style={{ color: '#94a3b8' }}>
          Bronze Final
        </div>
        <MatchBox
          game={bronze.game}
          t1={liveMatches.get(bronze.game)?.homeTeam.name || bronze.t1}
          t2={liveMatches.get(bronze.game)?.awayTeam.name || bronze.t2}
          liveMatch={liveMatches.get(bronze.game)}
        />
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function FullBracketView({ matches }: { matches: MatchRow[] }) {
  // Build a fast lookup from game/matchNumber → MatchRow (for knockout rounds)
  // If your DB stores the game number in a field, use it. Otherwise leave empty.
  const liveMatches = new Map<number, MatchRow>()
  // (populate if you have match.gameNumber in the schema)

  const colGap = 6

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d1b3e' }}>
      {/* Header */}
      <div className="text-center py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-4xl font-black text-white leading-none tracking-tight">2026</p>
        <p className="text-sm font-bold tracking-[0.3em] text-gray-300 mt-0.5">WORLD CUP</p>
        <div className="inline-block mt-1.5 px-3 py-0.5 rounded-sm text-xs font-black tracking-widest"
          style={{ background: '#8b1c2c', color: '#fff' }}>
          SCHEDULE
        </div>
        <p className="text-[10px] text-gray-500 mt-2 tracking-widest">48 NATIONS · 3 COUNTRIES · 1 CHAMPION</p>
      </div>

      {/* Bracket scroll container */}
      <div className="overflow-x-auto">
        <div className="flex items-center px-4 py-6"
          style={{ gap: colGap, minWidth: 'max-content' }}>

          {/* Groups A–F */}
          <GroupsCol letters={['A','B','C','D','E','F']} matches={matches} side="left" />

          {/* Separator */}
          <div className="flex-shrink-0 self-stretch" style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />

          {/* Round of 32 — left */}
          <BracketCol items={L_R32} liveMatches={liveMatches} colWidth={130} colLabel="Round of 32" />

          {/* Round of 16 — left */}
          <BracketCol items={L_R16} liveMatches={liveMatches} colWidth={130} colLabel="Round of 16" />

          {/* Quarter-Finals — left */}
          <BracketCol items={L_QF} liveMatches={liveMatches} colWidth={128} colLabel="Quarter-Finals" />

          {/* Semi-Finals — left */}
          <BracketCol items={[L_SF]} liveMatches={liveMatches} colWidth={128} colLabel="Semi-Finals" />

          {/* Final */}
          <FinalCol final={FINAL} bronze={BRONZE} liveMatches={liveMatches} />

          {/* Semi-Finals — right */}
          <BracketCol items={[R_SF]} liveMatches={liveMatches} colWidth={128} colLabel="Semi-Finals" />

          {/* Quarter-Finals — right */}
          <BracketCol items={R_QF} liveMatches={liveMatches} colWidth={128} colLabel="Quarter-Finals" />

          {/* Round of 16 — right */}
          <BracketCol items={R_R16} liveMatches={liveMatches} colWidth={130} colLabel="Round of 16" />

          {/* Round of 32 — right */}
          <BracketCol items={R_R32} liveMatches={liveMatches} colWidth={130} colLabel="Round of 32" />

          {/* Separator */}
          <div className="flex-shrink-0 self-stretch" style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />

          {/* Groups G–L */}
          <GroupsCol letters={['G','H','I','J','K','L']} matches={matches} side="right" />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 text-[10px] tracking-widest font-semibold"
        style={{ color: '#4b6a9b', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        GROUP STAGE: JUNE 11 – JULY 2 &nbsp;·&nbsp; KNOCKOUT: JULY 6 – JULY 19, 2026
      </div>
    </div>
  )
}
