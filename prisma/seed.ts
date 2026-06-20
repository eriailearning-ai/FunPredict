import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const teams = [
  // Group A
  { name: 'USA',          code: 'USA', group: 'A' },
  { name: 'Mexico',       code: 'MEX', group: 'A' },
  { name: 'Panama',       code: 'PAN', group: 'A' },
  { name: 'Bahrain',      code: 'BHR', group: 'A' },
  // Group B
  { name: 'Argentina',    code: 'ARG', group: 'B' },
  { name: 'Chile',        code: 'CHI', group: 'B' },
  { name: 'Peru',         code: 'PER', group: 'B' },
  { name: 'New Zealand',  code: 'NZL', group: 'B' },
  // Group C
  { name: 'Spain',        code: 'ESP', group: 'C' },
  { name: 'Morocco',      code: 'MAR', group: 'C' },
  { name: 'Côte d\'Ivoire', code: 'CIV', group: 'C' },
  { name: 'Brazil',       code: 'BRA', group: 'C' },
  // Group D
  { name: 'France',       code: 'FRA', group: 'D' },
  { name: 'Nigeria',      code: 'NGA', group: 'D' },
  { name: 'Italy',        code: 'ITA', group: 'D' },
  { name: 'Ecuador',      code: 'ECU', group: 'D' },
  // Group E
  { name: 'Germany',      code: 'GER', group: 'E' },
  { name: 'Japan',        code: 'JPN', group: 'E' },
  { name: 'Belgium',      code: 'BEL', group: 'E' },
  { name: 'Congo DR',     code: 'COD', group: 'E' },
  // Group F
  { name: 'Portugal',     code: 'POR', group: 'F' },
  { name: 'Colombia',     code: 'COL', group: 'F' },
  { name: 'South Korea',  code: 'KOR', group: 'F' },
  { name: 'Senegal',      code: 'SEN', group: 'F' },
  // Group G
  { name: 'England',      code: 'ENG', group: 'G' },
  { name: 'Netherlands',  code: 'NED', group: 'G' },
  { name: 'Australia',    code: 'AUS', group: 'G' },
  { name: 'Saudi Arabia', code: 'KSA', group: 'G' },
  // Group H
  { name: 'Uruguay',      code: 'URU', group: 'H' },
  { name: 'Canada',       code: 'CAN', group: 'H' },
  { name: 'Hungary',      code: 'HUN', group: 'H' },
  { name: 'Cameroon',     code: 'CMR', group: 'H' },
]

// Sample group stage matches (3 per group × 12 groups = 36 match days; we'll do 48 matches total — 6 per group)
function matchDate(month: number, day: number, hour = 18) {
  return new Date(`2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:00:00Z`)
}

