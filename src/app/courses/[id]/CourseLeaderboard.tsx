"use client";

import { useEffect, useState } from "react";

type Entry = {
  userId: string;
  name: string;
  completed: number;
  totalLessons: number;
};

export default function CourseLeaderboard({ courseId }: { courseId: string }) {
  const [list, setList] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/leaderboard`)
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Загрузка рейтинга...</div>;
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center text-sm text-[var(--text-muted)]">
        Пока никто не прошёл уроки этого курса. Будьте первым!
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Ученик</th>
            <th className="px-3 py-2 text-right font-semibold">Уроков</th>
          </tr>
        </thead>
        <tbody>
          {list.map((entry, i) => (
            <tr key={entry.userId} className="border-b border-[var(--border)] last:border-0">
              <td className="px-3 py-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : "text-[var(--text-muted)]"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-2 font-medium">{entry.name}</td>
              <td className="px-3 py-2 text-right text-[var(--xp-gold)]">
                {entry.completed} / {entry.totalLessons}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
