/**
 * POST /api/admin/seed-bonus
 * Seeds the 6 official FIFAFun bonus questions if they don't already exist.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const BONUS_QUESTIONS = [
  {
    question: 'Who will win the FIFA World Cup 2026?',
    type: 'single',
    stage: 'final',
    points: 10,
    status: 'closed',   // deadline was June 11 — pre-tournament pick
    options: [
      'Mexico','South Africa','South Korea','Czechia',
      'Canada','Bosnia-Herzegovina','Qatar','Switzerland',
      'Haiti','Scotland','Brazil','Morocco',
      'United States','Paraguay','Australia','Türkiye',
      'Germany','Curaçao','Ivory Coast','Ecuador',
      'Netherlands','Japan','Sweden','Tunisia',
      'Iran','New Zealand','Belgium','Egypt',
      'Saudi Arabia','Uruguay','Spain','Cape Verde',
      'France','Senegal','Iraq','Norway',
      'Argentina','Algeria','Austria','Jordan',
      'Portugal','Congo DR','Uzbekistan','Colombia',
      'Ghana','Panama','England','Croatia',
    ],
  },
  {
    question: 'Who will win the Golden Ball (Tournament MVP)?',
    type: 'single',
    stage: 'final',
    points: 8,
    status: 'closed',
    options: [
      'Lionel Messi (Argentina)',
      'Kylian Mbappé (France)',
      'Erling Haaland (Norway)',
      'Vinicius Jr (Brazil)',
      'Pedri (Spain)',
      'Rodri (Spain)',
      'Jude Bellingham (England)',
      'Lamine Yamal (Spain)',
      'Bukayo Saka (England)',
      'Florian Wirtz (Germany)',
      'Jamal Musiala (Germany)',
      'Alejandro Garnacho (Argentina)',
      'Julian Alvarez (Argentina)',
      'Cody Gakpo (Netherlands)',
      'Gavi (Spain)',
      'Other',
    ],
  },
  {
    question: 'Who will win the Golden Boot (Top Scorer)?',
    type: 'single',
    stage: 'final',
    points: 7,
    status: 'closed',
    options: [
      'Kylian Mbappé (France)',
      'Erling Haaland (Norway)',
      'Vinicius Jr (Brazil)',
      'Robert Lewandowski (not in WC)',
      'Harry Kane (England)',
      'Álvaro Morata (Spain)',
      'Romelu Lukaku (Belgium)',
      'Richarlison (Brazil)',
      'Julian Alvarez (Argentina)',
      'Cody Gakpo (Netherlands)',
      'Kai Havertz (Germany)',
      'Ivan Toney (England)',
      'Olivier Giroud (not in WC)',
      'Memphis Depay (Netherlands)',
      'Other',
    ],
  },
  {
    question: 'Who will win the Golden Glove (Best Goalkeeper)?',
    type: 'single',
    stage: 'final',
    points: 5,
    status: 'closed',
    options: [
      'Alisson Becker (Brazil)',
      'Ederson (Brazil)',
      'Gianluigi Donnarumma (not in WC)',
      'Thibaut Courtois (Belgium)',
      'Marc-André ter Stegen (Germany)',
      'Jordan Pickford (England)',
      'Jan Oblak (not in WC)',
      'Yann Sommer (Switzerland)',
      'Diogo Costa (Portugal)',
      'Mike Maignan (France)',
      'David Raya (Spain)',
      'Other',
    ],
  },
  {
    question: 'Who will win the Best Young Player award?',
    type: 'single',
    stage: 'knockout',
    points: 4,
    status: 'open',
    options: [
      'Lamine Yamal (Spain)',
      'Florian Wirtz (Germany)',
      'Jamal Musiala (Germany)',
      'Gavi (Spain)',
      'Pedri (Spain)',
      'Bukayo Saka (England)',
      'Jude Bellingham (England)',
      'Alejandro Garnacho (Argentina)',
      'Warren Zaïre-Emery (France)',
      'Patrick Dorgu (Denmark — not in WC)',
      'Ansu Fati (Spain)',
      'Khvicha Kvaratskhelia (not in WC)',
      'Other',
    ],
  },
  {
    question: 'Will the final go to extra time or penalties?',
    type: 'single',
    stage: 'final',
    points: 3,
    status: 'open',
    options: ['Yes', 'No'],
  },
]

export async function POST() {
  await requireAdmin()

  let created = 0
  let skipped = 0

  for (const q of BONUS_QUESTIONS) {
    // Check if question already exists (by exact question text)
    const existing = await prisma.bonusQuestion.findFirst({ where: { question: q.question } })
    if (existing) { skipped++; continue }

    await prisma.bonusQuestion.create({
      data: {
        question: q.question,
        type: q.type,
        stage: q.stage,
        options: JSON.stringify(q.options),
        points: q.points,
        status: q.status,
      },
    })
    created++
  }

  return NextResponse.json({ ok: true, created, skipped })
}
