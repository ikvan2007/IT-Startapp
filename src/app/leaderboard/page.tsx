import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    select: { id: true, name: true, xp: true, level: true },
  });

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Лидерборд</h1>
      <p className="mb-8 text-[var(--text-muted)]">
        Топ учеников по опыту (XP). Проходи уроки и поднимайся в рейтинге.
      </p>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text)]">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text)]">Ученик</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text)]">Уровень</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--text)]">XP</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Пока никого нет.{" "}
                  <Link href="/register" className="text-[var(--accent)] hover:underline">
                    Зарегистрируйтесь
                  </Link>{" "}
                  первым.
                </td>
              </tr>
            ) : (
              users.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--border)] last:border-0 transition hover:bg-[var(--bg-elevated)]/50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-slate-200 text-slate-600"
                            : i === 2
                              ? "bg-amber-50 text-amber-800"
                              : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{u.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-sm font-semibold text-violet-700">
                      LVL {u.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--xp-gold)]">
                    ★ {u.xp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        <Link href="/profile" className="text-[var(--accent)] hover:underline">
          Мой профиль
        </Link>
        {" · "}
        <Link href="/courses" className="text-[var(--accent)] hover:underline">
          Курсы
        </Link>
      </p>
    </div>
  );
}
