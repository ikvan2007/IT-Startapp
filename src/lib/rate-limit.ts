/**
 * Rate-limit утилита для API роутов Next.js.
 *
 * Использует Redis если доступен; иначе — in-memory Map (для dev/тестов).
 *
 * Пример использования в route.ts:
 *   import { checkRateLimit } from "@/lib/rate-limit";
 *
 *   export async function POST(req: Request) {
 *     const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
 *     const rl = await checkRateLimit(`login:${ip}`, 5, 60);
 *     if (rl.limited) {
 *       return NextResponse.json(
 *         { error: "Слишком много попыток. Попробуйте через минуту." },
 *         {
 *           status: 429,
 *           headers: {
 *             "Retry-After": String(rl.retryAfter),
 *             "X-RateLimit-Limit": String(rl.limit),
 *             "X-RateLimit-Remaining": String(rl.remaining),
 *           },
 *         }
 *       );
 *     }
 *     // ... остальная логика
 *   }
 */

import { rateLimit } from "./redis";

// ─── In-memory fallback (когда Redis недоступен) ─────────────────────────────

interface MemoryEntry {
  count: number;
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { count: number; limited: boolean } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { count: 1, limited: false };
  }

  entry.count += 1;
  return { count: entry.count, limited: entry.count > maxRequests };
}

// Очистка истёкших записей каждые 5 минут
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.expiresAt < now) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ─── Публичный API ───────────────────────────────────────────────────────────

export interface RateLimitResult {
  limited: boolean;
  count: number;
  remaining: number;
  limit: number;
  retryAfter: number; // секунды
}

/**
 * Проверить лимит для ключа (обычно `action:ip`).
 *
 * @param key          Уникальный ключ (например `login:1.2.3.4`)
 * @param maxRequests  Максимум запросов в окне
 * @param windowSeconds Длина окна в секундах
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const rl = process.env.REDIS_URL
    ? await rateLimit(`rl:${key}`, maxRequests, windowSeconds)
    : memoryRateLimit(`rl:${key}`, maxRequests, windowSeconds);

  return {
    limited: rl.limited,
    count: rl.count,
    remaining: Math.max(0, maxRequests - rl.count),
    limit: maxRequests,
    retryAfter: windowSeconds,
  };
}

// ─── Готовые пресеты ─────────────────────────────────────────────────────────

/** 5 попыток входа в минуту с одного IP */
export async function loginRateLimit(ip: string) {
  return checkRateLimit(`login:${ip}`, 5, 60);
}

/** 3 регистрации в час с одного IP */
export async function registerRateLimit(ip: string) {
  return checkRateLimit(`register:${ip}`, 3, 3600);
}

/** 10 попыток входа учителя в минуту с одного IP */
export async function teacherLoginRateLimit(ip: string) {
  return checkRateLimit(`teacher-login:${ip}`, 10, 60);
}
