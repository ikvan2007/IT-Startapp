import Link from "next/link";
import { getCourses } from "@/lib/courses";
import { SCHOOL_SUBJECTS } from "@/lib/subjects";
const difficultyLabel: Record<string, string> = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

function parseNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string | string[]; grade?: string | string[] }>;
}) {
  const p = await searchParams;
  const subject = typeof p.subject === "string" ? p.subject : Array.isArray(p.subject) ? p.subject[0] : undefined;
  const grade = parseNum(p.grade);
  const courses = await getCourses(subject, grade).catch(() => []);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Каталог курсов</h1>
      <p className="mb-6 text-[var(--text-muted)]">
        Выберите предмет или курс и начните зарабатывать опыт.
      </p>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Класс</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={subject ? `/courses?subject=${encodeURIComponent(subject)}` : "/courses"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              grade == null
                ? "bg-violet-600 text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-violet-100"
            }`}
          >
            Все классы
          </Link>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => {
            const href = grade === g
              ? (subject ? `/courses?subject=${encodeURIComponent(subject)}` : "/courses")
              : `/courses?grade=${g}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`;
            return (
              <Link
                key={g}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  grade === g
                    ? "bg-violet-600 text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-violet-100"
                }`}
              >
                {g} класс
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Предмет</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={grade != null ? `/courses?grade=${grade}` : "/courses"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !subject
                ? "bg-violet-600 text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-violet-100"
            }`}
          >
            Все
          </Link>
          {SCHOOL_SUBJECTS.map((subj) => {
            const href = subject === subj
              ? (grade != null ? `/courses?grade=${grade}` : "/courses")
              : `/courses?subject=${encodeURIComponent(subj)}${grade != null ? `&grade=${grade}` : ""}`;
            return (
              <Link
                key={subj}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  subject === subj
                    ? "bg-violet-600 text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-violet-100"
                }`}
              >
                {subj}
              </Link>
            );
          })}
        </div>
      </section>

      {(subject || grade != null) && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {subject && <span>Предмет: <strong>{subject}</strong></span>}
          {subject && grade != null && " · "}
          {grade != null && <span>Класс: <strong>{grade}</strong></span>}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <p className="col-span-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
            {subject
              ? `По предмету «${subject}» курсов пока нет.`
              : "Курсы пока не добавлены. Запустите: npx tsx prisma/seed.ts"}
          </p>
        ) : (
          courses.map((course: { id: string; title: string; description: string; image: string | null; category: string; grade: number | null; difficulty: string; xpReward: number; lessons: unknown[] }) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="card-hover block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            >
              <div className="flex h-32 items-center justify-center bg-[var(--bg-elevated)] text-5xl">
                {course.image || "📖"}
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-violet-600">
                  {course.category}
                  {course.grade != null && ` · ${course.grade} кл.`}
                </span>
                <h2 className="mt-1 text-lg font-bold text-[var(--text)]">{course.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">
                  {course.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-[var(--text-muted)]">
                    {difficultyLabel[course.difficulty] || course.difficulty}
                  </span>
                  <span className="text-sm font-semibold text-[var(--xp-gold)]">
                    +{course.xpReward} XP · {course.lessons?.length || 0} уроков
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
