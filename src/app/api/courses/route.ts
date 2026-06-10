import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redis } from '@/lib/redis'

const CACHE_TTL = 60

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject') || undefined
    const grade = searchParams.get('grade') ? Number(searchParams.get('grade')) : undefined
    const difficulty = searchParams.get('difficulty') || undefined

    const cacheKey = `cache:courses:${JSON.stringify({
      subject: subject ?? null,
      grade: grade ?? null,
      difficulty: difficulty ?? null,
    })}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const courses = await prisma.course.findMany({
      where: {
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(difficulty && { difficulty }),
      },
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    await redis.set(cacheKey, JSON.stringify(courses), 'EX', CACHE_TTL)

    return NextResponse.json(courses, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (e) {
    console.error('[GET /api/courses]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/courses — создать курс (только teacher)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    if (session.role !== 'teacher') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })

    const body = await req.json()
    const { title, description, subject, grade, difficulty, xpReward } = body

    if (!title || !description || !subject || !grade || !difficulty) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: { title, description, subject, grade: Number(grade), difficulty, xpReward: xpReward ?? 50 },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (e) {
    console.error('[POST /api/courses]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
