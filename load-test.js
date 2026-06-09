import http from 'k6/http';
import { sleep, check, group } from 'k6';

// ─────────────────────────────────────────────
// НАГРУЗОЧНЫЕ ТЕСТЫ — k6
// Установка:
//   Windows:  winget install grafana.k6
//   macOS:    brew install k6
//
// Запуск: k6 run load-test.js
// Перед запуском: npm run dev
// ─────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000';

export const options = {
  vus: 10,          // 10 одновременных виртуальных пользователей
  duration: '30s',  // Общая длительность теста
  thresholds: {
    // 95% запросов должны выполняться быстрее 2 секунд
    http_req_duration: ['p(95)<2000'],
    // Менее 5% запросов должны завершаться ошибкой
    http_req_failed: ['rate<0.05'],
  },
};

// Тестовые данные
const CREDENTIALS = {
  email: 'student@edu.ru',
  password: 'password123',
};

// ── Вспомогательная функция: получить сессионную cookie ──
function login() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(CREDENTIALS),
    { headers: { 'Content-Type': 'application/json' } }
  );
  // Возвращаем jar с cookie для авторизованных запросов
  return res.cookies;
}

// ── Главный сценарий нагрузки ──
export default function () {
  // ── Группа 1: Публичные страницы ──
  group('Публичные страницы', () => {
    const resMain = http.get(`${BASE_URL}/`);
    check(resMain, {
      'Главная: статус 200': (r) => r.status === 200,
      'Главная: содержит Study Task': (r) => r.body.includes('Study Task'),
    });

    const resCourses = http.get(`${BASE_URL}/courses`);
    check(resCourses, {
      'Страница курсов: статус 200': (r) => r.status === 200,
    });

    const resLeaderboard = http.get(`${BASE_URL}/leaderboard`);
    check(resLeaderboard, {
      'Лидерборд: статус 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  // ── Группа 2: API эндпоинты ──
  group('API: курсы', () => {
    const resCourses = http.get(`${BASE_URL}/api/courses`);
    check(resCourses, {
      'GET /api/courses: статус 200': (r) => r.status === 200,
      'GET /api/courses: возвращает массив': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  // ── Группа 3: Аутентификация ──
  group('API: аутентификация', () => {
    const resLogin = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify(CREDENTIALS),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(resLogin, {
      'POST /api/auth/login: статус 200': (r) => r.status === 200,
      'POST /api/auth/login: содержит user': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.user !== undefined;
        } catch {
          return false;
        }
      },
    });

    // Тест на неверные credentials
    const resBadLogin = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'bad@test.ru', password: 'wrongpass' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(resBadLogin, {
      'Неверный логин: статус 400 или 401': (r) =>
        r.status === 400 || r.status === 401,
    });
  });

  sleep(1);

  // ── Группа 4: Статические ресурсы ──
  group('Страницы входа и регистрации', () => {
    const resLogin = http.get(`${BASE_URL}/login`);
    check(resLogin, {
      'Страница /login: статус 200': (r) => r.status === 200,
    });

    const resRegister = http.get(`${BASE_URL}/register`);
    check(resRegister, {
      'Страница /register: статус 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
