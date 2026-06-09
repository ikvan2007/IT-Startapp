import { getSession } from "@/lib/auth";
import Link from "next/link";
import TeacherLogout from "@/components/TeacherLogout";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  const isTeacher = user && (user as { role?: string }).role === "teacher";

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/teacher" className="font-bold text-violet-700">
            Панель преподавателя
          </Link>
          <nav className="flex gap-4">
            {isTeacher ? (
              <>
                <Link href="/teacher" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  Курсы
                </Link>
                <TeacherLogout />
              </>
            ) : (
              <Link href="/teacher/login" className="btn-primary text-sm">
                Вход
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
