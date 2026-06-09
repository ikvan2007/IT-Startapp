// __tests__/integration/courses.integration.test.ts
//
// Integration-тесты для /api/courses
// Адаптированы под наш проект: Redis-кэш мокируется, id=string
//
// Запуск: npx jest __tests__/integration/courses.integration.test.ts

import { NextRequest } from 'next/server'

const mockCourses = [
  {
    id: 'clcourse1',
    title: 'Основы математики',
    description: 'Арифметика для 5 класса',
    category: 'Математика',
    subject: 'Математика',
    grade: 5,
    difficulty: 'beginner',
    xpReward: 50,
    cost: 0,
    durationHours: null,
    createdAt: new Date(),
    lessons: [
      { id: 'lsn1', title: 'Натуральные числа', order: 1, xpReward: 10, videoUrl: null },
    ],
  },
  {
    id: 'clcourse2',
    title: 'Введение в физику',
    description: 'Механика для 7 класса',
    category: 'Физика',
    subject: 'Физика',
    grade: 7,
    difficulty: 'intermediate',
    xpReward: 75,
    cost: 0,
    durationHours: 4,
    createdAt: new Date(),
    lessons: [],
  },
]

// ── Моки ─────────────────────────────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
}))

// Мокируем Redis — в тестах всегда MISS
jest.mock('@/lib/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDelete: jest.fn().mockResolvedValue(undefined),
  rateLimit: jest.fn().mockResolvedValue({ count: 1, limited: false }),
}))

import { prisma } from '@/lib/db'

function makeRequest(url = 'http://localhost:3000/api/courses'): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

// ── GET /api/courses ──────────────────────────────────────────────────────
describe('GET /api/courses', () => {
  let coursesRoute: typeof import('@/app/api/courses/route')

  beforeAll(async () => {
    coursesRoute = await import('@/app/api/courses/route')
  })

  beforeEach(() => jest.clearAllMocks())

  it('200 — возвращает массив курсов', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const res = await coursesRoute.GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('курс содержит обязательные поля', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const res = await coursesRoute.GET()
    const [course] = await res.json()

    expect(course).toHaveProperty('id')
    expect(course).toHaveProperty('title')
    expect(course).toHaveProperty('category')
    expect(course).toHaveProperty('difficulty')
    expect(course).toHaveProperty('xpReward')
    expect(course).toHaveProperty('lessons')
  })

  it('200 — пустой массив если курсов нет', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue([])

    const res = await coursesRoute.GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })

  it('ответ содержит заголовок X-Cache: MISS при промахе кэша', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const res = await coursesRoute.GET()
    expect(res.headers.get('x-cache')).toBe('MISS')
  })

  it('ответ содержит заголовок X-Cache: HIT при попадании в кэш', async () => {
    const { cacheGet } = require('@/lib/redis')
    ;(cacheGet as jest.Mock).mockResolvedValue(mockCourses)

    const res = await coursesRoute.GET()
    expect(res.headers.get('x-cache')).toBe('HIT')
    // Prisma не должна была вызываться
    expect(prisma.course.findMany).not.toHaveBeenCalled()
  })
})
