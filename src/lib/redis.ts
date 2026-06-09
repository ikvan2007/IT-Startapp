/**
 * Redis client — единственный инстанс для всего приложения.
 * Если REDIS_URL не задан или Redis недоступен — все операции
 * падают тихо (no-op), чтобы приложение работало без Redis.
 */
import Redis from "ioredis";

type RedisClient = Redis | null;

const globalForRedis = globalThis as unknown as { redis: RedisClient };

function createRedisClient(): RedisClient {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL не задан — кэш и очередь отключены");
    return null;
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  client.on("error", (err) => {
    console.error("[Redis] Ошибка подключения:", err.message);
  });
  return client;
}

export const redis: RedisClient =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// ─── Вспомогательные функции ────────────────────────────────────────────────

/** Получить значение из кэша. Возвращает null если Redis недоступен. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

/** Сохранить значение в кэш с TTL (секунды). */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // silent fail
  }
}

/** Инвалидировать один ключ или паттерн (SCAN + DEL). */
export async function cacheDelete(keyOrPattern: string): Promise<void> {
  if (!redis) return;
  try {
    if (keyOrPattern.includes("*")) {
      let cursor = "0";
      do {
        const [next, keys] = await redis.scan(
          cursor,
          "MATCH",
          keyOrPattern,
          "COUNT",
          100
        );
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== "0");
    } else {
      await redis.del(keyOrPattern);
    }
  } catch {
    // silent fail
  }
}

// ─── Rate-limit helper ───────────────────────────────────────────────────────

/**
 * Атомарный инкремент счётчика с TTL.
 * Возвращает { count, limited }.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ count: number; limited: boolean }> {
  if (!redis) return { count: 0, limited: false };
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return { count, limited: count > maxRequests };
  } catch {
    return { count: 0, limited: false };
  }
}
