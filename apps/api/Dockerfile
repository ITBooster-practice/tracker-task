# ─────────────────────────────────────────────────────────────────────────────
# Этап 1: Сборка
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Инструменты для компиляции нативных модулей (argon2)
RUN apk add --no-cache python3 make g++

# Активируем pnpm — версия зафиксирована полем packageManager в корневом package.json
RUN corepack enable

# ── Сначала копируем манифесты воркспейса (кэш слоя инвалидируется только при смене зависимостей)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./

# Копируем package.json каждого пакета (только объявления зависимостей, без исходников)
COPY apps/api/package.json                   ./apps/api/
COPY packages/eslint-config/package.json     ./packages/eslint-config/
COPY packages/types/package.json             ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json                ./packages/ui/
COPY packages/vitest-config/package.json     ./packages/vitest-config/

# Устанавливаем все зависимости (devDeps нужны для prisma generate и nest build)
RUN pnpm install --frozen-lockfile

# ── Копируем исходный код (после установки зависимостей — для лучшего кэширования)
COPY apps/api  ./apps/api
COPY packages  ./packages

# Фиктивный DATABASE_URL, чтобы `prisma generate` не падал без реальной БД.
# Prisma при кодогенерации только читает схему — соединение с БД не устанавливается.
ENV DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma"

# Сначала собираем @repo/types — api использует его как production-зависимость
RUN pnpm --filter=@repo/types build

# Генерируем Prisma-клиент, затем компилируем NestJS в dist/
RUN pnpm --filter=api prisma:generate
RUN pnpm --filter=api build

# ── Создаём минимальный production-bundle ────────────────────────────────────
# pnpm deploy копирует только production-зависимости (без devDeps) и корректно
# включает workspace-пакеты вроде @repo/types (через поле files → dist/).
# inject-workspace-packages=true в .npmrc включает новый режим pnpm v10:
# пакеты физически копируются в node_modules вместо симлинков на исходники.
RUN pnpm --filter=api deploy --prod /app/deploy

# Добавляем скомпилированный код и артефакты Prisma поверх deploy-bundle
RUN cp -r apps/api/dist         /app/deploy/dist      \
 && cp -r apps/api/generated    /app/deploy/generated \
 && cp -r apps/api/prisma       /app/deploy/prisma

# ─────────────────────────────────────────────────────────────────────────────
# Этап 2: Запуск
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# libstdc++ нужен скомпилированному нативному аддону argon2 (.node-файл)
RUN apk add --no-cache libstdc++

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder /app/deploy ./

EXPOSE 3000
CMD ["node", "dist/main"]
