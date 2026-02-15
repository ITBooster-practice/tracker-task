# 🚀 Tracker Task — Дорожная карта разработки

**Open-source система управления IT-проектами**

> Лёгкая, современная альтернатива Jira и Яндекс.Трекер для разработчиков и небольших команд

## 👥 Команда

- **Дмитрий** — Fullstack (преимущественно Backend), Middle, Тимлид
- **Сальман** — Frontend, Middle+
- **Артём** — Frontend, Middle
- **Даниил** — Frontend, Junior+
- **Александр** — Frontend, Junior+
- **Роман** — Frontend, Junior

---

## 🎯 Основная цель проекта

Создать self-hosted трекер задач, который можно легко развернуть на своем сервере:

- 📊 Проекты, доски, задачи (Epic, Story, Bug, Task, Tech Debt)
- 👥 Команды с ролями и правами доступа
- 🤖 AI ассистент для генерации задач и консультации
- ⚡ Realtime уведомления через WebSockets
- 🐳 Простое развертывание через Docker

---

## 📋 Первоочередные задачи для старта

### 🎨 1. Frontend — UI Kit и базовая инфраструктура

#### 1.1 Настройка UI Kit

- [ ] **Установить и настроить ShadCN UI + Tailwind CSS**
  - Настроить темы (светлая/темная)
  - Создать базовые компоненты (Button, Input, Card, Modal и т.д.)
  - Настроить переменные для цветов и отступов
- [ ] **Настроить Storybook**
  - Интеграция с проектом
  - Создать stories для базовых компонентов
  - Документация компонентов
- [ ] **Создать UI Kit в `packages/ui`**
  - Button, Input, Select, Checkbox, Radio
  - Modal, Dialog, Drawer
  - Card, Badge, Avatar
  - Table, Pagination
  - Toast, Alert
  - Form components (FormField, FormLabel, FormError)

#### 1.2 Архитектура и структура

- [ ] **Настроить Feature-Sliced Design (FSD)**
  - Создать структуру папок (app, pages, widgets, features, entities, shared)
  - Настроить ESLint плагин для FSD
  - Документация по структуре
- [ ] **Настроить State Management**
  - Zustand для локального состояния
  - TanStack Query для серверного состояния
  - Создать базовые stores и queries
- [ ] **Настроить Forms**
  - React Hook Form + Zod
  - Создать базовые схемы валидации
  - Примеры переиспользуемых форм

#### 1.3 Авторизация (Frontend)

- [ ] **Создать страницы Auth**
  - `/login` — страница входа
  - `/register` — страница регистрации
  - `/forgot-password` — восстановление пароля
- [ ] **Реализовать Auth Flow**
  - Хранение JWT токена
  - Автоматическое обновление токена (refresh)
  - Защищенные роуты (PrivateRoute)
  - Редирект после авторизации
- [ ] **Создать Auth UI компоненты**
  - LoginForm
  - RegisterForm
  - ForgotPasswordForm

---

### 🔧 2. Backend — База данных и авторизация

#### 2.1 Настройка базы данных

- [ ] **Docker Compose для локальной разработки**
  - PostgreSQL
  - Redis
  - Adminer/pgAdmin (опционально)
  - Docker файлы для всех сервисов
- [ ] **Выбрать и настроить ORM**
  - Prisma ИЛИ TypeORM (принять решение)
  - Создать базовую схему БД
  - Настроить миграции
- [ ] **Создать базовые модели**
  - User (id, email, password, name, role, avatar, createdAt, updatedAt)
  - Team (id, name, ownerId, createdAt, updatedAt)
  - TeamMember (id, teamId, userId, role, createdAt)
  - Project (id, teamId, name, description, createdAt, updatedAt)

#### 2.2 Авторизация и аутентификация (Backend)

- [ ] **Реализовать Auth модуль в NestJS**
  - `POST /auth/register` — регистрация
  - `POST /auth/login` — вход
  - `POST /auth/refresh` — обновление токена
  - `POST /auth/logout` — выход
  - `POST /auth/forgot-password` — восстановление пароля
  - `POST /auth/reset-password` — сброс пароля
- [ ] **Настроить JWT**
  - Access token (15 минут)
  - Refresh token (7 дней)
  - Хранение refresh token в БД или Redis
- [ ] **Настроить Guards и Decorators**
  - `@Auth()` — защита роутов
  - `@CurrentUser()` — получение текущего пользователя
  - `@Roles()` — проверка ролей
- [ ] **Хэширование паролей**
  - bcrypt для хэширования
  - Валидация пароля при входе

#### 2.3 Swagger документация

- [ ] **Настроить Swagger**
  - Автодокументация всех endpoints
  - Описание моделей и DTO
  - Примеры запросов/ответов

---

### 🛠️ 3. Общая инфраструктура

#### 3.1 CI/CD Pipeline

