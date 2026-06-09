import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheDelete } from "@/lib/redis";
import {
  enqueueXpUpdate,
  enqueueBadgeCheck,
  enqueueLeaderboardSync,
} from "@/lib/queue";

const PROGRESS_TTL = 30; // 30 секунд

export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Кэш прогресса пользователя ─────────────────────────────────────────
  const cacheKey = `progress:${user.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // ── Исправлен N+1: select только нужные поля урока ─────────────────────
  // Старый код: include: { lesson: true } — тянул ВСЕ поля включая content
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      lessonId: true,
      completed: true,
      completedAt: true,
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
          xpReward: true,
          courseId: true,
        },
      },
    },
  });

  await cacheSet(cacheKey, progress, PROGRESS_TTL);
  return NextResponse.json(progress, { headers: { "X-Cache": "MISS" } });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await req.json();
  if (!lessonId)
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, xpReward: true, courseId: true },
  });
  if (!lesson)
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // ── Транзакция: только прогресс, XP вынесен в очередь ──────────────────
  const [progress, alreadyCompleted] = await prisma.$transaction(async (tx) => {
    const existing = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      select: { completed: true },
    });
    const wasCompleted = existing?.completed ?? false;

    const prog = await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: {
        userId: user.id,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      update: { completed: true, completedAt: new Date() },
    });

    return [prog, wasCompleted];
  });

  // ── Фоновые задачи (Celery-аналог через Bull) ───────────────────────────
  if (!alreadyCompleted) {
    // 1. Обновить XP в фоне
    await enqueueXpUpdate({ userId: user.id, xpDelta: lesson.xpReward });

    // 2. Проверить бейджи в фоне (с небольшой задержкой, чтобы XP уже обновился)
    const currentXp = (
      await prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true },
      })
    )?.xp ?? 0;
    await enqueueBadgeCheck({ userId: user.id, currentXp: currentXp + lesson.xpReward });

    // 3. Сбросить кэш лидерборда для этого курса
    await enqueueLeaderboardSync({ courseId: lesson.courseId });
  }

  // ── Инвалидируем кэш прогресса пользователя ────────────────────────────
  await cacheDelete(`progress:${user.id}`);

  // ── Быстрый ответ (не ждём обновления XP) ──────────────────────────────
  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { xp: true, level: true },
  });

  return NextResponse.json({
    progress,
    xp: freshUser?.xp ?? 0,
    level: freshUser?.level ?? 1,
    xpGained: alreadyCompleted ? 0 : lesson.xpReward,
  });
}
