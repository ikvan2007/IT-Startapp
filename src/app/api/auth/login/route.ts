import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, setSession } from "@/lib/auth";
import { loginRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // ── Rate limiting: 5 попыток в минуту с одного IP ──────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
  const rl = await loginRateLimit(ip);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Попробуйте через минуту." },
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
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    const token = await createToken(user.id);
    await setSession(token);
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          xp: user.xp,
          level: user.level,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
