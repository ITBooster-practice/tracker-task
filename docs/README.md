# Tracker Task

Open-source система управления IT-проектами. Лёгкая, современная альтернатива
Jira и Яндекс.Трекеру для разработчиков и небольших команд.

> Документ описывает **текущее состояние** проекта и **что осталось до MVP**.
> Подробные гайды по темам — в разделе [Документация](#-документация-проекта) ниже.

## Команда

- **Дмитрий** — Fullstack (преимущественно Backend), Middle, Тимлид
- **Сальман** — Frontend, Middle+
- **Артём** — Frontend, Middle
- **Даниил** — Frontend, Junior+
- **Александр** — Frontend, Junior+
- **Роман** — Frontend, Junior

## Цель

Self-hosted трекер, который можно развернуть на своём сервере одной командой:

- Проекты, доски, задачи (Epic, Story, Bug, Task, Tech Debt)
- Команды с ролями и правами доступа
- AI-ассистент для генерации задач и консультаций
- Realtime-уведомления через WebSockets
- Простое развертывание через Docker

---

## Стек

| Слой        | Технологии                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), TypeScript, Tailwind, ShadCN UI                   |
| State       | Zustand + TanStack Query                                                   |
| Forms       | React Hook Form + Zod                                                      |
| Backend     | NestJS, Prisma 7, PostgreSQL 16, Redis 7, argon2                           |
| Mail        | Nodemailer (Mailpit dev) / Resend (prod) через `MAIL_TRANSPORT`            |
| API docs    | Swagger                                                                    |
| Архитектура | Монорепо: pnpm workspaces + Turborepo, Frontend по Feature-Sliced Design   |
| Infra       | Docker Compose (dev / local-stage), Caddy на VPS, GitHub Actions           |
| Quality     | ESLint + Prettier, Husky, commitlint (conventional commits), lint-staged   |
| Tests       | Vitest + Testing Library (web), Vitest + supertest (api), e2e c Playwright |

---

## Что готово ✅

### Frontend

- ShadCN UI + Tailwind, 25+ компонентов в `packages/ui`
- Storybook для UI-кита (9 stories: Button, Input, Card, Badge, Skeleton и др.)
- FSD-структура: `app / entities / features / widgets / views / shared`
- Zustand-сторы (`entities/user`, `features/theme`, `widgets/sidebar`) + TanStack Query
- React Hook Form + Zod (`@hookform/resolvers`)
- Auth-страницы: `/login`, `/register`, восстановление пароля **отсутствует**
- Auth-flow: cookies-based JWT + автоматический refresh (`shared/lib/api`)
- Profile-страница (`views/profile`): карточка, команды, приглашения
- Teams UI: список, создание, настройки команды, инвайты участников
- Feature flags на `NEXT_PUBLIC_*` (см. [work/feature-flags.md](./work/feature-flags.md))

### Backend

- Prisma 7 + миграции, модели: `User`, `Team`, `TeamMember`, `TeamInvitation`,
  `Project`, `Task`
