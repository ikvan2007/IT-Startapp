/**
 * Воркер очереди задач — запускается отдельным процессом.
 *
 * Запуск (вне Docker):
 *   REDIS_URL=redis://localhost:6379 DATABASE_URL=file:./prisma/dev.db \
 *   node --env-file=.env src/workers/queue-worker.mjs
 *
 * В Docker: добавьте сервис `worker` в docker-compose.yml (пример ниже).
 *
 * docker-compose фрагмент:
 * ─────────────────────────
 *   worker:
 *     build:
 *       context: .
 *       dockerfile: Dockerfile
 *       target: runner
 *     command: node src/workers/queue-worker.mjs
 *     environment:
 *       REDIS_URL: redis://redis:6379
 *       DATABASE_URL: file:/app/prisma/dev.db
 *     depends_on:
 *       - redis
 *     restart: unless-stopped
 */

import { PrismaClient } from "@prisma/client";
import Bull from "bull";
import { cacheDelete } from "../lib/redis.js";

const prisma = new PrismaClient();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const queueOpts = {
  redis: REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

// ─── XP Update ──────────────────────────────────────────────────────────────

const xpQueue = new Bull("xp-update", queueOpts);

xpQueue.process(async (job) => {
  const { userId, xpDelta } = job.data;
  console.log(`[worker] xp-update userId=${userId} delta=${xpDelta}`);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xpDelta } },
    select: { xp: true },
  });

  const newLevel = Math.min(99, Math.floor(user.xp / 100) + 1);
  await prisma.user.update({
    where: { id: userId },
    data: { level: newLevel },
  });

  // Инвалидируем кэш профиля
  await cacheDelete(`user:${userId}`);
  console.log(`[worker] xp-update done userId=${userId} xp=${user.xp} level=${newLevel}`);
});

// ─── Badge Check ─────────────────────────────────────────────────────────────

const badgeQueue = new Bull("badge-check", queueOpts);

badgeQueue.process(async (job) => {
  const { userId, currentXp } = job.data;
  console.log(`[worker] badge-check userId=${userId} xp=${currentXp}`);

  const [badgesToGrant, existingBadges] = await Promise.all([
    prisma.badge.findMany({ where: { xpRequired: { lte: currentXp } } }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
  ]);

  const existingIds = new Set(existingBadges.map((b) => b.badgeId));
  const newBadges = badgesToGrant.filter((b) => !existingIds.has(b.id));

  if (newBadges.length) {
    await prisma.userBadge.createMany({
      data: newBadges.map((b) => ({ userId, badgeId: b.id })),
      skipDuplicates: true,
    });
    console.log(`[worker] badge-check granted ${newBadges.length} badges to ${userId}`);
  }
});

// ─── Leaderboard Sync ────────────────────────────────────────────────────────

const leaderboardQueue = new Bull("leaderboard-sync", queueOpts);

leaderboardQueue.process(async (job) => {
  const { courseId } = job.data;
  console.log(`[worker] leaderboard-sync courseId=${courseId ?? "all"}`);

  if (courseId) {
    await cacheDelete(`leaderboard:${courseId}`);
  } else {
    await cacheDelete("leaderboard:*");
  }
  await cacheDelete("courses:all");
  console.log(`[worker] leaderboard-sync done`);
});

// ─── Глобальная обработка ошибок ─────────────────────────────────────────────

for (const q of [xpQueue, badgeQueue, leaderboardQueue]) {
  q.on("failed", (job, err) => {
    console.error(`[worker] Job ${job.id} in queue "${q.name}" failed:`, err.message);
  });
}

console.log("✅ Queue worker запущен. Ожидаю задачи...");
console.log(`   Redis: ${REDIS_URL}`);
