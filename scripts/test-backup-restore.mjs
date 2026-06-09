#!/usr/bin/env node
// scripts/test-backup-restore.mjs
//
// Тест цикла бэкап → восстановление
// Запуск: node scripts/test-backup-restore.mjs
//
// Что проверяет:
//   1. Создаёт бэкап
//   2. Проверяет, что файл создался и не пустой
//   3. Проверяет контрольную сумму
//   4. Восстанавливает в temp-файл
//   5. Сравнивает MD5 оригинала и восстановленного

import { execSync, spawnSync } from 'child_process'
import { existsSync, statSync, readFileSync, unlinkSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Утилиты ───────────────────────────────────────────────────────────────
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

function md5(filePath) {
  const content = readFileSync(filePath)
  return createHash('md5').update(content).digest('hex')
}

// ── Конфигурация ──────────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const DB_PATH = join(ROOT, DB_URL.replace('file:', ''))
const BACKUP_DIR = join(ROOT, 'backups')
const TEMP_RESTORE = join(ROOT, 'backups', '_test_restore.sqlite')

console.log('\n🧪 Тест бэкапа и восстановления\n')
console.log(`   БД        : ${DB_PATH}`)
console.log(`   Бэкап-папка: ${BACKUP_DIR}\n`)

// ── Шаг 0: проверить наличие БД ───────────────────────────────────────────
test('БД существует', () => {
  assert(existsSync(DB_PATH), `Файл БД не найден: ${DB_PATH}`)
  const size = statSync(DB_PATH).size
  assert(size > 0, `БД пустая: ${DB_PATH}`)
  console.log(`     Размер: ${(size / 1024).toFixed(1)} KB`)
})

const originalMd5 = existsSync(DB_PATH) ? md5(DB_PATH) : null

// ── Шаг 1: запустить backup.sh ───────────────────────────────────────────
let backupFile = null

test('backup.sh выполняется без ошибок', () => {
  const result = spawnSync(
    'bash',
    [join(ROOT, 'scripts', 'backup.sh')],
    {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: DB_URL, BACKUP_DIR },
      encoding: 'utf8',
    }
  )
  assert(result.status === 0, `Скрипт завершился с кодом ${result.status}:\n${result.stderr}`)

  // Найти созданный файл
  const { readdirSync } = await import('fs').catch(() => ({ readdirSync: null }))
  // Используем sync вместо import
  const { readdirSync: rd } = await (async () => {
    const fs = await import('fs')
    return fs
  })()
})

// Обходим async import в sync-контексте:
const { readdirSync } = { readdirSync: (await import('fs')).readdirSync }

test('Файл бэкапа создан', () => {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('db_backup_') && f.endsWith('.sqlite'))
    .sort()
  assert(files.length > 0, 'Нет файлов бэкапа в папке backups/')
  backupFile = join(BACKUP_DIR, files[files.length - 1])
  console.log(`     Файл: ${files[files.length - 1]}`)
})

test('Бэкап не пустой', () => {
  assert(backupFile && existsSync(backupFile), 'Файл бэкапа не найден')
  const size = statSync(backupFile).size
  assert(size > 0, 'Файл бэкапа пустой')
  console.log(`     Размер: ${(size / 1024).toFixed(1)} KB`)
})

test('Контрольная сумма существует', () => {
  assert(backupFile, 'Нет файла бэкапа')
  const checksumFile = backupFile + '.sha256'
  assert(existsSync(checksumFile), `Файл контрольной суммы не найден: ${checksumFile}`)
})

// ── Шаг 2: восстановить во временный файл ────────────────────────────────
test('restore.sh восстанавливает файл', () => {
  assert(backupFile, 'Нет файла бэкапа для восстановления')

  const result = spawnSync(
    'bash',
    [join(ROOT, 'scripts', 'restore.sh'), backupFile],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        DATABASE_URL: `file:${TEMP_RESTORE}`,
        BACKUP_DIR,
      },
      encoding: 'utf8',
    }
  )
  assert(result.status === 0, `restore.sh завершился с кодом ${result.status}:\n${result.stderr}`)
  assert(existsSync(TEMP_RESTORE), 'Восстановленный файл не создан')
})

test('Восстановленный файл идентичен оригиналу (MD5)', () => {
  assert(originalMd5, 'Нет MD5 оригинала')
  assert(existsSync(TEMP_RESTORE), 'Нет восстановленного файла')
  const restoredMd5 = md5(TEMP_RESTORE)
  assert(
    originalMd5 === restoredMd5,
    `MD5 не совпадает!\n  Оригинал : ${originalMd5}\n  Восстановл: ${restoredMd5}`
  )
})

// ── Шаг 3: cleanup ────────────────────────────────────────────────────────
if (existsSync(TEMP_RESTORE)) {
  try { unlinkSync(TEMP_RESTORE) } catch {}
}
const beforeRestore = DB_PATH + '.before_restore_*'
// Удалить temp backup of current DB created by restore.sh
try {
  execSync(`find "${join(ROOT, 'prisma')}" -name "*.before_restore_*" -delete 2>/dev/null || true`)
} catch {}

// ── Итог ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(45)}`)
console.log(`Результат: ${passed} ✅  ${failed} ❌`)
if (failed > 0) {
  console.log('❌ Тест НЕ ПРОЙДЕН\n')
  process.exit(1)
} else {
  console.log('✅ Все тесты пройдены!\n')
}
