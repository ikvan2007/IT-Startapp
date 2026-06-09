/**
 * @jest-environment node
 */
// __tests__/integration/courses.integration.test.ts

import { NextRequest } from 'next/server'

const mockCourses = [
  {
    id: 1,
    title: 'Основы математики',
    description: 'Арифметика для 5 класса',
    subject: 'Математика',
    grade: 5,
    difficulty: 'easy',
    xpReward: 50,
    createdAt: new Date(),
    _count: { lessons: 3 },
  },
  {
    id: 2,
    title: 'Введение в физику',
    description: 'Механика для 7 класса',
    subject: 'Физика',
    grade: 7,
    difficulty: 'medium',
    xpReward: 75,
    createdAt: new Date(),
    _count: { lessons: 2 },
  },
]

jest.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
  createToken: jest.fn(),
  verifyToken: jest.fn(),
  COOKIE_NAME: 'session',
}))

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { GET, POST } from '@/app/api/courses/route'

function makeRequest(method: string, body?: unknown, url = 'http://localhost:3000/api/courses'): NextRequest {
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

describe('GET /api/courses', () => {
  beforeEach(() => jest.clearAllMocks())

  it('200 — возвращает массив курсов', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const req = makeRequest('GET')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('курс содержит обязательные поля', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses)

    const req = makeRequest('GET')
    const res = await GET(req)
    const [course] = await res.json()

    expect(course).toHaveProperty('id')
    expect(course).toHaveProperty('title')
    expect(course).toHaveProperty('subject')
    expect(course).toHaveProperty('grade')
    expect(course).toHaveProperty('difficulty')
    expect(course).toHaveProperty('xpReward')
  })

  it('200 — пустой массив если курсов нет', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue([])

    const req = makeRequest('GET')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })

  it('передаёт фильтр subject в Prisma', async () => {
    ;(prisma.course.findMany as jest.Mock).mockResolvedValue([mockCourses[0]])

    const req = makeRequest('GET', undefined, 'http://localhost:3000/api/courses?subject=Математика')
    await GET(req)

    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subject: 'Математика' }) })
    )
  })
})

describe('POST /api/courses', () => {
  const newCourse = { title: 'Химия', description: 'Базовая химия', subject: 'Химия', grade: 8, difficulty: 'medium' }

  beforeEach(() => jest.clearAllMocks())

  it('401 — без авторизации', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = makeRequest('POST', newCourse)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('403 — студент не может создавать курсы', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 1, email: 'student@edu.ru', role: 'student' })

    const req = makeRequest('POST', newCourse)
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('201 — учитель создаёт курс', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 2, email: 'teacher@edu.ru', role: 'teacher' })
    ;(prisma.course.create as jest.Mock).mockResolvedValue({ ...newCourse, id: 3, xpReward: 50, createdAt: new Date() })

    const req = makeRequest('POST', newCourse)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.title).toBe('Химия')
  })

  it('400 — пропущены обязательные поля', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: 2, email: 'teacher@edu.ru', role: 'teacher' })

    const req = makeRequest('POST', { title: 'Только заголовок' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
