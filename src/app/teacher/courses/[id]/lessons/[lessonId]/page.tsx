import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TeacherLessonQuizEditor from "./TeacherLessonQuizEditor";

export default async function TeacherLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const user = await getSession();
  const isTeacher = user && (user as { role?: string }).role === "teacher";
  if (!isTeacher) redirect("/login");

  const { id, lessonId } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: true },
  });
  if (!course) notFound();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: true },
  });
  if (!lesson || lesson.courseId !== id) notFound();

  const questions = lesson.quiz.map((q) => ({
    ...q,
    options: JSON.parse(q.options) as string[],
  }));

  return (
    <div>
      <Link href={`/teacher/courses/${id}`} className="mb-6 inline-block text-sm text-violet-600 hover:underline">
        ← {course.title}
      </Link>
      <h1 className="mb-2 text-2xl font-bold">{lesson.title}</h1>
      <p className="mb-6 text-[var(--text-muted)]">Редактирование теста</p>
      <TeacherLessonQuizEditor
        lessonId={lessonId}
        questions={questions}
        courseId={id}
      />
    </div>
  );
}
