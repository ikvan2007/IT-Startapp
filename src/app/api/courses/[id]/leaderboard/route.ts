import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_TTL = 120; // 2 минуты

/**
 * Лидерборд курса — кэшируется в Redis.
 *
 * Исправлен N+1: вместо include { user } для каждой записи прогресса
 * используем один агрегированный запрос через groupBy + отдельный
 * запрос пользователей по id.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;

  // ── Кэш ────────────────────────────────────────────────────────────────
  const cacheKey = `leaderboard:${courseId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // ── Проверяем курс ──────────────────────────────────────────────────────
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, lessons: { select: { id: true } } },
  });
  if (!course)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lessonIds = course.lessons.map((l) => l.id);
  const totalLessons = lessonIds.length;

  // ── Исправлен N+1: агрегация + одиночный запрос пользователей ──────────
  // Старый код: prisma.lessonProgress.findMany({ include: { user: ... } })
  // Это создавало N+1: для каждой записи прогресса шёл запрос user.
  //
  // Новый код:
  //   1. groupBy userId — одним SQL запросом считаем кол-во завершённых уроков
  //   2. один запрос user.findMany({ where: { id: { in: [...] } } })
  //   3. join в памяти

  const [grouped, users] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { lessonId: { in: lessonIds }, completed: true },
      _count: { lessonId: true },
      orderBy: { _count: { lessonId: "desc" } },
      take: 20,
    }),
    // Пустой массив lessonIds — курс без уроков
    lessonIds.length === 0
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: {
            progress: {
              some: { lessonId: { in: lessonIds }, completed: true },
            },
          },
          select: { id: true, name: true },
          take: 20,
        }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const list = grouped.map((g) => ({
    userId: g.userId,
    name: userMap.get(g.userId) ?? "Пользователь",
    completed: g._count.lessonId,
    totalLessons,
  }));

  await cacheSet(cacheKey, list, CACHE_TTL);

  return NextResponse.json(list, { headers: { "X-Cache": "MISS" } });
}
