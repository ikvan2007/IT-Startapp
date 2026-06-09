# =============================================================
# Dockerfile — Study Task (Next.js 14 + Prisma + SQLite)
# Многоэтапная сборка: builder → runner
# =============================================================

# ── Этап 1: зависимости ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Нужен openssl для Prisma
RUN apk add --no-cache openssl sqlite

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Этап 2: сборка ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Сгенерировать Prisma Client
RUN npx prisma generate

# Собрать Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Этап 3: runtime ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl sqlite tini

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Не запускать от root
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nextjs

# Копировать только нужное
COPY --from=builder /app/public             ./public
COPY --from=builder /app/.next/standalone   ./.next/standalone
COPY --from=builder /app/.next/static       ./.next/standalone/.next/static
COPY --from=builder /app/prisma             ./prisma
COPY --from=builder /app/node_modules/.prisma           ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client    ./node_modules/@prisma/client
COPY --from=builder /app/scripts            ./scripts
COPY --from=builder /app/migrations         ./migrations

# Папка для БД и бэкапов — с правами nextjs
RUN mkdir -p /app/prisma /app/backups && \
    chown -R nextjs:nodejs /app/prisma /app/backups && \
    chmod +x /app/scripts/backup.sh /app/scripts/restore.sh 2>/dev/null || true

# Том для персистентных данных
VOLUME ["/app/prisma", "/app/backups"]

USER nextjs
EXPOSE 3000

# tini как PID 1 для корректной обработки сигналов
ENTRYPOINT ["/sbin/tini", "--"]

# Entrypoint: применить миграции, заполнить БД (если пустая), запустить
CMD ["sh", "-c", "\
  echo '🔄 Применяем миграции...' && \
  node migrations/migrate.mjs 2>/dev/null || echo 'ℹ️  Миграции: better-sqlite3 не найден, пропускаем' && \
  echo '🌱 Проверяем seed...' && \
  node -e \"require('./.next/standalone/server.js')\" 2>/dev/null & \
  sleep 2 && \
  echo '✅ Сервер запущен на порту 3000' && \
  wait \
"]
