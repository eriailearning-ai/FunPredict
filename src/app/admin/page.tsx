import { prisma } from '@/lib/db'
import Link from 'next/link'
import SeedDbButton from './SeedDbButton'

export const dynamic = 'force-dynamic'

// Safe wrappers — new tables won't exist until `npx prisma db push` is run
async function safeCount(fn: () => Promise<number>): Promise<number> {
  try { return await fn() } catch { return 0 }
}
async function safeFind<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn() } catch { return [] }
}

export default async function AdminDashboard() {
  const [totalPlayers, pendingApproval, totalMatches, finishedMatches, totalPredictions] = await Promise.all([
    safeCount(() => prisma.user.count({ where: { role: 'player', status: 'approved' } })),
    safeCount(() => prisma.user.count({ where: { status: 'verified' } })),
    safeCount(() => prisma.match.count()),
    safeCount(() => prisma.match.count({ where: { status: 'finished' } })),
    safeCount(() => prisma.prediction.count()),
  ])

  // New tables — safe until migration runs
  const totalLeagues = await safeCount(() => (prisma as any).league.count())
  const openBonusQ  = await safeCount(() => (prisma as any).bonusQuestion.count({ where: { status: 'open' } }))
  const openPolls   = await safeCount(() => (prisma as any).poll.count({ where: { status: 'open' } }))
  const recentLogs  = await safeFind(() => (prisma as any).auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } }))

  const recentUsers = await safeFind(() => prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }))

  const needsMigration = totalLeagues === 0 && openBonusQ === 0

  const statCards = [
    { label: 'Approved Players', value: totalPlayers,    href: '/admin/users',   icon: '👥', accent: '#1e3a5f' },
    { label: 'Awaiting Approval', value: pendingApproval, href: '/admin/users',   icon: '⏳', accent: pendingApproval > 0 ? '#b45309' : '#374151' },
    { label: 'Total Matches',    value: totalMatches,    href: '/admin/matches', icon: '📅', accent: '#374151' },
    { label: 'Results Entered',  value: finishedMatches, href: '/admin/sync',    icon: '✅', accent: '#166534' },
    { label: 'Predictions',      value: totalPredictions, href: '/admin/users',  icon: '⚽', accent: '#374151' },
    { label: 'Leagues',          value: totalLeagues,    href: '/admin/leagues', icon: '🏆', accent: '#374151' },
    { label: 'Bonus Qs Open',    value: openBonusQ,      href: '/admin/bonus',  icon: '❓', accent: '#374151' },
    { label: 'Polls Open',       value: openPolls,       href: '/admin/polls',  icon: '🗳️', accent: '#374151' },
  ]

  const quickLinks = [
    { href: '/admin/users',    title: 'User Management',  desc: 'Approve registrations, assign leagues, manage roles', icon: '👥', urgent: pendingApproval > 0 },
    { href: '/admin/leagues',  title: 'Leagues',          desc: 'Create and edit Aila Attackers, Sukuti Strikers, Gorkhali Gooners', icon: '🏆', urgent: false },
    { href: '/admin/sync',     title: 'Score Sync',       desc: 'Auto-fetch live scores from football-data.org', icon: '🔄', urgent: false },
    { href: '/admin/bonus',    title: 'Bonus Questions',  desc: 'Create questions, set answers, award extra points', icon: '❓', urgent: false },
    { href: '/admin/polls',    title: 'Audience Polls',   desc: 'Manage fun voting polls for upcoming matches', icon: '🗳️', urgent: false },
    { href: '/admin/teams',    title: 'Teams',            desc: 'Manage team data, flags, and group assignments', icon: '🚩', urgent: false },
    { href: '/admin/matches',  title: 'Match Schedule',   desc: 'View and manage all 104 matches', icon: '📅', urgent: false },
    { href: '/admin/settings', title: 'Settings',         desc: 'Scoring rules, site config, email settings', icon: '⚙️', urgent: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Seed / sync matches */}
      <SeedDbButton hasMatches={totalMatches > 0} />

      {/* Migration reminder */}
      {needsMigration && (
        <div className="rounded-xl p-4 border-l-4 border-blue-400 bg-blue-50">
          <p className="text-sm font-bold text-blue-800">⚡ Run database migration to unlock all features</p>
          <p className="text-xs text-blue-600 mt-1">Leagues, Bonus Questions, Polls, and Audit Log require a one-time migration:</p>
          <code className="block mt-2 text-xs bg-white rounded px-3 py-2 text-blue-900 border border-blue-200 font-mono">
            npx prisma db push
          </code>
          <p className="text-xs text-blue-500 mt-1">Run this in the project folder, then restart the dev server.</p>
        </div>
      )}

      {/* Pending approval banner */}
      {pendingApproval > 0 && (
        <Link href="/admin/users" className="flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity" style={{ background: '#b45309' }}>
          <span className="text-xl">⏳</span>
          {pendingApproval} player{pendingApproval !== 1 ? 's' : ''} waiting for approval — click to review
          <span className="ml-auto">→</span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(q => (
            <Link key={q.href} href={q.href}
              className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${q.urgent ? 'border-yellow-500' : 'border-transparent hover:border-blue-300'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{q.icon}</span>
                <span className="font-bold text-sm text-gray-800">{q.title}</span>
                {q.urgent && <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">!</span>}
              </div>
              <p className="text-xs text-gray-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Recent registrations */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Recent Registrations</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">No users yet</p>
            ) : recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1e3a5f' }}>
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{(u as any).nickname || u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  u.status === 'approved' ? 'bg-green-100 text-green-700' :
                  u.status === 'verified' ? 'bg-yellow-100 text-yellow-700' :
                  u.status === 'denied'   ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-500'
                }`}>{u.status}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-gray-50">
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">View all users →</Link>
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">
                {needsMigration ? 'Run migration to enable audit log.' : 'No activity logged yet.'}
              </p>
            ) : recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 flex-shrink-0" style={{ background: '#1e3a5f' }}>
                  {log.user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">
                    <strong>{(log.user as any)?.nickname || log.user?.name}</strong> {log.action}
                  </p>
                  {log.details && <p className="text-xs text-gray-400 truncate">{log.details}</p>}
                </div>
                <p className="text-xs text-gray-300 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-gray-50">
            <Link href="/admin/audit" className="text-xs text-blue-600 hover:underline">View full audit log →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
