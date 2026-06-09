// __tests__/future.test.ts
//
// FutureTest — запланированные тесты (TODO)
// Скелет тестов для функций, которые будут реализованы.
// Все тесты помечены .todo и НЕ ломают CI.

describe('FutureTest: Quiz', () => {
  it.todo('POST /api/lessons/[lessonId]/quiz/check — верный ответ принимается')
  it.todo('POST /api/lessons/[lessonId]/quiz/check — неверный ответ возвращает ошибку')
  it.todo('повторная попытка quiz не начисляет XP дважды')
})

describe('FutureTest: Стрик (streak)', () => {
  it.todo('GET /api/profile — содержит поле streak (дни подряд)')
  it.todo('ежедневный вход увеличивает streak на 1')
  it.todo('пропуск дня сбрасывает streak')
  it.todo('XP-бонус за недельный стрик')
})

describe('FutureTest: Уведомления', () => {
  it.todo('POST /api/notifications — создаёт уведомление в очереди Bull')
  it.todo('GET /api/notifications — возвращает список уведомлений пользователя')
  it.todo('уведомление о новом значке попадает в очередь badge-check')
})

describe('FutureTest: Управление курсами (teacher)', () => {
  it.todo('PATCH /api/teacher/courses/[id] — обновить курс')
  it.todo('POST /api/teacher/courses/[id]/lessons — добавить урок')
  it.todo('DELETE /api/teacher/lessons/[id] — удалить урок (cascade прогресс)')
})

describe('FutureTest: Прогресс и статистика', () => {
  it.todo('GET /api/courses/[id] — содержит процент прохождения для авторизованного')
  it.todo('завершение всех уроков курса выдаёт course completion badge')
  it.todo('GET /api/progress — возвращает кэшированный ответ (X-Cache: HIT)')
})

describe('FutureTest: Безопасность', () => {
  it.todo('rate limiting login — более 5 попыток с одного IP блокируются')
  it.todo('rate limiting register — более 3 попыток в час блокируются')
  it.todo('SQL injection — спецсимволы в email не ломают запрос')
  it.todo('XSS — HTML в поле name экранируется при выводе')
})

describe('FutureTest: Redis / Bull интеграция', () => {
  it.todo('воркер обрабатывает задачу из очереди xp-update')
  it.todo('воркер обрабатывает задачу из очереди badge-check')
  it.todo('воркер корректно завершается по SIGTERM')
  it.todo('сбой воркера не теряет задачу (Bull retry x3)')
  it.todo('кэш инвалидируется после завершения урока')
})

describe('FutureTest: Индексы и производительность', () => {
  it.todo('EXPLAIN QUERY PLAN — запрос лидерборда использует idx_progress_lesson_completed')
  it.todo('EXPLAIN QUERY PLAN — запрос прогресса использует idx_progress_user')
  it.todo('1000 параллельных запросов GET /api/courses — ответ < 200ms')
})

describe('FutureTest: Бэкап и восстановление', () => {
  it.todo('бэкап при запущенных транзакциях не корруптирует данные')
  it.todo('восстановление из бэкапа сохраняет все записи LessonProgress')
})
