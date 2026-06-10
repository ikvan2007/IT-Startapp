"use client";

import Link from "next/link";
import { useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  avatar?: string | null;
};

type LessonProgress = {
  id: string;
  completedAt: Date | string | null;
  lesson: {
    id: string;
    title: string;
    course: { id: string; title: string };
  };
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
};

export default function ProfileClient({
  user: initialUser,
  progressList,
  badges,
  allBadges,
  progressPercent,
  xpInCurrentLevel,
}: {
  user: User;
  progressList: LessonProgress[];
  badges: Badge[];
  allBadges: Badge[];
  progressPercent: number;
  xpInCurrentLevel: number;
}) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveProfile = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), avatar: editAvatar.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка");
        return;
      }
      const updated = await res.json();
      setUser(updated);
      setEditing(false);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("user-updated"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Профиль</h1>
        {!editing ? (
          <button onClick={() => { setEditing(true); setEditName(user.name); setEditAvatar(user.avatar || ""); }} className="btn-ghost">
            Редактировать
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Отмена</button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <h3 className="mb-4 font-bold">Редактирование профиля</h3>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <label className="block">
            <span className="text-sm text-[var(--text-muted)]">Имя</span>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm text-[var(--text-muted)]">Фото профиля (URL)</span>
            <input
              type="url"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2"
            />
          </label>
        </div>
      )}

      {/* Level card */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <div className="relative">
                <img
                  src={user.avatar}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-violet-200"
                />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
                  LVL {user.level}
                </span>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-3xl font-bold text-violet-700 pulse-glow">
                {user.level}
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--text-muted)]">Уровень</p>
              <p className="text-2xl font-bold">{user.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[var(--bg-elevated)] px-4 py-2">
              <span className="text-2xl font-bold text-[var(--xp-gold)]">★ {user.xp}</span>
              <span className="ml-2 text-sm text-[var(--text-muted)]">XP</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">До уровня {user.level + 1}</span>
            <span className="font-medium text-violet-600">{xpInCurrentLevel} / 100 XP</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-fill-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Достижения</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allBadges.map((b) => {
            const earned = badges.some((earnedBadge) => earnedBadge.id === b.id);
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${
                  earned
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-[var(--border)] bg-[var(--bg-card)] opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">{b.description}</p>
                    {earned && (
                      <span className="mt-1 inline-block text-xs font-medium text-amber-600">
                        ✓ Получено
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent progress */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Недавно пройдено</h2>
        {progressList.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-[var(--text-muted)]">
            Пока нет пройденных уроков.{" "}
            <Link href="/courses" className="text-violet-600 hover:underline">
              Выбрать курс
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {progressList.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/courses/${p.lesson.course.id}/lesson/${p.lesson.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-violet-300"
                >
                  <span>
                    <span className="font-medium">{p.lesson.title}</span>
                    <span className="ml-2 text-sm text-[var(--text-muted)]">
                      {p.lesson.course.title}
                    </span>
                  </span>
                  <span className="text-sm text-green-600">✓</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
