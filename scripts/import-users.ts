/**
 * Run: npx tsx scripts/import-users.ts
 * Imports WordPress users directly into the Neon DB.
 * Reads import-players.json from the project root.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

function slugify(email: string) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'import-players.json')
  const rows: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  let created = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const email = row.email?.trim()
    if (!email) { errors.push('missing email, skipped'); skipped++; continue }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Update nickname if it differs
      if (row.nickname && existing.nickname !== row.nickname) {
        await prisma.user.update({ where: { email }, data: { nickname: row.nickname } })
        console.log(`  UPD   ${email} — nickname → ${row.nickname}`)
      } else {
        console.log(`  SKIP  ${email} — already exists`)
      }
      skipped++
      continue
    }

    // Build unique username
    let username: string = (row.username ?? slugify(email)).slice(0, 30)
    const conflict = await prisma.user.findUnique({ where: { username } })
    if (conflict) username = username.slice(0, 26) + Math.floor(Math.random() * 1000)

    // Use WP bcrypt hash directly (strip $wp$ prefix) or hash a temp password
    let passwordHash: string
    if (row.passwordHash && row.passwordHash.startsWith('$2')) {
      passwordHash = row.passwordHash
    } else {
      const tmp = row.tempPassword ?? crypto.randomBytes(10).toString('base64url').slice(0, 12)
      passwordHash = await bcrypt.hash(tmp, 12)
    }

    try {
      await prisma.user.create({
        data: {
          name:         row.name,
          email,
          username,
          nickname:     row.nickname ?? row.name.split(' ')[0],
          league:       row.league ?? '',
          cheeringFrom: row.cheeringFrom ?? '',
          password:     passwordHash,
          role:         row.role ?? 'player',
          status:       'approved',
        },
      })
      console.log(`  OK    ${email} (${row.name})`)
      created++
    } catch (e: any) {
      console.error(`  ERR   ${email}: ${e.message}`)
      errors.push(`${email}: ${e.message}`)
      skipped++
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`)
  if (errors.length) console.log('Errors:', errors)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
