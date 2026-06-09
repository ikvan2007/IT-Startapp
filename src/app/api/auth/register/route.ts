import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken, setSession } from "@/lib/auth";
import { registerRateLimit } from "@/lib/rate-limit";

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("HCAPTCHA_SECRET_KEY not set");
    return false;
  }
  const params = new URLSearchParams({
    secret,
    response: token,
  });
  const res = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
  const rl = await registerRateLimit(ip);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Слишком много попыток регистрации. Попробуйте через час." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const { email, password, name, captchaToken } = await req.json();

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Капча обязательна" },
        { status: 400 }
      );
    }
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return NextResponse.json(
        { error: "Проверка капчи не пройдена. Попробуйте ещё раз." },
        { status: 400 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true, xp: true, level: true },
    });
    const token = await createToken(user.id);
    await setSession(token);
    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}