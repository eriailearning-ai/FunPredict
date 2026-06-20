import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const questions = await prisma.bonusQuestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { answers: true } } },
  })
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { question, type, stage, options, points, status } = await req.json()
  const opts = options.split('\n').map((o: string) => o.trim()).filter(Boolean)
  const q = await prisma.bonusQuestion.create({
    data: { question, type, stage, options: JSON.stringify(opts), points: +points, status },
  })
  return NextResponse.json(q)
}

export async function PUT(req: NextRequest) {
  await requireAdmin()
  const { id, question, type, stage, options, points, status } = await req.json()
  const opts = options.split('\n').map((o: string) => o.trim()).filter(Boolean)
  const q = await prisma.bonusQuestion.update({
    where: { id },
    data: { question, type, stage, options: JSON.stringify(opts), points: +points, status },
  })
  return NextResponse.json(q)
}

export async function PATCH(req: NextRequest) {
  await requireAdmin()
  const { id, action, answer } = await req.json()

  if (action === 'set_answer') {
    // Update question as answered
    await prisma.bonusQuestion.update({
      where: { id },
      data: { correctAnswer: answer, status: 'answered' },
    })

    // Award points to all users who gave the correct answer
    const q = await prisma.bonusQuestion.findUnique({ where: { id } })
    if (q) {
      const correct = await prisma.bonusAnswer.findMany({
        where: { questionId: id, answer },
      })
      for (const a of correct) {
        await prisma.bonusAnswer.update({ where: { id: a.id }, data: { points: q.points } })
      }
    }
    return NextResponse.json({ ok: true, awarded: 0 })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { id } = await req.json()
  await prisma.bonusQuestion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
