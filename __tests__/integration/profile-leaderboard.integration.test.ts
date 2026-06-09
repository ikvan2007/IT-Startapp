/**
 * @jest-environment node
 */
// __tests__/integration/profile-leaderboard.integration.test.ts

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
  COOKIE_NAME: 'session',
}))

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { GET as getProfile } from '@/app/api/profile/route'
import { GET as getLeaderboard } from '@/app/api/leaderboard/route'

const mockFullUser = {
  id: 1,
  email: 'student@edu.ru',
  name: 'Иван',
  avatar: null,
  role: 'student',
  xp: 150,
  level: 2,
  badges: [{ badge: { id: 1, name: 'Новичок', description: '10 XP', icon: '🌱', xpThreshold: 10 }, awardedAt: new Date() }],
  lessonProgress: [
    {
      lessonId: 1,
      completedAt: new Date(),
      lesson: { title: 'Натуральные числа', course: { title: 'Математика' } },
    },
  ],
}

describe('GET /api/profile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('401 — без авторизации', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const res = await getProfile()
    expect(res.status).toBe(401)
  })

  it('200 — профиль авторизованного пользователя', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'student@edu.ru', role: 'student' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockFullUser)

    const res = await getProfile()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.email).toBe('student@edu.ru')
    expect(data.xp).toBe(150)
    expect(data.level).toBe(2)
    expect(data.xpToNextLevel).toBe(50)
    expect(Array.isArray(data.badges)).toBe(true)
    expect(Array.isArray(data.recentLessons)).toBe(true)
  })

  it('нет поля passwordHash в ответе', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'student@edu.ru', role: 'student' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockFullUser)

    const res = await getProfile()
    const data = await res.json()

    expect(data).not.toHaveProperty('passwordHash')
  })

  it('404 — пользователь не найден в БД', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 999, email: 'ghost@edu.ru', role: 'student' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await getProfile()
    expect(res.status).toBe(404)
  })
})

describe('GET /api/leaderboard', () => {
  const mockLeaders = [
    { id: 2, name: 'Топ Студент', xp: 500, level: 6, avatar: null },
    { id: 1, name: 'Иван', xp: 150, level: 2, avatar: null },
  ]

  beforeEach(() => jest.clearAllMocks())

  it('200 — публичный эндпоинт', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await getLeaderboard()
    expect(res.status).toBe(200)
  })

  it('содержит rank, отсортированный по убыванию XP', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await getLeaderboard()
    const data = await res.json()

    expect(data[0].rank).toBe(1)
    expect(data[0].xp).toBe(500)
    expect(data[1].rank).toBe(2)
    expect(data[1].xp).toBe(150)
  })

  it('не содержит passwordHash', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await getLeaderboard()
    const [first] = await res.json()
    expect(first).not.toHaveProperty('passwordHash')
  })
})
