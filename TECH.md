# из корня проекта
dir src\app /s /b          # windows
# или
ls -R src/app               # wsl / git‑bashimport Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function Header() {
  const session = await getSession(); // возвращает null, если не залогинен

  return (
    <nav className="flex items-center justify-between py-4">
      <Link href="/" className="font-bold text-lg">EduGame</Link>

      <div className="flex items-center space-x-4">
        {session ? (
          <>
            <Link href="/courses" className="hover:underline">Курсы</Link>
            <Link href="/leaderboard" className="hover:underline">Лидерборд</Link>
            <Link href="/profile" className="hover:underline">Профиль</Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Выйти
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Вход</Link>
            <Link href="/register" className="hover:underline">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}# Технологии и стек Study Task

## Базы данных

- **SQLite** — реляционная база данных (файл `prisma/dev.db`)
- **Prisma ORM** — работа с БД, миграции, типизация

### Модели (таблицы)

| Таблица        | Описание                                          |
|----------------|---------------------------------------------------|
| User           | Пользователи: email, пароль, имя, аватар, роль, XP, уровень |
| Course         | Курсы: название, описание, предмет, класс (1–11), сложность |
| Lesson         | Уроки: курс, название, контент, видео URL, XP за урок |
| LessonProgress | Прогресс: какой пользователь какой урок прошёл    |
| QuizQuestion   | Вопросы теста: урок, текст, варианты, правильный ответ |
| Badge          | Достижения (значки)                               |
| UserBadge      | Связь пользователь–достижение                     |

---

## Языки и фреймворки

| Технология   | Назначение                          |
|--------------|-------------------------------------|
| **TypeScript** | Типизированный JavaScript для всего кода |
| **JavaScript** | Используется через TypeScript       |
| **React**      | UI-компоненты, состояние           |
| **Next.js 14** | Фреймворк: SSR, API routes, роутинг |
| **Tailwind CSS** | Стили, адаптивность              |

---

## Библиотеки

- **Prisma** — ORM для SQLite
- **bcryptjs** — хеширование паролей
- **jose** — JWT для сессий
