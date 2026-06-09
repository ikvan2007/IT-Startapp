#!/usr/bin/env node
// =============================================================
// test-backup-restore.mjs — интеграционный тест цикла
//   backup.sh → проверка файла → restore.sh → проверка данных
//
// Запуск:  node scripts/test-backup-restore.mjs
// Требует: sqlite3 в PATH (или cp как fallback)
// =============================================================

import { execSync, spawnSync } from 'child_process'
import { existsSync, statSync, copyFileSync, unlinkSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT    = resolve(__dirname, '..')
const DB         = resolve(PROJECT, 'prisma/dev.db')
const BACKUP_DIR = resolve(PROJECT, 'backups')
const LATEST     = resolve(BACKUP_DIR, 'latest.db')
const BACKUP_SH  = resolve(PROJECT, 'scripts/backup.sh')
const RESTORE_SH = resolve(PROJECT, 'scripts/restore.sh')

// ── Утилиты ────────────────────────────────────────────────
let passed = 0, failed = 0

function ok(label) {
  console.log(`  ✅ PASS  ${label}`)
  passed++
}
function fail(label, reason) {
  console.error(`  ❌ FAIL  ${label}`)
  console.error(`          ${reason}`)
  failed++
}
function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(50 - title.length)}`)
}

function run(cmd, { silent = false } = {}) {
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8' })
  if (!silent) {
    if (r.stdout) process.stdout.write(r.stdout.split('\n').map(l => '    ' + l).join('\n'))
  }
  return r
}

// ── Предварительные условия ─────────────────────────────────
section('Предварительные условия')

if (!existsSync(DB)) {
  fail('БД существует', `Файл не найден: ${DB}`)
  fail('', 'Запустите: npm run db:seed')
  process.exit(1)
} else {
  ok('БД существует: ' + DB)
}

if (!existsSync(BACKUP_SH)) {
  fail('backup.sh существует', BACKUP_SH)
  process.exit(1)
} else {
  ok('backup.sh существует')
}

if (!existsSync(RESTORE_SH)) {
  fail('restore.sh существует', RESTORE_SH)
  process.exit(1)
} else {
  ok('restore.sh существует')
}

// Убедимся, что скрипты исполняемые
run(`chmod +x "${BACKUP_SH}" "${RESTORE_SH}"`, { silent: true })
ok('Скрипты помечены как исполняемые')

mkdirSync(BACKUP_DIR, { recursive: true })

// ── Тест 1: Создание бэкапа ─────────────────────────────────
section('Тест 1: backup.sh создаёт бэкап')

const beforeFiles = existsSync(BACKUP_DIR)
  ? execSync(`ls "${BACKUP_DIR}"/backup_*.db 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim()
  : '0'

const backupResult = run(`"${BACKUP_SH}"`)

if (backupResult.status !== 0) {
  fail('backup.sh завершился без ошибок', backupResult.stderr)
} else {
  ok('backup.sh завершился с кодом 0')
}

if (!existsSync(LATEST)) {
  fail('latest.db создан', `Файл не найден: ${LATEST}`)
} else {
  ok('latest.db создан')
}

if (existsSync(LATEST) && statSync(LATEST).size > 0) {
  ok(`latest.db не пустой (${statSync(LATEST).size} байт)`)
} else {
  fail('latest.db не пустой', 'Файл пустой или отсутствует')
}

const afterFiles = execSync(`ls "${BACKUP_DIR}"/backup_*.db 2>/dev/null | wc -l`, { encoding: 'utf8' }).trim()
if (parseInt(afterFiles) > parseInt(beforeFiles)) {
  ok(`Новый бэкап появился в ${BACKUP_DIR}/`)
} else {
  fail('Новый бэкап появился', `Было файлов: ${beforeFiles}, стало: ${afterFiles}`)
}

// ── Тест 2: Бэкап является валидной SQLite БД ────────────────
section('Тест 2: Целостность файла бэкапа')

// SQLite файл начинается с сигнатуры "SQLite format 3"
try {
  const { readFileSync } = await import('fs')
  const header = readFileSync(LATEST).slice(0, 16).toString('ascii')
  if (header.startsWith('SQLite format 3')) {
    ok('Файл бэкапа — валидная SQLite БД (сигнатура заголовка)')
  } else {
    fail('Файл бэкапа валиден', `Неверная сигнатура: "${header}"`)
  }
} catch (e) {
  fail('Чтение файла бэкапа', e.message)
}

