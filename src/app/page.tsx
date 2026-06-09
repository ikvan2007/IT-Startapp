import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700">
        <span>🎮</span> Обучение как игра
      </div>
      <h1 className="mb-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
        <span className="gradient-text">Достигай целей.</span>
        <br />
        Зарабатывай опыт. Получай награды.
      </h1>
      <p className="mb-10 max-w-xl text-lg text-[var(--text-muted)]">
        Проходи курсы, набирай XP и поднимай уровень. Соревнуйся с собой и открывай достижения.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/courses" className="btn-primary text-base px-6 py-3">
          Смотреть курсы
        </Link>
        <Link
          href="/register"
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 font-semibold text-[var(--text)] transition hover:border-violet-400 hover:bg-violet-50"
        >
          Начать бесплатно
        </Link>
      </div>

      <div className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-left card-hover">
          <div className="mb-3 text-3xl">⭐</div>
          <h3 className="mb-2 font-bold text-[var(--text)]">Опыт (XP)</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Завершай уроки и получай очки опыта. Чем сложнее урок — тем больше награда.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-left card-hover">
          <div className="mb-3 text-3xl">📈</div>
          <h3 className="mb-2 font-bold text-[var(--text)]">Уровни</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Каждые 100 XP — новый уровень. Отслеживай прогресс и расти от новичка до эксперта.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-left card-hover">
          <div className="mb-3 text-3xl">🏆</div>
          <h3 className="mb-2 font-bold text-[var(--text)]">Достижения</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Специальные значки за первые шаги, 100 XP, 500 XP и другие цели.
          </p>
        </div>
      </div>
    </div>
  );
}
