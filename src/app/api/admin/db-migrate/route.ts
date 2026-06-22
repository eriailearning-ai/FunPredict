import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/db-migrate
 * Returns which columns exist in the User table + phone values for all users.
 */
export async function GET() {
  await requireAdmin()
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'User' ORDER BY ordinal_position
  `
  const phones = await prisma.$queryRaw<{ id: string; email: string; phone: string | null }[]>`
    SELECT id, email, phone FROM "User" ORDER BY "createdAt" DESC LIMIT 20
  `
  return NextResponse.json({ columns: cols.map(c => c.column_name), phones })
}

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
    { col: 'phone_unique', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone") WHERE "phone" IS NOT NULL` },
    { col: 'verifyToken',  sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyToken" TEXT` },
    { col: 'verifyExpiry', sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyExpiry" TIMESTAMP(3)` },
    { col: 'nickname',     sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT NOT NULL DEFAULT ''` },
    // Scorer prediction on Prediction table
    { col: 'Prediction.scorerPred', sql: `ALTER TABLE "Prediction" ADD COLUMN IF NOT EXISTS "scorerPred" TEXT` },
    // Actual scorers on Match table (persists who scored for display + re-grading)
    { col: 'Match.scorers', sql: `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "scorers" TEXT[] DEFAULT '{}'` },
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
