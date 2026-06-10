// src/app/api/auth/login/route.ts — с rate limiting (5 попыток/мин)
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'
import { loginRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    const rl = await loginRateLimit(ip)
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter), 'X-RateLimit-Limit': String(rl.limit), 'X-RateLimit-Remaining': String(rl.remaining) } }
      )
    }

    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })

    const token = await createToken(user.id)
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, xp: user.xp, level: user.level },
    })
    response.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return response
  } catch (e) {
    console.error('[login]', e)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
