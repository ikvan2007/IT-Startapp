// src/lib/auth.ts — полная версия, совместимая со старым фронтендом
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'edu-platform-secret-change-me-in-production'
)

export interface SessionPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// Создать токен (поддерживает как string userId так и number)
export async function createToken(userId: string | number) {
  return new SignJWT({ userId: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

// Верифицировать токен
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// Получить сессию — возвращает пользователя из БД
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        xp: true,
        level: true,
      },
    })
    return user
  } catch {
    return null
  }
}

export async function setSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireTeacher() {
  const user = await getSession()
  if (!user || (user as { role?: string }).role !== 'teacher') return null
  return user
}

// Имя cookie для совместимости
export const COOKIE_NAME = 'session'
