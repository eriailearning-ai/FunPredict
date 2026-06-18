'use client'
import { useState } from 'react'

export default function AdminSyncPage() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [pollStatus, setPollStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [pollResult, setPollResult] = useState<any>(null)

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
        <p className="text-sm text-gray-500 mb-4">Click to fetch the latest scores right now. During matches, results and predictions are updated automatically.</p>
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
          Run this after adding new matches.
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

      {/* Auto-sync setup */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Auto-Sync (Recommended)</h2>
        <p className="text-sm text-gray-600 mb-3">Set up a cron job to automatically sync every 5 minutes during match days:</p>
        <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-green-400 space-y-2 overflow-x-auto">
          <p className="text-gray-500"># Add to your server's crontab (every 5 min)</p>
          <p>*/5 * * * * curl -s "{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4001'}/api/sync-scores?secret=local-dev" &gt; /dev/null</p>
          <p className="text-gray-500 mt-3"># Or use Vercel Cron (vercel.json):</p>
          <p>{`{
  "crons": [{
    "path": "/api/sync-scores",
    "schedule": "*/5 * * * *"
  }]
}`}</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">Set <code>CRON_SECRET</code> in .env.local to protect the endpoint in production.</p>
      </div>
    </div>
  )
}
