#!/usr/bin/env node
// src/workers/queue-worker.mjs
//
// Bull-воркер для фоновых задач
// Запуск: node src/workers/queue-worker.mjs
//
// Очереди:
//   xp-awards   — начисление XP (дублирующий путь через очередь)
//   notifications — уведомления (заглушка)

import Bull from 'bull'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

console.log('🚀 Study Task — Queue Worker запускается...')
console.log(`   Redis: ${REDIS_URL}`)

// ── XP Award Queue ───────────────────────────────────────────────────────
const xpQueue = new Bull('xp-awards', REDIS_URL)

xpQueue.process(async (job) => {
  const { userId, amount, lessonId } = job.data
  console.log(`[xp-awards] userId=${userId} +${amount} XP (lesson ${lessonId})`)
  // Логика начисления XP уже выполнена в API, здесь можно:
  // - отправить push-уведомление
  // - обновить стрик
  // - пересчитать рейтинг
  return { ok: true }
})

xpQueue.on('completed', (job, result) => {
  console.log(`[xp-awards] ✅ job ${job.id} completed`)
})

xpQueue.on('failed', (job, err) => {
  console.error(`[xp-awards] ❌ job ${job.id} failed:`, err.message)
})

// ── Notifications Queue ──────────────────────────────────────────────────
const notifQueue = new Bull('notifications', REDIS_URL)

notifQueue.process(async (job) => {
  const { userId, type, payload } = job.data
  console.log(`[notifications] userId=${userId} type=${type}`, payload)
  // TODO: email / push notification
  return { sent: true }
})

notifQueue.on('failed', (job, err) => {
  console.error(`[notifications] ❌ job ${job.id} failed:`, err.message)
})

// ── Graceful shutdown ────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n📴 ${signal} — завершаем воркер...`)
  await xpQueue.close()
  await notifQueue.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

console.log('✅ Воркер запущен. Ожидаем задачи...')
