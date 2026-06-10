// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { xpToNextLevel } from '@/lib/xp'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        badges: { include: { badge: true }, orderBy: { awardedAt: 'desc' } },
        lessonProgress: {
          where: { completed: true },
          include: { lesson: { include: { course: { select: { title: true } } } } },
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      xp: user.xp,
      level: user.level,
      xpToNextLevel: xpToNextLevel(user.xp),
      badges: user.badges.map((ub) => ub.badge),
      recentLessons: user.lessonProgress.map((p) => ({
        lessonId: p.lessonId,
        lessonTitle: p.lesson.title,
        courseTitle: p.lesson.course.title,
        completedAt: p.completedAt,
      })),
    })
  } catch (e) {
    console.error('[GET /api/profile]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
