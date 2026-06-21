import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  const rows = await prisma.setting.findMany()
  const settings = Object.fromEntries(rows.map((r: any) => [r.key, r.value]))
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const body = await req.json()
  // Upsert each setting key
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
