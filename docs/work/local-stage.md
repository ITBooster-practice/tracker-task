# Локальный stage-стенд (local-stage)

Это **второе из трёх окружений** проекта:

| #   | Окружение        | Где живёт    | Как запускается                                         |
| --- | ---------------- | ------------ | ------------------------------------------------------- |
| 1   | **dev**          | Твой ноутбук | `pnpm dev` — API/web с горячей перезагрузкой            |
| 2   | **local-stage**  | Твой ноутбук | `pnpm local:build` — сборка и запуск production-образов |
| 3   | **stage / prod** | VPS          | CI/CD или ручной деплой на сервер                       |

Цель local-stage — **убедиться, что Docker-образы собираются и работают правильно** прежде чем отправлять их на VPS.

---

Состояния флагов меняются через `/admin/feature-flags` без пересборки. Создание и подключение выполняются кодом и миграциями. Для доступа задайте `SYSTEM_DEVELOPER_USER_ID` в окружении API; [настройка разработчика](../backend/system-developer.md), [работа с флагами](./feature-flags.md). [Порядок перехода на упрощённую схему](./feature-flags.md#переход-с-прежней-модели). Для серверных запросов web Compose задаёт `API_INTERNAL_URL=http://api:3000`; браузер использует `NEXT_PUBLIC_API_URL=http://localhost/api` через Caddy.

## Что запускается

```text
браузер
  └── http://localhost         ← Caddy (реверс-прокси, порт 80)
        ├── /api/*  →  api:3000   (NestJS)
        └── /*      →  web:3000   (Next.js standalone)

http://localhost:8026           ← Mailpit (перехватчик писем, UI)
```

> Mailpit-UI вынесен на **8026**, чтобы не конфликтовать с dev-стеком,
> в котором тот же Mailpit поднят на `:8025` через `pnpm dev`.
> Внутри local-stage SMTP-порт `1025` наружу не прокинут — он доступен
> только api-контейнеру через внутреннюю docker-сеть.

**Сервисы:**

- `caddy` — реверс-прокси, имитирует nginx/caddy на VPS
- `postgres:16` — база данных
- `redis:7` — кэш и очереди задач
- `mailpit` — SMTP-ловушка: письма из API сюда попадают, но наружу не уходят
- `api` — NestJS, собранный production-образ
- `web` — Next.js standalone, собранный production-образ

---

## Первый запуск

Из **корня монорепо** выполните по порядку:

```bash
pnpm local:build
pnpm local:migrate
```

Первая команда собирает образы API и web и поднимает стек (Caddy, Postgres, Redis, Mailpit, API и web). После запуска API вторая команда применяет миграции БД. Это два отдельных действия: сборка и запуск контейнеров миграции не применяют.

`pnpm local:build` выполняет `docker compose -f docker-compose.local.yml up -d --build`. Прежняя запись `pnpm local --build` также работает. Обычный `pnpm local` запускает стек без пересборки; используйте его, когда образы уже соответствуют текущему коду.

Первая сборка скачивает зависимости. Следующие сборки используют кэш неизменившихся слоёв.

> **Почему контекст сборки — корень монорепо?**
> Оба Dockerfile копируют `pnpm-workspace.yaml`, `pnpm-lock.yaml` и `packages/` из корня. Compose задаёт `context: .` автоматически.

### Применить миграции БД

Применяйте миграции при первом запуске и после добавления новых файлов миграций, включая изменения данных без изменения схемы Prisma:

```bash
pnpm local:migrate
```

Скрипт запускает Prisma **внутри работающего контейнера API**:

```bash
docker compose -f docker-compose.local.yml exec api sh -c "node_modules/.bin/prisma migrate deploy --config prisma.config.mjs"
```

Миграции копируются в образ при сборке. Если они добавлены в репозиторий, сначала пересоберите API, иначе Prisma увидит старый набор файлов. Повторный запуск `migrate deploy` применяет только ещё не выполненные миграции.

### Адреса стенда

- **Приложение**: <http://localhost>
- **API** (корневой endpoint): <http://localhost/api/>
- **Входящие письма** (подтверждение email, сброс пароля): <http://localhost:8026>

### Проверка после запуска

Минимальный сценарий, чтобы убедиться, что стек живой:

1. Открыть <http://localhost> — должна загрузиться страница `/login`.
2. Зарегистрировать аккаунт или войти под существующим пользователем. Миграции не запускают seed автоматически и не создают тестовые аккаунты.
3. После регистрации проверить приветственное письмо в <http://localhost:8026>.

Если письмо не появилось, проверьте логи API и почтовые настройки в `apps/api/.env.local`: `MAIL_TRANSPORT=smtp`, `MAIL_HOST=mailpit`, `MAIL_PORT=1025`.

---

## Пересборка после изменений

После обновления кода или добавления миграций выполните:

```bash
pnpm local:build
pnpm local:migrate
```

Порядок: **пересобрать образы → обновить контейнеры → применить миграции**. Команда `pnpm local` без `--build` не обновляет код и файлы миграций в уже собранном образе.

Если изменился только API:

```bash
pnpm local:build api
pnpm local:migrate
```

Если изменился только web:

```bash
pnpm local:build web
```

При изменении общих пакетов, которые используют API и web, пересоберите оба сервиса через `pnpm local:build`.

Если Prisma сообщает `No pending migrations to apply`, хотя в репозитории появились новые миграции, проверьте файлы внутри контейнера:

```bash
docker compose -f docker-compose.local.yml exec api ls -1 prisma/migrations
```

Если новых каталогов нет, контейнер использует старый образ: пересоберите API и повторите `pnpm local:migrate`.

Пересборка и замена контейнеров сохраняют БД в Docker volume. Уже применённые миграции не повторяются; выбранные состояния флагов сохраняются, новые записи создаются выключенными. [Работа с флагами при развёртывании](./feature-flags.md#миграции-и-развёртывание).

---

## Полезные команды

```bash
# Логи API в реальном времени
docker compose -f docker-compose.local.yml logs -f api

# Логи всех сервисов сразу
pnpm local:logs

# Зайти в контейнер API (как SSH на сервер)
docker compose -f docker-compose.local.yml exec api sh

# Остановить стек (данные БД сохранятся)
pnpm local:down

# Остановить стек И удалить данные БД (полный сброс)
pnpm local:reset
```

---

## Как работает маршрутизация через Caddy

Файл `Caddyfile.local` в корне проекта:

```caddyfile
:80 {
    handle /api/* {
        reverse_proxy api:3000
    }
    handle {
        reverse_proxy web:3000
    }
}
```

Запрос `GET http://localhost/api/users` →

1. Caddy получает запрос
2. Видит путь начинается с `/api/`
3. Проксирует на `api:3000` (внутренняя Docker-сеть)
4. API обрабатывает и возвращает ответ

Запрос `GET http://localhost/dashboard` →

1. Caddy получает запрос
2. Путь не начинается с `/api/`
3. Проксирует на `web:3000`
4. Next.js возвращает страницу

На VPS будет аналогичная конфигурация Caddy, только с реальным доменом и HTTPS.

---

## Как работают письма через Mailpit

API получает почтовые настройки из `apps/api/.env.local` через `env_file` в Compose:

```yaml
MAIL_TRANSPORT: smtp
MAIL_HOST: mailpit
MAIL_PORT: 1025
```

Когда API отправляет письмо (например, подтверждение регистрации):

1. NestJS через Nodemailer подключается к `mailpit:1025`
2. Mailpit принимает письмо, **не отправляет** его реальному получателю
3. Письмо появляется в веб-интерфейсе: <http://localhost:8026>

Это позволяет тестировать письма без реального SMTP-сервера и без риска случайно отправить что-то пользователям.

На VPS (stage/prod) будет Resend или настоящий SMTP с реальными отправками.

---

## Почему образы собираются так сложно

### Монорепо и pnpm workspaces

Проект — **монорепо**: один репозиторий содержит несколько пакетов (`apps/api`, `apps/web`, `packages/types`, и т.д.). Они зависят друг от друга.

Проблема: Docker по умолчанию не знает о workspace-структуре. Нельзя просто скопировать `apps/api/` — там не будет зависимости `@repo/types`.

Решение: Docker-контекст — **корень монорепо**, и Dockerfile копирует всё нужное вручную:

```dockerfile
# Копируем манифесты из корня
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./

# Копируем только package.json каждого пакета (не исходники!)
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
# ... и т.д.

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Теперь копируем исходники
COPY apps/api ./apps/api
COPY packages  ./packages
```

Зачем сначала только `package.json`, а потом исходники? **Кэш Docker.** Если изменился только исходный код (но не `package.json`), слой с `pnpm install` не пересчитывается — экономия нескольких минут.

### pnpm deploy

После сборки используется `pnpm --filter=api deploy --prod /app/deploy`:

```text
/app/deploy/
  node_modules/  ← только production-зависимости (без devDeps)
  dist/          ← скомпилированный NestJS
  generated/     ← Prisma client
  prisma/        ← схема и миграции
  package.json
```

Это минимальный набор для запуска — без TypeScript, без тестов, без лишнего.

### Поле `files` в package.json

В `apps/api/package.json` добавлено:

```json
"files": ["dist", "generated", "prisma", "prisma.config.mjs"]
```

`pnpm deploy` использует это поле как список того, что нужно скопировать из пакета. Без него скопировался бы весь исходный код (`src/`, `test/`, `Dockerfile` и т.д.).

### Почему `prisma` теперь в `dependencies`, а не в `devDependencies`

Раньше `prisma` (CLI) лежал в `devDependencies`. В Docker мы делаем `pnpm deploy --prod`, который **выкидывает devDeps**, и Prisma CLI пропадает из бандла. Но он нам нужен в runtime — внутри контейнера выполняется:

```bash
node_modules/.bin/prisma migrate deploy --config prisma.config.mjs
```

Поэтому `prisma` переехал в обычные `dependencies`. `@prisma/client` тоже там — он генерируется в `generated/` и нужен серверу.

### Два конфига Prisma: `.ts` и `.mjs`

В `apps/api/` лежат два файла:

- `prisma.config.ts` — используется в dev (`pnpm prisma:migrate`, `pnpm prisma:seed`). Запускается через ts-node, поддерживает TypeScript.
- `prisma.config.mjs` — используется в Docker. В production-образе нет ts-node, поэтому конфиг должен быть в нативном ESM (`.mjs`).

Содержимое у них одинаковое. Если меняешь один — синхронно обнови второй, иначе dev и Docker будут видеть разные настройки.

### `dist/src/main` vs `dist/main`

NestJS компилирует с `sourceRoot=src` (см. `nest-cli.json`), поэтому собранный файл лежит в `dist/src/main.js`, а не в `dist/main.js`. В Dockerfile это видно в `CMD`:

```dockerfile
CMD ["node", "dist/src/main"]
```

Если ты увидишь ошибку `Cannot find module '/app/dist/main.js'` после сборки — значит кто-то поменял `sourceRoot` или путь в `CMD`. Проверь оба.

### `NEXT_PUBLIC_API_URL` и build-arg в web-образе

В `apps/web/Dockerfile`:

```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

Особенность Next.js: все переменные `NEXT_PUBLIC_*` **вшиваются в JavaScript-бандл во время `next build`**, а не читаются в runtime. Значит, если задать переменную через `environment:` в `docker-compose.yml`, она уже не сможет повлиять на собранный фронт.

Решение: передавать значение через build-arg:

```yaml
web:
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      NEXT_PUBLIC_API_URL: http://localhost/api
```

На production-VPS будет тот же механизм, только со значением `https://example.ru/api`.

---

## Почему установили Nodemailer

Изначально API использовал только **Resend** (облачный сервис отправки писем) — для работы нужен API-ключ (`RESEND_API_KEY`), которого нет в локальной среде.

В `mail.module.ts` добавлена логика выбора провайдера по переменной `MAIL_TRANSPORT`:

```typescript
const transport = configService.get('MAIL_TRANSPORT', 'resend')

if (transport === 'smtp') {
	// Nodemailer → Mailpit (локально) или любой SMTP
} else {
	// Resend → production
}
```

**Nodemailer** — стандартная Node.js-библиотека для отправки через SMTP. Mailpit принимает SMTP-соединения на порту 1025.

Итог:

- `MAIL_TRANSPORT=smtp` → письма идут в Mailpit (local-stage)
- `MAIL_TRANSPORT=resend` (по умолчанию) → письма идут через Resend (prod)

---

## Три окружения — сводная таблица

|               | dev                 | local-stage                | stage/prod (VPS)           |
| ------------- | ------------------- | -------------------------- | -------------------------- |
| Запуск        | `pnpm dev`          | `pnpm local:build`         | CI/CD или вручную          |
| API           | ts-node, hot reload | production-сборка в Docker | production-сборка в Docker |
| Web           | Next.js dev server  | Next.js standalone         | Next.js standalone         |
| БД            | локальная / Docker  | Docker (postgres:16)       | Managed DB или Docker      |
| Почта         | нет / заглушка      | Mailpit (перехватчик)      | Resend / настоящий SMTP    |
| Reverse proxy | нет                 | Caddy (HTTP)               | Caddy (HTTPS + домен)      |
| HTTPS         | нет                 | нет                        | да, Let's Encrypt          |
| Домен         | localhost           | localhost                  | реальный домен             |
