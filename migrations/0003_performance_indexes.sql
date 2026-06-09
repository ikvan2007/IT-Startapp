-- ============================================================
-- Migration: 0003_performance_indexes.sql
-- Добавляем индексы для устранения медленных full-scan запросов
-- ============================================================

-- ── LessonProgress ─────────────────────────────────────────────────────────
-- Частые запросы:
--   WHERE userId = ?                      → idx_progress_user
--   WHERE lessonId IN (...)               → idx_progress_lesson
--   WHERE lessonId IN (...) AND completed = true  → idx_progress_lesson_completed
--   WHERE userId = ? AND lessonId = ?     → уже покрыт UNIQUE constraint

-- Получение всего прогресса конкретного пользователя (GET /api/progress)
CREATE INDEX IF NOT EXISTS idx_progress_user
  ON LessonProgress(userId);

-- Фильтр по уроку (leaderboard)
CREATE INDEX IF NOT EXISTS idx_progress_lesson
  ON LessonProgress(lessonId);

-- Комбинированный индекс для leaderboard: lessonId + completed
CREATE INDEX IF NOT EXISTS idx_progress_lesson_completed
  ON LessonProgress(lessonId, completed);

-- ── Lesson ─────────────────────────────────────────────────────────────────
-- Частые запросы:
--   WHERE courseId = ? ORDER BY order ASC   → idx_lesson_course_order

CREATE INDEX IF NOT EXISTS idx_lesson_course_order
  ON Lesson(courseId, "order");

-- ── Course ─────────────────────────────────────────────────────────────────
-- Часто сортируем по createdAt DESC
CREATE INDEX IF NOT EXISTS idx_course_created
  ON Course(createdAt DESC);

-- Фильтрация по категории/предмету (для будущих фичей)
CREATE INDEX IF NOT EXISTS idx_course_category
  ON Course(category);

-- ── QuizQuestion ───────────────────────────────────────────────────────────
-- WHERE lessonId = ?
CREATE INDEX IF NOT EXISTS idx_quiz_lesson
  ON QuizQuestion(lessonId);

-- ── UserBadge ──────────────────────────────────────────────────────────────
-- WHERE userId = ?
CREATE INDEX IF NOT EXISTS idx_userbadge_user
  ON UserBadge(userId);

-- ── Badge ──────────────────────────────────────────────────────────────────
-- WHERE xpRequired <= ? (для выдачи бейджей)
CREATE INDEX IF NOT EXISTS idx_badge_xp
  ON Badge(xpRequired);

-- ── User ───────────────────────────────────────────────────────────────────
-- Сортировка лидерборда по XP
CREATE INDEX IF NOT EXISTS idx_user_xp
  ON User(xp DESC);
