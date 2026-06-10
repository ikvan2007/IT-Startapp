// src/app/api/courses/[id]/route.ts — с Redis кэшем
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getSession } from '@/lib/auth'

const CACHE_TTL = 60

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    const courseId = params.id
    const cacheKey = `course:${courseId}`
    const cached = await cacheGet(cacheKey)
    if (cached && !session) {
      return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { orderBy: { order: 'asc' } } },
    })
    if (!course) return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })

    if (!session) await cacheSet(cacheKey, course, CACHE_TTL)
    return NextResponse.json(course, { headers: { 'X-Cache': 'MISS' } })
  } catch (e) {
    console.error('[GET /api/courses/[id]]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
