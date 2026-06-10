import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const CACHE_TTL = 60
const CACHE_KEY = 'cache:leaderboard:top50'

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY)

    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, xp: true, level: true, avatar: true },
      orderBy: { xp: 'desc' },
      take: 50,
    })

    const result = users.map((u, i) => ({ rank: i + 1, ...u }))

    await redis.set(CACHE_KEY, JSON.stringify(result), 'EX', CACHE_TTL)

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (e) {
    console.error('[GET /api/leaderboard]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}