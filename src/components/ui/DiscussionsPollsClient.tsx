'use client'
import { useState, useEffect } from 'react'
import FlagImg from './FlagImg'
import { CODE3_TO_ISO2 } from '@/lib/flags'

type PollResult = { option: string; count: number; pct: number }
type Poll = {
  id: number; question: string; options: string[]; status: string
  matchId: number | null; match: any; totalVotes: number
  results: PollResult[]; myVote: string | null
}

const COLORS = ['#3b82f6', '#f43f5e', '#22c55e', '#f59e0b']

function isoFlag(code: string) {
  return CODE3_TO_ISO2[code?.toUpperCase()] ?? code?.toLowerCase()?.slice(0, 2) ?? ''
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function DiscussionsPollsClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [polls, setPolls]   = useState<Poll[]>([])
  const [voting, setVoting] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/polls').catch(() => null)
    if (!res?.ok) { setLoading(false); return }
    setPolls(await res.json())
    setLoading(false)
  }

  async function vote(pollId: number, option: string) {
    setVoting(v => ({ ...v, [pollId]: true }))
    await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, option }),
    })
    setVoting(v => ({ ...v, [pollId]: false }))
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading polls…</div>
  )

  if (polls.length === 0) return (
    <div className="p-8 text-center text-gray-400 text-sm">
      No polls open yet — check back soon for the next 3 match polls.
    </div>
  )

  return (
    <div className="space-y-6">
      {polls.map((poll, pi) => {
        const voted     = !!poll.myVote
        const match     = poll.match
        const homeCode  = match?.homeTeam?.code ?? ''
        const awayCode  = match?.awayTeam?.code ?? ''

        return (
          <div key={poll.id} className="border border-gray-100 rounded-xl p-5">
            {match && (
              <p className="text-xs text-gray-400 mb-3">
                Voting open until kickoff · {fmtDate(match.matchDate)} {fmtTime(match.matchDate)}
              </p>
            )}
            <h4 className="font-bold text-sm text-gray-800 mb-4">{poll.question}</h4>

            {voted ? (
              /* ── Results view ── */
              <div className="space-y-3">
                {poll.results.map((r, i) => (
                  <div key={r.option}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${poll.myVote === r.option ? 'text-blue-700' : 'text-gray-600'}`}>
                        {poll.myVote === r.option && '✓ '}{r.option}
                      </span>
                      <span className="text-gray-500">{r.count} vote{r.count !== 1 ? 's' : ''} · {r.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${r.pct}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">{poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => setPolls(ps => ps.map(p => p.id === poll.id ? { ...p, myVote: null } : p))}
                  className="text-xs text-blue-500 hover:underline mt-1"
                >
                  Change vote
                </button>
              </div>
            ) : (
              /* ── Vote buttons ── */
              <div className="flex flex-col sm:flex-row gap-3">
                {poll.options.map((opt, i) => {
                  const isHome = i === 0 && homeCode
                  const isAway = i === poll.options.length - 1 && awayCode && i !== 0
                  const flagCode = isHome ? isoFlag(homeCode) : isAway ? isoFlag(awayCode) : ''
                  const teamName = isHome ? match?.homeTeam?.name : isAway ? match?.awayTeam?.name : ''
                  return (
                    <button
                      key={opt}
                      onClick={() => vote(poll.id, opt)}
                      disabled={voting[poll.id]}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
                    >
                      {flagCode && <FlagImg iso2={flagCode} name={teamName} size="sm" />}
                      <span className="text-sm font-semibold text-gray-700">{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {!isLoggedIn && !voted && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Voting is open to everyone — guests can vote too!
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
