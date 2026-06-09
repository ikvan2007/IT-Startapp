#!/usr/bin/env node
// =============================================================
// migrate.mjs — простой runner Prisma-совместимых SQL-миграций
//
// Использование:
//   node migrations/migrate.mjs             # применить все новые
//   node migrations/migrate.mjs --status    # показать статус
//   node migrations/migrate.mjs --rollback  # откатить последнюю
//
// Как это работает:
//   - Читает .sql файлы из папки migrations/ по порядку имён
//   - Хранит историю в таблице _migrations внутри самой БД
//   - Применяет только те, которых ещё нет в истории
// =============================================================

import { execSync }  from 'child_process'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const PROJECT    = resolve(__dirname, '..')
const DB_PATH    = resolve(PROJECT, 'prisma/dev.db')
const MIGS_DIR   = resolve(PROJECT, 'migrations')

// ── Проверить наличие better-sqlite3 ────────────────────────
// Если не установлен — предложить установить и упасть понятно
let Database
try {
  const mod = await import('better-sqlite3')
  Database = mod.default
} catch {
  console.error('❌ Установите зависимость: npm install better-sqlite3')
  console.error('   Затем: node migrations/migrate.mjs')
  process.exit(1)
}

if (!existsSync(DB_PATH)) {
  console.error(`❌ База данных не найдена: ${DB_PATH}`)
  console.error('   Запустите: npm run db:seed')
  process.exit(1)
}

const db = new Database(DB_PATH)

// WAL-режим для безопасности
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Создать таблицу истории миграций ────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum    TEXT
  )
`)

// ── Загрузить файлы миграций ─────────────────────────────────
const migrationFiles = readdirSync(MIGS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()  // 0001_... < 0002_... и т.д.

// ── Команды ──────────────────────────────────────────────────
const args = process.argv.slice(2)

if (args.includes('--status')) {
  // Показать статус всех миграций
  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  )
  console.log('\nСтатус миграций:')
  console.log('─'.repeat(55))
  for (const file of migrationFiles) {
    const status = applied.has(file) ? '✅ applied' : '⏳ pending'
    console.log(`  ${status}  ${file}`)
  }
  if (migrationFiles.length === 0) console.log('  (нет файлов миграций)')
  console.log()
  db.close()
  process.exit(0)
}

if (args.includes('--rollback')) {
  // Откатить последнюю применённую миграцию (удалить запись)
  const last = db.prepare(
    'SELECT name FROM _migrations ORDER BY id DESC LIMIT 1'
  ).get()
  if (!last) {
    console.log('ℹ️  Нет применённых миграций для отката')
  } else {
    db.prepare('DELETE FROM _migrations WHERE name = ?').run(last.name)
    console.log(`♻️  Откат миграции: ${last.name}`)
    console.log('⚠️  SQL-изменения в SQLite не откатываются автоматически.')
    console.log('    Восстановите БД из бэкапа, если нужен полный откат данных.')
  }
  db.close()
  process.exit(0)
}

// ── Применить новые миграции ─────────────────────────────────
const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
)
const pending = migrationFiles.filter(f => !applied.has(f))

if (pending.length === 0) {
  console.log('✅ Все миграции уже применены. Ничего не делаем.')
  db.close()
  process.exit(0)
}

console.log(`\n🔄 Применяем ${pending.length} миграцию(-й)...\n`)

let successCount = 0
for (const file of pending) {
  const sql = readFileSync(resolve(MIGS_DIR, file), 'utf8')
  // Убрать комментарии и пустые строки для checksum
  const clean = sql.replace(/--[^\n]*/g, '').trim()

  try {
    // Выполнить все SQL-инструкции из файла
    db.exec(sql)
    db.prepare(
      'INSERT INTO _migrations (name, checksum) VALUES (?, ?)'
    ).run(file, Buffer.from(clean).toString('base64').slice(0, 32))
    console.log(`  ✅  ${file}`)
    successCount++
  } catch (err) {
    console.error(`  ❌  ${file}`)
    console.error(`      ${err.message}`)
    console.error('\n⛔ Миграция прервана. Исправьте ошибку и запустите снова.')
    db.close()
    process.exit(1)
  }
}

console.log(`\n✅ Применено миграций: ${successCount}`)
db.close()
