import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import CourseLeaderboard from "./CourseLeaderboard";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  return (
    <div>
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        ← Назад к курсам
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-5xl">
          {course.image || "📖"}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-2 text-[var(--text-muted)]">{course.description}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--xp-gold)]">
            +{course.xpReward} XP за курс · {course.lessons?.length || 0} уроков
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Соревнование в курсе</h2>
        <CourseLeaderboard courseId={id} />
      </section>

      <h2 className="mb-4 text-lg font-bold">Уроки</h2>
      <ul className="space-y-2">
        {(course.lessons || []).map((lesson: { id: string; title: string; order: number; xpReward: number }, i: number) => (
          <li key={lesson.id}>
            <Link
              href={`/courses/${id}/lesson/${lesson.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-violet-500/40 hover:bg-[var(--bg-elevated)]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700">
                  {i + 1}
                </span>
                {lesson.title}
              </span>
              <span className="text-sm text-[var(--xp-gold)]">+{lesson.xpReward} XP</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
