"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SCHOOL_SUBJECTS } from "@/lib/subjects";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Математика");
  const [grade, setGrade] = useState<string>("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          grade: grade ? parseInt(grade, 10) : null,
          difficulty,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка");
        return;
      }
      const course = await res.json();
      router.push(`/teacher/courses/${course.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/teacher" className="mb-6 inline-block text-sm text-violet-600 hover:underline">
        ← К курсам
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Новый курс</h1>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        {error && <div className="rounded-lg bg-red-100 p-3 text-red-700">{error}</div>}
        <label className="block">
          <span className="text-sm text-[var(--text-muted)]">Название</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-muted)]">Описание</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-muted)]">Предмет</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2"
          >
            {SCHOOL_SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-muted)]">Класс (1–11, пусто = все)</span>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2"
          >
            <option value="">Все классы</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>{g} класс</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[var(--text-muted)]">Сложность</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2"
          >
            <option value="beginner">Начальный</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
          </select>
        </label>
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Создание..." : "Создать"}
          </button>
          <Link href="/teacher" className="btn-ghost">Отмена</Link>
        </div>
      </form>
    </div>
  );
}
