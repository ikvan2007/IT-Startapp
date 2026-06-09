#!/bin/bash
# scripts/restore.sh
#
# Восстановление SQLite базы из бэкапа
#
# Использование:
#   bash scripts/restore.sh backups/db_backup_20240101_020000.sqlite
#   bash scripts/restore.sh --latest    — восстановить из последнего бэкапа

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"
DB_PATH="${DATABASE_URL#file:}"
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$ROOT_DIR/$DB_PATH"
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"

# ── Определить файл для восстановления ──────────────────────────────────
if [[ "${1:-}" == "--latest" ]]; then
  RESTORE_FILE=$(find "$BACKUP_DIR" -name "db_backup_*.sqlite" | sort | tail -n1)
  if [ -z "$RESTORE_FILE" ]; then
    echo "❌ Нет бэкапов в $BACKUP_DIR"
    exit 1
  fi
  echo "📂 Последний бэкап: $RESTORE_FILE"
elif [ -n "${1:-}" ]; then
  RESTORE_FILE="$1"
else
  echo "Использование: $0 <файл_бэкапа> | --latest"
  exit 1
fi

if [ ! -f "$RESTORE_FILE" ]; then
  echo "❌ Файл не найден: $RESTORE_FILE"
  exit 1
fi

# ── Проверить контрольную сумму ──────────────────────────────────────────
CHECKSUM_FILE="$RESTORE_FILE.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  echo "🔐 Проверяем контрольную сумму..."
  if command -v sha256sum &>/dev/null; then
    sha256sum -c "$CHECKSUM_FILE" && echo "   ✅ Контрольная сумма OK"
  elif command -v shasum &>/dev/null; then
    shasum -a 256 -c "$CHECKSUM_FILE" && echo "   ✅ Контрольная сумма OK"
  fi
fi

# ── Создать резервную копию текущей БД ───────────────────────────────────
if [ -f "$DB_PATH" ]; then
  CURRENT_BACKUP="$DB_PATH.before_restore_$(date +%Y%m%d_%H%M%S)"
  cp "$DB_PATH" "$CURRENT_BACKUP"
  echo "💾 Текущая БД сохранена: $CURRENT_BACKUP"
fi

echo ""
echo "🔄 Восстанавливаем из: $RESTORE_FILE"
echo "   В: $DB_PATH"

mkdir -p "$(dirname "$DB_PATH")"
cp "$RESTORE_FILE" "$DB_PATH"

echo "✅ Восстановление завершено!"
echo "   Размер: $(du -sh "$DB_PATH" | cut -f1)"
