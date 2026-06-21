import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/db-migrate
 * Adds missing columns to the User table (safe, uses IF NOT EXISTS).
 */
export async function POST() {
  await requireAdmin()

  const migrations = [
    { col: 'resetToken',   sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT` },
    { col: 'resetExpiry',  sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMP(3)` },
    { col: 'phone',        sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT` },
    { col: 'verifyToken',  sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyToken" TEXT` },
    { col: 'verifyExpiry', sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyExpiry" TIMESTAMP(3)` },
    { col: 'nickname',     sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT NOT NULL DEFAULT ''` },
  ]

  const results: string[] = []
  for (const { col, sql } of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql)
      results.push(`✅ ${col}`)
    } catch (e: any) {
      results.push(`⚠️ ${col}: ${e?.message ?? 'error'}`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
