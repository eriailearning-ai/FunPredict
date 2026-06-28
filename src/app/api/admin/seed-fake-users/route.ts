/**
 * POST /api/admin/seed-fake-users
 * Creates 50 sample users with funny nicknames in the Aila Attackers league,
 * with realistic predictions (scores + scorer picks) for every match.
 * Safe to run multiple times — skips users that already exist.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { calcPoints, scorerMatches } from '@/lib/scoring'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const FUNNY_NICKNAMES = [
  'OffsideTrap','GoldenGloveGoblin','TacticsTerry','WhistleBlower','RedCardRandy',
  'NinetyPlusMike','CornerKingKev','DivingDave','HandballHannah','FreeKickFred',
  'VAR Victim','Penalty Penguin','OffsideOllie','SubstituteSue','YellowCardYara',
  'TiebreakerTom','ExtraTimeEd','SuddenDeathSam','OwnGoalOscar','HatTrickHarry',
  'BicycleKickBob','HeaderHector','ChipShotChris','VolleyVince','DribbleDan',
  'TackleTimmy','ClearanceCarla','ThrowInTheo','GoalkickGrace','DropballDrake',
  'MexicanWaveMarta','JerseySwapJoe','BenchWarmerBen','Superfan Sofia','UltrasFrank',
  'TifoBruno','CurvaCapo','ManagersNightmare','AssistKingAli','CleanSheetClara',
  'GoldenBootBruno','WorldClassWendy','PressurePete','HighLineHugh','GegenPressGus',
  'TikiTakaTina','CatenaccioCarlo','SweepingStephen','LiberoLucy','FalseNineFelix',
]

const SAMPLE_SCORERS_BY_TEAM: Record<string, string[]> = {
  ARG: ['Lionel Messi','Julian Alvarez'],
  FRA: ['Kylian Mbappe','Ousmane Dembele'],
  BRA: ['Vinicius Jr','Rodrygo'],
  ENG: ['Harry Kane','Bukayo Saka'],
  ESP: ['Lamine Yamal','Alvaro Morata'],
  GER: ['Kai Havertz','Leroy Sane'],
  POR: ['Cristiano Ronaldo','Bruno Fernandes'],
  NED: ['Memphis Depay','Cody Gakpo'],
  NOR: ['Erling Haaland','Alexander Sorloth'],
  JPN: ['Wataru Endo','Takumi Minamino'],
  USA: ['Christian Pulisic','Folarin Balogun'],
  MEX: ['Hirving Lozano','Alexis Vega'],
  URY: ['Darwin Nunez','Federico Valverde'],
  COL: ['Luis Diaz','James Rodriguez'],
  MAR: ['Hakim Ziyech','Youssef En-Nesyri'],
  SEN: ['Sadio Mane','Ismaila Sarr'],
  CRO: ['Andrej Kramaric','Luka Modric'],
  BEL: ['Romelu Lukaku','Kevin De Bruyne'],
  SCO: ['Che Adams','John McGinn'],
  TUR: ['Arda Guler','Hakan Calhanoglu'],
}

function pickScorer(homeCode: string, awayCode: string): string | null {
  // 70% chance of picking a scorer
  if (Math.random() > 0.70) return null
  const candidates = [
    ...(SAMPLE_SCORERS_BY_TEAM[homeCode] ?? []),
    ...(SAMPLE_SCORERS_BY_TEAM[awayCode] ?? []),
  ]
  if (!candidates.length) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function randomScore(): { h: number; a: number } {
  const scores = [
    {h:1,a:0},{h:2,a:0},{h:2,a:1},{h:3,a:0},{h:3,a:1},{h:3,a:2},
    {h:0,a:0},{h:1,a:1},{h:2,a:2},
    {h:0,a:1},{h:0,a:2},{h:1,a:2},{h:0,a:3},{h:1,a:3},{h:2,a:3},
  ]
  return scores[Math.floor(Math.random() * scores.length)]
}

export async function POST() {
  try {
    await requireAdmin()

    // Find or create Aila Attackers league
    let league = await prisma.league.findFirst({ where: { name: { contains: 'Aila', mode: 'insensitive' } } })
    if (!league) {
      league = await prisma.league.create({
        data: { name: 'Aila Attackers', slug: 'aila-attackers', color: '#1e3a5f' },
      })
    }

    // Fetch all matches with team codes
    const matches: any[] = await prisma.$queryRawUnsafe(`
      SELECT m.id, m.status, m."homeScore", m."awayScore", m.locked, m.scorers,
             ht.code AS home_code, at.code AS away_code
      FROM "Match" m
      JOIN "Team" ht ON ht.id = m."homeTeamId"
      JOIN "Team" at ON at.id = m."awayTeamId"
      ORDER BY m."matchDate" ASC
    `)

    const passwordHash = await bcrypt.hash('Demo1234!', 10)
    const created: string[] = []
    const skipped: string[] = []

    for (let i = 0; i < 50; i++) {
      const nickname = FUNNY_NICKNAMES[i]
      const username = nickname.toLowerCase().replace(/\s+/g, '_')
      const email = `${username}@fifafun-demo.test`

      // Skip if already exists
      const existing = await prisma.user.findFirst({ where: { email } })
      if (existing) { skipped.push(nickname); continue }

      const user = await prisma.user.create({
        data: {
          name: nickname,
          nickname,
          username,
          email,
          password: passwordHash,
          role: 'player',
          status: 'approved',
          league: league.name,
          leagueId: league.id,
          cheeringFrom: ['Kathmandu','London','Sydney','New York','Tokyo','Dubai'][i % 6],
        },
      })

      // Pick a random joker match (one upcoming, unlocked match)
      const jokerCandidates = matches.filter(m => !m.locked && m.status === 'upcoming')
      const jokerMatch = jokerCandidates.length
        ? jokerCandidates[Math.floor(Math.random() * jokerCandidates.length)]
        : null

      // Create predictions for all matches
      for (const m of matches) {
        const score = randomScore()
        const isJoker = jokerMatch?.id === m.id
        const scorerPred = m.status !== 'finished'
          ? pickScorer(m.home_code, m.away_code)
          : pickScorer(m.home_code, m.away_code) // also pick for finished (historical)

        // Calculate points for finished matches
        let points: number | null = null
        if (m.status === 'finished' && m.homeScore !== null && m.awayScore !== null) {
          const scorerList: string[] = m.scorers ?? []
          const sc = scorerMatches(scorerPred ?? '', scorerList)
          points = calcPoints(
            score.h, score.a,
            Number(m.homeScore), Number(m.awayScore),
            isJoker, sc
          )
        }

        await prisma.$executeRawUnsafe(`
          INSERT INTO "Prediction" ("userId","matchId","homeScore","awayScore",joker,"scorerPred","points","createdAt","updatedAt")
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
          ON CONFLICT ("userId","matchId") DO NOTHING
        `, user.id, Number(m.id), score.h, score.a, isJoker, scorerPred ?? null, points)
      }

      created.push(nickname)
    }

    return NextResponse.json({
      ok: true,
      league: league.name,
      created: created.length,
      skipped: skipped.length,
      users: created,
    })
  } catch (err: any) {
    console.error('[seed-fake-users]', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
