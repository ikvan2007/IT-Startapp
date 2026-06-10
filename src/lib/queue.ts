/**
 * Фоновая очередь задач на базе Bull (Redis).
 *
 * Аналог Celery для Node.js стека.
 * Воркер запускается в отдельном процессе: `node src/workers/queue-worker.mjs`
 *
 * Поддерживаемые задачи:
 *   - xp-update        : обновление XP + уровня пользователя
 *   - badge-check      : проверка и выдача бейджей
 *   - leaderboard-sync : сброс кэша лидерборда
 */

import Bull from "bull";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ─── Типы задач ─────────────────────────────────────────────────────────────

export interface XpUpdateJob {
  userId: string;
  xpDelta: number;
}

export interface BadgeCheckJob {
  userId: string;
  currentXp: number;
}

export interface LeaderboardSyncJob {
  courseId?: string; // undefined = все курсы
}

// ─── Определение очередей ───────────────────────────────────────────────────

const queueOpts: Bull.QueueOptions = {
  redis: REDIS_URL as string,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100, // хранить последние 100 выполненных
    removeOnFail: 50,
  },
};

// Ленивая инициализация — создаём только если Redis доступен
let _xpQueue: Bull.Queue<XpUpdateJob> | null = null;
let _badgeQueue: Bull.Queue<BadgeCheckJob> | null = null;
let _leaderboardQueue: Bull.Queue<LeaderboardSyncJob> | null = null;

function getXpQueue() {
  if (!process.env.REDIS_URL) return null;
  _xpQueue ??= new Bull<XpUpdateJob>("xp-update", queueOpts);
  return _xpQueue;
}

function getBadgeQueue() {
  if (!process.env.REDIS_URL) return null;
  _badgeQueue ??= new Bull<BadgeCheckJob>("badge-check", queueOpts);
  return _badgeQueue;
}

function getLeaderboardQueue() {
  if (!process.env.REDIS_URL) return null;
  _leaderboardQueue ??= new Bull<LeaderboardSyncJob>(
    "leaderboard-sync",
    queueOpts
  );
  return _leaderboardQueue;
}

// ─── Публичный API — добавление задач ───────────────────────────────────────

/** Поставить задачу обновления XP в очередь */
export async function enqueueXpUpdate(data: XpUpdateJob) {
  const q = getXpQueue();
  if (!q) return;
  await q.add(data, { priority: 2 });
}

/** Поставить задачу проверки бейджей в очередь */
export async function enqueueBadgeCheck(data: BadgeCheckJob) {
  const q = getBadgeQueue();
  if (!q) return;
  await q.add(data, { priority: 3, delay: 500 }); // небольшая задержка
}

/** Поставить задачу сброса кэша лидерборда */
export async function enqueueLeaderboardSync(data: LeaderboardSyncJob = {}) {
  const q = getLeaderboardQueue();
  if (!q) return;
  // deduplicate: не добавляем если уже есть аналогичная задача в очереди
  await q.add(data, {
    jobId: `leaderboard-${data.courseId ?? "all"}`,
    priority: 4,
  });
}

// ─── Экспорт очередей для воркера ───────────────────────────────────────────

export { getXpQueue, getBadgeQueue, getLeaderboardQueue };
