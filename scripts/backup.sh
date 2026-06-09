#!/usr/bin/env bash
# =============================================================
# backup.sh — резервное копирование SQLite базы данных
#
# Использование:
#   ./scripts/backup.sh              # создать бэкап
#   ./scripts/backup.sh --clean      # создать бэкап + удалить старые (>7 дней)
#
# Cron (каждый день в 2:00):
#   0 2 * * * /bin/bash /path/to/project/scripts/backup.sh --clean >> /var/log/studytask-backup.log 2>&1
# =============================================================

set -euo pipefail

# ── Пути ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.db"
LATEST_LINK="$BACKUP_DIR/latest.db"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [backup.sh]"

# ── Проверки ─────────────────────────────────────────────────
if [ ! -f "$DB_PATH" ]; then
  echo "$LOG_PREFIX ERROR: база данных не найдена: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# ── Создание бэкапа ──────────────────────────────────────────
echo "$LOG_PREFIX Создание бэкапа..."

# sqlite3 .backup — атомарный снимок, безопасен при работающем приложении
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
  # Fallback: обычное копирование
  cp "$DB_PATH" "$BACKUP_FILE"
fi

# Проверить, что файл создан и не пустой
if [ ! -s "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ERROR: файл бэкапа пуст или не создан" >&2
  exit 1
fi

BACKUP_SIZE="$(du -sh "$BACKUP_FILE" | cut -f1)"
echo "$LOG_PREFIX OK: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Симлинк на последний бэкап ───────────────────────────────
ln -sf "$BACKUP_FILE" "$LATEST_LINK"
echo "$LOG_PREFIX Симлинк обновлён: $LATEST_LINK -> $BACKUP_FILE"

# ── Очистка старых бэкапов (если передан флаг --clean) ───────
if [[ "${1:-}" == "--clean" ]]; then
  KEEP_DAYS=7
  DELETED=$(find "$BACKUP_DIR" -name "backup_*.db" -mtime +${KEEP_DAYS} -print -delete | wc -l)
  echo "$LOG_PREFIX Удалено старых бэкапов (>${KEEP_DAYS} дней): $DELETED"
fi

# ── Итог ─────────────────────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "backup_*.db" | wc -l)
echo "$LOG_PREFIX Всего бэкапов в $BACKUP_DIR: $TOTAL"
echo "$LOG_PREFIX DONE"
