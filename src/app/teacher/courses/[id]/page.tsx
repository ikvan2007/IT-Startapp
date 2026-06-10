import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TeacherCourseEditor from "./TeacherCourseEditor";

export default async function TeacherCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  const isTeacher = user && (user as { role?: string }).role === "teacher";
  if (!isTeacher) redirect("/login");

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" }, include: { quiz: true } } },
  });
  if (!course) notFound();

  return (
    <div>
      <Link href="/teacher" className="mb-6 inline-block text-sm text-violet-600 hover:underline">
        ← К курсам
      </Link>
      <h1 className="mb-2 text-2xl font-bold">{course.title}</h1>
      <p className="mb-6 text-[var(--text-muted)]">
        {course.category}
        {course.grade != null && ` · ${course.grade} класс`}
      </p>
      <TeacherCourseEditor course={course} />
    </div>
  );
}
