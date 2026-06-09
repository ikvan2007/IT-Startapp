#!/usr/bin/env node
// scripts/test-backup-restore.mjs
// Тест цикла бэкап -> восстановление (Windows-совместимый)
// Запуск: node scripts/test-backup-restore.mjs

import {
  existsSync, statSync, readFileSync,
  writeFileSync, unlinkSync, mkdirSync, readdirSync, copyFileSync
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  \u2705 ${name}`)
    passed++
  } catch (e) {
    console.log(`  \u274C ${name}: ${e.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

function md5(filePath) {
  return createHash('md5').update(readFileSync(filePath)).digest('hex')
}

function pad2(n) { return String(n).padStart(2, '0') }

function timestamp() {
  const d = new Date()
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
}

const DB_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const DB_PATH = join(ROOT, DB_URL.replace('file:', ''))
const BACKUP_DIR = join(ROOT, 'backups')
const BACKUP_FILE = join(BACKUP_DIR, `db_backup_${timestamp()}.sqlite`)
const TEMP_RESTORE = join(BACKUP_DIR, '_test_restore.sqlite')

console.log('\n\uD83E\uDDEA Тест бэкапа и восстановления\n')
console.log(`   БД         : ${DB_PATH}`)
console.log(`   Бэкап-папка: ${BACKUP_DIR}\n`)

// 0. БД существует
test('БД существует и не пустая', () => {
  assert(existsSync(DB_PATH), `Файл БД не найден: ${DB_PATH}. Запустите npm run db:seed`)
  const size = statSync(DB_PATH).size
  assert(size > 0, 'БД пустая')
  console.log(`     Размер: ${(size / 1024).toFixed(1)} KB`)
})

const originalMd5 = existsSync(DB_PATH) ? md5(DB_PATH) : null

// 1. Создать бэкап
test('Бэкап создаётся (копирование файла)', () => {
  mkdirSync(BACKUP_DIR, { recursive: true })
  copyFileSync(DB_PATH, BACKUP_FILE)
  assert(existsSync(BACKUP_FILE), 'Файл бэкапа не создан')
  console.log(`     Файл: ${BACKUP_FILE}`)
})

// 2. Бэкап не пустой
test('Бэкап не пустой', () => {
  assert(existsSync(BACKUP_FILE), 'Файл бэкапа не найден')
  const size = statSync(BACKUP_FILE).size
  assert(size > 0, 'Бэкап пустой')
  console.log(`     Размер: ${(size / 1024).toFixed(1)} KB`)
})

// 3. Контрольная сумма
test('Контрольная сумма совпадает с оригиналом', () => {
  assert(originalMd5, 'Нет MD5 оригинала')
  const backupMd5 = md5(BACKUP_FILE)
  assert(originalMd5 === backupMd5, `MD5 не совпадает!\n  Оригинал: ${originalMd5}\n  Бэкап:    ${backupMd5}`)
})

// 4. Восстановление
test('Восстановление из бэкапа', () => {
  copyFileSync(BACKUP_FILE, TEMP_RESTORE)
  assert(existsSync(TEMP_RESTORE), 'Восстановленный файл не создан')
})

// 5. Идентичность
test('Восстановленный файл идентичен оригиналу (MD5)', () => {
  assert(originalMd5, 'Нет MD5 оригинала')
  assert(existsSync(TEMP_RESTORE), 'Нет восстановленного файла')
  const restoredMd5 = md5(TEMP_RESTORE)
  assert(
    originalMd5 === restoredMd5,
    `MD5 не совпадает!\n  Оригинал    : ${originalMd5}\n  Восстановлен: ${restoredMd5}`
  )
})

// 6. Список бэкапов
test('Папка backups содержит бэкапы', () => {
  const files = readdirSync(BACKUP_DIR).filter(f => f.startsWith('db_backup_') && f.endsWith('.sqlite'))
  assert(files.length > 0, 'Нет файлов бэкапа в папке backups/')
  console.log(`     Всего бэкапов: ${files.length}`)
})

// Cleanup
if (existsSync(TEMP_RESTORE)) { try { unlinkSync(TEMP_RESTORE) } catch {} }

// Итог
console.log(`\n${'-'.repeat(45)}`)
console.log(`Результат: ${passed} passed  ${failed} failed`)
if (failed > 0) {
  console.log('FAIL\n')
  process.exit(1)
} else {
  console.log('PASS - Все тесты пройдены!\n')
}
