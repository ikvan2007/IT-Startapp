"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import PasswordInput from "@/components/PasswordInput";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const onCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const onCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Пожалуйста, подтвердите, что вы не робот.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        return;
      }
      router.push("/courses");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold">Регистрация</h1>
        <p className="mb-6 text-[var(--text-muted)]">
          Создайте аккаунт и начните зарабатывать XP с первого урока.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-muted)]">Имя</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Иван"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-muted)]">Пароль</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="Минимум 6 символов"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 pr-12 text-[var(--text)] placeholder:text-slate-400 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>

          <div className="flex justify-center">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={onCaptchaVerify}
              onExpire={onCaptchaExpire}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="btn-primary mt-2 disabled:opacity-50"
          >
            {loading ? "Регистрация..." : "Создать аккаунт"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-violet-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}