- **Auth-модуль** (argon2 + JWT 15m/7d, refresh-токены в Redis):
  - `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
  - `GET /auth/me`
  - Декораторы: `@Authorization`, `@Authorized`, `@Roles`
- **Teams-модуль** (полный CRUD): команды, участники, приглашения по токену
- **Projects-модуль** (CRUD проектов внутри команды)
- **Mail-модуль** с двумя провайдерами (см. [backend/mail.md](./backend/mail.md)):
  - `MAIL_TRANSPORT=smtp` → Nodemailer → Mailpit (dev/local-stage)
  - `MAIL_TRANSPORT=resend` → Resend HTTP API (prod)
  - Отправка fire-and-forget — не блокирует ответ API
- Swagger-документация всех endpoints
- Логирование ошибок отправки писем

### Инфраструктура

- **`pnpm dev`** одной командой: автоматически поднимает `redis` и `mailpit`
  в Docker, запускает api+web с hot-reload
- **`pnpm stage`** — локальный production-стек (Caddy + Postgres + Redis +
  Mailpit + api + web), полностью имитирует VPS-развёртывание.
  Подробно — [work/local-stage.md](./work/local-stage.md)
- Dev и stage стеки полностью изолированы (разные имена проектов, разные
  порты Mailpit-UI), можно держать оба запущенными
- Husky + commitlint + lint-staged
- ESLint-конфиги: base, next, nest, react-internal (`packages/eslint-config`)
- GitHub Actions: lint, type-check, tests, build

### Документация

- [`docs/work/`](./work/) — гайды разработчика (start, git, hooks, local-stage)
- [`docs/backend/`](./backend/) — Prisma, Redis, Swagger, Mail, Teams, валидация
- [`docs/frontend/`](./frontend/) — ShadCN, layout, API-интеграция
- [`docs/infra/`](./infra/) — CI/CD, deployment, release-process
- [`docs/plans/`](./plans/) — черновики будущих фич (magic-link, MVP, epics)
- [`docs/releases/`](./releases/) — release notes

---

## Что осталось до MVP ❌

### Backend

- [ ] **Users-модуль**: `GET /users/:id`, `PATCH /users/me`, загрузка аватара
- [ ] **Восстановление пароля**: `POST /auth/forgot-password`, `/reset-password`
- [ ] **Magic-link авторизация** — спека готова: [plans/magic-link.md](./plans/magic-link.md)
- [x] **Tasks-модуль** (CRUD + канбан-доска + moveTask — Done)
- [x] **Boards** (GET /board — Done, см. [docs/backend/tasks.md](./backend/tasks.md))
- [ ] **Подтверждение email** при регистрации

### Frontend

- [ ] Страница `/forgot-password`
- [ ] `middleware.ts` для защиты роутов
- [ ] Тёмная тема (структура есть, реализация неполная)
- [ ] FSD-линтер для контроля архитектурных границ
- [ ] UI задач и досок

### Интеграции

- [ ] **File Storage (S3)** — аватары, вложения к задачам
      (выбрать: AWS S3 / Cloudflare R2 / Supabase / MinIO)
- [ ] **WebSockets (Socket.io)** — realtime-уведомления, обновления задач
- [ ] **BullMQ** — фоновые задачи (отправка писем, AI-генерация)
- [ ] **AI-ассистент** — генерация задач, консультации

### Инфраструктура

- [ ] Branch protection rules в GitHub-репо (запрет прямого push в `main`,
      обязательное ревью, требование зелёного CI)
- [ ] Деплой на VPS по `docs/infra/deployment.md`

---

## Приоритеты

### 🔴 Сейчас

1. Восстановление пароля + magic-link
2. Users-модуль (профиль + avatar upload)
3. File Storage (S3) для аватаров
4. Tasks-модуль (бэк + UI)

### 🟠 Следующее

1. Boards
2. WebSockets для realtime
3. BullMQ для фоновых задач
4. Деплой stage на VPS

### 🟡 Потом

1. AI-ассистент
2. Тёмная тема, FSD-линтер
3. Подтверждение email при регистрации

---

## Соглашения

- **Git flow**: trunk-based, короткоживущие feature-ветки, обязательный PR
  с code review, conventional commits.
  Подробно — [work/git.md](./work/git.md).
- **Code review**: минимум 1 апрув, зелёный CI обязателен.
- **Code quality**: ESLint + Prettier + строгий TS, unit-тесты для критичной
  логики.

---

## 📖 Документация проекта

### Быстрый старт

- [Начало работы](./work/start.md) — установка, .env, первый запуск
- [Локальный stage-стек](./work/local-stage.md) — `pnpm stage` и production-like локально
- [Общие практики](./work/common.md), [Git](./work/git.md), [Git Hooks](./work/git-hooks.md)
- [Feature Flags](./work/feature-flags.md)
- [Vitest coverage](./work/vitest-coverage.md)

### Backend

- [Prisma](./backend/prisma/README.md) — БД и миграции
- [Redis](./backend/redis/README.md) — кэш и refresh-токены
- [Swagger API](./backend/swagger/README.md)
- [Mail](./backend/mail.md) — SMTP/Resend, переключение dev↔prod
- [Teams](./backend/teams/) — модуль команд и приглашений
- [Schedule](./backend/schedule.md)
- [E2E тесты](./backend/test/)

### Frontend

- [ShadCN UI](./frontend/shadcn.md)
- [Layout / навигация](./frontend/layout-navigation.md)
- [API-интеграция](./frontend/api-integration-pattern.md)

### Валидация

- [Общая валидация (Zod)](./validation/README.md)
- [Backend валидация](./backend/validation/README.md)
- [Кастомные ошибки](./backend/validation/custom-errors.md)

### Инфра / релизы

- [CI/CD](./infra/ci-cd-overview.md)
- [Deployment](./infra/deployment.md)
- [Release process](./infra/release-process.md)
- [Releases](./releases/)

### Планы

- [docs/plans/](./plans/) — черновики (не закоммичены, личное пространство для drafts)
