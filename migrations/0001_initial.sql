-- Migration: 0001_initial
-- Описание: Начальная схема — все таблицы платформы Study Task
-- Создано:  2024-01-01
-- Применить вручную: sqlite3 prisma/dev.db < migrations/0001_initial.sql

-- ── Пользователи ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "avatar"    TEXT,
  "role"      TEXT NOT NULL DEFAULT 'student',
  "xp"        INTEGER NOT NULL DEFAULT 0,
  "level"     INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Курсы ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Course" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "image"       TEXT,
  "category"    TEXT NOT NULL,
  "grade"       INTEGER,
  "difficulty"  TEXT NOT NULL,
  "xpReward"    INTEGER NOT NULL DEFAULT 100,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Уроки ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Lesson" (
  "id"       TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title"    TEXT NOT NULL,
  "content"  TEXT NOT NULL,
  "order"    INTEGER NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 10,
  "videoUrl" TEXT,
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE
);

-- ── Вопросы квиза ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "lessonId"     TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "options"      TEXT NOT NULL,
  "correctIndex" INTEGER NOT NULL,
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE
);

-- ── Прогресс по урокам ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LessonProgress" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "lessonId"    TEXT NOT NULL,
  "completed"   INTEGER NOT NULL DEFAULT 0,
  "completedAt" DATETIME,
  UNIQUE ("userId", "lessonId"),
  FOREIGN KEY ("userId")   REFERENCES "User"("id")   ON DELETE CASCADE,
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE
);

-- ── Значки ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Badge" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon"        TEXT NOT NULL,
  "xpRequired"  INTEGER NOT NULL
);

-- ── Значки пользователей ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserBadge" (
  "id"       TEXT NOT NULL PRIMARY KEY,
  "userId"   TEXT NOT NULL,
  "badgeId"  TEXT NOT NULL,
  "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "badgeId"),
  FOREIGN KEY ("userId")  REFERENCES "User"("id")  ON DELETE CASCADE,
  FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE
);

-- ── Индексы ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_lesson_courseId"        ON "Lesson"("courseId");
CREATE INDEX IF NOT EXISTS "idx_progress_userId"        ON "LessonProgress"("userId");
CREATE INDEX IF NOT EXISTS "idx_progress_lessonId"      ON "LessonProgress"("lessonId");
CREATE INDEX IF NOT EXISTS "idx_userbadge_userId"       ON "UserBadge"("userId");
CREATE INDEX IF NOT EXISTS "idx_quizquestion_lessonId"  ON "QuizQuestion"("lessonId");
CREATE INDEX IF NOT EXISTS "idx_course_category"        ON "Course"("category");
CREATE INDEX IF NOT EXISTS "idx_course_grade"           ON "Course"("grade");
CREATE INDEX IF NOT EXISTS "idx_user_xp"                ON "User"("xp");
