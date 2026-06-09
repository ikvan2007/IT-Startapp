"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  order: number;
  xpReward: number;
  quiz: { id: string; questionText: string; options: string; correctIndex: number }[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  grade: number | null;
  lessons: Lesson[];
};

export default function TeacherCourseEditor({ course }: { course: Course }) {
  const router = useRouter();
  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);

  const addLesson = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/courses/${course.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          order: course.lessons.length,
          xpReward: 10,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setAddingLesson(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Удалить урок?")) return;
    await fetch(`/api/teacher/lessons/${lessonId}`, { method: "DELETE" });
    router.refresh();
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Удалить вопрос теста?")) return;
    await fetch(`/api/teacher/quiz/${quizId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-bold">Уроки</h2>
        <ul className="space-y-2">
          {course.lessons.map((lesson, i) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
            >
              <div>
                <span className="text-sm text-[var(--text-muted)]">{i + 1}.</span>{" "}
                <Link
                  href={`/teacher/courses/${course.id}/lessons/${lesson.id}`}
                  className="font-medium hover:underline"
                >
                  {lesson.title}
                </Link>
                <span className="ml-2 text-sm text-[var(--xp-gold)]">+{lesson.xpReward} XP</span>
                {lesson.quiz.length > 0 && (
                  <span className="ml-2 text-xs text-violet-600">{lesson.quiz.length} вопросов</span>
                )}
              </div>
              <button
                onClick={() => deleteLesson(lesson.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        {addingLesson ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название урока"
              className="mb-2 w-full rounded border border-[var(--border)] px-3 py-2"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Содержание"
              rows={2}
              className="mb-2 w-full rounded border border-[var(--border)] px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                onClick={addLesson}
                disabled={loading || !newTitle.trim()}
                className="btn-primary text-sm"
              >
                Добавить
              </button>
              <button
                onClick={() => { setAddingLesson(false); setNewTitle(""); setNewContent(""); }}
                className="btn-ghost text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingLesson(true)}
            className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-600"
          >
            + Добавить урок
          </button>
        )}
      </section>
      <p className="text-sm text-[var(--text-muted)]">
        Чтобы добавить или изменить тесты, откройте{" "}
        <Link href={`/courses/${course.id}`} className="text-violet-600 hover:underline">
          страницу курса для учеников
        </Link>{" "}
        и перейдите в урок. В панели преподавателя тесты редактируются через страницу урока.
      </p>
    </div>
  );
}
