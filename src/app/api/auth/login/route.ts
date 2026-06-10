import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, COOKIE_NAME } from '@/lib/auth'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
})

const MAX_ATTEMPTS = 5
const BLOCK_SECONDS = 60 * 10

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateKey = `login:fail:${ip}`

    const current = Number((await redis.get(rateKey)) || '0')
    if (current >= MAX_ATTEMPTS) {
      const ttl = await redis.ttl(rateKey)

      return NextResponse.json(
        {
          error: 'Слишком много попыток входа. Попробуйте позже.',
          retryAfter: ttl > 0 ? ttl : BLOCK_SECONDS,
        },
        {
          status: 429,
          headers: ttl > 0 ? { 'Retry-After': String(ttl) } : {},
        }
      )
    }

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const attempts = await redis.incr(rateKey)
      if (attempts === 1) {
        await redis.expire(rateKey, BLOCK_SECONDS)
      }

      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      const attempts = await redis.incr(rateKey)
      if (attempts === 1) {
        await redis.expire(rateKey, BLOCK_SECONDS)
      }

      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    await redis.del(rateKey)

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        xp: user.xp,
        level: user.level,
      },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('[login]', e)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}