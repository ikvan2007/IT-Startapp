import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
        },
        lessonProgress: {
          where: { completed: true },
          include: {
            lesson: {
              include: {
                course: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      xp: user.xp,
      level: user.level,
      xpToNextLevel: 100 - (user.xp % 100),
      badges: user.badges.map(ub => ub.badge),
      recentLessons: user.lessonProgress.map(p => ({
        id: p.id,
        completedAt: p.completedAt,
        lesson: p.lesson,
      })),
    })
  } catch (e) {
    console.error('[GET /api/profile]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, avatar } = await req.json()
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name && { name }),
        avatar: avatar ?? null,
      },
      select: {
        id: true, name: true, email: true,
        avatar: true, xp: true, level: true, role: true,
      },
    })
    return NextResponse.json(user)
  } catch (e) {
    console.error('[PATCH /api/profile]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
