/**
 * Queue Worker — аналог Celery для Node.js стека.
 * Запуск: node --env-file=.env src/workers/queue-worker.mjs
 *
 * Логи подтверждают выполнение задач (требование к Celery-задаче).
 */

import { PrismaClient } from '@prisma/client'
import Bull from 'bull'
import IORedis from 'ioredis'

const prisma = new PrismaClient()
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// ── Redis для кэша ──────────────────────────────────────────────────────────
const redisClient = new IORedis(REDIS_URL, { maxRetriesPerRequest: 1, enableReadyCheck: false })
redisClient.on('error', (err) => console.error('[redis]', err.message))

async function cacheDelete(keyOrPattern) {
  try {
    if (keyOrPattern.includes('*')) {
      let cursor = '0'
      do {
        const [next, keys] = await redisClient.scan(cursor, 'MATCH', keyOrPattern, 'COUNT', 100)
        cursor = next
        if (keys.length) await redisClient.del(...keys)
      } while (cursor !== '0')
    } else {
      await redisClient.del(keyOrPattern)
    }
  } catch {}
}

const queueOpts = {
  redis: REDIS_URL,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 50 },
}

// ── XP Update ───────────────────────────────────────────────────────────────
const xpQueue = new Bull('xp-update', queueOpts)
xpQueue.process(async (job) => {
  const { userId, xpDelta } = job.data
  console.log(`[worker][xp-update] START userId=${userId} delta=${xpDelta}`)
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xpDelta } },
    select: { xp: true },
  })
  const newLevel = Math.min(99, Math.floor(user.xp / 100) + 1)
  await prisma.user.update({ where: { id: userId }, data: { level: newLevel } })
  await cacheDelete(`user:${userId}`)
  console.log(`[worker][xp-update] DONE userId=${userId} xp=${user.xp} level=${newLevel}`)
})

// ── Badge Check ─────────────────────────────────────────────────────────────
const badgeQueue = new Bull('badge-check', queueOpts)
badgeQueue.process(async (job) => {
  const { userId, currentXp } = job.data
  console.log(`[worker][badge-check] START userId=${userId} xp=${currentXp}`)
  const [badgesToGrant, existingBadges] = await Promise.all([
    prisma.badge.findMany({ where: { xpThreshold: { lte: currentXp } } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ])
  const existingIds = new Set(existingBadges.map((b) => b.badgeId))
  const newBadges = badgesToGrant.filter((b) => !existingIds.has(b.id))
  if (newBadges.length) {
    await prisma.userBadge.createMany({ data: newBadges.map((b) => ({ userId, badgeId: b.id })), skipDuplicates: true })
    console.log(`[worker][badge-check] DONE granted=${newBadges.length} badges to userId=${userId}`)
  } else {
    console.log(`[worker][badge-check] DONE no new badges for userId=${userId}`)
  }
})

// ── Leaderboard Sync ─────────────────────────────────────────────────────────
const leaderboardQueue = new Bull('leaderboard-sync', queueOpts)
leaderboardQueue.process(async (job) => {
  const { courseId } = job.data
  console.log(`[worker][leaderboard-sync] START courseId=${courseId ?? 'all'}`)
  if (courseId) {
    await cacheDelete(`leaderboard:${courseId}`)
  } else {
    await cacheDelete('leaderboard:*')
  }
  await cacheDelete('courses:*')
  console.log(`[worker][leaderboard-sync] DONE`)
})

// ── Global error handler ─────────────────────────────────────────────────────
for (const q of [xpQueue, badgeQueue, leaderboardQueue]) {
  q.on('failed', (job, err) => {
    console.error(`[worker][${q.name}] FAILED job=${job.id}: ${err.message}`)
  })
  q.on('completed', (job) => {
    console.log(`[worker][${q.name}] COMPLETED job=${job.id}`)
  })
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[worker] ${signal} — завершаем воркер...`)
  await Promise.all([xpQueue.close(), badgeQueue.close(), leaderboardQueue.close()])
  await prisma.$disconnect()
  await redisClient.quit()
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

console.log('✅ Queue Worker запущен')
console.log(`   Redis: ${REDIS_URL}`)
console.log('   Очереди: xp-update, badge-check, leaderboard-sync')
