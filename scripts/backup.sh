#!/bin/bash
# scripts/backup.sh
#
# Резервное копирование SQLite базы данных
#
# Запуск:
#   bash scripts/backup.sh           — создать бэкап
#   bash scripts/backup.sh --clean   — создать бэкап + удалить старые
#
# Переменные окружения:
#   DATABASE_URL     — путь к БД (file:./prisma/dev.db)
#   BACKUP_KEEP_DAYS — сколько дней хранить бэкапы (default: 7)
#   BACKUP_DIR       — папка для бэкапов (default: ./backups)

set -euo pipefail

# ── Настройки ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"
DB_PATH="${DATABASE_URL#file:}"
# Если путь относительный — относительно корня проекта
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$ROOT_DIR/$DB_PATH"
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sqlite"
CHECKSUM_FILE="$BACKUP_FILE.sha256"

# ── Проверки ─────────────────────────────────────────────────────────────
if [ ! -f "$DB_PATH" ]; then
  echo "❌ База данных не найдена: $DB_PATH"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "🗄️  Бэкап базы данных Study Task"
echo "   Источник  : $DB_PATH"
echo "   Назначение: $BACKUP_FILE"
echo "   Время     : $(date)"
echo ""

# ── Создать бэкап через sqlite3 (онлайн-бэкап без блокировки) ───────────
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
  echo "✅ Бэкап создан через sqlite3 (online backup API)"
else
  # Fallback: просто скопировать файл
  cp "$DB_PATH" "$BACKUP_FILE"
  echo "✅ Бэкап создан (cp fallback — sqlite3 не найден)"
fi

# ── Контрольная сумма ────────────────────────────────────────────────────
if command -v sha256sum &>/dev/null; then
  sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
  echo "🔐 Контрольная сумма: $CHECKSUM_FILE"
elif command -v shasum &>/dev/null; then
  shasum -a 256 "$BACKUP_FILE" > "$CHECKSUM_FILE"
  echo "🔐 Контрольная сумма: $CHECKSUM_FILE"
fi

# ── Размер ───────────────────────────────────────────────────────────────
SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "📦 Размер бэкапа: $SIZE"

# ── Удалить старые бэкапы ────────────────────────────────────────────────
if [[ "${1:-}" == "--clean" ]]; then
  echo ""
  echo "🧹 Удаляем бэкапы старше $BACKUP_KEEP_DAYS дней..."
  DELETED=$(find "$BACKUP_DIR" -name "db_backup_*.sqlite" -mtime +"$BACKUP_KEEP_DAYS" -print -delete | wc -l)
  find "$BACKUP_DIR" -name "db_backup_*.sqlite.sha256" -mtime +"$BACKUP_KEEP_DAYS" -delete 2>/dev/null || true
  echo "   Удалено: $DELETED файлов"
fi

# ── Итог ─────────────────────────────────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "db_backup_*.sqlite" | wc -l)
echo ""
echo "✅ Готово! Всего бэкапов: $TOTAL"
echo "   Последний: $BACKUP_FILE"
