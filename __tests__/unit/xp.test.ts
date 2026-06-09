// __tests__/unit/xp.test.ts
//
// Unit-тесты для логики XP и уровней
// В нашем проекте формула: level = floor(xp / 100) + 1
// Запуск: npx jest __tests__/unit/xp.test.ts

// Вынесем логику расчёта уровня (дублируем из прогресс-роута для тестируемости)
const XP_PER_LEVEL = 100

function calculateLevel(xp: number): number {
  return Math.min(99, Math.floor(xp / XP_PER_LEVEL) + 1)
}

function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL)
}

describe('XP utilities', () => {
  describe('calculateLevel', () => {
    it('уровень 1 при 0 XP',   () => expect(calculateLevel(0)).toBe(1))
    it('уровень 1 при 99 XP',  () => expect(calculateLevel(99)).toBe(1))
    it('уровень 2 при 100 XP', () => expect(calculateLevel(100)).toBe(2))
    it('уровень 2 при 150 XP', () => expect(calculateLevel(150)).toBe(2))
    it('уровень 2 при 199 XP', () => expect(calculateLevel(199)).toBe(2))
    it('уровень 3 при 200 XP', () => expect(calculateLevel(200)).toBe(3))
    it('уровень 6 при 500 XP', () => expect(calculateLevel(500)).toBe(6))
    it('не уходит ниже 1',     () => expect(calculateLevel(0)).toBeGreaterThanOrEqual(1))
    it('не превышает 99',      () => expect(calculateLevel(999999)).toBe(99))

    it.each([
      [0, 1], [50, 1], [99, 1],
      [100, 2], [199, 2],
      [200, 3], [300, 4], [400, 5], [500, 6], [1000, 11],
    ])('calculateLevel(%i) === %i', (xp, level) => {
      expect(calculateLevel(xp)).toBe(level)
    })
  })

  describe('xpToNextLevel', () => {
    it('при 0 XP нужно 100',                    () => expect(xpToNextLevel(0)).toBe(100))
    it('при 50 XP нужно 50',                    () => expect(xpToNextLevel(50)).toBe(50))
    it('при 99 XP нужно 1',                     () => expect(xpToNextLevel(99)).toBe(1))
    it('при 100 XP нужно 100 (новый уровень)',  () => expect(xpToNextLevel(100)).toBe(100))
    it('при 150 XP нужно 50',                   () => expect(xpToNextLevel(150)).toBe(50))

    it('результат всегда от 1 до 100', () => {
      for (let xp = 0; xp < 500; xp++) {
        const needed = xpToNextLevel(xp)
        expect(needed).toBeGreaterThanOrEqual(1)
        expect(needed).toBeLessThanOrEqual(100)
      }
    })
  })
})
