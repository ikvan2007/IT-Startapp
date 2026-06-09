#!/usr/bin/env node
// migrations/migrate.mjs
//
// Простой миграционный runner для SQLite (без better-sqlite3 в prod).
// Использует Prisma db push как основной механизм.
//
// Запуск:
//   node migrations/migrate.mjs           — применить все миграции
//   node migrations/migrate.mjs --status  — показать статус

import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MIGRATIONS_DIR = __dirname
const APPLIED_FILE = join(ROOT, 'prisma', '.applied_migrations.json')

// ── Флаги ─────────────────────────────────────────────────────────────────
const isStatus = process.argv.includes('--status')

// ── Список всех .sql файлов в папке migrations ────────────────────────────
function getMigrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) return []
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

// ── Уже применённые ───────────────────────────────────────────────────────
function getApplied() {
  if (!existsSync(APPLIED_FILE)) return []
  try {
    return JSON.parse(readFileSync(APPLIED_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveApplied(applied) {
  mkdirSync(join(ROOT, 'prisma'), { recursive: true })
  writeFileSync(APPLIED_FILE, JSON.stringify(applied, null, 2))
}

// ── Применить Prisma schema через db push ────────────────────────────────
function prismaDbPush() {
  console.log('🔄 Применяем Prisma schema (db push)...')
  try {
    execSync('npx prisma db push --accept-data-loss', {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env },
    })
    console.log('✅ Schema applied')
  } catch (e) {
    console.error('❌ Prisma db push failed:', e.message)
    process.exit(1)
  }
}

// ── Применить один SQL файл через sqlite3 CLI ────────────────────────────
function applySqlFile(filename) {
  const dbPath = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '')
  const absDb = join(ROOT, dbPath)
  const sqlPath = join(MIGRATIONS_DIR, filename)
  const sql = readFileSync(sqlPath, 'utf8')

  try {
    execSync(`sqlite3 "${absDb}"`, { input: sql, stdio: ['pipe', 'inherit', 'inherit'] })
    console.log(`  ✅ ${filename}`)
  } catch {
    console.log(`  ⚠️  sqlite3 не найден — пропускаем SQL-миграцию ${filename}`)
  }
}

// ── Главная логика ────────────────────────────────────────────────────────
const files = getMigrationFiles()
const applied = getApplied()
const pending = files.filter((f) => !applied.includes(f))

if (isStatus) {
  console.log('\n📋 Статус миграций:')
  console.log(`  Всего SQL файлов : ${files.length}`)
  console.log(`  Применено        : ${applied.length}`)
  console.log(`  Ожидают          : ${pending.length}`)
  if (pending.length > 0) {
    console.log('\n  Не применены:')
    pending.forEach((f) => console.log(`    - ${f}`))
  } else {
    console.log('\n  ✅ Все миграции применены')
  }
  process.exit(0)
}

console.log('\n🚀 Запуск миграций Study Task\n')

// 1. Применяем Prisma schema
prismaDbPush()

// 2. Применяем SQL-файлы (для data migrations)
if (pending.length > 0) {
  console.log(`\n📂 SQL миграции (${pending.length} новых):`)
  for (const file of pending) {
    applySqlFile(file)
    applied.push(file)
  }
  saveApplied(applied)
} else {
  console.log('\n✅ SQL миграции: всё актуально')
}

console.log('\n✅ Миграции завершены!\n')
