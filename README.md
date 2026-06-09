# Study Task — платформа онлайн-образования с геймификацией

Учебная платформа с опытом (XP), уровнями и достижениями.

## Возможности

- **Регистрация и вход** — JWT в httpOnly cookie
- **Курсы и уроки** — каталог, страница курса, страница урока
- **Геймификация** — XP за уроки, уровень (каждые 100 XP), достижения (значки)
- **Профиль** — уровень, прогресс до следующего уровня, полученные значки, недавно пройденные уроки
- **Фоновые задачи** — Bull-очереди на Redis (начисление XP, проверка значков, сброс кэша)
- **Кэширование** — Redis-кэш для горячих эндпоинтов (`/api/courses`, `/api/progress`, `/api/leaderboard`)
- **Rate limiting** — защита от брутфорса на `/login`, `/register`, `/teacher-login`

## Стек

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma, SQLite
- bcryptjs, jose (JWT)
- Redis, Bull (фоновые задачи и кэш), ioredis

## Запуск (локально)

```bash
# Установка зависимостей
npm install

# Создание БД и таблиц
npm run db:push

# Заполнение тестовыми данными
npm run db:seed

# Запуск сервера разработки
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

**Тестовый аккаунт:** `student@edu.ru` / `password123`

> Redis опционален — без него приложение работает без кэша и очередей (graceful fallback).
> Для локального Redis: `docker run -d -p 6379:6379 redis:7-alpine`

## Запуск в Docker

```bash
# Полный стек: приложение + Redis + воркер + бэкап
docker compose up -d

# Первый запуск — заполнить БД
docker compose exec app sh -c "npx prisma db seed"
```

## Воркер очередей

```bash
# Запуск воркера отдельно (без Docker)
REDIS_URL=redis://localhost:6379 npm run worker
```

## Тесты

```bash
npm run test:all          # все тесты
npm run test:unit         # только unit
npm run test:integration  # только integration
npm run test:coverage     # с отчётом покрытия
```

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Сервер разработки |
| `npm run build` | Сборка (Prisma generate + Next build) |
| `npm run db:push` | Применить схему Prisma к БД |
| `npm run db:seed` | Заполнить БД тестовыми данными |
| `npm run db:migrate` | Применить SQL-миграции |
| `npm run worker` | Запустить Bull-воркер |
| `npm run test:all` | Запустить все тесты |
| `npm run backup` | Создать бэкап БД |

## Структура БД

- **User** — email, пароль (hash), имя, XP, уровень
- **Course** — название, описание, категория, сложность, награда XP
- **Lesson** — курс, название, контент, порядок, XP за урок
- **LessonProgress** — пользователь + урок, флаг «пройдено»
- **Badge** — название, описание, иконка, порог XP
- **UserBadge** — выданные пользователю значки

Значки выдаются автоматически при достижении порога XP (10, 100, 500).

Индексы добавлены на часто используемые поля: `LessonProgress(userId)`, `LessonProgress(lessonId, completed)`, `Lesson(courseId, order)`, `Badge(xpRequired)` и другие — см. `migrations/0003_performance_indexes.sql`.

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

| Переменная | Описание | По умолчанию |
|---|---|---|
| `JWT_SECRET` | Секрет для подписи JWT | ⚠️ обязательно сменить |
| `DATABASE_URL` | Путь к SQLite | `file:./prisma/dev.db` |
| `REDIS_URL` | Адрес Redis | опционально |
| `BACKUP_KEEP_DAYS` | Дней хранить бэкапы | `7` |
