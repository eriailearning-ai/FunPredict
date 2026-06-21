'use client'
import { useState, useEffect, useRef } from 'react'

type Msg = {
  id: number
  guestName: string
  message: string
  createdAt: string
  user: { nickname: string; username: string; name: string; role: string } | null
}

export default function ShoutboxClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  function displayName(m: Msg) {
    if (m.user) return m.user.nickname || m.user.username || m.user.name
    return m.guestName || 'Guest'
  }

  function isAdmin(m: Msg) {
    return m.user?.role === 'admin' || m.user?.role === 'superplayer'
  }

  async function load(scroll = false) {
    const res = await fetch('/api/shoutbox').catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setMessages(data)
    if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setError('')
    const res = await fetch('/api/shoutbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, guestName }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setError(data.error); return }
    setText('')
    load(true)
  }

  useEffect(() => {
    load(true)
    const t = setInterval(() => load(), 15_000)
    return () => clearInterval(t)
  }, [])

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg,#0d1b3e,#8b1c2c)' }}>
        <h2 className="text-white font-bold text-base">💬 Family Shoutbox</h2>
        <p className="text-blue-200 text-xs mt-0.5">Live family chat — refreshes every 15s</p>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 h-64 overflow-y-auto space-y-2 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">No messages yet — say something!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className="flex gap-2">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isAdmin(m) ? 'bg-yellow-500' : 'bg-blue-600'}`} style={!isAdmin(m) ? { background: '#1e3a5f' } : {}}>
              {displayName(m)[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xs font-bold ${isAdmin(m) ? 'text-yellow-600' : 'text-blue-800'}`}>
                  {displayName(m)}
                  {isAdmin(m) && <span className="ml-1 text-yellow-500 text-[10px]">⭐</span>}
                </span>
                <span className="text-[10px] text-gray-400">{fmtTime(m.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 break-words">{m.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <div className="px-4 py-3 border-t border-gray-100">
        <form onSubmit={send} className="space-y-2">
          {!isLoggedIn && (
            <input
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Your name (guest)"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              maxLength={30}
            />
          )}
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder={isLoggedIn ? 'Say something…' : 'Message…'}
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={300}
              required
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 flex-shrink-0"
              style={{ background: '#1e3a5f' }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-[10px] text-gray-400">Keep it friendly · 300 chars max · 20s cooldown</p>
        </form>
      </div>
    </div>
  )
}
