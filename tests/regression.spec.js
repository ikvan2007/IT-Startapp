const { test, expect } = require('@playwright/test');
 
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'student@edu.ru';
const TEST_PASSWORD = 'password123';
 
// ── 1. Публичные страницы ──
 
test('Regression: Главная страница открывается', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(BASE_URL + '/');
});
 
test('Regression: Главная содержит заголовок Study Task', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('text=Study Task')).toBeVisible();
});
 
test('Regression: Страница /courses открывается', async ({ page }) => {
  await page.goto(`${BASE_URL}/courses`);
  await expect(page).toHaveURL(`${BASE_URL}/courses`);
});
 
test('Regression: Страница /login открывается', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('text=Войти')).toBeVisible();
});
 
test('Regression: Страница /register открывается', async ({ page }) => {
  await page.goto(`${BASE_URL}/register`);
  await expect(page.locator('text=Создать аккаунт')).toBeVisible();
});
 
test('Regression: Страница /leaderboard открывается', async ({ page }) => {
  await page.goto(`${BASE_URL}/leaderboard`);
  await expect(page).toHaveURL(`${BASE_URL}/leaderboard`);
});
 
// ── 2. Навигация ──
 
test('Regression: Ссылка "Курсы" в хедере работает', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click('text=Курсы');
  await expect(page).toHaveURL(`${BASE_URL}/courses`);
});
 
test('Regression: Логотип ведёт на главную', async ({ page }) => {
  await page.goto(`${BASE_URL}/courses`);
  await page.click('text=Study Task');
  await expect(page).toHaveURL(`${BASE_URL}/`);
});
 
test('Regression: Ссылка "Лидерборд" в хедере работает', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click('text=Лидерборд');
  await expect(page).toHaveURL(`${BASE_URL}/leaderboard`);
});
 
// ── 3. Форма входа ──
 
test('Regression: Форма входа имеет поле Email', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
 
test('Regression: Форма входа имеет поле Пароль', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
 
test('Regression: Неверные данные — показывается ошибка', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'nonexistent@test.ru');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(page.locator('[class*="red"]').first()).toBeVisible({ timeout: 5000 });
});
 
test('Regression: Успешный вход перенаправляет на /courses', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${BASE_URL}/courses`, { timeout: 8000 });
});
 
// ── 4. Форма регистрации ──
 
test('Regression: Форма регистрации имеет поле Имя', async ({ page }) => {
  await page.goto(`${BASE_URL}/register`);
  await expect(page.locator('input[placeholder="Иван"]')).toBeVisible();
});
 
// Пропускаем — кнопка заблокирована капчей, автоматизация невозможна
test.skip('Regression: Дублирующийся email при регистрации — ошибка', async ({ page }) => {
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[placeholder="Иван"]', 'Иван');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', 'password123');
  await page.dispatchEvent('button[type="submit"]', 'click');
  await expect(page.locator('[class*="red"]').first()).toBeVisible({ timeout: 5000 });
});
 
// ── 5. Авторизованные страницы ──
 
test('Regression: Профиль /profile доступен после входа', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/courses`, { timeout: 8000 });
  await page.goto(`${BASE_URL}/profile`);
  await expect(page).toHaveURL(`${BASE_URL}/profile`);
});
 
test('Regression: Страница курса открывается', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/courses`, { timeout: 8000 });
  const firstCourse = page.locator('a[href^="/courses/"]').first();
  await firstCourse.click();
  await expect(page).toHaveURL(/\/courses\/.+/);
});
 
test('Regression: API /api/courses возвращает 200', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/courses`);
  expect(response.status()).toBe(200);
});
 
test('Regression: API /api/auth/me без сессии возвращает 401 или пустого юзера', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/auth/me`);
  expect([200, 401]).toContain(response.status());
});
 