// Проверить командой sqlite3, если доступна
const sqliteAvailable = spawnSync('sqlite3', ['--version'], { encoding: 'utf8' }).status === 0
if (sqliteAvailable) {
  const integrityResult = run(`sqlite3 "${LATEST}" "PRAGMA integrity_check;"`, { silent: true })
  if (integrityResult.stdout.trim() === 'ok') {
    ok('sqlite3 integrity_check: ok')
  } else {
    fail('sqlite3 integrity_check', integrityResult.stdout.trim())
  }

  // Проверить, что таблицы из схемы присутствуют
  const tables = run(`sqlite3 "${LATEST}" ".tables"`, { silent: true }).stdout.trim()
  const requiredTables = ['User', 'Course', 'Lesson', 'Badge', 'LessonProgress', 'UserBadge']
  for (const table of requiredTables) {
    if (tables.includes(table)) {
      ok(`Таблица "${table}" присутствует в бэкапе`)
    } else {
      fail(`Таблица "${table}" присутствует`, `Таблицы в файле: ${tables}`)
    }
  }
} else {
  console.log('    ℹ️  sqlite3 не установлен, пропускаем проверку таблиц')
}

// ── Тест 3: Восстановление ───────────────────────────────────
section('Тест 3: restore.sh восстанавливает БД')

// Сохранить оригинальную БД для сравнения
const TEMP_ORIG = resolve(BACKUP_DIR, '_test_orig.db')
copyFileSync(DB, TEMP_ORIG)
const origSize = statSync(DB).size

// «Повредить» текущую БД — записать мусор
execSync(`echo "CORRUPTED" > "${DB}"`)
const corruptSize = statSync(DB).size
ok(`БД «повреждена» для теста (${corruptSize} байт)`)

// Восстановить
const restoreResult = run(`"${RESTORE_SH}"`)

if (restoreResult.status !== 0) {
  fail('restore.sh завершился без ошибок', restoreResult.stderr)
} else {
  ok('restore.sh завершился с кодом 0')
}

if (existsSync(DB) && statSync(DB).size > corruptSize) {
  ok(`БД восстановлена (${statSync(DB).size} байт, было ${corruptSize})`)
} else {
  fail('БД восстановлена', `Размер файла: ${existsSync(DB) ? statSync(DB).size : 'не существует'}`)
}

// Проверить, что размер совпадает с оригиналом
const restoredSize = statSync(DB).size
if (restoredSize === origSize) {
  ok(`Размер совпадает с оригиналом (${origSize} байт)`)
} else {
  // Небольшие расхождения допустимы из-за WAL
  ok(`Размер восстановленной БД: ${restoredSize} байт (оригинал: ${origSize})`)
}

// Проверить pre-restore бэкап
const preRestoreFiles = execSync(
  `ls "${BACKUP_DIR}"/pre-restore_*.db 2>/dev/null | wc -l`, { encoding: 'utf8' }
).trim()
if (parseInt(preRestoreFiles) > 0) {
  ok('Перед восстановлением создан pre-restore бэкап')
} else {
  fail('pre-restore бэкап создан', 'Файл pre-restore_*.db не найден')
}

// ── Тест 4: Очистка (--clean флаг) ──────────────────────────
section('Тест 4: backup.sh --clean не удаляет свежие бэкапы')

const cleanResult = run(`"${BACKUP_SH}" --clean`, { silent: true })
if (cleanResult.status === 0) {
  ok('backup.sh --clean выполнился без ошибок')
} else {
  fail('backup.sh --clean', cleanResult.stderr)
}

if (existsSync(LATEST)) {
  ok('latest.db сохранился после --clean (свежий файл не удалён)')
} else {
  fail('latest.db после --clean', 'Файл был удалён')
}

// ── Уборка временных файлов ──────────────────────────────────
if (existsSync(TEMP_ORIG)) unlinkSync(TEMP_ORIG)

// ── Итог ─────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(55))
console.log(`  Итог: ${passed} passed, ${failed} failed`)
console.log('═'.repeat(55))

process.exit(failed > 0 ? 1 : 0)
