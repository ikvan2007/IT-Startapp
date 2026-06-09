// __tests__/unit/auth.test.ts
//
// Unit-тесты для src/lib/auth.ts
// Запуск: npx jest __tests__/unit/auth.test.ts

import { createToken, verifyToken } from '@/lib/auth'

// Мокаем next/headers (не нужен в unit-тестах)
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}))

describe('Auth — JWT utilities', () => {
  const payload = { userId: 1, email: 'test@edu.ru', role: 'student' }

  describe('createToken', () => {
    it('создаёт строку токена', async () => {
      const token = await createToken(payload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT = header.payload.sig
    })

    it('создаёт разные токены для разных пользователей', async () => {
      const t1 = await createToken({ userId: 1, email: 'a@edu.ru', role: 'student' })
      const t2 = await createToken({ userId: 2, email: 'b@edu.ru', role: 'teacher' })
      expect(t1).not.toBe(t2)
    })
  })

  describe('verifyToken', () => {
    it('верифицирует валидный токен и возвращает payload', async () => {
      const token = await createToken(payload)
      const result = await verifyToken(token)

      expect(result).not.toBeNull()
      expect(result!.userId).toBe(payload.userId)
      expect(result!.email).toBe(payload.email)
      expect(result!.role).toBe(payload.role)
    })

    it('возвращает null для невалидного токена', async () => {
      const result = await verifyToken('not.a.valid.token')
      expect(result).toBeNull()
    })

    it('возвращает null для пустой строки', async () => {
      const result = await verifyToken('')
      expect(result).toBeNull()
    })

    it('возвращает null для истёкшего токена', async () => {
      // Создаём токен с истёкшим exp (вручную подделываем)
      const { SignJWT } = await import('jose')
      const secret = new TextEncoder().encode('edu-platform-secret-change-me-in-production')
      const expired = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1s')
        .sign(secret)

      // Ждём секунду
      await new Promise((r) => setTimeout(r, 1100))
      const result = await verifyToken(expired)
      expect(result).toBeNull()
    })
  })

  describe('round-trip', () => {
    it('сохраняет все поля после encode → decode', async () => {
      const cases = [
        { userId: 1, email: 'student@edu.ru', role: 'student' },
        { userId: 99, email: 'teacher@edu.ru', role: 'teacher' },
      ]
      for (const c of cases) {
        const token = await createToken(c)
        const decoded = await verifyToken(token)
        expect(decoded?.userId).toBe(c.userId)
        expect(decoded?.email).toBe(c.email)
        expect(decoded?.role).toBe(c.role)
      }
    })
  })
})
