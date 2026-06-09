"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

  const complete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (res.ok) {
        const data = await res.json();
        setDone(true);
        setXpGained(data.xpGained ?? data.xp);
        setShowToast(true);
        // Обновить баллы в шапке сразу
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("user-updated"));
        }
        router.refresh();
        setTimeout(() => setShowToast(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast: баллы добавлены */}
      {showToast && xpGained != null && (
        <div
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fade-in rounded-xl border-2 border-violet-400 bg-white px-6 py-3 shadow-lg"
          role="alert"
        >
          <span className="text-lg font-bold text-violet-700">+{xpGained} XP</span>
          <span className="ml-2 text-[var(--text-muted)]">баллы добавлены на счёт</span>
        </div>
      )}

      {done ? (
        <div className="flex items-center gap-3 rounded-xl bg-green-100 px-4 py-3 text-green-800">
          <span className="text-xl">✓</span>
          <div>
            <p className="font-semibold">Урок пройден</p>
            {xpGained != null && (
              <p className="text-sm font-bold text-[var(--xp-gold)]">+{xpGained} XP зачислено на ваш счёт</p>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={complete}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Сохранение..." : "Отметить пройденным"}
        </button>
      )}
    </>
  );
}
