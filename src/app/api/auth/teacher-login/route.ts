import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, setSession } from "@/lib/auth";
import { teacherLoginRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // ── Rate limiting: 10 попыток в минуту с одного IP ──────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
  const rl = await teacherLoginRateLimit(ip);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через минуту." },
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
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }
    if (user.role !== "teacher") {
      return NextResponse.json(
        {
          error:
            "Вход только для преподавателей. Используйте обычную страницу входа.",
        },
        { status: 403 }
      );
    }
    const token = await createToken(user.id);
    await setSession(token);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
