/**
 * POST /api/admin/seed-db
 * Admin-only. Seeds all 48 teams + 72 group-stage matches.
 * Safe to run multiple times (upsert). Call once after first deploy.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const TEAMS: [string, string, string, string][] = [
  ['MEX','Mexico','mx','A'],       ['ZAF','South Africa','za','A'],
  ['KOR','South Korea','kr','A'],  ['CZE','Czechia','cz','A'],
  ['CAN','Canada','ca','B'],       ['BIH','Bosnia-Herzegovina','ba','B'],
  ['QAT','Qatar','qa','B'],        ['SUI','Switzerland','ch','B'],
  ['HTI','Haiti','ht','C'],        ['SCO','Scotland','gb-sct','C'],
  ['BRA','Brazil','br','C'],       ['MAR','Morocco','ma','C'],
  ['USA','United States','us','D'],['PRY','Paraguay','py','D'],
  ['AUS','Australia','au','D'],    ['TUR','Türkiye','tr','D'],
  ['GER','Germany','de','E'],      ['CUW','Curaçao','cw','E'],
  ['CIV','Ivory Coast','ci','E'],  ['ECU','Ecuador','ec','E'],
  ['NED','Netherlands','nl','F'],  ['JPN','Japan','jp','F'],
  ['SWE','Sweden','se','F'],       ['TUN','Tunisia','tn','F'],
  ['IRN','Iran','ir','G'],         ['NZL','New Zealand','nz','G'],
  ['BEL','Belgium','be','G'],      ['EGY','Egypt','eg','G'],
  ['KSA','Saudi Arabia','sa','H'], ['URY','Uruguay','uy','H'],
  ['ESP','Spain','es','H'],        ['CPV','Cabo Verde','cv','H'],
  ['FRA','France','fr','I'],       ['SEN','Senegal','sn','I'],
  ['IRQ','Iraq','iq','I'],         ['NOR','Norway','no','I'],
  ['ARG','Argentina','ar','J'],    ['ALG','Algeria','dz','J'],
  ['AUT','Austria','at','J'],      ['JOR','Jordan','jo','J'],
  ['POR','Portugal','pt','K'],     ['COD','DR Congo','cd','K'],
  ['UZB','Uzbekistan','uz','K'],   ['COL','Colombia','co','K'],
  ['GHA','Ghana','gh','L'],        ['PAN','Panama','pa','L'],
  ['ENG','England','gb-eng','L'],  ['CRO','Croatia','hr','L'],
]

const SCORES: Record<string, {h:number;a:number}> = {
  'MEX-ZAF':{h:2,a:0}, 'KOR-CZE':{h:2,a:1},
  'CAN-BIH':{h:1,a:1}, 'USA-PRY':{h:4,a:1},
  'HTI-SCO':{h:0,a:1}, 'AUS-TUR':{h:2,a:0},
  'BRA-MAR':{h:1,a:1}, 'QAT-SUI':{h:1,a:1},
  'CIV-ECU':{h:1,a:0}, 'GER-CUW':{h:7,a:1},
  'NED-JPN':{h:2,a:2}, 'SWE-TUN':{h:5,a:1},
  'KSA-URY':{h:1,a:1}, 'ESP-CPV':{h:0,a:0},
  'IRN-NZL':{h:2,a:2}, 'BEL-EGY':{h:1,a:1},
  'FRA-SEN':{h:3,a:1}, 'IRQ-NOR':{h:1,a:2},
  'ARG-ALG':{h:3,a:0}, 'AUT-JOR':{h:3,a:1},
}

// [homeCode, awayCode, utcDate, venue, group]
const MATCHES: [string,string,string,string,string][] = [
  ['MEX','ZAF','2026-06-11T19:00:00Z','Estadio Azteca, Mexico City','A'],
  ['KOR','CZE','2026-06-12T02:00:00Z','Estadio Akron, Guadalajara','A'],
  ['CAN','BIH','2026-06-12T19:00:00Z','BMO Field, Toronto','B'],
  ['USA','PRY','2026-06-13T01:00:00Z','SoFi Stadium, Inglewood','D'],
  ['HTI','SCO','2026-06-14T01:00:00Z','Gillette Stadium, Foxborough','C'],
  ['BRA','MAR','2026-06-13T22:00:00Z','MetLife Stadium, East Rutherford','C'],
  ['QAT','SUI','2026-06-13T19:00:00Z',"Levi's Stadium, Santa Clara",'B'],
  ['AUS','TUR','2026-06-14T04:00:00Z','BC Place, Vancouver','D'],
  ['CIV','ECU','2026-06-14T23:00:00Z','Lincoln Financial Field, Philadelphia','E'],
  ['GER','CUW','2026-06-14T17:00:00Z','NRG Stadium, Houston','E'],
  ['NED','JPN','2026-06-14T20:00:00Z','AT&T Stadium, Arlington','F'],
  ['SWE','TUN','2026-06-15T02:00:00Z','Estadio BBVA, Monterrey','F'],
  ['KSA','URY','2026-06-15T22:00:00Z','Hard Rock Stadium, Miami','H'],
  ['ESP','CPV','2026-06-15T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H'],
  ['IRN','NZL','2026-06-16T01:00:00Z','SoFi Stadium, Inglewood','G'],
  ['BEL','EGY','2026-06-15T19:00:00Z','Lumen Field, Seattle','G'],
  ['FRA','SEN','2026-06-16T19:00:00Z','MetLife Stadium, East Rutherford','I'],
  ['IRQ','NOR','2026-06-16T22:00:00Z','Gillette Stadium, Foxborough','I'],
  ['ARG','ALG','2026-06-17T01:00:00Z','GEHA Field at Arrowhead Stadium, KC','J'],
  ['AUT','JOR','2026-06-17T04:00:00Z',"Levi's Stadium, Santa Clara",'J'],
  ['GHA','PAN','2026-06-17T23:00:00Z','BMO Field, Toronto','L'],
  ['ENG','CRO','2026-06-17T20:00:00Z','AT&T Stadium, Arlington','L'],
  ['POR','COD','2026-06-17T17:00:00Z','NRG Stadium, Houston','K'],
  ['UZB','COL','2026-06-18T02:00:00Z','Estadio Azteca, Mexico City','K'],
  ['CZE','ZAF','2026-06-18T16:00:00Z','Mercedes-Benz Stadium, Atlanta','A'],
  ['SUI','BIH','2026-06-18T19:00:00Z','SoFi Stadium, Inglewood','B'],
  ['CAN','QAT','2026-06-18T22:00:00Z','BC Place, Vancouver','B'],
  ['MEX','KOR','2026-06-19T01:00:00Z','Estadio Akron, Guadalajara','A'],
  ['BRA','HTI','2026-06-20T00:30:00Z','Lincoln Financial Field, Philadelphia','C'],
  ['SCO','MAR','2026-06-19T22:00:00Z','Gillette Stadium, Foxborough','C'],
  ['TUR','PRY','2026-06-20T03:00:00Z',"Levi's Stadium, Santa Clara",'D'],
  ['USA','AUS','2026-06-19T19:00:00Z','Lumen Field, Seattle','D'],
  ['GER','CIV','2026-06-20T20:00:00Z','BMO Field, Toronto','E'],
  ['ECU','CUW','2026-06-21T00:00:00Z','GEHA Field at Arrowhead Stadium, KC','E'],
  ['NED','SWE','2026-06-20T17:00:00Z','NRG Stadium, Houston','F'],
  ['TUN','JPN','2026-06-21T04:00:00Z','Estadio BBVA, Monterrey','F'],
  ['URY','CPV','2026-06-21T22:00:00Z','Hard Rock Stadium, Miami','H'],
  ['ESP','KSA','2026-06-21T16:00:00Z','Mercedes-Benz Stadium, Atlanta','H'],
  ['BEL','IRN','2026-06-21T19:00:00Z','SoFi Stadium, Inglewood','G'],
  ['NZL','EGY','2026-06-22T01:00:00Z','BC Place, Vancouver','G'],
  ['NOR','SEN','2026-06-23T00:00:00Z','MetLife Stadium, East Rutherford','I'],
  ['FRA','IRQ','2026-06-22T21:00:00Z','Lincoln Financial Field, Philadelphia','I'],
  ['ARG','AUT','2026-06-22T17:00:00Z','AT&T Stadium, Arlington','J'],
  ['JOR','ALG','2026-06-23T03:00:00Z',"Levi's Stadium, Santa Clara",'J'],
  ['ENG','GHA','2026-06-23T20:00:00Z','Gillette Stadium, Foxborough','L'],
  ['PAN','CRO','2026-06-23T23:00:00Z','BMO Field, Toronto','L'],
  ['POR','UZB','2026-06-23T17:00:00Z','NRG Stadium, Houston','K'],
  ['COL','COD','2026-06-24T02:00:00Z','Estadio Akron, Guadalajara','K'],
  ['SCO','BRA','2026-06-24T22:00:00Z','Hard Rock Stadium, Miami','C'],
  ['MAR','HTI','2026-06-24T22:00:00Z','Mercedes-Benz Stadium, Atlanta','C'],
  ['SUI','CAN','2026-06-24T19:00:00Z','BC Place, Vancouver','B'],
  ['BIH','QAT','2026-06-24T19:00:00Z','Lumen Field, Seattle','B'],
  ['CZE','MEX','2026-06-25T01:00:00Z','Estadio Azteca, Mexico City','A'],
  ['ZAF','KOR','2026-06-25T01:00:00Z','Estadio BBVA, Monterrey','A'],
  ['CUW','CIV','2026-06-25T20:00:00Z','Lincoln Financial Field, Philadelphia','E'],
  ['ECU','GER','2026-06-25T20:00:00Z','MetLife Stadium, East Rutherford','E'],
  ['JPN','SWE','2026-06-25T23:00:00Z','AT&T Stadium, Arlington','F'],
  ['TUN','NED','2026-06-25T23:00:00Z','GEHA Field at Arrowhead Stadium, KC','F'],
  ['TUR','USA','2026-06-26T02:00:00Z','SoFi Stadium, Inglewood','D'],
  ['PRY','AUS','2026-06-26T02:00:00Z',"Levi's Stadium, Santa Clara",'D'],
  ['NOR','FRA','2026-06-26T19:00:00Z','Gillette Stadium, Foxborough','I'],
  ['SEN','IRQ','2026-06-26T19:00:00Z','BMO Field, Toronto','I'],
  ['EGY','IRN','2026-06-27T03:00:00Z','Lumen Field, Seattle','G'],
  ['NZL','BEL','2026-06-27T03:00:00Z','BC Place, Vancouver','G'],
  ['CPV','KSA','2026-06-27T00:00:00Z','NRG Stadium, Houston','H'],
  ['URY','ESP','2026-06-27T00:00:00Z','Estadio Akron, Guadalajara','H'],
  ['PAN','ENG','2026-06-27T21:00:00Z','MetLife Stadium, East Rutherford','L'],
  ['CRO','GHA','2026-06-27T21:00:00Z','Lincoln Financial Field, Philadelphia','L'],
  ['ALG','AUT','2026-06-28T02:00:00Z','GEHA Field at Arrowhead Stadium, KC','J'],
  ['JOR','ARG','2026-06-28T02:00:00Z','AT&T Stadium, Arlington','J'],
  ['COL','POR','2026-06-27T23:30:00Z','Hard Rock Stadium, Miami','K'],
  ['COD','UZB','2026-06-27T23:30:00Z','Mercedes-Benz Stadium, Atlanta','K'],
]

function matchStatus(utcDate: string) {
  const now = new Date()
  const kick = new Date(utcDate)
  const end  = new Date(kick.getTime() + 115 * 60 * 1000)
  if (now >= end)  return 'finished'
  if (now >= kick) return 'live'
  return 'upcoming'
}

export async function POST() {
  await requireAdmin()

  // 1. Upsert teams
  const teamMap: Record<string, number> = {}
  for (const [code, name, flagCode, group] of TEAMS) {
    const t = await prisma.team.upsert({
      where:  { code },
      create: { code, name, flagCode, group, flag: flagCode },
      update: { name, flagCode, group, flag: flagCode },
    })
    teamMap[code] = t.id
  }

  // 2. Upsert matches
  let created = 0, updated = 0

  for (const [homeCode, awayCode, utcDate, venue, group] of MATCHES) {
    const homeTeamId = teamMap[homeCode]
    const awayTeamId = teamMap[awayCode]
    if (!homeTeamId || !awayTeamId) continue

    const key    = `${homeCode}-${awayCode}`
    const scores = SCORES[key]
    const status = scores ? 'finished' : matchStatus(utcDate)
    const locked = scores ? true : new Date() >= new Date(new Date(utcDate).getTime() - 15 * 60 * 1000)

    const data = {
      homeTeamId, awayTeamId, group, stage: 'group',
      matchDate: new Date(utcDate), venue, status, locked,
      homeScore: scores?.h ?? null,
      awayScore: scores?.a ?? null,
    }

    const existing = await prisma.match.findFirst({ where: { homeTeamId, awayTeamId } })
    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data })
      updated++
    } else {
      await prisma.match.create({ data })
      created++
    }
  }

  const counts = {
    upcoming: await prisma.match.count({ where: { status: 'upcoming' } }),
    finished: await prisma.match.count({ where: { status: 'finished' } }),
    teams:    await prisma.team.count(),
  }

  return NextResponse.json({ ok: true, created, updated, ...counts })
}
