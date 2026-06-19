'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/ui/FlagImg'

/* ─── Types ─────────────────────────────────────────────── */
type Team = { id: number; name: string; code: string; flag: string }
type Match = {
  id: number; homeTeam: Team; awayTeam: Team
  matchDate: string; group: string; stage: string
  homeScore: number | null; awayScore: number | null
  status: string; locked: boolean
}
type Pred = { homeScore: number; awayScore: number; joker: boolean; points: number | null }
type Performer = { display: string; league: string; cheeringFrom: string; total: number }
type PollResult = { option: string; count: number; pct: number }
type Poll = {
  id: number; question: string; options: string[]; status: string
  matchId: number | null; match: any; totalVotes: number
  results: PollResult[]; myVote: string | null
}

type BonusQuestion = {
  id: number; question: string; type: string; stage: string
  options: string[]; points: number; status: string
  correctAnswer: string | null; deadline: string | null
  myAnswer: string | null; myPoints: number | null
}
type LeagueBoard = { league: string; players: Array<{ id: string; display: string; total: number; rank: number }> }

type Props = {
  isLoggedIn: boolean
  matches: Match[]
  predMap: Record<number, Pred>
  userName: string; userRole: string; userNickname: string; userLeague: string
  userTotalPoints: number; userRank: number
  topPerformers: Performer[]
  leagueScoreboards: LeagueBoard[]
  groupAStandings: Array<{ flag: string; code: string; p: number; pts: number; gd: string }>
  nextMatch: Match | null
  comingUp: Match | null
}

/* ─── Slideshow ─────────────────────────────────────────── */
const SLIDES = [
  { bg: '/images/banners/banner-02.png', label: 'FOOTBALL SEASON' },
  { bg: '/images/banners/banner-05.png', label: 'GO · COMPETE · WIN' },
  { bg: '/images/banners/banner-09.png', label: 'PREDICT EVERY MATCH' },
  { bg: '/images/banners/banner-14.png', label: 'FIFA WORLD CUP 2026' },
  { bg: '/images/banners/banner-20.png', label: 'FAMILY · FUN · FOOTBALL' },
]

/* ─── Poll colors ───────────────────────────────────────── */
const POLL_COLORS = ['#3b82f6', '#f43f5e', '#22c55e', '#f59e0b']
const POLL_BG     = ['#eff6ff', '#fff1f2', '#f0fdf4', '#fffbeb']

