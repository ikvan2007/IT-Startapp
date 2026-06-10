// GET /api/health — статус БД и Redis
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { status: 'unknown' },
    cache: { status: 'unknown' },
  }

  try {
    const t = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.database = { status: 'ok', latencyMs: Date.now() - t }
  } catch (e) {
    health.database = { status: 'error', error: String(e) }
    health.status = 'degraded'
  }

  try {
    if (!redis) {
      health.cache = { status: 'disabled' }
    } else {
      const t = Date.now()
      await redis.ping()
      health.cache = { status: 'ok', latencyMs: Date.now() - t }
    }
  } catch (e) {
    health.cache = { status: 'error', error: String(e) }
    health.status = 'degraded'
  }

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 })
}
