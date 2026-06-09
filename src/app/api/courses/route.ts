import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_KEY = "courses:all";
const CACHE_TTL = 60; // 60 секунд

export async function GET() {
  // ── 1. Пробуем кэш ─────────────────────────────────────────────────────
  const cached = await cacheGet(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // ── 2. Запрос к БД — без N+1: один запрос с include ────────────────────
  // Было: prisma.course.findMany({ include: { lessons: ... } })
  // Уже правильно — Prisma делает JOIN, а не N запросов.
  // Дополнительно: убираем тяжёлый контент урока из списка курсов.
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          xpReward: true,
          videoUrl: true,
          // НЕ включаем content — он не нужен в списке курсов (экономим трафик)
        },
      },
    },
  });

  // ── 3. Сохраняем в кэш ─────────────────────────────────────────────────
  await cacheSet(CACHE_KEY, courses, CACHE_TTL);

  return NextResponse.json(courses, {
    headers: { "X-Cache": "MISS" },
  });
}
