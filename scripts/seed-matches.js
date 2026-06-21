/**
 * FIFA World Cup 2026 — Group Stage Match Seeder
 *
 * Run: node scripts/seed-matches.js
 *
 * Upserts all 48 teams + 72 group-stage matches into the DB.
 * Uses "upsert" so it's safe to run multiple times.
 * All kickoff times are UTC (source: bracketmundial2026.com ET times + 4h).
 *
 * Known finished scores are applied automatically.
 * Add more scores to FINISHED_SCORES as results come in.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ─── Teams ──────────────────────────────────────────────────────────────────
// [code, name, flagCode (ISO 3166-1 alpha-2), group]
const TEAMS = [
  // Group A
  ['MEX', 'Mexico',       'mx',     'A'],
  ['ZAF', 'South Africa', 'za',     'A'],
  ['KOR', 'South Korea',  'kr',     'A'],
  ['CZE', 'Czechia',      'cz',     'A'],
  // Group B
  ['CAN', 'Canada',             'ca', 'B'],
  ['BIH', 'Bosnia-Herzegovina', 'ba', 'B'],
  ['QAT', 'Qatar',              'qa', 'B'],
  ['SUI', 'Switzerland',        'ch', 'B'],
  // Group C
  ['HTI', 'Haiti',    'ht',     'C'],
  ['SCO', 'Scotland', 'gb-sct', 'C'],
  ['BRA', 'Brazil',   'br',     'C'],
  ['MAR', 'Morocco',  'ma',     'C'],
  // Group D
  ['USA', 'United States', 'us', 'D'],
  ['PRY', 'Paraguay',      'py', 'D'],
  ['AUS', 'Australia',     'au', 'D'],
  ['TUR', 'Türkiye',       'tr', 'D'],
  // Group E
  ['GER', 'Germany',     'de', 'E'],
  ['CUW', 'Curaçao',     'cw', 'E'],
  ['CIV', 'Ivory Coast', 'ci', 'E'],
  ['ECU', 'Ecuador',     'ec', 'E'],
  // Group F
  ['NED', 'Netherlands', 'nl', 'F'],
  ['JPN', 'Japan',       'jp', 'F'],
  ['SWE', 'Sweden',      'se', 'F'],
  ['TUN', 'Tunisia',     'tn', 'F'],
  // Group G
  ['IRN', 'Iran',        'ir', 'G'],
  ['NZL', 'New Zealand', 'nz', 'G'],
  ['BEL', 'Belgium',     'be', 'G'],
  ['EGY', 'Egypt',       'eg', 'G'],
  // Group H
  ['KSA', 'Saudi Arabia', 'sa', 'H'],
  ['URY', 'Uruguay',      'uy', 'H'],
  ['ESP', 'Spain',        'es', 'H'],
  ['CPV', 'Cabo Verde',   'cv', 'H'],
  // Group I
  ['FRA', 'France',  'fr', 'I'],
  ['SEN', 'Senegal', 'sn', 'I'],
  ['IRQ', 'Iraq',    'iq', 'I'],
  ['NOR', 'Norway',  'no', 'I'],
  // Group J
  ['ARG', 'Argentina', 'ar', 'J'],
  ['ALG', 'Algeria',   'dz', 'J'],
  ['AUT', 'Austria',   'at', 'J'],
  ['JOR', 'Jordan',    'jo', 'J'],
  // Group K
  ['POR', 'Portugal',   'pt', 'K'],
  ['COD', 'DR Congo',   'cd', 'K'],
  ['UZB', 'Uzbekistan', 'uz', 'K'],
  ['COL', 'Colombia',   'co', 'K'],
  // Group L
  ['GHA', 'Ghana',    'gh',     'L'],
  ['PAN', 'Panama',   'pa',     'L'],
  ['ENG', 'England',  'gb-eng', 'L'],
  ['CRO', 'Croatia',  'hr',     'L'],
]

// ─── Known finished scores ────────────────────────────────────────────────
// Add more as results come in: { home: N, away: N }
const FINISHED_SCORES = {
  // matchDate key = UTC ISO string of kickoff (for lookup reference only)
  // Keyed by "HOMECODE-AWAYCODE"
  'MEX-ZAF': { h: 2, a: 0 },
  'KOR-CZE': { h: 2, a: 1 },
  'CAN-BIH': { h: 1, a: 1 },
  'USA-PRY': { h: 4, a: 1 },
  'HTI-SCO': { h: 0, a: 1 },
  'AUS-TUR': { h: 2, a: 0 },
  'BRA-MAR': { h: 1, a: 1 },
  'QAT-SUI': { h: 1, a: 1 },
  'CIV-ECU': { h: 1, a: 0 },
  'GER-CUW': { h: 7, a: 1 },
  'NED-JPN': { h: 2, a: 2 },
  'SWE-TUN': { h: 5, a: 1 },
  'KSA-URY': { h: 1, a: 1 },
  'ESP-CPV': { h: 0, a: 0 },
  'IRN-NZL': { h: 2, a: 2 },
  'BEL-EGY': { h: 1, a: 1 },
  'FRA-SEN': { h: 3, a: 1 },
  'IRQ-NOR': { h: 1, a: 2 },
  'ARG-ALG': { h: 3, a: 0 },
  'AUT-JOR': { h: 3, a: 1 },
  // Add more below as matches finish:
  // 'POR-COD': { h: ?, a: ? },
  // 'ENG-CRO': { h: ?, a: ? },
  // 'GHA-PAN': { h: ?, a: ? },
  // 'UZB-COL': { h: ?, a: ? },
}

// ─── Match schedule ──────────────────────────────────────────────────────
// Format: [matchNum, homeCode, awayCode, utcDateString, venue, group]
// UTC = ET + 4h (EDT during June/July)
const MATCHES = [
  // ── Jun 11 ──
  [1,  'MEX','ZAF', '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City',         'A'],
  [2,  'KOR','CZE', '2026-06-12T02:00:00Z', 'Estadio Akron, Guadalajara',           'A'],
  // ── Jun 12 ──
  [3,  'CAN','BIH', '2026-06-12T19:00:00Z', 'BMO Field, Toronto',                   'B'],
  [4,  'USA','PRY', '2026-06-13T01:00:00Z', 'SoFi Stadium, Inglewood',              'D'],
  // ── Jun 13 ──
  [5,  'HTI','SCO', '2026-06-14T01:00:00Z', 'Gillette Stadium, Foxborough',          'C'],
  [7,  'BRA','MAR', '2026-06-13T22:00:00Z', 'MetLife Stadium, East Rutherford',      'C'],
  [8,  'QAT','SUI', '2026-06-13T19:00:00Z', "Levi's Stadium, Santa Clara",           'B'],
  // ── Jun 14 ──
  [6,  'AUS','TUR', '2026-06-14T04:00:00Z', 'BC Place, Vancouver',                   'D'],
  [9,  'CIV','ECU', '2026-06-14T23:00:00Z', 'Lincoln Financial Field, Philadelphia', 'E'],
  [10, 'GER','CUW', '2026-06-14T17:00:00Z', 'NRG Stadium, Houston',                  'E'],
  [11, 'NED','JPN', '2026-06-14T20:00:00Z', 'AT&T Stadium, Arlington',               'F'],
  [12, 'SWE','TUN', '2026-06-15T02:00:00Z', 'Estadio BBVA, Monterrey',               'F'],
  // ── Jun 15 ──
  [13, 'KSA','URY', '2026-06-15T22:00:00Z', 'Hard Rock Stadium, Miami',              'H'],
  [14, 'ESP','CPV', '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta',        'H'],
  [15, 'IRN','NZL', '2026-06-16T01:00:00Z', 'SoFi Stadium, Inglewood',               'G'],
  [16, 'BEL','EGY', '2026-06-15T19:00:00Z', 'Lumen Field, Seattle',                  'G'],
  // ── Jun 16 ──
  [17, 'FRA','SEN', '2026-06-16T19:00:00Z', 'MetLife Stadium, East Rutherford',      'I'],
  [18, 'IRQ','NOR', '2026-06-16T22:00:00Z', 'Gillette Stadium, Foxborough',           'I'],
  [19, 'ARG','ALG', '2026-06-17T01:00:00Z', 'GEHA Field at Arrowhead Stadium, KC',   'J'],
  // ── Jun 17 ──
  [20, 'AUT','JOR', '2026-06-17T04:00:00Z', "Levi's Stadium, Santa Clara",            'J'],
  [23, 'POR','COD', '2026-06-17T17:00:00Z', 'NRG Stadium, Houston',                  'K'],
  [22, 'ENG','CRO', '2026-06-17T20:00:00Z', 'AT&T Stadium, Arlington',               'L'],
  [21, 'GHA','PAN', '2026-06-17T23:00:00Z', 'BMO Field, Toronto',                    'L'],
  [24, 'UZB','COL', '2026-06-18T02:00:00Z', 'Estadio Azteca, Mexico City',           'K'],
  // ── Jun 18 ──
  [25, 'CZE','ZAF', '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta',        'A'],
  [26, 'SUI','BIH', '2026-06-18T19:00:00Z', 'SoFi Stadium, Inglewood',               'B'],
  [27, 'CAN','QAT', '2026-06-18T22:00:00Z', 'BC Place, Vancouver',                   'B'],
  [28, 'MEX','KOR', '2026-06-19T01:00:00Z', 'Estadio Akron, Guadalajara',            'A'],
  // ── Jun 19 ──
  [29, 'BRA','HTI', '2026-06-20T00:30:00Z', 'Lincoln Financial Field, Philadelphia', 'C'],
  [30, 'SCO','MAR', '2026-06-19T22:00:00Z', 'Gillette Stadium, Foxborough',           'C'],
  [31, 'TUR','PRY', '2026-06-20T03:00:00Z', "Levi's Stadium, Santa Clara",            'D'],
  [32, 'USA','AUS', '2026-06-19T19:00:00Z', 'Lumen Field, Seattle',                   'D'],
  // ── Jun 20 ──
  [33, 'GER','CIV', '2026-06-20T20:00:00Z', 'BMO Field, Toronto',                    'E'],
  [34, 'ECU','CUW', '2026-06-21T00:00:00Z', 'GEHA Field at Arrowhead Stadium, KC',   'E'],
  [35, 'NED','SWE', '2026-06-20T17:00:00Z', 'NRG Stadium, Houston',                   'F'],
  // ── Jun 21 ──
  [36, 'TUN','JPN', '2026-06-21T04:00:00Z', 'Estadio BBVA, Monterrey',               'F'],
  [37, 'URY','CPV', '2026-06-21T22:00:00Z', 'Hard Rock Stadium, Miami',              'H'],
  [38, 'ESP','KSA', '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta',        'H'],
  [39, 'BEL','IRN', '2026-06-21T19:00:00Z', 'SoFi Stadium, Inglewood',               'G'],
  [40, 'NZL','EGY', '2026-06-22T01:00:00Z', 'BC Place, Vancouver',                   'G'],
  // ── Jun 22 ──
  [41, 'NOR','SEN', '2026-06-23T00:00:00Z', 'MetLife Stadium, East Rutherford',      'I'],
  [42, 'FRA','IRQ', '2026-06-22T21:00:00Z', 'Lincoln Financial Field, Philadelphia', 'I'],
  [43, 'ARG','AUT', '2026-06-22T17:00:00Z', 'AT&T Stadium, Arlington',               'J'],
  [44, 'JOR','ALG', '2026-06-23T03:00:00Z', "Levi's Stadium, Santa Clara",            'J'],
  // ── Jun 23 ──
  [45, 'ENG','GHA', '2026-06-23T20:00:00Z', 'Gillette Stadium, Foxborough',           'L'],
  [46, 'PAN','CRO', '2026-06-23T23:00:00Z', 'BMO Field, Toronto',                    'L'],
  [47, 'POR','UZB', '2026-06-23T17:00:00Z', 'NRG Stadium, Houston',                  'K'],
  [48, 'COL','COD', '2026-06-24T02:00:00Z', 'Estadio Akron, Guadalajara',            'K'],
  // ── Jun 24 ──
  [49, 'SCO','BRA', '2026-06-24T22:00:00Z', 'Hard Rock Stadium, Miami',              'C'],
  [50, 'MAR','HTI', '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium, Atlanta',        'C'],
  [51, 'SUI','CAN', '2026-06-24T19:00:00Z', 'BC Place, Vancouver',                   'B'],
  [52, 'BIH','QAT', '2026-06-24T19:00:00Z', 'Lumen Field, Seattle',                   'B'],
  [53, 'CZE','MEX', '2026-06-25T01:00:00Z', 'Estadio Azteca, Mexico City',           'A'],
  [54, 'ZAF','KOR', '2026-06-25T01:00:00Z', 'Estadio BBVA, Monterrey',               'A'],
  // ── Jun 25 ──
  [55, 'CUW','CIV', '2026-06-25T20:00:00Z', 'Lincoln Financial Field, Philadelphia', 'E'],
  [56, 'ECU','GER', '2026-06-25T20:00:00Z', 'MetLife Stadium, East Rutherford',      'E'],
  [57, 'JPN','SWE', '2026-06-25T23:00:00Z', 'AT&T Stadium, Arlington',               'F'],
  [58, 'TUN','NED', '2026-06-25T23:00:00Z', 'GEHA Field at Arrowhead Stadium, KC',   'F'],
  [59, 'TUR','USA', '2026-06-26T02:00:00Z', 'SoFi Stadium, Inglewood',               'D'],
  [60, 'PRY','AUS', '2026-06-26T02:00:00Z', "Levi's Stadium, Santa Clara",            'D'],
  // ── Jun 26 ──
  [61, 'NOR','FRA', '2026-06-26T19:00:00Z', 'Gillette Stadium, Foxborough',           'I'],
  [62, 'SEN','IRQ', '2026-06-26T19:00:00Z', 'BMO Field, Toronto',                    'I'],
  [63, 'EGY','IRN', '2026-06-27T03:00:00Z', 'Lumen Field, Seattle',                   'G'],
  [64, 'NZL','BEL', '2026-06-27T03:00:00Z', 'BC Place, Vancouver',                   'G'],
  [65, 'CPV','KSA', '2026-06-27T00:00:00Z', 'NRG Stadium, Houston',                  'H'],
  [66, 'URY','ESP', '2026-06-27T00:00:00Z', 'Estadio Akron, Guadalajara',            'H'],
  // ── Jun 27 ──
  [67, 'PAN','ENG', '2026-06-27T21:00:00Z', 'MetLife Stadium, East Rutherford',      'L'],
  [68, 'CRO','GHA', '2026-06-27T21:00:00Z', 'Lincoln Financial Field, Philadelphia', 'L'],
  [69, 'ALG','AUT', '2026-06-28T02:00:00Z', 'GEHA Field at Arrowhead Stadium, KC',   'J'],
  [70, 'JOR','ARG', '2026-06-28T02:00:00Z', 'AT&T Stadium, Arlington',               'J'],
  [71, 'COL','POR', '2026-06-27T23:30:00Z', 'Hard Rock Stadium, Miami',              'K'],
  [72, 'COD','UZB', '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium, Atlanta',        'K'],
]

const NOW = new Date()
const LOCK_MINS = 15

function matchStatus(utcDate) {
  const kickoff = new Date(utcDate)
  const end     = new Date(kickoff.getTime() + 115 * 60 * 1000) // ~115 min window
  if (NOW >= end)     return 'finished'
  if (NOW >= kickoff) return 'live'
  return 'upcoming'
}

function isLocked(utcDate) {
  return NOW >= new Date(new Date(utcDate).getTime() - LOCK_MINS * 60 * 1000)
}

async function main() {
  console.log('🌍 Seeding FIFA World Cup 2026 teams and matches…\n')

  // ── 1. Upsert teams ───────────────────────────────────────────────────────
  let teamCount = 0
  const teamMap = {}   // code → id

  for (const [code, name, flagCode, group] of TEAMS) {
    const t = await prisma.team.upsert({
      where:  { code },
      create: { code, name, flagCode, group, flag: flagCode },
      update: { name, flagCode, group, flag: flagCode },
    })
    teamMap[code] = t.id
    teamCount++
  }
  console.log(`✅ Teams: ${teamCount} upserted`)

  // ── 2. Upsert matches ─────────────────────────────────────────────────────
  let created = 0, updated = 0, scored = 0

  for (const [num, homeCode, awayCode, utcDate, venue, group] of MATCHES) {
    const homeTeamId = teamMap[homeCode]
    const awayTeamId = teamMap[awayCode]
    if (!homeTeamId || !awayTeamId) {
      console.warn(`⚠️  M${num}: missing team ${homeCode} or ${awayCode}`)
      continue
    }

    const key    = `${homeCode}-${awayCode}`
    const scores = FINISHED_SCORES[key]
    const status = scores ? 'finished' : matchStatus(utcDate)
    const locked = scores ? true : isLocked(utcDate)

    const matchData = {
      homeTeamId,
      awayTeamId,
      group,
      stage:   'group',
      matchDate: new Date(utcDate),
      venue,
      status,
      locked,
      homeScore: scores?.h ?? null,
      awayScore: scores?.a ?? null,
    }

    // Find existing by team pair (no externalId to collide on)
    const existing = await prisma.match.findFirst({
      where: { homeTeamId, awayTeamId },
    })

    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data: matchData })
      updated++
    } else {
      await prisma.match.create({ data: matchData })
      created++
    }

    if (scores) scored++
  }

  console.log(`✅ Matches: ${created} created, ${updated} updated, ${scored} with scores`)

  // ── 3. Summary ────────────────────────────────────────────────────────────
  const upcomingCount = await prisma.match.count({ where: { status: 'upcoming' } })
  const finishedCount = await prisma.match.count({ where: { status: 'finished' } })
  const liveCount     = await prisma.match.count({ where: { status: 'live'     } })

  console.log(`\n📊 DB state after seed:`)
  console.log(`   Finished: ${finishedCount}`)
  console.log(`   Live:     ${liveCount}`)
  console.log(`   Upcoming: ${upcomingCount}`)

  const next2 = await prisma.match.findMany({
    where:   { status: 'upcoming' },
    orderBy: { matchDate: 'asc'   },
    take:    2,
    include: { homeTeam: true, awayTeam: true },
  })
  console.log(`\n📅 Next 2 upcoming matches:`)
  next2.forEach(m => {
    console.log(`   ${m.matchDate.toUTCString()} — ${m.homeTeam.name} vs ${m.awayTeam.name}`)
  })

  console.log('\n✨ Done!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
