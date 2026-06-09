#!/usr/bin/env node
// scripts/backup.mjs — Windows-совместимый бэкап
// Запуск: node scripts/backup.mjs

import { existsSync, statSync, copyFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function pad2(n) { return String(n).padStart(2, '0') }
function timestamp() {
  const d = new Date()
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
}

const DB_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const DB_PATH = join(ROOT, DB_URL.replace('file:', ''))
const BACKUP_DIR = process.env.BACKUP_DIR || join(ROOT, 'backups')
const KEEP_DAYS = parseInt(process.env.BACKUP_KEEP_DAYS || '7', 10)
const CLEAN = process.argv.includes('--clean')

if (!existsSync(DB_PATH)) {
  console.error(`ОШИБКА: База данных не найдена: ${DB_PATH}`)
  console.error(`Сначала запустите: npm run db:seed`)
  process.exit(1)
}

mkdirSync(BACKUP_DIR, { recursive: true })

const BACKUP_FILE = join(BACKUP_DIR, `db_backup_${timestamp()}.sqlite`)
const CHECKSUM_FILE = BACKUP_FILE + '.sha256'

console.log('Бэкап базы данных Study Task')
console.log(`  Источник  : ${DB_PATH}`)
console.log(`  Назначение: ${BACKUP_FILE}`)
console.log(`  Время     : ${new Date().toLocaleString()}\n`)

copyFileSync(DB_PATH, BACKUP_FILE)
console.log('OK Бэкап создан')

const hash = createHash('sha256').update(readFileSync(BACKUP_FILE)).digest('hex')
writeFileSync(CHECKSUM_FILE, `${hash}  ${BACKUP_FILE}\n`)
console.log(`OK Контрольная сумма: ${hash.slice(0, 16)}...`)

const size = (statSync(BACKUP_FILE).size / 1024).toFixed(1)
console.log(`OK Размер бэкапа: ${size} KB`)

if (CLEAN) {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  const old = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('db_backup_') && f.endsWith('.sqlite'))
    .map(f => join(BACKUP_DIR, f))
    .filter(f => statSync(f).mtimeMs < cutoff)
  old.forEach(f => { try { unlinkSync(f); unlinkSync(f + '.sha256') } catch {} })
  console.log(`\nУдалено старых бэкапов: ${old.length}`)
}

const total = readdirSync(BACKUP_DIR).filter(f => f.startsWith('db_backup_') && f.endsWith('.sqlite')).length
console.log(`\nГотово! Всего бэкапов: ${total}`)
