import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  let logs: any[] = []
  try {
    logs = await (prisma as any).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { name: true, nickname: true, email: true } } },
    })
  } catch { /* Table not yet created — run: npx prisma db push */ }

  const ACTION_COLORS: Record<string, string> = {
    predict: 'bg-blue-100 text-blue-700',
    update_prediction: 'bg-indigo-100 text-indigo-700',
    login: 'bg-green-100 text-green-700',
    register: 'bg-yellow-100 text-yellow-700',
    approve: 'bg-emerald-100 text-emerald-700',
    deny: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-xs text-gray-400">Last 200 events</p>
      </div>
      <p className="text-sm text-gray-500">Track all prediction saves, login attempts, and admin actions.</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: '#1e2d40' }}>
              <tr>
                {['Time', 'Player', 'Action', 'Details', 'IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No events logged yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-gray-800">{(log.user as any).nickname || log.user.name}</p>
                    <p className="text-xs text-gray-400">{log.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 max-w-xs truncate">{log.details || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
