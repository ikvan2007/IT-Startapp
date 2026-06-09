// src/app/api/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = Number(params.id)
    if (isNaN(courseId)) return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })

    const session = await getSession()

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            ...(session
              ? {
                  progress: {
                    where: { userId: session.userId },
                    select: { completed: true, completedAt: true },
                  },
                }
              : {}),
            _count: { select: { questions: true } },
          },
        },
      },
    })

    if (!course) return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })

    return NextResponse.json(course)
  } catch (e) {
    console.error('[GET /api/courses/[id]]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    if (session.role !== 'teacher') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })

    const courseId = Number(params.id)
    await prisma.course.delete({ where: { id: courseId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/courses/[id]]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
