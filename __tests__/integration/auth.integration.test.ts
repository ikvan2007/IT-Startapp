// __tests__/integration/auth.integration.test.ts
import { NextRequest } from 'next/server'

const mockUser = {
  id: 'cluser123abc',
  email: 'student@edu.ru',
  password: '$2a$10$mockHashForTesting',
  name: 'Ivan',
  role: 'student',
  xp: 150,
  level: 2,
  avatar: null,
}

jest.mock('@/lib/db', () => ({
  prisma: { user: { findUnique: jest.fn(), create: jest.fn() } },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })),
}))

jest.mock('@/lib/redis', () => ({
  rateLimit: jest.fn().mockResolvedValue({ count: 1, limited: false }),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDelete: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/db'

function makeRequest(method: string, body: unknown, url = 'http://localhost:3000'): NextRequest {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
  })
}

describe('POST /api/auth/login', () => {
  let loginRoute: typeof import('@/app/api/auth/login/route')

  beforeAll(async () => { loginRoute = await import('@/app/api/auth/login/route') })

  beforeEach(() => {
    jest.clearAllMocks()
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 1, limited: false })
  })

  it('200 - uspeshnyy vkhod', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never)
    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123' })
    const res = await loginRoute.POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.user.email).toBe('student@edu.ru')
    expect(data.user.role).toBe('student')
    expect(data.user).not.toHaveProperty('password')
  })

  it('400 - net email', async () => {
    const req = makeRequest('POST', { password: 'password123' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 - net parolya', async () => {
    const req = makeRequest('POST', { email: 'student@edu.ru' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('401 - polzovatel ne nayden', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const req = makeRequest('POST', { email: 'nobody@edu.ru', password: 'pass' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(401)
  })

  it('401 - nevernyi parol', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false as never)
    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'wrongpass' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(401)
  })

  it('429 - rate limit prevyshen', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 6, limited: true })
    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123' })
    const res = await loginRoute.POST(req)
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBeTruthy()
  })
})

describe('POST /api/auth/register', () => {
  let registerRoute: typeof import('@/app/api/auth/register/route')

  beforeAll(async () => { registerRoute = await import('@/app/api/auth/register/route') })

  beforeEach(() => {
    jest.clearAllMocks()
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 1, limited: false })
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any)
  })

  it('200 - uspeshnaya registratsiya', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    jest.spyOn(require('bcryptjs'), 'hash').mockResolvedValue('hashedpassword' as never)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'clnew456', email: 'new@edu.ru', name: 'Novyi', xp: 0, level: 1 })
    const req = makeRequest('POST', { email: 'new@edu.ru', password: 'password123', name: 'Novyi', captchaToken: 'valid-token' })
    const res = await registerRoute.POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.user.email).toBe('new@edu.ru')
  })

  it('400 - kapcha ne peredana', async () => {
    const req = makeRequest('POST', { email: 'new@edu.ru', password: 'password123', name: 'Novyi' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 - kapcha ne proshla proverku', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ success: false }) })
    const req = makeRequest('POST', { email: 'new@edu.ru', password: 'password123', name: 'Novyi', captchaToken: 'invalid-token' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 - nepolnye dannye', async () => {
    const req = makeRequest('POST', { email: 'a@a.ru', captchaToken: 'valid-token' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('400 - email uzhe zanyat', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const req = makeRequest('POST', { email: 'student@edu.ru', password: 'password123', name: 'Dubl', captchaToken: 'valid-token' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(400)
  })

  it('429 - rate limit prevyshen', async () => {
    const { rateLimit } = require('@/lib/redis')
    ;(rateLimit as jest.Mock).mockResolvedValue({ count: 4, limited: true })
    const req = makeRequest('POST', { email: 'x@edu.ru', password: 'password123', name: 'X', captchaToken: 'valid-token' })
    const res = await registerRoute.POST(req)
    expect(res.status).toBe(429)
  })
})
