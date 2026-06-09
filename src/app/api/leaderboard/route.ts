// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, xp: true, level: true, avatar: true },
      orderBy: { xp: 'desc' },
      take: 50,
    })

    return NextResponse.json(
      users.map((u, i) => ({ rank: i + 1, ...u }))
    )
  } catch (e) {
    console.error('[GET /api/leaderboard]', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
