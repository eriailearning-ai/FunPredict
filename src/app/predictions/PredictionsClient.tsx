'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/ui/FlagImg'
import LocalTime from '@/components/ui/LocalTime'
import Navbar from '@/components/layout/Navbar'
import SiteBanner from '@/components/ui/SiteBanner'
import Footer from '@/components/layout/Footer'

/* ─── Types ─────────────────────────────────────────────── */
type Team = { id: number; name: string; code: string; flag: string }
type Match = {
  id: number; homeTeam: Team; awayTeam: Team
  matchDate: string; group: string; stage: string
  homeScore: number | null; awayScore: number | null
  status: string; locked: boolean
}
type Pred = { homeScore: number; awayScore: number; joker: boolean; points: number | null; scorerPred?: string | null }
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
type BonusEntry = { questionId: number; answer: string | null; points: number | null; status: string; correctAnswer: string | null }
type PredDist = { home: number; draw: number; away: number; total: number }

type Props = {
  isLoggedIn: boolean
  matches: Match[]
  predMap: Record<number, Pred>
  userName: string; userRole: string; userNickname: string; userLeague: string
  userTotalPoints: number; userRank: number
  topPerformers: Performer[]
  leagueScoreboards: LeagueBoard[]
  groupAStandings: Array<{ flag: string; name: string; p: number; pts: number; gd: string }>
  nextMatch: Match | null
  comingUp: Match | null
  topScorers: Array<{ name: string; team: string; goals: number; assists: number }>
  bonusMap: Record<number, BonusEntry>
  predDistMap: Record<number, PredDist>
}

/* ─── Poll colors ───────────────────────────────────────── */
const POLL_COLORS = ['#3b82f6', '#f43f5e', '#22c55e', '#f59e0b']
const POLL_BG     = ['#eff6ff', '#fff1f2', '#f0fdf4', '#fffbeb']

