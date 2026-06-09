// src/app/api/lessons/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { awardXp } from '@/lib/xp'

// POST /api/lessons/:id/complete — отметить урок как пройденный и начислить XP
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const lessonId = Number(params.id)
    if (isNaN(lessonId)) return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) return NextResponse.json({ error: 'Урок не найден' }, { status: 404 })

    // Проверить, не пройден ли уже
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
    })
    if (existing?.completed) {
      return NextResponse.json({ message: 'Урок уже пройден', alreadyCompleted: true })
    }

    // Создать или обновить прогресс
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: session.userId, lessonId, completed: true, completedAt: new Date() },
    })

    // Начислить XP и проверить значки
    const { user, newBadges } = await awardXp(session.userId, lesson.xpReward)

    return NextResponse.json({
      ok: true,
      xpAwarded: lesson.xpReward,
      totalXp: user.xp,
      level: user.level,
      newBadges,
    })
  } catch (e) {
    console.error('[POST /api/lessons/[id]/complete]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
