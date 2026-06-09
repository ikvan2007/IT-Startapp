/**
 * @jest-environment node
 */
// __tests__/integration/auth.integration.test.ts

import { NextRequest } from 'next/server'

const mockUser = {
  id: 1,
  email: 'student@edu.ru',
  passwordHash: '$2a$10$mockHashForTesting',
  name: 'Иван Студентов',
  role: 'student',
  xp: 150,
  level: 2,
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function makeRequest(method: string, body: unknown, url = 'http://localhost:3000'): NextRequest {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/login', () => {
  let loginRoute: typeof import('@/app/api/auth/login/route')

  beforeAll(async () => {
    loginRoute = await import('@/app/api/auth/login/route')
  })

  beforeEach(() => jest.clearAllMocks())

  it('200 — успешный вход', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123' })
    const res = await loginRoute.POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user.email).toBe('student@edu.ru')
    expect(data.user.role).toBe('student')
    expect(data.user).not.toHaveProperty('passwordHash')
  })

  it('400 — отсутствует email', async () => {
    const req = makeRequest('POST', { password: 'password123' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 — отсутствует пароль', async () => {
    const req = makeRequest('POST', { email: 'student@edu.ru' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('401 — пользователь не найден', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const req = makeRequest('POST', { email: 'nobody@edu.ru', password: 'pass' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(401)
  })

  it('401 — неверный пароль', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'wrongpass' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(401)
  })

  it('ответ устанавливает httpOnly cookie', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123' })
    const res = await loginRoute.POST(req)

    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('session=')
    expect(setCookie).toContain('HttpOnly')
  })
})

describe('POST /api/auth/register', () => {
  let registerRoute: typeof import('@/app/api/auth/register/route')

  beforeAll(async () => {
    registerRoute = await import('@/app/api/auth/register/route')
  })

  beforeEach(() => jest.clearAllMocks())

  it('201 — успешная регистрация', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      id: 2,
      email: 'new@edu.ru',
      name: 'Новый',
    })

    const req = makeRequest('POST', { email: 'new@edu.ru', password: 'password123', name: 'Новый' })
    const res = await registerRoute.POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.user.email).toBe('new@edu.ru')
  })

  it('400 — неполные данные', async () => {
    const req = makeRequest('POST', { email: 'a@a.ru' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 — некорректный email', async () => {
    const req = makeRequest('POST', { email: 'notanemail', password: 'pass123', name: 'Test' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 — короткий пароль', async () => {
    const req = makeRequest('POST', { email: 'a@b.ru', password: '123', name: 'Test' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('409 — email уже занят', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123', name: 'Дубль' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(409)
  })
})
