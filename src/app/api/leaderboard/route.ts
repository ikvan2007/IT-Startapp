import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 60

export async function GET() {
  try {
    const cacheKey = 'leaderboard:global'
    const cached = await cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })

    const users = await prisma.user.findMany({
      select: { id: true, name: true, xp: true, level: true, avatar: true },
      orderBy: { xp: 'desc' },
      take: 50,
    })
    const result = users.map((u, i) => ({ rank: i + 1, ...u }))
    await cacheSet(cacheKey, result, CACHE_TTL)
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } })
  } catch (e) {
    console.error('[GET /api/leaderboard]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
