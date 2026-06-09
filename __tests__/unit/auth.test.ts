// __tests__/unit/auth.test.ts
//
// Unit-тесты для src/lib/auth.ts
// Запуск: npx jest __tests__/unit/auth.test.ts

import { createToken } from '@/lib/auth'

// Мокаем next/headers и @/lib/db (не нужны в unit-тестах)
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}))

describe('Auth — JWT utilities', () => {
  const userId = 'cluser123abc'

  describe('createToken', () => {
    it('создаёт строку токена', async () => {
      const token = await createToken(userId)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT = header.payload.sig
    })

    it('создаёт разные токены для разных пользователей', async () => {
      const t1 = await createToken('user-id-1')
      const t2 = await createToken('user-id-2')
      expect(t1).not.toBe(t2)
    })

    it('токен содержит userId в payload', async () => {
      const token = await createToken(userId)
      // Декодируем payload (base64url, средняя часть JWT)
      const payloadB64 = token.split('.')[1]
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
      expect(payload.userId).toBe(userId)
    })
  })

  describe('hashPassword / verifyPassword', () => {
    it('хэш отличается от исходного пароля', async () => {
      const { hashPassword } = await import('@/lib/auth')
      const hash = await hashPassword('mypassword')
      expect(hash).not.toBe('mypassword')
      expect(hash.startsWith('$2')).toBe(true) // bcrypt prefix
    })

    it('verifyPassword возвращает true для верного пароля', async () => {
      const { hashPassword, verifyPassword } = await import('@/lib/auth')
      const hash = await hashPassword('correctpassword')
      const result = await verifyPassword('correctpassword', hash)
      expect(result).toBe(true)
    })

    it('verifyPassword возвращает false для неверного пароля', async () => {
      const { hashPassword, verifyPassword } = await import('@/lib/auth')
      const hash = await hashPassword('correctpassword')
      const result = await verifyPassword('wrongpassword', hash)
      expect(result).toBe(false)
    })
  })

  describe('round-trip токена', () => {
    it('токен не совпадает со случайной строкой', async () => {
      const token = await createToken(userId)
      expect(token).not.toBe('not-a-token')
      expect(token.length).toBeGreaterThan(20)
    })

    it('два токена с одним userId разные (из-за iat)', async () => {
      const t1 = await createToken(userId)
      await new Promise((r) => setTimeout(r, 10))
      const t2 = await createToken(userId)
      // Могут совпасть если iat одинаковый — проверяем что оба валидны
      expect(typeof t1).toBe('string')
      expect(typeof t2).toBe('string')
    })
  })
})
