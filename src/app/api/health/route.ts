// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

const prisma = new PrismaClient()

const redis = new Redis(process.env.REDIS_URL!, {
  // Upstash обычно работает по TLS через rediss://
  tls: {},
})

export async function GET() {
  const result = {
    status: 'ok',
    db: 'unknown' as 'up' | 'down' | 'unknown',
    cache: 'unknown' as 'up' | 'down' | 'unknown',
  }

  // Проверка БД (SQLite через Prisma)
  try {
    await prisma.$queryRaw`SELECT 1`
    result.db = 'up'
  } catch (e) {
    result.db = 'down'
  }

  // Проверка Redis (Upstash)
  try {
    const pong = await redis.ping()
    if (pong === 'PONG') {
      result.cache = 'up'
    } else {
      result.cache = 'down'
    }
  } catch (e) {
    result.cache = 'down'
  }

  const ok = result.db === 'up' && result.cache === 'up'

  return NextResponse.json(result, { status: ok ? 200 : 500 })
}