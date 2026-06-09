// src/app/api/auth/signout/route.ts
import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}

// Поддержка GET для <form action="/api/auth/signout" method="post">
export async function GET() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  response.cookies.delete(COOKIE_NAME)
  return response
}
