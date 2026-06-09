import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import CompleteButton from "./CompleteButton";
import LessonVideo from "./LessonVideo";
import LessonQuiz from "./LessonQuiz";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const course = await getCourse(id);
  if (!course) notFound();
  const lesson = course.lessons?.find((l: { id: string }) => l.id === lessonId);
  if (!lesson) notFound();

  const currentIndex = course.lessons.findIndex((l: { id: string }) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 && currentIndex >= 0
    ? course.lessons[currentIndex + 1]
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/courses/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        ← {course.title}
      </Link>
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
            Урок {currentIndex + 1} из {course.lessons.length}
          </span>
          <span className="text-sm font-semibold text-[var(--xp-gold)]">
            +{lesson.xpReward} XP
          </span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
        <div className="prose prose-invert mt-6 max-w-none">
          <div className="whitespace-pre-wrap text-[var(--text-muted)] leading-relaxed">
            {lesson.content}
          </div>
        </div>

        {lesson.videoUrl && <LessonVideo videoUrl={lesson.videoUrl} />}

        <LessonQuiz lessonId={lesson.id} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
          <CompleteButton lessonId={lesson.id} />
          <div className="flex gap-2">
            {prevLesson ? (
              <Link
                href={`/courses/${id}/lesson/${prevLesson.id}`}
                className="btn-ghost"
              >
                ← Предыдущий
              </Link>
            ) : null}
            {nextLesson ? (
              <Link
                href={`/courses/${id}/lesson/${nextLesson.id}`}
                className="btn-primary"
              >
                Следующий →
              </Link>
            ) : (
              <Link href={`/courses/${id}`} className="btn-primary">
                К курсу
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
