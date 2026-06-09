-- Migration: 0002_extend_user_and_course
-- Описание: Добавить новые поля согласно ТЗ
--   User:   возраст (age), пол (gender), фамилия (surname)
--   Course: стоимость (cost), длительность в часах (durationHours)
-- Создано:  2024-01-02
-- Применить: sqlite3 prisma/dev.db < migrations/0002_extend_user_and_course.sql

-- ── User: новые поля ─────────────────────────────────────────
-- SQLite не поддерживает ALTER TABLE ADD COLUMN с UNIQUE/NOT NULL без DEFAULT,
-- поэтому добавляем с DEFAULT NULL

ALTER TABLE "User" ADD COLUMN "surname"  TEXT;
ALTER TABLE "User" ADD COLUMN "age"      INTEGER;
ALTER TABLE "User" ADD COLUMN "gender"   TEXT;
-- gender принимает: 'male' | 'female' | 'other' | NULL

-- ── Course: новые поля ────────────────────────────────────────
ALTER TABLE "Course" ADD COLUMN "cost"          REAL    NOT NULL DEFAULT 0;
-- cost = 0 означает бесплатный курс
ALTER TABLE "Course" ADD COLUMN "durationHours" INTEGER;
-- durationHours = суммарная длительность курса в часах
ALTER TABLE "Course" ADD COLUMN "subject"       TEXT;
-- subject = предмет (дублирует category, но может быть более детальным)

-- ── Индексы на новые поля ────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_course_cost"    ON "Course"("cost");
CREATE INDEX IF NOT EXISTS "idx_user_age"       ON "User"("age");
