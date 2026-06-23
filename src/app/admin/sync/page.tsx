'use client'
import { useState } from 'react'

export default function AdminSyncPage() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [pollStatus, setPollStatus]     = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [pollResult, setPollResult]     = useState<any>(null)
  const [scorerStatus, setScorerStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [scorerResult, setScorerResult] = useState<any>(null)
  const [seedStatus, setSeedStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [seedResult, setSeedResult] = useState<any>(null)
  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [migrateResult, setMigrateResult] = useState<any>(null)
  const [backfillStatus, setBackfillStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [backfillResult, setBackfillResult] = useState<any>(null)
  const [recalcStatus, setRecalcStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [recalcResult, setRecalcResult] = useState<any>(null)
  const [resetStatus, setResetStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [resetResult, setResetResult] = useState<any>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  async function sync() {
    setStatus('syncing')
    setResult(null)
    try {
      const res = await fetch('/api/sync-scores', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      setStatus(data.ok ? 'done' : 'error')
    } catch (e: any) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  async function syncPolls() {
    setPollStatus('syncing')
    setPollResult(null)
    try {
      const res = await fetch('/api/polls')
      const data = await res.json()
      setPollResult({ ok: true, count: data.length })
      setPollStatus('done')
    } catch (e: any) {
      setPollResult({ error: e.message })
      setPollStatus('error')
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Score Sync</h1>
      <p className="text-sm text-gray-500">
        Fetches live match results from <strong>football-data.org</strong> and automatically updates the database.
        Predictions are scored immediately. No manual entry needed.
      </p>

      {/* ── DB Migration ── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-400">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Run DB Migrations</h2>
        <p className="text-sm text-gray-500 mb-4">
          Adds any missing columns to the database (safe to run multiple times — uses IF NOT EXISTS).
          Run this once after each deployment that changes the schema.
        </p>
        <button
          onClick={async () => {
            setMigrateStatus('syncing'); setMigrateResult(null)
            try {
              const res = await fetch('/api/admin/db-migrate', { method: 'POST' })
              const data = await res.json()
              setMigrateResult(data)
              setMigrateStatus(data.ok ? 'done' : 'error')
            } catch (e: any) { setMigrateResult({ error: e.message }); setMigrateStatus('error') }
          }}
          disabled={migrateStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: migrateStatus === 'done' ? '#166534' : '#7c3aed' }}
        >
          {migrateStatus === 'syncing' ? 'Running…' : migrateStatus === 'done' ? '✅ Migrations done' : '🗄 Run DB Migrations'}
        </button>
        {migrateResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${migrateResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {migrateResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {migrateResult.error}</p>
              : <p className="text-green-800">✅ Migrations applied: {JSON.stringify(migrateResult.results ?? migrateResult)}</p>}
          </div>
        )}
      </div>

      {/* ── Backfill scorer predictions from old bonus answers ── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-400">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Backfill Scorer Predictions</h2>
        <p className="text-sm text-gray-500 mb-1">
          Copies players' old bonus-question scorer answers into the new <code className="bg-gray-100 px-1 rounded text-xs">scorerPred</code> column.
          Safe to run multiple times — only fills rows that are currently empty.
        </p>
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
          Run this <strong>after</strong> DB Migrations. Then re-save any finished match results so points recalculate with the +2 scorer bonus.
        </p>
        <button
          onClick={async () => {
            setBackfillStatus('syncing'); setBackfillResult(null)
            try {
              const res = await fetch('/api/admin/backfill-scorer-preds', { method: 'POST' })
              const data = await res.json()
              setBackfillResult(data)
              setBackfillStatus(data.ok ? 'done' : 'error')
            } catch (e: any) { setBackfillResult({ error: e.message }); setBackfillStatus('error') }
          }}
          disabled={backfillStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: backfillStatus === 'done' ? '#166534' : '#d97706' }}
        >
          {backfillStatus === 'syncing' ? 'Backfilling…' : backfillStatus === 'done' ? '✅ Backfill done' : '⚽ Backfill Scorer Predictions'}
        </button>
        {backfillResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${backfillResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {backfillResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {backfillResult.error}</p>
              : <p className="text-green-800">
                  ✅ Updated: <strong>{backfillResult.updated}</strong> predictions &nbsp;·&nbsp;
                  Already set: {backfillResult.skipped} &nbsp;·&nbsp;
                  No prediction found: {backfillResult.notFound}
                </p>}
          </div>
        )}
      </div>

      {/* ── Recalculate All Points ── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-400">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Recalculate All Points</h2>
        <p className="text-sm text-gray-500 mb-4">
          Re-scores every prediction on every finished match using the current scorer lists.
          Run this after backfilling scorer predictions to apply the +2 bonus retroactively.
        </p>
        <button
          onClick={async () => {
            setRecalcStatus('syncing'); setRecalcResult(null)
            try {
              const res = await fetch('/api/admin/recalc-points', { method: 'POST' })
              const data = await res.json()
              setRecalcResult(data)
              setRecalcStatus(data.ok ? 'done' : 'error')
            } catch (e: any) { setRecalcResult({ error: e.message }); setRecalcStatus('error') }
          }}
          disabled={recalcStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: recalcStatus === 'done' ? '#166534' : '#059669' }}
        >
          {recalcStatus === 'syncing' ? 'Recalculating…' : recalcStatus === 'done' ? '✅ Points recalculated' : '🔢 Recalculate All Points'}
        </button>
        {recalcResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${recalcResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {recalcResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {recalcResult.error}</p>
              : <p className="text-green-800">
                  ✅ Matches processed: <strong>{recalcResult.matchesProcessed}</strong> &nbsp;·&nbsp;
                  Predictions checked: {recalcResult.predictionsChecked} &nbsp;·&nbsp;
                  Updated: <strong>{recalcResult.predictionsUpdated}</strong>
                </p>}
          </div>
        )}
      </div>

      {/* API Key setup */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-400">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Setup — football-data.org API Key</h2>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Go to <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">football-data.org</a> and register for a free account</li>
          <li>Copy your API key from the dashboard</li>
          <li>Add it to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">FOOTBALL_DATA_API_KEY="your-key-here"</code></li>
          <li>Restart the dev server</li>
        </ol>
        <p className="text-xs text-gray-400 mt-3">Free tier: 10 requests/minute. Enough for auto-sync every 5 minutes during match days.</p>
      </div>

      {/* Manual sync */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Manual Sync</h2>
        <p className="text-sm text-gray-500 mb-4">Click to fetch the latest scores right now.</p>
        <button
          onClick={sync}
          disabled={status === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: status === 'done' ? '#166534' : '#1e3a5f' }}
        >
          {status === 'syncing' ? '🔄 Syncing…' : status === 'done' ? '✅ Sync Complete' : '🔄 Sync Scores Now'}
        </button>
        {result && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.error ? (
              <p className="text-red-700"><strong>Error:</strong> {result.error}</p>
            ) : (
              <div className="text-green-800 space-y-1">
                <p><strong>✅ Sync successful</strong></p>
                <p>Matches checked: {result.total ?? 0}</p>
                <p>Match results updated: {result.updated ?? 0}</p>
                <p>Predictions scored: {result.scored ?? 0}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Poll sync */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Auto-Create Audience Polls</h2>
        <p className="text-sm text-gray-500 mb-4">
          Automatically creates polls for the next 3 upcoming matches (if they don't already exist).
        </p>
        <button
          onClick={syncPolls}
          disabled={pollStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: pollStatus === 'done' ? '#166534' : '#8b1c2c' }}
        >
          {pollStatus === 'syncing' ? '🔄 Creating polls…' : pollStatus === 'done' ? '✅ Polls synced' : '🗳 Sync Polls for Next 3 Matches'}
        </button>
        {pollResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${pollResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {pollResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {pollResult.error}</p>
              : <p className="text-green-800">✅ {pollResult.count} poll{pollResult.count !== 1 ? 's' : ''} ready for next 3 matches.</p>
            }
          </div>
        )}
      </div>

      {/* Scorers sync */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Sync Top Goalscorers</h2>
        <p className="text-sm text-gray-500 mb-4">Fetches the current top goalscorers from football-data.org and displays them in the sidebar.</p>
        <button
          onClick={async () => {
            setScorerStatus('syncing'); setScorerResult(null)
            try {
              const res = await fetch('/api/sync-scorers', { method: 'POST' })
              const data = await res.json()
              setScorerResult(data)
              setScorerStatus(data.ok ? 'done' : 'error')
            } catch (e: any) { setScorerResult({ error: e.message }); setScorerStatus('error') }
          }}
          disabled={scorerStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
          style={{ background: scorerStatus === 'done' ? '#166534' : '#1e3a5f' }}
        >
          {scorerStatus === 'syncing' ? '🔄 Syncing…' : scorerStatus === 'done' ? '✅ Scorers Synced' : '⚽ Sync Top Goalscorers'}
        </button>
        {scorerResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${scorerResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {scorerResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {scorerResult.error}</p>
              : <p className="text-green-800">✅ {scorerResult.count} top scorers cached for sidebar.</p>}
          </div>
        )}
      </div>

      {/* ── Reset All Points ── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
        <h2 className="text-sm font-bold text-gray-800 mb-1">⚠️ Reset All Points to Zero</h2>
        <p className="text-sm text-gray-500 mb-3">
          Sets every player's points to 0. Use this before the knockout phase to start a fresh leaderboard.
          Predictions are kept — only the stored point totals are cleared.
          <strong className="text-red-600"> This is irreversible.</strong>
        </p>
        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors"
            style={{ background: '#dc2626' }}
          >
            🔴 Reset All Points
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-700 font-medium">Are you sure? This cannot be undone.</span>
            <button
              onClick={async () => {
                setResetStatus('syncing'); setResetResult(null); setResetConfirm(false)
                try {
                  const res = await fetch('/api/admin/reset-points', { method: 'POST' })
                  const data = await res.json()
                  setResetResult(data)
                  setResetStatus(data.ok ? 'done' : 'error')
                } catch (e: any) { setResetResult({ error: e.message }); setResetStatus('error') }
              }}
              disabled={resetStatus === 'syncing'}
              className="px-4 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: '#dc2626' }}
            >
              Yes, reset
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-4 py-2 rounded-lg text-gray-700 font-semibold text-sm border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
        {resetResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${resetResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {resetResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {resetResult.error}</p>
              : <p className="text-green-800">✅ All points reset to 0. ({resetResult.updated} predictions cleared)</p>}
          </div>
        )}
      </div>

      {/* Seed DB */}
      <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-400">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Seed Database (48 Teams + Matches)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upserts all 48 WC2026 teams and 72 group-stage matches. Safe to run multiple times.
        </p>
        <button
          onClick={async () => {
            setSeedStatus('syncing'); setSeedResult(null)
            try {
              const res = await fetch('/api/admin/seed-db', { method: 'POST' })
              const data = await res.json()
              setSeedResult(data)
              setSeedStatus(data.ok ? 'done' : 'error')
            } catch (e: any) { setSeedResult({ error: e.message }); setSeedStatus('error') }
          }}
          disabled={seedStatus === 'syncing'}
          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          style={{ background: seedStatus === 'done' ? '#166534' : '#b45309' }}
        >
          {seedStatus === 'syncing' ? 'Seeding...' : seedStatus === 'done' ? 'Done!' : 'Seed DB Now'}
        </button>
        {seedResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${seedResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {seedResult.error
              ? <p className="text-red-700"><strong>Error:</strong> {seedResult.error}</p>
              : <p className="text-green-800">Teams: {seedResult.teams} | Matches created: {seedResult.created} | Updated: {seedResult.updated}</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}
