import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TeacherDashboardPage() {
  const user = await getSession();
  const isTeacher = user && (user as { role?: string }).role === "teacher";
  if (!isTeacher) redirect("/login");

  const courses = await prisma.course.findMany({
    include: { lessons: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Мои курсы</h1>
      <div className="mb-6 flex gap-4">
        <Link href="/teacher/courses/new" className="btn-primary">
          + Создать курс
        </Link>
      </div>
      <ul className="space-y-3">
        {courses.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-[var(--text-muted)]">
            Курсов пока нет. Создайте первый курс.
          </p>
        ) : (
          courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/teacher/courses/${course.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-violet-400"
              >
                <div>
                  <span className="text-sm text-[var(--text-muted)]">{course.category}</span>
                  {course.grade != null && (
                    <span className="ml-2 text-sm text-violet-600">{course.grade} класс</span>
                  )}
                  <h2 className="font-bold">{course.title}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{course.lessons.length} уроков</p>
                </div>
                <span>→</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
