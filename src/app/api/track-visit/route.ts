/**
 * POST /api/track-visit
 * Increments total visit count and unique visitor count (by hashed IP).
 * Called silently from the client on page load.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const KEY = 'site_visit_stats'

// Simple hash to avoid storing raw IPs
function hashIp(ip: string): string {
  let h = 5381
  for (let i = 0; i < ip.length; i++) {
    h = ((h << 5) + h) ^ ip.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const hashedIp = hashIp(ip)

    // Read current stats
    const setting = await prisma.setting.findUnique({ where: { key: KEY } }).catch(() => null)
    let stats: { total: number; unique: number; ips: string[] } = { total: 0, unique: 0, ips: [] }
    if (setting) {
      try { stats = JSON.parse(setting.value) } catch {}
    }

    // Update
    stats.total += 1
    if (!stats.ips.includes(hashedIp)) {
      stats.ips.push(hashedIp)
      stats.unique += 1
      // Keep ips array bounded (max 50,000 entries)
      if (stats.ips.length > 50000) stats.ips = stats.ips.slice(-50000)
    }

    const value = JSON.stringify(stats)
    await prisma.setting.upsert({
      where: { key: KEY },
      update: { value },
      create: { key: KEY, value },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Silently fail — visit tracking is non-critical
    return NextResponse.json({ ok: false })
  }
}
