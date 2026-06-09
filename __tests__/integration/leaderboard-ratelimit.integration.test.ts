// __tests__/integration/leaderboard-ratelimit.integration.test.ts
//
// Integration-тесты для:
//   - GET /api/leaderboard (публичный)
//   - Rate limiting (429 при превышении лимита)
//
// Запуск: npx jest __tests__/integration/leaderboard-ratelimit.integration.test.ts

import { NextRequest } from 'next/server'

// ── Моки ─────────────────────────────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findMany: jest.fn(), findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    lessonProgress: {
      groupBy: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
}))

jest.mock('@/lib/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDelete: jest.fn().mockResolvedValue(undefined),
  rateLimit: jest.fn().mockResolvedValue({ count: 1, limited: false }),
}))

import { prisma } from '@/lib/db'

const mockLeaders = [
  { id: 'user2', name: 'Топ Студент', xp: 500, level: 6, avatar: null },
  { id: 'user1', name: 'Иван', xp: 150, level: 2, avatar: null },
]

// ── GET /api/leaderboard ──────────────────────────────────────────────────
describe('GET /api/leaderboard', () => {
  let leaderboardRoute: typeof import('@/app/api/leaderboard/route')

  beforeAll(async () => {
    leaderboardRoute = await import('@/app/api/leaderboard/route')
  })

  beforeEach(() => jest.clearAllMocks())

  it('200 — публичный эндпоинт, не требует авторизации', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await leaderboardRoute.GET()
    expect(res.status).toBe(200)
  })

  it('возвращает пользователей отсортированных по XP', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await leaderboardRoute.GET()
    const data = await res.json()

    expect(Array.isArray(data)).toBe(true)
    expect(data[0].xp).toBeGreaterThanOrEqual(data[1].xp)
  })

  it('не содержит поле password в ответе', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await leaderboardRoute.GET()
    const [first] = await res.json()

    expect(first).not.toHaveProperty('password')
    expect(first).not.toHaveProperty('passwordHash')
  })

  it('содержит поля id, name, xp, level', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaders)

    const res = await leaderboardRoute.GET()
    const [first] = await res.json()

    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('xp')
    expect(first).toHaveProperty('level')
  })
})

// ── Rate Limiting ─────────────────────────────────────────────────────────
describe('Rate Limiting — /api/auth/login', () => {
  let loginRoute: typeof import('@/app/api/auth/login/route')

  beforeAll(async () => {
    loginRoute = await import('@/app/api/auth/login/route')
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Возвращаем к дефолту
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 1, limited: false })
  })

  function makeLoginRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
    })
  }

  it('429 — возвращается при превышении лимита', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 6, limited: true })

    const req = makeLoginRequest({ email: 'test@test.ru', password: '123' })
    const res = await loginRoute.POST(req)

    expect(res.status).toBe(429)
  })

  it('429 — содержит заголовок Retry-After', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 6, limited: true })

    const req = makeLoginRequest({ email: 'test@test.ru', password: '123' })
    const res = await loginRoute.POST(req)

    expect(res.headers.get('retry-after')).not.toBeNull()
  })

  it('429 — содержит X-RateLimit-Limit', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 6, limited: true })

    const req = makeLoginRequest({ email: 'test@test.ru', password: '123' })
    const res = await loginRoute.POST(req)

    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull()
  })

  it('200 — при лимите не превышен запрос проходит', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 1, limited: false })
    ;(prisma.user.findMany as jest.Mock) // unused here
    const { prisma: db } = require('@/lib/db')
    ;(db.user.findUnique as jest.Mock).mockResolvedValue(null)

    const req = makeLoginRequest({ email: 'test@test.ru', password: 'badpass' })
    const res = await loginRoute.POST(req)

    // 401 (неверный пароль) — но не 429
    expect(res.status).not.toBe(429)
  })
})

