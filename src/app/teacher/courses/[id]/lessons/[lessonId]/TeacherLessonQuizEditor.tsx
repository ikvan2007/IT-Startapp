"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
};

export default function TeacherLessonQuizEditor({
  lessonId,
  questions: initial,
  courseId,
}: {
  lessonId: string;
  questions: Question[];
  courseId: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [newQ, setNewQ] = useState({ text: "", options: ["", "", "", ""], correct: 0 });
  const [loading, setLoading] = useState(false);

  const addQuestion = async () => {
    if (!newQ.text.trim() || newQ.options.filter(Boolean).length < 2) return;
    setLoading(true);
    try {
      const opts = newQ.options.filter(Boolean);
      const res = await fetch(`/api/teacher/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: newQ.text.trim(),
          options: opts,
          correctIndex: Math.min(newQ.correct, opts.length - 1),
        }),
      });
      if (res.ok) {
        const q = await res.json();
        setQuestions([...questions, { ...q, options: opts }]);
        setNewQ({ text: "", options: ["", "", "", ""], correct: 0 });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (quizId: string) => {
    if (!confirm("Удалить вопрос?")) return;
    await fetch(`/api/teacher/quiz/${quizId}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== quizId));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Вопросы теста</h2>
      <ul className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex justify-between">
              <p className="font-medium">{i + 1}. {q.questionText}</p>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
              {q.options.map((opt, oi) => (
                <li key={oi}>
                  {oi === q.correctIndex ? "✓ " : ""}{opt}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <h3 className="mb-3 font-medium">Добавить вопрос</h3>
        <input
          value={newQ.text}
          onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
          placeholder="Текст вопроса"
          className="mb-2 w-full rounded border border-[var(--border)] px-3 py-2"
        />
        <div className="mb-2 space-y-1">
          {newQ.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="radio"
                name="correct"
                checked={newQ.correct === i}
                onChange={() => setNewQ({ ...newQ, correct: i })}
              />
              <input
                value={opt}
                onChange={(e) => {
                  const opts = [...newQ.options];
                  opts[i] = e.target.value;
                  setNewQ({ ...newQ, options: opts });
                }}
                placeholder={`Вариант ${i + 1}`}
                className="flex-1 rounded border border-[var(--border)] px-3 py-1"
              />
            </div>
          ))}
        </div>
        <button
          onClick={addQuestion}
          disabled={loading || !newQ.text.trim()}
          className="btn-primary text-sm"
        >
          Добавить вопрос
        </button>
      </div>
    </div>
  );
}