/* ─── Helpers ───────────────────────────────────────────── */
function isLockedByTime(matchDate: string) {
  return Date.now() >= new Date(matchDate).getTime() - 15 * 60 * 1000
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDayFull(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
}
function countdown(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return 'Live now!'
  const days = Math.floor(diff / 86400000)
  const hrs  = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `Just ${days} days · ${hrs} hr · ${mins} min until`
  if (hrs > 0) return `Just ${hrs} hr · ${mins} min until`
  return `Just ${mins} min until`
}

const TABS = ['PLAY RULES', 'GO PREDICT SCORES', 'AUDIENCE POLL', 'BONUS POINTS', 'SCOREBOARD']

/* ─── Component ─────────────────────────────────────────── */
export default function PredictionsClient({
  isLoggedIn, matches, predMap, userName, userRole, userNickname,
  userLeague, userTotalPoints: initPts, userRank: initRank,
  topPerformers: initTop, leagueScoreboards,
  groupAStandings, nextMatch, comingUp,
}: Props) {
  /* Slideshow */
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  /* Predictions state */
  const [preds, setPreds] = useState<Record<number, { h: string; a: string }>>(
    Object.fromEntries(matches.map(m => [m.id, {
      h: predMap[m.id]?.homeScore?.toString() ?? '',
      a: predMap[m.id]?.awayScore?.toString() ?? '',
    }]))
  )
  const [saving,  setSaving]  = useState<number | null>(null)
  const [saved,   setSaved]   = useState<Record<number, boolean>>({})
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})
  const [tab, setTab]         = useState(isLoggedIn ? 1 : 0)
  const [rulesOpen, setRulesOpen] = useState(false)

  /* Joker state — one per group (key = group like "A","B",...,"L") */
  const [jokers, setJokers] = useState<Record<number, boolean>>(
    Object.fromEntries(
      Object.entries(predMap)
        .filter(([, p]) => (p as Pred).joker)
        .map(([k]) => [+k, true])
    )
  )
  const [jokerSaving, setJokerSaving] = useState<number | null>(null)

  /* Live score refresh */
  const [livePoints, setLivePoints]   = useState(initPts)
  const [liveRank,   setLiveRank]     = useState(initRank)
  const [liveTop,    setLiveTop]      = useState(initTop)
  const [liveMatchPts, setLiveMatchPts] = useState<Record<number, number | null>>(
    Object.fromEntries(Object.entries(predMap).map(([k, v]) => [+k, v.points]))
  )

  const refreshScores = useCallback(async () => {
    try {
      const r = await fetch('/api/scores/me')
      if (!r.ok) return
      const data = await r.json()
      setLivePoints(data.userTotalPoints)
      setLiveRank(data.userRank)
      setLiveTop(data.topPerformers)
      const pts: Record<number, number | null> = {}
      for (const m of data.matchPts ?? []) pts[m.matchId] = m.points
      setLiveMatchPts(pts)
    } catch {}
  }, [])

  useEffect(() => {
    refreshScores()
    const t = setInterval(refreshScores, 30000) // every 30s
    // Also refresh when tab becomes visible
    const onVisible = () => { if (!document.hidden) refreshScores() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [refreshScores])

  /* Polls */
  const [polls, setPolls]     = useState<Poll[]>([])
  const [pollLoaded, setPollLoaded] = useState(false)
  const [voting, setVoting]   = useState<Record<number, boolean>>({})

  async function loadPolls() {
    try {
      const r = await fetch('/api/polls')
      if (r.ok) setPolls(await r.json())
    } catch {}
    setPollLoaded(true)
  }

  async function vote(pollId: number, option: string) {
    setVoting(v => ({ ...v, [pollId]: true }))
    await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, option }),
    })
    await loadPolls()
    setVoting(v => ({ ...v, [pollId]: false }))
  }

  useEffect(() => {
    if (tab === 2 && !pollLoaded) loadPolls()
  }, [tab, pollLoaded])

  /* Prediction save */
  async function savePred(matchId: number) {
    const p = preds[matchId]
    if (!p || p.h === '' || p.a === '') return
    setSaving(matchId)
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, homeScore: +p.h, awayScore: +p.a }),
    })
    setSaving(null)
    setSaved(s => ({ ...s, [matchId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2500)
    refreshScores()
  }

  /* Joker toggle — one per group stage */
  async function toggleJoker(matchId: number, group: string) {
    const current = !!jokers[matchId]
    const newVal = !current
    // Optimistically update UI
    const sameGroupIds = matches.filter(m => m.group === group).map(m => m.id)
    setJokers(prev => {
      const next = { ...prev }
      sameGroupIds.forEach(id => { next[id] = false })
      if (newVal) next[matchId] = true
      return next
    })
    setJokerSaving(matchId)
    const p = preds[matchId] ?? { h: '0', a: '0' }
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        homeScore: p.h !== '' ? +p.h : 0,
        awayScore: p.a !== '' ? +p.a : 0,
        joker: newVal,
      }),
    })
    setJokerSaving(null)
    refreshScores()
  }

  /* Stats from match points (for pie chart) */
  const stats = useMemo(() => {
    const finished = Object.entries(liveMatchPts).filter(([, pts]) => pts !== null && pts !== undefined)
    const exact   = finished.filter(([, pts]) => (pts ?? 0) >= 5).length
    const outcome = finished.filter(([, pts]) => (pts ?? 0) === 3).length
    const partial = finished.filter(([, pts]) => (pts ?? 0) === 1).length
    const wrong   = finished.filter(([, pts]) => (pts ?? 0) === 0).length
    return { exact, outcome, partial, wrong, total: finished.length }
  }, [liveMatchPts])

  /* Date grouping */
  const byDate: Record<string, Match[]> = {}
  for (const m of matches) {
    const key = fmtDate(m.matchDate)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(m)
  }
  const dateKeys = Object.keys(byDate)
  const todayKey = fmtDate(new Date().toISOString())

  /* Slideshow background */
  const [imgErrs, setImgErrs] = useState<Record<number, boolean>>({})
  const cur = SLIDES[slide]

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-3 h-14">
          <Link href="/" className="flex-shrink-0">
            <img src="/images/logo/eagle-logo.png" alt="FIFAFun" className="h-10 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium flex-1">
            <Link href="/" className="text-gray-700 hover:text-red-700">FIFA World Cup 2026</Link>
            <Link href="/standings" className="text-gray-700 hover:text-red-700">Standings</Link>
            <Link href="/highlights" className="text-gray-700 hover:text-red-700">Highlights</Link>
            <Link href="/predictions" className="font-bold border-b-2 border-blue-900" style={{ color: '#1e3a5f' }}>Go FIFAFun</Link>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            {isLoggedIn ? (
              <>
                <span className="hidden sm:inline text-gray-600 font-medium">{userNickname}</span>
                <form action="/api/auth/logout" method="POST">
                  <button className="text-xs text-gray-400 hover:text-red-600">Logout</button>
                </form>
                {userRole === 'admin' && (
                  <Link href="/admin" className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">⚙ Admin</Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-blue-800 font-medium">Login</Link>
                <span className="text-gray-300">|</span>
                <Link href="/auth/register" className="text-gray-700 hover:text-blue-800 font-medium">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* SLIDESHOW BANNER */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(160px,30vw,300px)' }}>
        {!imgErrs[slide] && (
          <img src={cur.bg} alt="" className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgErrs(e => ({ ...e, [slide]: true }))} />
        )}
        <div className="absolute inset-0" style={{
          background: imgErrs[slide]
            ? 'linear-gradient(135deg,#0d1b3e,#8b1c2c)'
            : 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5))',
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-xs tracking-[0.3em] text-yellow-400 font-bold uppercase mb-2">Football Season</p>
          <h2 className="text-lg sm:text-3xl font-black uppercase mb-4">GO · Compete · Win bragging rights</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href={isLoggedIn ? '#predict' : '/auth/register'} className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#8b1c2c' }}>Let's GO</Link>
            <Link href="/leaderboard" className="px-4 py-2 rounded-lg font-semibold text-sm text-white border border-white hover:bg-white hover:text-gray-900 transition-colors">Top Performers</Link>
            {!isLoggedIn && <Link href="/auth/register" className="px-4 py-2 rounded-lg font-semibold text-sm text-white" style={{ background: '#1e3a5f' }}>Register free</Link>}
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${i === slide ? 'w-5 bg-yellow-400' : 'w-2 bg-white opacity-50'}`} />
          ))}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 flex flex-col lg:flex-row gap-5">

        {/* LEFT: Main content */}
        <div className="flex-1 min-w-0">

          {/* ── GUEST VIEW ── */}
          {!isLoggedIn && (
            <div className="space-y-4">
              <div className="border border-yellow-400 bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800 font-medium">
                Note: verify your email from the message we send you, then wait for admin approval before you can log in and play.
                Check your spam or junk folder if you do not see the verification email.
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: '#1e3a5f' }}>Join To Have Super Fun</h2>
                <p className="text-sm text-gray-600 mb-4">Create an account with your full name and funny nickname. Verify your email, then wait for admin approval.</p>
                <div className="flex gap-3 flex-wrap mb-3">
                  <Link href="/auth/register" className="px-5 py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#8b1c2c' }}>Register</Link>
                  <Link href="/auth/login" className="px-5 py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#1e3a5f' }}>Log in</Link>
                </div>
                <p className="text-xs text-gray-500">Just browsing? Visit <Link href="/leaderboard" className="text-blue-700 font-semibold hover:underline">Top Performers</Link> to see player picks.</p>
              </div>
              {/* Scoring rules collapsible */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setRulesOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #8b1c2c)' }}>
                  <span className="flex items-center gap-2 text-white font-bold text-sm">
                    <span>{rulesOpen ? '▾' : '▸'}</span> How points are scored
                  </span>
                </button>
                {rulesOpen && <ScoringRules />}
              </div>
            </div>
          )}

          {/* ── LOGGED-IN VIEW ── */}
          {isLoggedIn && (
            <>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#1e3a5f' }}>Welcome to FIFAFun Predict!</h1>

              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="flex overflow-x-auto border-b border-gray-100">
                  {TABS.map((t, i) => (
                    <button key={t} onClick={() => setTab(i)}
                      className="flex-shrink-0 px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap transition-colors"
                      style={tab === i
                        ? { background: '#1e3a5f', color: 'white', borderBottom: '3px solid #f59e0b' }
                        : { color: '#9ca3af' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── PLAY RULES ── */}
              {tab === 0 && <div className="bg-white rounded-xl p-5 shadow-sm"><ScoringRules /></div>}

              {/* ── GO PREDICT SCORES ── */}
              {tab === 1 && (
                <div id="predict" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-800">Matches</h2>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedDates(Object.fromEntries(dateKeys.map(k => [k, true])))}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Expand all</button>
                      <button onClick={() => setExpandedDates({})}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Collapse all</button>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-white text-xs font-bold tracking-widest uppercase rounded-lg" style={{ background: '#1e3a5f' }}>Group Stage</div>
                  {dateKeys.map(key => {
                    const dayMatches = byDate[key]
                    const expanded = !!expandedDates[key]
                    return (
                      <div key={key}>
                        <button onClick={() => setExpandedDates(s => ({ ...s, [key]: !s[key] }))}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${key === todayKey ? 'border-2 border-dashed border-blue-400 bg-white text-blue-900' : 'bg-white hover:bg-gray-50 text-gray-600'}`}>
                          <span>{expanded ? '∨' : '›'} {key}</span>
                          <span className="text-xs text-gray-400">{dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}</span>
                        </button>
                        {expanded && (
                          <div className="space-y-3 mt-2 mb-3">
                            {dayMatches.map(m => {
                              const p = preds[m.id] ?? { h: '', a: '' }
                              const timeLocked = isLockedByTime(m.matchDate)
                              const locked = m.locked || m.status === 'finished' || timeLocked
                              const pts = liveMatchPts[m.id]
                              return (
                                <div key={m.id} className="bg-white rounded-xl shadow-sm p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">{key}</span>
                                    <div className="flex items-center gap-2">
                                      {pts !== undefined && pts !== null && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pts >= 5 ? 'bg-green-100 text-green-700' : pts >= 3 ? 'bg-blue-100 text-blue-700' : pts > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {pts} pts
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400 font-medium">{fmtTime(m.matchDate)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="sm" />
                                      <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{m.homeTeam.name}</span>
                                    </div>
                                    {m.status === 'finished' && (
                                      <span className="text-sm font-black text-gray-800 flex-shrink-0">{m.homeScore}–{m.awayScore}</span>
                                    )}
                                    {m.status !== 'finished' && <span className="text-xs text-gray-300 flex-shrink-0">vs</span>}
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                      <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate text-right">{m.awayTeam.name}</span>
                                      <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="sm" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input type="number" min="0" max="20" disabled={locked}
                                      value={p.h} onChange={e => setPreds(s => ({ ...s, [m.id]: { ...s[m.id], h: e.target.value } }))}
                                      className="w-12 text-center text-base font-bold border-2 border-blue-200 rounded-lg py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                                      placeholder="0" />
                                    <span className="text-gray-300 text-xs">vs</span>
                                    <input type="number" min="0" max="20" disabled={locked}
                                      value={p.a} onChange={e => setPreds(s => ({ ...s, [m.id]: { ...s[m.id], a: e.target.value } }))}
                                      className="w-12 text-center text-base font-bold border-2 border-blue-200 rounded-lg py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-300"
                                      placeholder="0" />
                                    {!locked && (
                                      <button onClick={() => savePred(m.id)} disabled={saving === m.id}
                                        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                        style={{ background: saved[m.id] ? '#166534' : '#6b7280' }}>
                                        {saving === m.id ? '…' : saved[m.id] ? '✓ Saved' : 'Save'}
                                      </button>
                                    )}
                                    {locked && (
                                      <span className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs rounded-lg">
                                        {m.status === 'finished' ? 'Final' : '🔒 Locked'}
                                      </span>
                                    )}
                                    {/* Joker toggle */}
                                    {!locked && (
                                      <button
                                        onClick={() => toggleJoker(m.id, m.group)}
                                        disabled={jokerSaving === m.id}
                                        title={jokers[m.id] ? 'Joker active — click to remove (×2 this match)' : `Apply joker to double points for Group ${m.group}`}
                                        className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          jokers[m.id]
                                            ? 'bg-yellow-400 text-gray-900 shadow-md ring-2 ring-yellow-300'
                                            : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'
                                        }`}>
                                        {jokerSaving === m.id ? '…' : jokers[m.id] ? '🃏 ×2 ON' : '🃏 Joker'}
                                      </button>
                                    )}
                                    {locked && jokers[m.id] && (
                                      <span className="ml-auto px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-lg font-bold">🃏 ×2</span>
                                    )}
                                  </div>
                                  {predMap[m.id] && (
                                    <p className="text-xs text-gray-400 mt-2">
                                      Your prediction: {predMap[m.id].homeScore}–{predMap[m.id].awayScore}
                                    </p>
                                  )}
                                  {timeLocked && m.status !== 'finished' && (
                                    <p className="text-xs text-orange-500 mt-1">🔒 Locked — kicks off soon</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── AUDIENCE POLL ── */}
              {tab === 2 && (
                <AudiencePollTab
                  polls={polls}
                  loaded={pollLoaded}
                  onVote={vote}
                  voting={voting}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {/* ── BONUS POINTS ── */}
              {tab === 3 && (
                <BonusPointsTab isLoggedIn={isLoggedIn} />
              )}

              {/* ── SCOREBOARD ── */}
              {tab === 4 && (
                <ScoreboardTab
                  topPerformers={liveTop}
                  leagueScoreboards={leagueScoreboards}
                  userNickname={userNickname}
                  userLeague={userLeague}
                />
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-3">
          {/* Your Score */}
          {isLoggedIn && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700">Your score</span>
              </div>
              <div className="px-4 py-3 bg-blue-50">
                <p className="text-xs font-semibold text-blue-800">Your predictions</p>
                <p className="text-xs text-gray-500">
                  {liveRank > 0 ? `#${liveRank}` : '—'} · <span className="font-bold text-blue-700">{livePoints} pts</span>
                  <span className="ml-2 text-gray-300 text-xs animate-pulse">● live</span>
                </p>
              </div>
              <div className="px-4 py-2">
                <Link href="/leaderboard" className="text-xs text-blue-700 hover:underline">View all top performers</Link>
              </div>
            </div>
          )}

          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
              <span className="text-white text-xs font-bold tracking-widest uppercase">Top Performers</span>
              <Link href="/leaderboard" className="text-yellow-400 text-xs hover:underline">View all</Link>
            </div>
            <div className="p-3">
              {liveTop.length === 0 ? (
                <p className="text-xs text-gray-400 p-1">No players registered yet.</p>
              ) : liveTop.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800">{p.display}</div>
                    <div className="text-xs text-gray-400 truncate">{p.cheeringFrom ? `${p.cheeringFrom} · ` : ''}{p.league} · {p.total} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Count Me In (guests) */}
          {!isLoggedIn && (
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              <p className="text-xs text-gray-600 text-center font-semibold">Count Me In!</p>
              <Link href="/auth/register" className="block text-center py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: '#8b1c2c' }}>Register</Link>
              <Link href="/auth/login" className="block text-center py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: '#1e3a5f' }}>Log in</Link>
            </div>
          )}

          {/* Next Match */}
          {nextMatch && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
              <div className="px-4 pt-3 pb-1">
                <p className="text-white text-xs font-bold tracking-widest uppercase mb-0.5">Next match</p>
                <p className="text-gray-300 text-xs">{countdown(nextMatch.matchDate)}</p>
              </div>
              <div className="px-4 pb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FlagImg iso2={nextMatch.homeTeam.flag} name={nextMatch.homeTeam.name} size="md" />
                  <span className="text-gray-400 text-xs font-bold">VS</span>
                  <FlagImg iso2={nextMatch.awayTeam.flag} name={nextMatch.awayTeam.name} size="md" />
                </div>
                <p className="text-center text-gray-300 text-xs">{nextMatch.homeTeam.name} vs {nextMatch.awayTeam.name}</p>
              </div>
            </div>
          )}

          {/* Today's match */}
          {comingUp && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#2563eb' }}>TODAY</span>
                <span className="text-white text-xs font-bold tracking-widest uppercase">Football Match</span>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-center gap-4 bg-white rounded-xl px-4 py-2.5 mb-2">
                  <FlagImg iso2={comingUp.homeTeam.flag} name={comingUp.homeTeam.name} size="lg" />
                  <span className="text-xs font-black text-gray-600">VS</span>
                  <FlagImg iso2={comingUp.awayTeam.flag} name={comingUp.awayTeam.name} size="lg" />
                </div>
                <div className="text-center py-1.5 rounded-lg text-white text-xs font-semibold mb-1" style={{ background: '#0f2040' }}>
                  {fmtDayFull(comingUp.matchDate)}
                </div>
                <p className="text-center text-yellow-400 text-xl font-black">{fmtTime(comingUp.matchDate)}</p>
              </div>
            </div>
          )}

          {/* Coming Up */}
          {nextMatch && nextMatch.id !== comingUp?.id && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#f97316' }}>NEXT</span>
                <span className="text-white text-xs font-bold tracking-widest uppercase">Football Match</span>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-center gap-4 bg-white rounded-xl px-4 py-2.5 mb-2">
                  <FlagImg iso2={nextMatch.homeTeam.flag} name={nextMatch.homeTeam.name} size="lg" />
                  <span className="text-xs font-black text-gray-600">VS</span>
                  <FlagImg iso2={nextMatch.awayTeam.flag} name={nextMatch.awayTeam.name} size="lg" />
                </div>
                <div className="text-center py-1.5 rounded-lg text-white text-xs font-semibold mb-1" style={{ background: '#0f2040' }}>
                  {fmtDayFull(nextMatch.matchDate)}
                </div>
                <p className="text-center text-yellow-400 text-xl font-black">{fmtTime(nextMatch.matchDate)}</p>
              </div>
            </div>
          )}

          {/* Group A Standings */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
              <span className="text-white text-xs font-bold tracking-widest uppercase">Group A Standings</span>
              <Link href="/standings" className="text-yellow-400 text-xs hover:underline">All groups</Link>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-1.5 text-left text-gray-400 font-normal"></th>
                  <th className="px-2 py-1.5 text-center text-gray-400 font-normal">P</th>
                  <th className="px-2 py-1.5 text-center font-normal" style={{ color: '#dc2626' }}>Pts</th>
                  <th className="px-2 py-1.5 text-center text-gray-400 font-normal">GD</th>
                </tr>
              </thead>
              <tbody>
                {groupAStandings.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <FlagImg iso2={t.flag} name={t.code} size="sm" />
                        <span className="text-xs text-gray-700">{t.code}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center text-gray-600">{t.p}</td>
                    <td className="px-2 py-1.5 text-center font-bold" style={{ color: '#dc2626' }}>{t.pts}</td>
                    <td className="px-2 py-1.5 text-center text-gray-500">{t.gd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          {isLoggedIn && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
                <span className="text-white text-xs font-bold tracking-widest uppercase">Statistics</span>
                <button onClick={() => setTab(4)} className="text-yellow-400 text-xs hover:underline">Scoreboard</button>
              </div>
              {stats.total === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400">Charts appear after your first finished match.</p>
                </div>
              ) : (
                <div className="px-4 py-4">
                  {/* Pie chart */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 relative" style={{ width: 56, height: 56 }}>
                      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                        {(() => {
                          const segs = [
                            { val: stats.exact,   color: '#22c55e' },
                            { val: stats.outcome, color: '#3b82f6' },
                            { val: stats.partial, color: '#f59e0b' },
                            { val: stats.wrong,   color: '#e5e7eb' },
                          ]
                          let offset = 0
                          return segs.map((s, i) => {
                            const pct = stats.total > 0 ? (s.val / stats.total) * 100 : 0
                            const el = pct > 0 ? (
                              <circle key={i} cx="18" cy="18" r="15.9"
                                fill="none" stroke={s.color} strokeWidth="4"
                                strokeDasharray={`${pct} ${100 - pct}`}
                                strokeDashoffset={-offset}
                              />
                            ) : null
                            offset += pct
                            return el
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-gray-700">{stats.total}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1 text-xs">
                      {[
                        { label: 'Exact (5pt)',    val: stats.exact,   color: '#22c55e' },
                        { label: 'Outcome (3pt)',  val: stats.outcome, color: '#3b82f6' },
                        { label: 'Partial (1pt)',  val: stats.partial, color: '#f59e0b' },
                        { label: 'Wrong (0pt)',    val: stats.wrong,   color: '#e5e7eb' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-gray-500 flex-1">{label}</span>
                          <span className="font-bold text-gray-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">{stats.total} finished match{stats.total !== 1 ? 'es' : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* Top Goalscorers */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Top Goalscorers</p>
              <p className="text-xs text-gray-400">Tournament goalscorers</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400">No goal data yet — check back after matches are played.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="mt-8" style={{ background: '#111827' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm text-gray-400">
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Tournament</h4>
            <div className="w-6 h-0.5 mb-3 bg-red-600" />
            {['Full Schedule', 'Groups', 'Teams', 'Venues'].map(l => (
              <Link key={l} href="/schedule" className="block hover:text-white text-xs mb-1">{l}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Community</h4>
            <div className="w-6 h-0.5 mb-3 bg-red-600" />
            {['Highlights', 'Audience Poll', 'Discussions', 'Home'].map(l => (
              <Link key={l} href={l === 'Audience Poll' ? '/predictions' : '/'} className="block hover:text-white text-xs mb-1">{l}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Account</h4>
            <div className="w-6 h-0.5 mb-3 bg-red-600" />
            <Link href="/auth/login" className="block hover:text-white text-xs mb-1">Log in</Link>
            <Link href="/auth/register" className="block hover:text-white text-xs mb-1">Register free</Link>
          </div>
        </div>
        <div className="border-t border-gray-800 py-3 text-center text-xs text-gray-500">Copyright © 2026 WorldCup FIFAFun 2026</div>
      </footer>
    </div>
  )
}

/* ─── Scoring Rules sub-component ─────────────────────── */
/* ─── Bonus Points Tab ─────────────────────────────────── */
function BonusPointsTab({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [questions, setQuestions] = useState<BonusQuestion[]>([])
  const [loaded, setLoaded] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/bonus').then(r => r.ok ? r.json() : []).then(data => {
      setQuestions(data)
      const init: Record<number, string> = {}
      for (const q of data) if (q.myAnswer) init[q.id] = q.myAnswer
      setAnswers(init)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function saveAnswers() {
    setSaving(true)
    await fetch('/api/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function fmtDeadline(d: string | null) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (!loaded) return <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />

  const hasOpenQuestions = questions.some(q => q.status === 'open')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Answer bonus questions for extra points when the official results are confirmed.</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: '#1e3a5f' }}>Bonus Questions</h2>
        </div>

        {questions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No bonus questions yet — check back during the tournament.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map((q, i) => {
              const isClosed = q.status !== 'open'
              const isAnswered = q.status === 'answered'
              const myAnswer = answers[q.id] ?? q.myAnswer ?? ''
              const correct = isAnswered && q.correctAnswer && myAnswer === q.correctAnswer

              return (
                <div key={q.id} className="px-6 py-5">
                  {/* Question row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {i + 1}. {q.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        my answer:{' '}
                        {isAnswered ? (
                          <span className={`font-semibold ${correct ? 'text-green-600' : 'text-red-500'}`}>
                            {myAnswer || '—'} {correct ? '✓' : q.correctAnswer ? `(correct: ${q.correctAnswer})` : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400">{myAnswer || '—'}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>
                        [ Question value: {q.points} Points ]
                      </span>
                      {/* Pie chart icon */}
                      <div className="w-8 h-8 rounded-full border-4 flex-shrink-0" style={{
                        borderColor: '#e5e7eb',
                        background: isAnswered
                          ? `conic-gradient(${correct ? '#22c55e' : '#ef4444'} ${correct ? 100 : 0}%, #e5e7eb 0%)`
                          : 'conic-gradient(#f59e0b 50%, #e5e7eb 0%)',
                      }} />
                    </div>
                  </div>

                  {/* Closed question details */}
                  {isClosed && (
                    <div className="flex items-center gap-6 mt-2">
                      <span className="text-xs text-gray-400">
                        {isAnswered ? 'Answered' : 'Closed'} on {fmtDeadline(q.deadline)}
                      </span>
                      <span className={`text-xs font-semibold ${(q.myPoints ?? 0) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        points awarded: {q.myPoints ?? 0} points
                      </span>
                    </div>
                  )}

                  {/* Open question — dropdown */}
                  {!isClosed && (
                    <div className="mt-3">
                      <select
                        className="w-full sm:w-72 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white appearance-none"
                        value={myAnswer}
                        onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        disabled={!isLoggedIn}
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '36px' }}
                      >
                        <option value="">— Select your answer —</option>
                        {q.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {q.deadline && (
                        <p className="text-xs text-gray-400 mt-1.5">Answer before {fmtDeadline(q.deadline)}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Save button */}
        {hasOpenQuestions && isLoggedIn && (
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={saveAnswers}
              disabled={saving}
              className="px-8 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-colors"
              style={{ background: saved ? '#166534' : '#dc2626' }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save'}
            </button>
          </div>
        )}
        {!isLoggedIn && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">Log in</Link> to answer bonus questions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Scoreboard Tab ───────────────────────────────────── */
function ScoreboardTab({
  topPerformers, leagueScoreboards, userNickname, userLeague,
}: {
  topPerformers: Performer[]
  leagueScoreboards: LeagueBoard[]
  userNickname: string
  userLeague: string
}) {
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">See who is leading and how your picks compare.</p>

      {/* Overall leaderboard - grouped by league */}
      {topPerformers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No users have registered for FIFAFun (yet).</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leagueScoreboards.map(({ league, players }) => {
            if (players.length === 0) return null
            const isMyLeague = league === userLeague
            return (
              <div key={league} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{league}</h3>
                  {isMyLeague && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Your league</span>
                  )}
                  <span className="text-xs text-gray-400">{players.length} player{players.length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">#</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Player</th>
                      <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={p.id} className={`border-t border-gray-50 ${p.display === userNickname ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-800">
                          {p.display}
                          {p.display === userNickname && <span className="ml-1.5 text-blue-500 text-xs">(you)</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center font-black text-xs" style={{ color: '#1e3a5f' }}>{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* Collapsible scoring rules */}
      <div className="rounded-xl overflow-hidden">
        <button
          onClick={() => setRulesOpen(o => !o)}
          className="w-full flex items-center gap-3 px-6 py-4 text-left"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #8b1c2c 100%)' }}
        >
          <span className="text-yellow-400 font-bold text-sm">{rulesOpen ? '▾' : '▸'}</span>
          <span className="text-yellow-400 font-bold text-sm">How points are scored</span>
        </button>
        {rulesOpen && (
          <div className="bg-white px-6 py-5">
            <ScoringRules />
          </div>
        )}
      </div>

      {/* Stats section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your stats &amp; charts</h2>
        {topPerformers.length === 0 ? (
          <p className="text-sm font-semibold" style={{ color: '#8b1c2c' }}>
            Statistics not yet available — After the first match you can view your scores and those of other players here.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total points', val: topPerformers.find(p => p.display === userNickname)?.total ?? 0 },
              { label: 'Matches played', val: '—' },
              { label: 'Exact scores', val: '—' },
            ].map(({ label, val }) => (
              <div key={label} className="text-center rounded-xl p-4" style={{ background: '#f4f6fb' }}>
                <div className="text-2xl font-black" style={{ color: '#1e3a5f' }}>{val}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Scoring Rules sub-component ─────────────────────── */
function ScoringRules() {
  return (
    <div className="space-y-6">

      {/* ── Main scoring intro ── */}
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Enter home and away goals for each match. Use one joker per stage to double your points on a match.
          You can change predictions until kick-off.
        </p>
        <p className="text-sm text-gray-600">
          Your total is the sum of points from every finished match plus any bonus questions you answered correctly.
          Each match can award points as follows:
        </p>
      </div>

      {/* ── Score grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Exact score',           val: '5'  },
          { label: 'Correct outcome only',  val: '3'  },
          { label: 'Per correct team goals',val: '1'  },
          { label: 'Joker multiplier',      val: '×2' },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl p-4 text-center text-white" style={{ background: '#1e3a5f' }}>
            <div className="text-xs text-gray-300 mb-1 leading-tight">{label}</div>
            <div className="text-3xl font-black text-yellow-400">{val}</div>
          </div>
        ))}
      </div>

      {/* ── Bullet notes ── */}
      <ul className="text-sm text-gray-600 space-y-2 list-disc list-outside ml-5">
        <li>Pick one joker per stage to multiply that match's points (see multiplier above).</li>
        <li>Bonus questions add extra points when the official answer is confirmed — use the Bonus Points tab to answer them.</li>
      </ul>

      {/* ── Divider ── */}
      <hr className="border-gray-200" />

      {/* ── Scoring detail table ── */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#1e3a5f' }}>Scoring — full breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                <th className="text-left px-4 py-2.5 text-white text-xs font-semibold">Prediction</th>
                <th className="text-left px-4 py-2.5 text-white text-xs font-semibold">Example</th>
                <th className="text-center px-4 py-2.5 text-yellow-400 text-xs font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { pred: 'Exact score',               ex: 'Result 2–1, you predicted 2–1',       pts: '5' },
                { pred: 'Correct outcome only',       ex: 'Result 2–1, you predicted 3–1',       pts: '3' },
                { pred: 'One team correct, wrong result', ex: 'Result 2–1, you predicted 2–0',   pts: '1' },
                { pred: 'Both teams correct, wrong result', ex: 'Result 2–1, you predicted 2–1 — already exact', pts: '—' },
                { pred: 'Wrong outcome',              ex: 'Result 2–1, you predicted 0–1',       pts: '0' },
              ].map(({ pred, ex, pts }) => (
                <tr key={pred} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{pred}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{ex}</td>
                  <td className="px-4 py-2.5 text-center text-xs font-black" style={{ color: pts === '0' || pts === '—' ? '#9ca3af' : '#1e3a5f' }}>{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* ── Joker rules ── */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>🃏 Joker</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>You get one joker per stage (group stage, round of 32, round of 16, quarter-finals, semi-finals, final).</li>
          <li>Apply your joker to one match per stage to double that match's points.</li>
          <li>You can change or remove your joker up to kick-off of the match it is applied to.</li>
          <li>If the match you jokered is postponed or cancelled, your joker is returned.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      {/* ── Bonus questions ── */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>❓ Bonus questions</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>Bonus questions appear in the <strong>Bonus Points</strong> tab throughout the tournament.</li>
          <li>Each question states its point value and the deadline for answering.</li>
          <li>Once the admin confirms the correct answer, points are awarded automatically to everyone who got it right.</li>
          <li>Bonus question points are added on top of your match-prediction total.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      {/* ── Deadlines ── */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>🔒 Deadlines & locks</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>Predictions for each match lock <strong>15 minutes before kick-off</strong>. You cannot change them after that.</li>
          <li>You can update your prediction as many times as you like before the lock.</li>
          <li>If you do not submit a prediction before the lock, you score 0 for that match — no retroactive entries.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      {/* ── Tiebreakers ── */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>🏅 Tiebreakers</h3>
        <p className="text-sm text-gray-600 mb-2">When two or more players have the same total points, rank is decided by:</p>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-outside ml-5">
          <li>Most exact scores (5-point predictions)</li>
          <li>Most correct outcomes (3-point predictions)</li>
          <li>Earliest registration date</li>
        </ol>
      </div>

      <hr className="border-gray-200" />

      {/* ── Leagues ── */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>🏆 Leagues</h3>
        <p className="text-sm text-gray-600">
          Players are grouped into leagues — <strong>Aila Attackers</strong>, <strong>Sukuti Strikers</strong>, and <strong>Gorkhali Gooners</strong>.
          The Scoreboard and Leagues Standings show rankings within each league so you can compare with the people you know.
          The same scoring rules apply in every league.
        </p>
      </div>

      <hr className="border-gray-200" />

      {/* ── Fun disclaimer ── */}
      <div className="rounded-xl p-4 text-sm text-gray-500 border border-gray-100" style={{ background: '#f9fafb' }}>
        <p>
          <strong>This is a free, fun pool for friends and family.</strong> No entry fees, no real prizes — just bragging rights.
          Predictions are for entertainment only.{' '}
          <Link href="/disclaimer" className="text-blue-600 hover:underline">Read the full disclaimer →</Link>
        </p>
      </div>
    </div>
  )
}

/* ─── Audience Poll tab ────────────────────────────────── */
function AudiencePollTab({
  polls, loaded, onVote, voting, isLoggedIn,
}: {
  polls: Poll[]
  loaded: boolean
  onVote: (pollId: number, option: string) => Promise<void>
  voting: Record<number, boolean>
  isLoggedIn: boolean
}) {
  const [selected, setSelected] = useState<Record<number, string>>({})

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Poll votes are for fun and do not count for points.</p>

      {/* Header banner */}
      <div className="rounded-xl overflow-hidden">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #8b1c2c 100%)' }}>
          <h2 className="text-xl font-black text-yellow-400 mb-1">🏆 Next 3 matches</h2>
          <p className="text-sm text-white">
            Poll votes do not count for points.{' '}
            <Link href="#predict" className="text-yellow-400 font-semibold hover:underline" onClick={() => {}}>
              Enter your official prediction →
            </Link>
          </p>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No polls open right now — check back before the next match!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, pi) => {
            const hasVoted = !!poll.myVote || !!selected[poll.id]
            const myChoice = poll.myVote || selected[poll.id]

            return (
              <div key={poll.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                {/* Poll header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {pi === 0 ? 'Vote now — next match' : `Poll ${pi + 1}`}
                      </h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#16a34a' }}>
                        {poll.status === 'open' ? 'Voting open until kickoff' : 'Poll closed'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Poll question + options */}
                <div className="px-6 py-5">
                  <p className="text-center text-gray-700 font-medium text-base mb-5">{poll.question}</p>

                  <div className="space-y-3">
                    {poll.options.map((opt, i) => {
                      const result = poll.results[i]
                      const pct = result?.pct ?? 0
                      const isChosen = myChoice === opt
                      const color = POLL_COLORS[i % POLL_COLORS.length]
                      const bg    = POLL_BG[i % POLL_BG.length]

                      return (
                        <div key={opt}>
                          {/* Option row */}
                          <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isChosen ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                          }`}
                            style={{ cursor: poll.status !== 'open' ? 'default' : 'pointer' }}>
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              value={opt}
                              checked={isChosen}
                              onChange={() => {
                                if (poll.status !== 'open') return
                                setSelected(s => ({ ...s, [poll.id]: opt }))
                              }}
                              disabled={poll.status !== 'open'}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="flex-1 text-sm font-medium text-gray-700">{opt}</span>
                            <span className="text-sm font-bold text-gray-500">{pct}%</span>
                          </label>

                          {/* Progress bar */}
                          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: bg }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Vote button */}
                  <div className="mt-5 text-center">
                    {hasVoted ? (
                      <p className="text-xs text-gray-400">
                        {poll.myVote ? `You voted: ${poll.myVote}` : 'Vote registered! Waiting for confirmation…'}
                      </p>
                    ) : (
                      <button
                        onClick={() => {
                          const choice = selected[poll.id]
                          if (choice) onVote(poll.id, choice)
                        }}
                        disabled={!selected[poll.id] || voting[poll.id] || poll.status !== 'open'}
                        className="px-8 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {voting[poll.id] ? 'Voting…' : isLoggedIn ? 'Vote' : 'Anonymous Vote'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
