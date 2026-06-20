/**
 * POST /api/sync-scorers  — fetch top scorers from football-data.org and cache in DB
 * GET  /api/sync-scorers  — return cached scorers
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const WC2026_ID = 2000
const API_KEY   = process.env.FOOTBALL_DATA_API_KEY ?? ''
const BASE_URL  = 'https://api.football-data.org/v4'
const CACHE_KEY = 'top_scorers'

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: CACHE_KEY } })
    const scorers = row ? JSON.parse(row.value) : []
    return NextResponse.json(scorers)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not configured' }, { status: 500 })
  }

  const res = await fetch(`${BASE_URL}/competitions/${WC2026_ID}/scorers?limit=10`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: `API error: ${res.status}` }, { status: 502 })
  }

  const data = await res.json()
  const scorers = (data.scorers ?? []).slice(0, 10).map((s: any) => ({
    name:    s.player?.name ?? 'Unknown',
    team:    s.team?.shortName ?? s.team?.name ?? '',
    goals:   s.goals ?? 0,
    assists: s.assists ?? 0,
  }))

  await prisma.setting.upsert({
    where:  { key: CACHE_KEY },
    create: { key: CACHE_KEY, value: JSON.stringify(scorers) },
    update: { value: JSON.stringify(scorers) },
  })

  return NextResponse.json({ ok: true, count: scorers.length, scorers })
}
