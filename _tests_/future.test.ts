// __tests__/future.test.ts
//
// FutureTest — запланированные тесты (TODO)
// Это скелет тестов для функций, которые будут реализованы.
// Все тесты помечены .todo или .skip и НЕ ломают CI.

describe('FutureTest: Quiz (тесты по урокам)', () => {
  it.todo('POST /api/lessons/:id/quiz — принимает ответ и возвращает результат')
  it.todo('POST /api/lessons/:id/quiz — неверный ответ не даёт XP')
  it.todo('POST /api/lessons/:id/quiz — верный ответ засчитывается')
  it.todo('повторное прохождение quiz не даёт XP дважды')
})

describe('FutureTest: Стрик (streak)', () => {
  it.todo('GET /api/profile — содержит поле streak (дни подряд)')
  it.todo('ежедневный вход увеличивает streak на 1')
  it.todo('пропуск дня сбрасывает streak')
  it.todo('XP-бонус за недельный стрик')
})

describe('FutureTest: Уведомления', () => {
  it.todo('POST /api/notifications — создаёт уведомление в очереди')
  it.todo('GET /api/notifications — возвращает список уведомлений пользователя')
  it.todo('уведомление об новом значке попадает в Bull-очередь')
})

describe('FutureTest: Управление курсами (учитель)', () => {
  it.todo('PATCH /api/courses/:id — обновить курс (только teacher)')
  it.todo('POST /api/courses/:id/lessons — добавить урок в курс')
  it.todo('DELETE /api/lessons/:id — удалить урок (cascade прогресс)')
})

describe('FutureTest: Прогресс и статистика', () => {
  it.todo('GET /api/courses/:id — содержит процент прохождения для авторизованного')
  it.todo('GET /api/stats — общая статистика платформы (для teacher)')
  it.todo('завершение всех уроков курса выдаёт course completion badge')
})

describe('FutureTest: Безопасность', () => {
  it.todo('rate limiting — более 10 неверных попыток входа блокируются')
  it.todo('CSRF — POST без CSRF-токена отклоняется (если включён)')
  it.todo('SQL injection — спецсимволы в email не ломают запрос')
  it.todo('XSS — HTML в поле name экранируется при выводе')
})

describe('FutureTest: Интеграция с Redis / Bull', () => {
  it.todo('воркер обрабатывает задачу из очереди xp-awards')
  it.todo('воркер корректно завершается по SIGTERM')
  it.todo('сбой воркера не теряет задачу (Bull retry)')
})

describe('FutureTest: Бэкап и восстановление (расширенные)', () => {
  it.todo('бэкап при запущенных транзакциях не корруптирует данные')
  it.todo('восстановление из бэкапа сохраняет все записи LessonProgress')
  it.todo('cron запускается точно в 02:00')
})
