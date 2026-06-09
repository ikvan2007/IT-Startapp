"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  avatar?: string | null;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const isInProfile = pathname === "/profile";
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchUser = () => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user));
  };

  useEffect(() => {
    fetchUser();
    const onUserUpdated = () => fetchUser();
    window.addEventListener("user-updated", onUserUpdated);
    return () => window.removeEventListener("user-updated", onUserUpdated);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">📚</span>
          <span className="gradient-text">Study Task</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/courses" className="btn-ghost">
            Курсы
          </Link>
          <Link href="/leaderboard" className="btn-ghost">
            Лидерборд
          </Link>
          {user || isInProfile ? (
            <>
              <Link href="/profile" className="btn-ghost flex items-center gap-2">
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                  LVL {user?.level ?? 1}
                </span>
                <span className="text-[var(--xp-gold)]">★ {user?.xp ?? 0}</span>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="btn-ghost flex items-center gap-2 rounded-full"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                      {user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  )}
                  <span className="max-w-[100px] truncate">{user?.name ?? "Профиль"}</span>
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-xl">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm hover:bg-slate-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        Профиль
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
                      >
                        Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Вход
              </Link>
              <Link href="/register" className="btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {(user || isInProfile) && (
            <Link
              href="/profile"
              className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700"
            >
              LVL {user?.level ?? 1} ★{user?.xp ?? 0}
            </Link>
          )}
          <Link href="/courses" className="btn-ghost text-sm">Курсы</Link>
          <Link href="/leaderboard" className="btn-ghost text-sm">Лидерборд</Link>
          {user || isInProfile ? (
            <button onClick={logout} className="btn-ghost text-sm text-red-400">
              Выйти
            </button>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Вход</Link>
              <Link href="/register" className="btn-primary text-sm">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
