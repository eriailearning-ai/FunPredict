/**
 * GET  /api/bonus   - list official bonus questions (not per-match) with user answers
 * POST /api/bonus   - save user answers (while status is open)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession().catch(() => null)

  let questions: any[] = []
  try {
    questions = await (prisma as any).bonusQuestion.findMany({
      where: { NOT: { stage: { startsWith: 'm' } } },
      orderBy: { createdAt: 'asc' },
    })
  } catch (e: any) {
    console.error('[bonus] GET failed:', e?.message)
    return NextResponse.json([])
  }

  let myAnswers: Record<number, any> = {}
  if (session?.id) {
    try {
      const answers = await (prisma as any).bonusAnswer.findMany({
        where: { userId: session.id },
      })
      myAnswers = Object.fromEntries(answers.map((a: any) => [a.questionId, a]))
    } catch {}
  }

  const result = questions.map((q: any) => {
    const opts = JSON.parse(q.options ?? '[]') as string[]
    const myAnswer = myAnswers[q.id]
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      stage: q.stage,
      options: opts,
      points: q.points,
      status: q.status,
      correctAnswer: q.status === 'answered' ? q.correctAnswer : null,
      deadline: null,
      myAnswer: myAnswer?.answer ?? null,
      myPoints: myAnswer?.points ?? null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getSession().catch(() => null)
  if (!session?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { answers } = await req.json()

  let saved = 0
  for (const [qId, answer] of Object.entries(answers)) {
    const questionId = +qId
    try {
      const q = await (prisma as any).bonusQuestion.findUnique({ where: { id: questionId } })
      if (!q || q.status !== 'open') continue

      await (prisma as any).bonusAnswer.upsert({
        where: { userId_questionId: { userId: session.id, questionId } },
        create: { userId: session.id, questionId, answer: answer as string },
        update: { answer: answer as string },
      })
      saved++
    } catch {}
  }

  return NextResponse.json({ ok: true, saved })
}
