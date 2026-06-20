/**
 * POST /api/admin/import-users
 * Bulk-import players from an external source (e.g. WordPress).
 * Accepts a JSON array of user objects. Creates accounts with status='approved'
 * and a temporary random password they must reset on first login.
 *
 * Payload shape:
 * [
 *   {
 *     name: string,          // required — display name
 *     email: string,         // required — must be unique
 *     username?: string,     // optional — defaults to email prefix
 *     nickname?: string,     // optional
 *     league?: string,       // optional
 *     cheeringFrom?: string, // optional
 *     role?: string,         // optional — defaults to 'player'
 *     tempPassword?: string, // optional — random if omitted
 *   }
 * ]
 *
 * Response:
 * { ok: true, created: number, skipped: number, errors: string[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { sendEmail, approvedEmailHtml, emailEnabled } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:4001'

const UserRow = z.object({
  name:          z.string().min(1).max(60),
  email:         z.string().email(),
  username:      z.string().max(30).optional(),
  nickname:      z.string().max(40).optional(),
  league:        z.string().max(60).optional(),
  cheeringFrom:  z.string().max(60).optional(),
  role:          z.enum(['player', 'admin', 'superplayer']).optional(),
  tempPassword:  z.string().min(8).optional(),
  // Pre-hashed bcrypt password (e.g. from WordPress after stripping $wp$ prefix).
  // If provided, stored directly without re-hashing.
  passwordHash:  z.string().startsWith('$2').optional(),
})

function randomPassword() {
  return crypto.randomBytes(10).toString('base64url').slice(0, 12)
}

function slugify(email: string) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)
}

export async function POST(req: NextRequest) {
  await requireAdmin()

  let rows: unknown[]
  try {
    rows = await req.json()
    if (!Array.isArray(rows)) throw new Error('Payload must be a JSON array')
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Invalid JSON' }, { status: 400 })
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const raw of rows) {
    let row: z.infer<typeof UserRow>
    try {
      row = UserRow.parse(raw)
    } catch (e: any) {
      const email = (raw as any)?.email ?? '?'
      errors.push(`${email}: ${e.errors?.[0]?.message ?? 'validation error'}`)
      skipped++
      continue
    }

    // Skip if email already exists
    const existing = await prisma.user.findUnique({ where: { email: row.email } })
    if (existing) {
      errors.push(`${row.email}: already exists (skipped)`)
      skipped++
      continue
    }

    // Build a unique username
    let username = (row.username ?? slugify(row.email)).slice(0, 30)
    const usernameConflict = await prisma.user.findUnique({ where: { username } })
    if (usernameConflict) {
      username = username.slice(0, 26) + Math.floor(Math.random() * 1000)
    }

    const tempPw   = row.tempPassword ?? randomPassword()
    // Use provided hash directly (e.g. migrated from WordPress bcrypt),
    // otherwise hash the temp password.
    const hashed   = row.passwordHash ?? await hashPassword(tempPw)

    try {
      await prisma.user.create({
        data: {
          name:         row.name,
          email:        row.email,
          username,
          nickname:     row.nickname ?? row.name.split(' ')[0],
          league:       row.league ?? '',
          cheeringFrom: row.cheeringFrom ?? '',
          password:     hashed,
          role:         row.role ?? 'player',
          status:       'approved',
        },
      })
      created++

      // Notify the player they're in (if SMTP configured)
      if (emailEnabled()) {
        await sendEmail(
          row.email,
          '⚽ Your FIFAFun 2026 account is ready!',
          approvedEmailHtml(row.name, BASE + '/auth/login'),
        ).catch(() => {})
      }
    } catch (e: any) {
      errors.push(`${row.email}: ${e.message ?? 'DB error'}`)
      skipped++
    }
  }

  return NextResponse.json({ ok: true, created, skipped, errors })
}
