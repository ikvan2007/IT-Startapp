/**
 * @jest-environment node
 */
import { createToken, verifyToken } from '@/lib/auth'

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}))

describe('Auth — JWT utilities', () => {
  describe('createToken', () => {
    it('создаёт строку токена', async () => {
      const token = await createToken(1)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('создаёт разные токены для разных пользователей', async () => {
      const t1 = await createToken(1)
      const t2 = await createToken(2)
      expect(t1).not.toBe(t2)
    })
  })

  describe('verifyToken', () => {
    it('верифицирует валидный токен и возвращает payload', async () => {
      const token = await createToken(42)
      const result = await verifyToken(token)
      expect(result).not.toBeNull()
      expect(Number(result!.userId)).toBe(42)
    })

    it('возвращает null для невалидного токена', async () => {
      expect(await verifyToken('not.a.valid.token')).toBeNull()
    })

    it('возвращает null для пустой строки', async () => {
      expect(await verifyToken('')).toBeNull()
    })

    it('возвращает null для истёкшего токена', async () => {
      const { SignJWT } = await import('jose')
      const secret = new TextEncoder().encode('edu-platform-secret-change-me-in-production')
      const expired = await new SignJWT({ userId: 1 })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1s')
        .sign(secret)
      await new Promise(r => setTimeout(r, 1100))
      expect(await verifyToken(expired)).toBeNull()
    })
  })

  describe('round-trip', () => {
    it('сохраняет userId после encode => decode', async () => {
      for (const id of [1, 42, 99]) {
        const token = await createToken(id)
        const decoded = await verifyToken(token)
        expect(Number(decoded?.userId)).toBe(id)
      }
    })
  })
})