/* ─── Helpers ───────────────────────────────────────────── */
function isLockedByTime(matchDate: string) {
  return Date.now() >= new Date(matchDate).getTime() - 15 * 60 * 1000
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}
function fmtDayFull(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' }).toUpperCase()
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

const TABS = ['PLAY RULES', 'GO PREDICT SCORES', 'MY POINTS', 'AUDIENCE POLL', 'BONUS POINTS', 'SCOREBOARD']

/* ─── Component ─────────────────────────────────────────── */
export default function PredictionsClient({
  isLoggedIn, matches, predMap, userName, userRole, userNickname,
  userLeague, userTotalPoints: initPts, userRank: initRank,
  topPerformers: initTop, leagueScoreboards,
  groupAStandings, nextMatch, comingUp, topScorers,
  bonusMap: initBonusMap, predDistMap,
}: Props) {
  /* Predictions state */
  const [preds, setPreds] = useState<Record<number, { h: string; a: string }>>(
    Object.fromEntries(matches.map(m => [m.id, {
      h: predMap[m.id]?.homeScore?.toString() ?? '',
      a: predMap[m.id]?.awayScore?.toString() ?? '',
    }]))
  )
  /* Scorer state — one per match, synced from predMap on mount */
  const [scorerPreds, setScorerPreds] = useState<Record<number, string>>(
    Object.fromEntries(matches.map(m => [m.id, predMap[m.id]?.scorerPred ?? '']))
  )

  const [saving,  setSaving]  = useState<number | null>(null)
  const [saved,   setSaved]   = useState<Record<number, boolean>>({})
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(() => {
    const todayK = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    const init: Record<string, boolean> = { [todayK]: true }
    // Auto-expand all knockout stage dates so players can see and predict them
    for (const m of matches) {
      if (m.stage && m.stage !== 'group') {
        init[fmtDate(m.matchDate)] = true
      }
    }
    return init
  })
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
  const [jokerError, setJokerError] = useState<string | null>(null)

  /* Prediction distribution popup */
  const [showDist, setShowDist] = useState<number | null>(null)

  /* Per-match bonus questions */
  const [bonusAnswers, setBonusAnswers] = useState<Record<number, string>>(
    Object.fromEntries(
      Object.entries(initBonusMap)
        .filter(([, b]) => b.answer !== null)
        .map(([k, b]) => [+k, b.answer!])
    )
  )
  const [bonusSaving, setBonusSaving] = useState<number | null>(null)
  const [bonusSaved,  setBonusSaved]  = useState<Record<number, boolean>>({})

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
    if (tab === 3 && !pollLoaded) loadPolls()
  }, [tab, pollLoaded])

  /* Prediction save — includes scorer */
  async function savePred(matchId: number) {
    const p = preds[matchId]
    if (!p || p.h === '' || p.a === '') return
    setSaving(matchId)
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        homeScore: +p.h,
        awayScore: +p.a,
        scorerPred: scorerPreds[matchId] || null,
      }),
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
    setJokerError(null)

    // Optimistically update UI
    setJokers(prev => ({ ...prev, [matchId]: newVal }))
    setJokerSaving(matchId)

    // Only send matchId + joker — no scores, no scorerPred
    // The route uses a simple SQL path that doesn't touch other columns
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, joker: newVal }),
    })
    setJokerSaving(null)

    if (!res.ok) {
      // Revert optimistic update
      setJokers(prev => ({ ...prev, [matchId]: current }))
      const data = await res.json().catch(() => ({}))
      setJokerError(data.error ?? 'Could not apply joker.')
      setTimeout(() => setJokerError(null), 4000)
      return
    }
    refreshScores()
  }

  /* Save per-match bonus answer */
  async function saveBonusAnswer(matchId: number, questionId: number) {
    const answer = bonusAnswers[matchId]
    if (!answer?.trim()) return
    setBonusSaving(matchId)
    await fetch('/api/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { [questionId]: answer.trim() } }),
    })
    setBonusSaving(null)
    setBonusSaved(s => ({ ...s, [matchId]: true }))
    setTimeout(() => setBonusSaved(s => ({ ...s, [matchId]: false })), 2500)
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

  /* Stage ordering + labels */
  const STAGE_ORDER = ['group','r32','r16','qf','sf','3rd','final']
  const STAGE_LABEL: Record<string, string> = {
    group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
    qf: 'Quarter-Finals', sf: 'Semi-Finals', '3rd': 'Third-Place Play-off', final: 'Final',
  }

  /* Group matches by stage, then by date within each stage */
  const byStage: Record<string, Record<string, Match[]>> = {}
  for (const m of matches) {
    const stage = m.stage || 'group'
    if (!byStage[stage]) byStage[stage] = {}
    const key = fmtDate(m.matchDate)
    if (!byStage[stage][key]) byStage[stage][key] = []
    byStage[stage][key].push(m)
  }
  const stagesPresent = STAGE_ORDER.filter(s => byStage[s])

  /* For expand-all/collapse-all — all date keys across all stages */
  const allDateKeys = stagesPresent.flatMap(s => Object.keys(byStage[s]))
  const todayKey = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      {/* Shared navbar */}
      <Navbar user={isLoggedIn ? { name: userName, nickname: userNickname, role: userRole } : null} />

      {/* Shared banner — logo overlay included */}
      <SiteBanner />

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">

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
              {/* Joker error toast — fixed overlay so it's always visible */}
              {jokerError && (
                <div style={{
                  position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                  background: '#b45309', color: '#fff', padding: '12px 24px', borderRadius: '12px',
                  fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  maxWidth: '90vw', textAlign: 'center',
                }}>
                  {jokerError}
                </div>
              )}

              {tab === 1 && (
                <div id="predict" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-800">Matches</h2>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedDates(Object.fromEntries(allDateKeys.map(k => [k, true])))}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Expand all</button>
                      <button onClick={() => setExpandedDates({})}
                        className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Collapse all</button>
                    </div>
                  </div>
                  {stagesPresent.map(stage => {
                    const stageDateKeys = Object.keys(byStage[stage])
                    return (
                      <div key={stage}>
                        <div className="px-4 py-2 text-white text-xs font-bold tracking-widest uppercase rounded-lg" style={{ background: '#1e3a5f' }}>{STAGE_LABEL[stage] ?? stage}</div>
                        {stageDateKeys.map(key => {
                    const dayMatches = byStage[stage][key]
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
                              const bonus = initBonusMap[m.id]
                              const dist = predDistMap[m.id]
                              const jokerActive = !!jokers[m.id]
                              return (
                                <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                  {/* Card header: date + time + pts */}
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100" style={{ background: '#f9fafb' }}>
                                    <span className="text-xs text-gray-500 font-medium">{key}</span>
                                    <div className="flex items-center gap-2">
                                      {pts !== undefined && pts !== null && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pts >= 5 ? 'bg-green-100 text-green-700' : pts >= 3 ? 'bg-blue-100 text-blue-700' : pts > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {pts} pts
                                        </span>
                                      )}
                                      <LocalTime iso={m.matchDate} className="text-xs text-gray-500 font-medium" />
                                    </div>
                                  </div>

                                  <div className="flex">
                                    {/* Main match content */}
                                    <div className="flex-1 p-4 min-w-0">
                                      {/* Teams row: Flag Name ... Name Flag */}
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <FlagImg iso2={m.homeTeam.flag} name={m.homeTeam.name} size="md" />
                                          <span className="text-sm font-bold text-gray-900 truncate">{m.homeTeam.name}</span>
                                        </div>
                                        {m.status === 'finished' ? (
                                          <span className="text-base font-black text-gray-900 flex-shrink-0 px-1">{m.homeScore} – {m.awayScore}</span>
                                        ) : m.status === 'live' ? (
                                          <span className="text-base font-black flex-shrink-0 px-1" style={{ color: '#dc2626' }}>{m.homeScore} – {m.awayScore}</span>
                                        ) : (
                                          <span className="text-xs text-gray-300 flex-shrink-0 px-1">vs</span>
                                        )}
                                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                          <span className="text-sm font-bold text-gray-900 truncate text-right">{m.awayTeam.name}</span>
                                          <FlagImg iso2={m.awayTeam.flag} name={m.awayTeam.name} size="md" />
                                        </div>
                                      </div>

                                      {/* Prediction input row */}
                                      {!locked ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <input type="number" min="0" max="20"
                                            value={p.h} onChange={e => setPreds(s => ({ ...s, [m.id]: { ...s[m.id], h: e.target.value } }))}
                                            className="w-12 text-center text-base font-bold border-2 border-blue-200 rounded-lg py-1.5 focus:outline-none focus:border-blue-500"
                                            placeholder="0" />
                                          <span className="text-gray-300 text-xs">vs</span>
                                          <input type="number" min="0" max="20"
                                            value={p.a} onChange={e => setPreds(s => ({ ...s, [m.id]: { ...s[m.id], a: e.target.value } }))}
                                            className="w-12 text-center text-base font-bold border-2 border-blue-200 rounded-lg py-1.5 focus:outline-none focus:border-blue-500"
                                            placeholder="0" />
                                          <button onClick={() => savePred(m.id)} disabled={saving === m.id}
                                            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                            style={{ background: saved[m.id] ? '#166534' : '#1e3a5f' }}>
                                            {saving === m.id ? '…' : saved[m.id] ? '✓ Saved' : 'Save'}
                                          </button>
                                          {predMap[m.id] && (
                                            <span className="text-xs text-gray-400 ml-auto">
                                              {predMap[m.id].homeScore}–{predMap[m.id].awayScore}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {m.status === 'finished' ? (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Final</span>
                                          ) : (
                                            <span className="text-xs text-orange-500">🔒 {timeLocked ? 'Kicks off soon' : 'Locked'}</span>
                                          )}
                                          {predMap[m.id] && (
                                            <span className="text-xs text-gray-400 ml-2">
                                              My pick: {predMap[m.id].homeScore}–{predMap[m.id].awayScore}
                                              {jokerActive && <span className="ml-1 font-bold" style={{ color: '#d97706' }}>×2</span>}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* ── Scorer prediction (+2 pts) ── */}
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs text-gray-500 font-medium flex-1">⚽ Who scores?</span>
                                          <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#fef9c3', color: '#92400e' }}>+2 pts</span>
                                        </div>
                                        {!locked ? (
                                          <select
                                            value={scorerPreds[m.id] ?? ''}
                                            onChange={e => setScorerPreds(s => ({ ...s, [m.id]: e.target.value }))}
                                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
                                          >
                                            <option value="">— Pick a scorer (saved with score) —</option>
                                            {(m as any).homePlayers?.length > 0 && (
                                              <optgroup label={m.homeTeam.name}>
                                                {(m as any).homePlayers.map((name: string) => (
                                                  <option key={name} value={name}>{name}</option>
                                                ))}
                                              </optgroup>
                                            )}
                                            {(m as any).awayPlayers?.length > 0 && (
                                              <optgroup label={m.awayTeam.name}>
                                                {(m as any).awayPlayers.map((name: string) => (
                                                  <option key={name} value={name}>{name}</option>
                                                ))}
                                              </optgroup>
                                            )}
                                          </select>
                                        ) : (
                                          <div className="space-y-1">
                                            {/* Player's pick */}
                                            <p className="text-xs text-gray-500">
                                              My pick:{' '}
                                              {scorerPreds[m.id]
                                                ? <span className="font-semibold text-gray-700">{scorerPreds[m.id]}</span>
                                                : <span className="italic text-gray-400">none</span>
                                              }
                                            </p>
                                            {/* Actual scorers (once match is finished) */}
                                            {m.status === 'finished' && (m as any).scorers?.length > 0 && (
                                              <p className="text-xs text-gray-500">
                                                Scored:{' '}
                                                {(m as any).scorers.map((s: string, i: number) => {
                                                  const correct = scorerPreds[m.id]?.toLowerCase() === s.toLowerCase()
                                                  return (
                                                    <span key={s}>
                                                      {i > 0 && ', '}
                                                      <span className={correct ? 'font-bold text-green-600' : ''}>{s}</span>
                                                    </span>
                                                  )
                                                })}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right icons column: pie chart + soccer ball joker */}
                                    <div className="flex flex-col items-center justify-start gap-3 pt-4 pb-4 px-3 border-l border-gray-100 min-w-[52px]">
                                      {/* Pie chart: prediction distribution */}
                                      <button
                                        onClick={() => setShowDist(prev => prev === m.id ? null : m.id)}
                                        title="View prediction distribution"
                                        className="flex flex-col items-center gap-0.5 group">
                                        <DistPieIcon dist={dist} active={showDist === m.id} />
                                        <span className="text-[9px] text-gray-400 group-hover:text-blue-500">picks</span>
                                      </button>

                                      {/* Soccer ball joker icon */}
                                      {(!locked || jokerActive) && (
                                        <button
                                          onClick={() => !locked && toggleJoker(m.id, m.group)}
                                          disabled={jokerSaving === m.id || locked}
                                          title="Click to toggle your multiplier"
                                          className={`flex flex-col items-center gap-0.5 transition-all ${locked ? 'cursor-default' : 'cursor-pointer'} ${jokerActive ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}>
                                          <span className={`text-xl leading-none ${jokerActive ? 'filter drop-shadow' : ''}`}>⚽</span>
                                          <span className={`text-[9px] font-bold leading-none ${jokerActive ? 'text-yellow-600' : 'text-gray-400'}`}>
                                            {jokerSaving === m.id ? '…' : jokerActive ? '×2' : 'joker'}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Distribution popup */}
                                  {showDist === m.id && (
                                    <div className="border-t border-gray-100 px-4 py-3" style={{ background: '#f9fafb' }}>
                                      {dist && dist.total > 0 ? (
                                        <>
                                          <p className="text-xs font-bold text-gray-600 mb-2">{dist.total} prediction{dist.total !== 1 ? 's' : ''} so far</p>
                                          <div className="space-y-1.5">
                                            {[
                                              { label: `${m.homeTeam.name} win`, val: dist.home, color: '#3b82f6' },
                                              { label: 'Draw', val: dist.draw, color: '#f59e0b' },
                                              { label: `${m.awayTeam.name} win`, val: dist.away, color: '#ef4444' },
                                            ].map(row => {
                                              const pct = Math.round((row.val / dist.total) * 100)
                                              return (
                                                <div key={row.label}>
                                                  <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="text-gray-600">{row.label}</span>
                                                    <span className="font-bold text-gray-700">{row.val} ({pct}%)</span>
                                                  </div>
                                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: row.color }} />
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </>
                                      ) : (
                                        <p className="text-xs text-gray-400">No predictions yet for this match.</p>
                                      )}
                                    </div>
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
                    )
                  })}
                </div>
              )}

              {/* ── AUDIENCE POLL ── */}
              {/* ── MY POINTS ── */}
              {tab === 2 && (
                <MyPointsTab
                  matches={matches}
                  predMap={predMap}
                />
              )}

              {tab === 3 && (
                <AudiencePollTab
                  polls={polls}
                  loaded={pollLoaded}
                  onVote={vote}
                  voting={voting}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {/* ── BONUS POINTS ── */}
              {tab === 4 && (
                <BonusPointsTab isLoggedIn={isLoggedIn} />
              )}

              {/* ── SCOREBOARD ── */}
              {tab === 5 && (
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

          {/* Coming up match */}
          {comingUp && (
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e3a5f' }}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: new Date(comingUp.matchDate).toDateString() === new Date().toDateString() ? '#16a34a' : '#2563eb' }}>
                  {new Date(comingUp.matchDate).toDateString() === new Date().toDateString() ? 'TODAY' : 'COMING UP'}
                </span>
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
                <p className="text-center text-yellow-400 text-xl font-black"><LocalTime iso={comingUp.matchDate} color="#facc15" /></p>
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
                <p className="text-center text-yellow-400 text-xl font-black"><LocalTime iso={nextMatch.matchDate} color="#facc15" /></p>
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
                        <FlagImg iso2={t.flag} name={t.name} size="sm" />
                        <span className="text-xs text-gray-700">{t.name}</span>
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
                <button onClick={() => setTab(5)} className="text-yellow-400 text-xs hover:underline">Scoreboard</button>
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
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a5f' }}>
              <span className="text-white text-xs font-bold tracking-widest uppercase">Top Goalscorers</span>
            </div>
            <div className="p-3">
              {topScorers.length === 0 ? (
                <p className="text-xs text-gray-400 p-1">No goal data yet — check back after matches are played.</p>
              ) : topScorers.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.team}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs font-black" style={{ color: '#dc2626' }}>{s.goals}</span>
                    <span className="text-xs text-gray-300">⚽</span>
                    {s.assists > 0 && <span className="text-xs text-gray-400">{s.assists}A</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Shared footer */}
      <Footer />
    </div>
  )
}

/* ─── Dist Pie Icon ─────────────────────────────────────── */
function DistPieIcon({ dist, active }: { dist?: PredDist; active?: boolean }) {
  const size = 24
  if (!dist || dist.total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`transition-opacity ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#d1d5db" strokeWidth="2" />
        <path d="M12 3 L12 12 L21 12" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  const r = 9, cx = 12, cy = 12
  const slices = [
    { val: dist.home, color: '#3b82f6' },
    { val: dist.draw, color: '#f59e0b' },
    { val: dist.away, color: '#ef4444' },
  ]
  let cumPct = 0
  const paths: JSX.Element[] = []
  for (const s of slices) {
    const pct = s.val / dist.total
    if (pct <= 0) { cumPct += pct; continue }
    if (pct >= 1) {
      paths.push(<circle key={s.color} cx={cx} cy={cy} r={r} fill={s.color} />)
      break
    }
    const startA = cumPct * 2 * Math.PI - Math.PI / 2
    const endA = (cumPct + pct) * 2 * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA)
    const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA)
    paths.push(
      <path key={s.color}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={s.color} />
    )
    cumPct += pct
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`rounded-full transition-all ${active ? 'ring-2 ring-blue-400' : ''}`}>
      {paths}
    </svg>
  )
}

/* ─── My Points Tab ────────────────────────────────────── */
function MyPointsTab({ matches, predMap }: { matches: any[]; predMap: Record<number, any> }) {
  const finished = matches.filter(m => m.status === 'finished' && predMap[m.id])

  if (finished.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm">
        No finished matches with predictions yet. Points will appear here after matches complete.
      </div>
    )
  }

  // Use STORED points so total always matches leaderboard
  const rows = finished.map(m => {
    const pred       = predMap[m.id]
    const storedPts  = pred.points ?? 0          // ← source of truth
    const joker      = pred.joker  ?? false
    const scorerPred: string = pred.scorerPred ?? ''
    const actualScorers: string[] = (m.scorers ?? []) as string[]

    const scorerHit = !!scorerPred &&
      actualScorers.some(s => s.toLowerCase().trim() === scorerPred.toLowerCase().trim())

    // Score label — only computable when real match scores are in the DB
    const hasRealScore = m.homeScore !== null && m.awayScore !== null
    let scoreLabel = '—'
    let baseScore: number | null = null

    if (hasRealScore) {
      if (pred.homeScore === m.homeScore && pred.awayScore === m.awayScore) {
        scoreLabel = 'Exact'; baseScore = 5
      } else {
        const predSign = Math.sign(pred.homeScore - pred.awayScore)
        const realSign = Math.sign(m.homeScore - m.awayScore)
        if (predSign === realSign) {
          scoreLabel = 'Outcome'; baseScore = 3
        } else {
          let partial = 0
          if (pred.homeScore === m.homeScore) partial++
          if (pred.awayScore === m.awayScore) partial++
          scoreLabel = partial > 0 ? `Partial (${partial})` : 'Wrong'
          baseScore = partial
        }
      }
    }

    return { m, pred, storedPts, joker, scorerPred, scorerHit, scoreLabel, baseScore, hasRealScore }
  })

  const grandTotal = rows.reduce((s, r) => s + r.storedPts, 0)

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Finished matches with predictions</p>
          <p className="text-sm font-bold text-gray-800">{finished.length} matches graded</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total earned</p>
          <p className="text-3xl font-black" style={{ color: '#1e3a5f' }}>{grandTotal} pts</p>
        </div>
      </div>

      {/* Per-match breakdown */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                <th className="text-left px-3 py-2.5 text-white font-semibold">Match</th>
                <th className="text-center px-3 py-2.5 text-white font-semibold">Result</th>
                <th className="text-center px-3 py-2.5 text-white font-semibold">My pick</th>
                <th className="text-center px-3 py-2.5 text-yellow-300 font-semibold">Score</th>
                <th className="text-center px-3 py-2.5 text-yellow-300 font-semibold">⚽</th>
                <th className="text-center px-3 py-2.5 text-yellow-300 font-semibold">Joker</th>
                <th className="text-center px-3 py-2.5 text-yellow-400 font-black">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(({ m, pred, storedPts, joker, scorerPred, scorerHit, scoreLabel, baseScore, hasRealScore }) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  {/* Match */}
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-gray-800">{m.homeTeam.name} vs {m.awayTeam.name}</div>
                    <div className="text-gray-400">{new Date(m.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </td>
                  {/* Result */}
                  <td className="px-3 py-2.5 text-center font-bold text-gray-700">
                    {hasRealScore ? `${m.homeScore}–${m.awayScore}` : <span className="text-gray-400">?–?</span>}
                  </td>
                  {/* My pick */}
                  <td className="px-3 py-2.5 text-center text-gray-600">
                    {pred.homeScore}–{pred.awayScore}
                  </td>
                  {/* Score label */}
                  <td className="px-3 py-2.5 text-center">
                    {baseScore !== null ? (
                      <>
                        <span className={`font-bold ${baseScore === 5 ? 'text-green-600' : baseScore === 3 ? 'text-blue-600' : baseScore > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {baseScore}
                        </span>
                        <div className={`text-[10px] ${baseScore >= 3 ? 'text-gray-500' : 'text-gray-400'}`}>{scoreLabel}</div>
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {/* Scorer pts */}
                  <td className="px-3 py-2.5 text-center">
                    {scorerPred ? (
                      <div>
                        <span className={`font-bold ${scorerHit ? 'text-green-600' : 'text-gray-400'}`}>
                          {scorerHit ? '+2' : '+0'}
                        </span>
                        <div className="text-[10px] text-gray-400 truncate max-w-[64px]">{scorerPred}</div>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {/* Joker */}
                  <td className="px-3 py-2.5 text-center">
                    {joker
                      ? <span className="font-bold text-yellow-600">×2</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  {/* Total — always from stored points */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-base font-black" style={{ color: storedPts > 0 ? '#1e3a5f' : '#9ca3af' }}>{storedPts}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f4ff' }}>
                <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-gray-600">Grand total</td>
                <td className="px-3 py-2.5 text-center text-lg font-black" style={{ color: '#1e3a5f' }}>{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Points are stored values — Score/Scorer labels appear once admin enters match results. Joker doubles score points only (+2 scorer is always flat).
      </p>
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
          Each match can award up to <strong>7 points</strong> (12 with joker): 5 for exact score + 2 for naming a scorer.
          The joker doubles your score points only — the +2 scorer bonus is always flat.
        </p>
      </div>

      {/* ── Score grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Exact score',            val: '5'  },
          { label: 'Correct outcome',        val: '3'  },
          { label: 'Wrong outcome, one team correct', val: '1' },
          { label: 'Name a scorer',          val: '+2' },
          { label: 'Joker multiplier',       val: '×2' },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl p-4 text-center text-white" style={{ background: '#1e3a5f' }}>
            <div className="text-xs text-gray-300 mb-1 leading-tight">{label}</div>
            <div className="text-3xl font-black text-yellow-400">{val}</div>
          </div>
        ))}
      </div>

      {/* ── Bullet notes ── */}
      <ul className="text-sm text-gray-600 space-y-2 list-disc list-outside ml-5">
        <li>Name one player who will score — pick from the squad dropdown on each match card. Saved together with your score prediction.</li>
        <li>Pick one joker per stage to double that match's total points (including scorer bonus).</li>
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
                <th className="text-left px-4 py-2.5 text-white text-xs font-semibold">Scenario</th>
                <th className="text-left px-4 py-2.5 text-white text-xs font-semibold">Example (result vs. prediction)</th>
                <th className="text-center px-4 py-2.5 text-yellow-400 text-xs font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { pred: 'Exact score',                        ex: 'Result 2-1 / Predicted 2-1',           pts: '5' },
                { pred: 'Correct outcome, wrong score',       ex: 'Result 2-1 / Predicted 3-1 (home win)', pts: '3' },
                { pred: 'Wrong outcome, home score correct',  ex: 'Result 2-1 / Predicted 2-2 (draw)',     pts: '1' },
                { pred: 'Wrong outcome, away score correct',  ex: 'Result 2-1 / Predicted 0-1 (away win)', pts: '1' },
                { pred: 'Wrong outcome, both scores wrong',   ex: 'Result 2-1 / Predicted 0-2 (away win)', pts: '0' },
                { pred: 'Named a scorer correctly',           ex: 'Picked Messi — Messi scored',            pts: '+2' },
                { pred: 'Named a scorer — wrong',             ex: 'Picked Ronaldo — did not score',         pts: '+0' },
              ].map(({ pred, ex, pts }) => (
                <tr key={pred} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-medium text-gray-800">{pred}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{ex}</td>
                  <td className="px-4 py-2.5 text-center text-xs font-black" style={{ color: pts === '0' ? '#9ca3af' : '#1e3a5f' }}>{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>Joker</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>You get one joker per stage (group stage, round of 32, round of 16, quarter-finals, semi-finals, final).</li>
          <li>Apply your joker to one match per stage to double that match points.</li>
          <li>You can change or remove your joker up to kick-off of the match it is applied to.</li>
          <li>If the match you jokered is postponed or cancelled, your joker is returned.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>Bonus questions</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>Bonus questions appear directly on each match card (2 pts each) and in the Bonus Points tab.</li>
          <li>Each question states its point value and the deadline for answering.</li>
          <li>Once the admin confirms the correct answer, points are awarded automatically.</li>
          <li>Bonus question points are added on top of your match-prediction total.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>Deadlines &amp; locks</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-outside ml-5">
          <li>Predictions for each match lock 15 minutes before kick-off. You cannot change them after that.</li>
          <li>You can update your prediction as many times as you like before the lock.</li>
          <li>If you do not submit a prediction before the lock, you score 0 for that match.</li>
        </ul>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>Tiebreakers</h3>
        <p className="text-sm text-gray-600 mb-2">When two or more players have the same total points, rank is decided by:</p>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-outside ml-5">
          <li>Most exact scores (5-point predictions)</li>
          <li>Most correct outcomes (3-point predictions)</li>
          <li>Earliest registration date</li>
        </ol>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1e3a5f' }}>Leagues</h3>
        <p className="text-sm text-gray-600">
          Players are grouped into leagues. The Scoreboard shows rankings within each league so you can compare with the people you know.
        </p>
      </div>

      <hr className="border-gray-200" />

      <div className="rounded-xl p-4 text-sm text-gray-500 border border-gray-100" style={{ background: '#f9fafb' }}>
        <p>
          This is a free, fun pool for friends and family. No entry fees, no real prizes -- just bragging rights.
          Predictions are for entertainment only.{' '}
          <Link href="/disclaimer" className="text-blue-600 hover:underline">Read the full disclaimer</Link>
        </p>
      </div>
    </div>
  )
}

/* --- Audience Poll tab ---------------------------------------- */
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

      <div className="rounded-xl overflow-hidden">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #8b1c2c 100%)' }}>
          <h2 className="text-xl font-black text-yellow-400 mb-1">Next 3 matches</h2>
          <p className="text-sm text-white">
            Poll votes do not count for points.{' '}
            <Link href="#predict" className="text-yellow-400 font-semibold hover:underline">
              Enter your official prediction
            </Link>
          </p>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500 text-sm">No polls open right now -- check back before the next match!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, pi) => {
            const hasVoted = !!poll.myVote || !!selected[poll.id]
            const myChoice = poll.myVote || selected[poll.id]

            return (
              <div key={poll.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {pi === 0 ? 'Vote now -- next match' : 'Poll ' + (pi + 1)}
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
                          <label className={'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ' + (isChosen ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200')}
                            style={{ cursor: poll.status !== 'open' ? 'default' : 'pointer' }}>
                            <input
                              type="radio"
                              name={'poll-' + poll.id}
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

                          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: bg }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: pct + '%', background: color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {poll.status === 'open' && !poll.myVote && (
                    <button
                      onClick={async () => {
                        const choice = selected[poll.id]
                        if (!choice) return
                        await onVote(poll.id, choice)
                      }}
                      disabled={!selected[poll.id] || voting[poll.id]}
                      className="mt-5 w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-colors"
                      style={{ background: '#1e3a5f' }}
                    >
                      {voting[poll.id] ? 'Submitting...' : 'Submit Vote'}
                    </button>
                  )}

                  {poll.myVote && (
                    <p className="mt-4 text-center text-xs text-green-600 font-semibold">
                      You voted: {poll.myVote}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
