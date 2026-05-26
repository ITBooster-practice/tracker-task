# ─────────────────────────────────────────────────────────────────────────────
# Этап 1: Сборка
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Активируем pnpm — версия зафиксирована полем packageManager в корневом package.json
RUN corepack enable

# ── Сначала копируем манифесты воркспейса (кэш слоя инвалидируется только при смене зависимостей)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./

# Копируем package.json каждого пакета (только объявления зависимостей, без исходников)
COPY apps/web/package.json                   ./apps/web/
COPY packages/eslint-config/package.json     ./packages/eslint-config/
COPY packages/types/package.json             ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json                ./packages/ui/
COPY packages/vitest-config/package.json     ./packages/vitest-config/

RUN pnpm install --frozen-lockfile

# ── Копируем исходный код (после установки зависимостей — для лучшего кэширования)
COPY apps/web  ./apps/web
COPY packages  ./packages

# Собираем @repo/types — web использует его как production-зависимость,
# а он экспортирует из dist/, которого нет без предварительной сборки.
RUN pnpm --filter=@repo/types build

# Отключаем телеметрию Next.js во время сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем Next.js.
# Так как в next.config.js задан output: 'standalone' и outputFileTracingRoot
# указывает на корень монорепо, результат окажется в apps/web/.next/standalone/
# и будет содержать все общие пакеты из монорепо.
RUN pnpm --filter=web build

# ─────────────────────────────────────────────────────────────────────────────
# Этап 2: Запуск
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# При outputFileTracingRoot = корень монорепо Next.js зеркалирует структуру
# монорепо внутри .next/standalone:
#   .next/standalone/
#     apps/web/server.js   ← точка входа
#     node_modules/        ← минимальные runtime-зависимости
#
# Статические ресурсы (JS/CSS-чанки) и public должны лежать по путям,
# которые server.js ожидает относительно рабочей директории.
COPY --from=builder /app/apps/web/.next/standalone   ./
COPY --from=builder /app/apps/web/.next/static        ./apps/web/.next/static
COPY --from=builder /app/apps/web/public              ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
