'use client'
import { useState } from 'react'

export default function SeedDbButton({ hasMatches }: { hasMatches: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string>('')

  async function seed() {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/seed-db', { method: 'POST' })
      const text = await res.text()
      if (!text) {
        setResult('Timed out — Neon DB was cold. Wait 10s and try again.')
        setState('error')
        return
      }
      const data = JSON.parse(text)
      if (data.ok) {
        setResult(`✅ Done — ${data.created} created, ${data.updated} updated · ${data.teams} teams · ${data.finished} finished · ${data.upcoming} upcoming`)
        setState('done')
      } else {
        setResult(`Error: ${data.error ?? 'unknown'}`)
        setState('error')
      }
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
      setState('error')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-gray-800">
            {hasMatches ? '🔄 Re-sync match schedule' : '⚡ Seed match schedule'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasMatches
              ? 'Updates all 72 group-stage matches with current scores + statuses'
              : 'First-time setup: loads all 48 teams and 72 group-stage matches into the DB'}
          </p>
        </div>
        <button
          onClick={seed}
          disabled={state === 'loading'}
          className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          style={{ background: state === 'done' ? '#166534' : '#1e3a5f' }}
        >
          {state === 'loading' ? '⏳ Seeding…' : state === 'done' ? '✓ Done' : '🌍 Seed / Sync Matches'}
        </button>
      </div>
      {result && (
        <p className={`text-xs mt-2 font-medium ${state === 'error' ? 'text-red-600' : 'text-green-700'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
