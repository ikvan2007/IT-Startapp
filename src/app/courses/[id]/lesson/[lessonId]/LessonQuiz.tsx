"use client";

import { useState, useEffect } from "react";

type Question = {
  id: string;
  questionText: string;
  options: string[];
};

export default function LessonQuiz({ lessonId }: { lessonId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [wrongMessage, setWrongMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/quiz`)
      .then(async (r) => {
        const text = await r.text();
        if (!text) return [];
        try {
          return JSON.parse(text);
        } catch {
          return [];
        }
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuestions(list);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const checkAnswer = async () => {
    if (selectedAnswer == null || currentIndex >= questions.length) return;
    setChecking(true);
    setWrongMessage("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[currentIndex].id,
          answerIndex: selectedAnswer,
        }),
      });
      const data = await res.json();
      if (data.correct) {
        if (currentIndex + 1 >= questions.length) {
          setCompleted(true);
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId }),
          }).then(() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("user-updated"));
            }
          });
        } else {
          setCurrentIndex((i) => i + 1);
          setSelectedAnswer(null);
        }
      } else {
        setWrongMessage("Неправильно. Попробуйте ещё раз.");
      }
    } catch {
      setWrongMessage("Ошибка проверки. Попробуйте снова.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <div className="mt-6 text-[var(--text-muted)]">Загрузка теста...</div>;
  if (questions.length === 0) return null;

  if (completed) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-green-100 p-6 text-green-800">
        <p className="text-lg font-bold">✓ Тест пройден!</p>
        <p className="mt-1">Все {questions.length} вопросов решены правильно.</p>
      </div>
    );
  }

  const q = questions[currentIndex];
  return (
    <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
      <h3 className="mb-4 text-lg font-bold">Тест по уроку</h3>
      <p className="mb-2 text-sm text-[var(--text-muted)]">
        Вопрос {currentIndex + 1} из {questions.length}. Ответьте правильно, чтобы перейти к следующему.
      </p>
      <p className="mb-4 font-medium text-[var(--text)]">{q.questionText}</p>
      <ul className="space-y-1">
        {q.options.map((opt, oi) => (
          <li key={oi}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 hover:bg-violet-50">
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === oi}
                onChange={() => setSelectedAnswer(oi)}
                className="h-4 w-4 text-violet-600"
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      {wrongMessage && (
        <p className="mt-2 text-sm text-red-600">{wrongMessage}</p>
      )}
      <button
        onClick={checkAnswer}
        disabled={checking || selectedAnswer == null}
        className="btn-primary mt-4 disabled:opacity-50"
      >
        {checking ? "Проверка..." : "Проверить"}
      </button>
    </div>
  );
}
