// src/lib/xp.ts
import { prisma } from './prisma'

export const XP_PER_LEVEL = 100

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL)
}

// Добавить XP пользователю и проверить значки
export async function awardXp(userId: number, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: amount },
      level: { set: calculateLevel((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).xp + amount) },
    },
  })

  // Проверить, какие значки теперь разблокированы
  const eligibleBadges = await prisma.badge.findMany({
    where: { xpThreshold: { lte: user.xp } },
  })

  const newBadges = []
  for (const badge of eligibleBadges) {
    try {
      const created = await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
        include: { badge: true },
      })
      newBadges.push(created.badge)
    } catch {
      // Уже выдан (unique constraint) — игнорируем
    }
  }

  return { user, newBadges }
}