async function main() {
  console.log('Seeding database...')

  // Clear existing
  await prisma.prediction.deleteMany()
  await prisma.match.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany({ where: { role: 'player' } })

  // Create teams
  const createdTeams: Record<string, number> = {}
  for (const t of teams) {
    const team = await prisma.team.create({ data: t })
    createdTeams[t.code] = team.id
  }
  console.log(`Created ${teams.length} teams`)

  // Create admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com'
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: await bcrypt.hash('ChangeMe123!', 12),
        role: 'admin',
        status: 'approved',
      },
    })
    console.log(`Admin created: ${adminEmail} / password: ChangeMe123! (change immediately!)`)
  }

  // Group stage matches (6 per group: each team plays 3 games)
  const groupMatches: Array<{ home: string; away: string; group: string; day: number; hour: number }> = [
    // Group A
    { home:'USA', away:'MEX', group:'A', day:11, hour:20 },
    { home:'PAN', away:'BHR', group:'A', day:12, hour:16 },
    { home:'USA', away:'PAN', group:'A', day:16, hour:18 },
    { home:'MEX', away:'BHR', group:'A', day:16, hour:21 },
    { home:'USA', away:'BHR', group:'A', day:21, hour:20 },
    { home:'MEX', away:'PAN', group:'A', day:21, hour:20 },
    // Group B
    { home:'ARG', away:'CHI', group:'B', day:11, hour:22 },
    { home:'PER', away:'NZL', group:'B', day:12, hour:19 },
    { home:'ARG', away:'PER', group:'B', day:16, hour:22 },
    { home:'CHI', away:'NZL', group:'B', day:17, hour:16 },
    { home:'ARG', away:'NZL', group:'B', day:22, hour:20 },
    { home:'CHI', away:'PER', group:'B', day:22, hour:20 },
    // Group C
    { home:'ESP', away:'MAR', group:'C', day:12, hour:20 },
    { home:'CIV', away:'BRA', group:'C', day:13, hour:18 },
    { home:'ESP', away:'CIV', group:'C', day:17, hour:19 },
    { home:'MAR', away:'BRA', group:'C', day:17, hour:22 },
    { home:'ESP', away:'BRA', group:'C', day:22, hour:20 },
    { home:'MAR', away:'CIV', group:'C', day:22, hour:20 },
    // Group D
    { home:'FRA', away:'NGA', group:'D', day:13, hour:20 },
    { home:'ITA', away:'ECU', group:'D', day:14, hour:16 },
    { home:'FRA', away:'ITA', group:'D', day:18, hour:18 },
    { home:'NGA', away:'ECU', group:'D', day:18, hour:21 },
    { home:'FRA', away:'ECU', group:'D', day:23, hour:20 },
    { home:'NGA', away:'ITA', group:'D', day:23, hour:20 },
    // Group E
    { home:'GER', away:'JPN', group:'E', day:14, hour:20 },
    { home:'BEL', away:'COD', group:'E', day:15, hour:16 },
    { home:'GER', away:'BEL', group:'E', day:19, hour:18 },
    { home:'JPN', away:'COD', group:'E', day:19, hour:21 },
    { home:'GER', away:'COD', group:'E', day:24, hour:20 },
    { home:'JPN', away:'BEL', group:'E', day:24, hour:20 },
    // Group F
    { home:'POR', away:'COL', group:'F', day:15, hour:20 },
    { home:'KOR', away:'SEN', group:'F', day:16, hour:16 },
    { home:'POR', away:'KOR', group:'F', day:20, hour:18 },
    { home:'COL', away:'SEN', group:'F', day:20, hour:21 },
    { home:'POR', away:'SEN', group:'F', day:25, hour:20 },
    { home:'COL', away:'KOR', group:'F', day:25, hour:20 },
    // Group G
    { home:'ENG', away:'NED', group:'G', day:13, hour:22 },
    { home:'AUS', away:'KSA', group:'G', day:14, hour:18 },
    { home:'ENG', away:'AUS', group:'G', day:18, hour:20 },
    { home:'NED', away:'KSA', group:'G', day:19, hour:16 },
    { home:'ENG', away:'KSA', group:'G', day:23, hour:20 },
    { home:'NED', away:'AUS', group:'G', day:23, hour:20 },
    // Group H
    { home:'URU', away:'CAN', group:'H', day:15, hour:18 },
    { home:'HUN', away:'CMR', group:'H', day:15, hour:22 },
    { home:'URU', away:'HUN', group:'H', day:20, hour:16 },
    { home:'CAN', away:'CMR', group:'H', day:20, hour:20 },
    { home:'URU', away:'CMR', group:'H', day:25, hour:20 },
    { home:'CAN', away:'HUN', group:'H', day:25, hour:20 },
  ]

  for (const m of groupMatches) {
    await prisma.match.create({
      data: {
        homeTeamId: createdTeams[m.home],
        awayTeamId: createdTeams[m.away],
        group: 'Group ' + m.group,
        stage: 'group',
        matchDate: matchDate(6, m.day, m.hour),
        venue: 'TBD',
      },
    })
  }
  console.log(`Created ${groupMatches.length} group stage matches`)
  console.log('Done! Run: npm run dev')
}

main().catch(console.error).finally(() => prisma.$disconnect())