- [ ] **Настроить GitHub Actions**
  - Lint (ESLint, Prettier)
  - Type check (TypeScript)
  - Tests (Vitest)
  - Build
  - Прогон на каждый Pull Request
- [ ] **Branch Protection Rules**
  - Запрет прямого пуша в `main`/`dev`
  - Обязательное code review
  - Требование прохождения CI

#### 3.2 Docker и запуск проекта

- [ ] **Docker Compose для разработки**
  - API (NestJS)
  - Web (Next.js)
  - PostgreSQL
  - Redis
  - One-command запуск всего проекта
- [ ] **Документация по запуску**
  - README с инструкциями
  - Список переменных окружения
  - Troubleshooting частых проблем

#### 3.3 Качество кода

- [ ] **Настроить Husky**
  - Pre-commit хуки (lint, format, type-check)
  - Commit message validation (conventional commits)
- [ ] **Настроить ESLint правила**
  - Общие правила для монорепозитория
  - Специфичные для Frontend/Backend
  - FSD линтер для фронтенда

---

### 🎯 4. Базовые модули приложения

#### 4.1 User Management

- [ ] **Users Module (Backend)**
  - `GET /users/me` — получить текущего пользователя
  - `PATCH /users/me` — обновить профиль
  - `GET /users/:id` — получить пользователя по ID
  - `PATCH /users/:id/avatar` — загрузить аватар
- [ ] **Profile Page (Frontend)**
  - Просмотр профиля
  - Редактирование профиля
  - Загрузка аватара

#### 4.2 Teams Module

- [ ] **Teams Module (Backend)**
  - `POST /teams` — создать команду
  - `GET /teams` — список команд пользователя
  - `GET /teams/:id` — информация о команде
  - `PATCH /teams/:id` — обновить команду
  - `DELETE /teams/:id` — удалить команду
  - `POST /teams/:id/members` — добавить участника
  - `DELETE /teams/:id/members/:userId` — удалить участника
  - `PATCH /teams/:id/members/:userId/role` — изменить роль
- [ ] **Teams UI (Frontend)**
  - Список команд
  - Создание команды
  - Управление участниками
  - Настройки команды

---

### 📦 5. Интеграции и сервисы

#### 5.1 File Storage (S3)

- [ ] **Выбрать S3 провайдера**
  - AWS S3, MinIO, Cloudflare R2 (принять решение)
  - Настроить локальное хранилище для разработки
- [ ] **Upload Service**
  - Загрузка аватаров
  - Загрузка файлов к задачам
  - Генерация presigned URLs

#### 5.2 WebSockets (Socket.io)

- [ ] **Настроить Socket.io (Backend)**
  - WebSocket Gateway в NestJS
  - Аутентификация через JWT
  - Rooms для команд/проектов
- [ ] **Настроить Socket.io (Frontend)**
  - Подключение к WebSocket
  - Обработка событий уведомлений
  - Reconnection логика

#### 5.3 Queue System (BullMQ)

- [ ] **Настроить BullMQ**
  - Redis для очередей
  - Базовые очереди (email, ai-generation)
  - Worker процессы
  - Dashboard для мониторинга (Bull Board)

---

## 🗂️ Структура задач по приоритетам

### 🔴 Критический приоритет (Неделя 1-2)

1. Docker Compose для локальной разработки
2. База данных + миграции (базовые модели)
3. Авторизация Backend (register/login/refresh)
4. UI Kit + ShadCN настройка
5. Авторизация Frontend (страницы + формы)
6. CI/CD Pipeline (lint, test, build)

### 🟠 Высокий приоритет (Неделя 3-4)

1. FSD структура Frontend
2. Users Module (Backend + Frontend)
3. Teams Module (Backend + Frontend)
4. Storybook настройка
5. Swagger документация
6. File Storage (S3)

### 🟡 Средний приоритет (Неделя 5-6)

1. WebSockets настройка
2. BullMQ очереди
3. Projects Module (Backend + Frontend)
4. Husky + Git hooks
5. Документация по запуску

---

## 📚 Технологии и инструменты

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **State**: Zustand + TanStack Query
- **UI**: ShadCN UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **WebSocket**: Socket.io Client
- **Tests**: Vitest + React Testing Library
- **Docs**: Storybook

### Backend

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma/TypeORM
- **Cache**: Redis
- **Queue**: BullMQ
- **WebSocket**: Socket.io
- **API Docs**: Swagger
- **Storage**: S3 (Supabase)

### DevOps

- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Git**: Trunk-based development
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

---

## 📝 Соглашения

### Git Workflow

- **Trunk-based development**
- Короткоживущие feature ветки
- Обязательный Pull Request с code review
- Conventional Commits (feat, fix, docs, style, refactor, test, chore)

### Code Review

- Обязательно для каждой задачи
- Минимум 1 аппрув от другого разработчика
- CI должен быть зеленым

### Code Quality

- ESLint + Prettier обязательны
- Type-safety (строгий TypeScript)
- Unit тесты для критичной логики
- FSD линтер для Frontend
