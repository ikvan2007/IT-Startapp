#!/usr/bin/env bash
# =============================================================
# restore.sh — восстановление базы из резервной копии
#
# Использование:
#   ./scripts/restore.sh                        # восстановить из latest.db
#   ./scripts/restore.sh backups/backup_X.db    # из конкретного файла
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [restore.sh]"

# ── Выбор файла для восстановления ───────────────────────────
if [[ -n "${1:-}" ]]; then
  SOURCE="$1"
  # Если передан относительный путь — разворачиваем от PROJECT_DIR
  if [[ "$SOURCE" != /* ]]; then
    SOURCE="$PROJECT_DIR/$SOURCE"
  fi
else
  SOURCE="$BACKUP_DIR/latest.db"
fi

if [ ! -f "$SOURCE" ]; then
  echo "$LOG_PREFIX ERROR: файл не найден: $SOURCE" >&2
  echo "Доступные бэкапы:" >&2
  ls -lh "$BACKUP_DIR"/backup_*.db 2>/dev/null || echo "  (нет бэкапов)" >&2
  exit 1
fi

echo "$LOG_PREFIX Источник: $SOURCE ($(du -sh "$SOURCE" | cut -f1))"

# ── Сохранить текущую БД как pre-restore бэкап ───────────────
if [ -f "$DB_PATH" ]; then
  PRE="$BACKUP_DIR/pre-restore_$(date +%Y-%m-%d_%H-%M-%S).db"
  cp "$DB_PATH" "$PRE"
  echo "$LOG_PREFIX Текущая БД сохранена как: $PRE"
fi

# ── Восстановление ───────────────────────────────────────────
cp "$SOURCE" "$DB_PATH"

if [ ! -s "$DB_PATH" ]; then
  echo "$LOG_PREFIX ERROR: восстановленная БД пуста" >&2
  exit 1
fi

echo "$LOG_PREFIX OK: база восстановлена -> $DB_PATH"
echo "$LOG_PREFIX DONE"
