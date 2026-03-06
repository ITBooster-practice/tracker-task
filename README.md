# Tracker Task

**Открытая система управления IT-проектами**

## 📋 О проекте

Лёгкая, современная альтернатива Jira и Яндекс.Трекер для разработчиков и небольших команд.

### Цель

Создать open-source решение для управления проектами, спринтами и задачами, которое просто развернуть на собственном сервере.

### Возможности

- 📊 Управление проектами и задачами
- 🏃 Спринты и бэклог
- 🐛 Issue tracking
- 🚀 Простое развёртывание
- 💻 Открытый исходный код

## 🚀 Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Запуск тестов
pnpm test

# Сборка проекта
pnpm build
```

## 📦 Структура монорепозитория

```
tracker-task/
├── apps/
│   ├── api/        # NestJS API сервер
│   └── web/        # Next.js веб-приложение
├── packages/
│   ├── api/        # Общие типы и DTO
│   ├── ui/         # UI компоненты
│   ├── eslint-config/    # Конфигурация ESLint
│   ├── vitest-config/    # Конфигурация Vitest
│   └── typescript-config/ # Конфигурация TypeScript
```

---

# Полезные ссылки:

## [**Frontend**](https://itbooster.ru/roadmap/2/)

### **Стек**

- [Next.js](https://nextjs.org/docs) - для создания серверного рендеринга и статической генерации страниц
  - [Next.js с Нуля - полный курс для начинающих (2025)](https://www.youtube.com/watch?v=KZb53sf-PEg)
- [TypeScript](https://www.typescriptlang.org/docs/) - для статической типизации
  - [TypeScript ФУНДАМЕНТАЛЬНЫЙ КУРС от А до Я. Вся теория + практика](https://www.youtube.com/watch?v=LWtHl__oEWc&t=3720s)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) - для управления серверным состоянием и кэшированием данных
- [Tanstack query (react query) полный курс от А до Я за 70 минут](https://www.youtube.com/watch?v=mg9Kq1YaENI)
- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction) - для управления локальным состоянием
  - [Zustand и React query. State management в React без боли](https://www.youtube.com/watch?v=Egg8jH0Yj14)
  - [Persisting store data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - для сохранения состояния в localStorage
- [ShadCN UI](https://ui.shadcn.com/docs/installation/next) + [Tailwind CSS](https://tailwindcss.com/docs/installation)/[Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - для UI компонентов
- [React Hook Form](https://react-hook-form.com/get-started) + [Zod](https://zod.dev/) - для валидации форм
- [Turborepo](https://turborepo.dev/docs/getting-started/installation) - для монорепозитория
- [axios](https://axios-http.com/docs/intro) - для HTTP запросов

### **Архитектурная методология**

- [Feature sliced design](https://feature-sliced.design/docs/get-started) - для организации структуры проекта
- [10 ОШИБОК НОВИЧКОВ В FSD](https://www.youtube.com/watch?v=8pcu9MwTzJo)

### **Инструменты**

- [ESLint](https://eslint.org/docs/latest/user-guide/getting-started) - для статической проверки кода
- [Prettier](https://prettier.io/docs/en/install.html) - для форматирования кода
- [Husky](https://typicode.github.io/husky/ru/) - для запуска скриптов при коммитах и пушах
- [sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/) (используем [glitchtip](https://glitchtip.com/documentation) как альтернативу, тк sentry в рф не работает, но API там тот же) - для мониторинга ошибок в продакшене
- [Vitest](https://vitest.dev/) - для тестирования
  - [Vitest(ITBooster)](https://itbooster.ru/roadmap/10/?nodeId=0788cffc-d909-40b4-8954-116589c42b60)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - для тестирования компонентов
- [Storybook](https://storybook.js.org/docs/get-started/frameworks/nextjs/?renderer=react) - для разработки и тестирования UI компонентов в изоляции
- [pnpm](https://pnpm.io/installation)

### **Качество кода**

- Обязательный линтинг + линтер на правила соблюдения FSD
- Обязательное код ревью каждой задачи
- Минимум кастомных стилей по месту, используем разработанный UI kit
- Обязателен CI пайплайн
  - [CI CD наглядные примеры](https://www.youtube.com/watch?v=ANj7qUgzNq4&pp=ygUNdWxiaSB0diBjaSBjZA%3D%3D)

## [**Backend**](https://itbooster.ru/roadmap/4/)

### **Стек**

- [NestJS](https://docs.nestjs.com/) - для создания серверного приложения
  - [Полный курс по Nest.js](https://teacoder.ru/lesson/53bb0ebf-34f1-4423-882f-117f18b97b07)
  - [Nest JS(ITBooster)](https://itbooster.ru/roadmap/10/?nodeId=dec7d585-da3c-41a0-a15a-b450dfbd5a6b)
- [TypeScript](https://www.typescriptlang.org/docs/) - для статической типизации
- [Socket.IO](https://socket.io/docs/v4/tutorial/introduction) - для уведомлений
- [Prisma](https://www.pris.ly/docs) - для работы с базой
  - [ORM(ITBooster)](https://itbooster.ru/roadmap/18/?nodeId=51b620b2-c147-42e3-98a6-5f8632e34815)
  - [Prisma(ITBooster)](https://itbooster.ru/roadmap/10/?nodeId=ad55dd33-aba4-4d7d-ac5a-76694a3ca1d7)
- [Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/) - для документирования API
- [sentry](https://docs.sentry.io/platforms/javascript/guides/nestjs/) - для мониторинга ошибок в продакшене
- [Redis](https://redis.io/docs/latest/develop/clients/nodejs/) - для кэширования и управления сессиями
  - [Redis(ITBooster)](https://itbooster.ru/roadmap/4/?nodeId=1dc9c1d5-145b-4c40-9a5e-2931f65ac41c)
  - [Redis(ITBooster) обучение](https://itbooster.ru/database/category/14/)
- [PostgreSQL](https://www.postgresql.org/docs/current/) - для хранения данных
  - [pgAdmin](https://www.pgadmin.org/) - для управления базой данных PostgreSQL
  - [PostgreSQL(ITBooster)](https://itbooster.ru/roadmap/10/?nodeId=98d6d7cd-a36d-4086-9bd3-5b6229aac8cb)
- [BullMQ](https://docs.bullmq.io/readme-1) - для управления очередями задач
  - [BullMQ](https://itbooster.ru/roadmap/4/?nodeId=08380761-24eb-42b8-9f9b-522bc5f6ee8b)
- [OpenAI Node.js](https://github.com/openai/openai-node#readme) - для интеграции с OpenAI API
- [Passport.js](https://www.passportjs.org/) - для аутентификации
  - [Интеграция Passport.js с NestJS](https://docs.nestjs.com/recipes/passport) - интеграция Passport.js с NestJS

### **Инструменты**

- [ESLint](https://eslint.org/docs/latest/user-guide/getting-started) - для статической проверки кода
- [Prettier](https://prettier.io/docs/en/install.html) - для форматирования кода
- [Husky](https://typicode.github.io/husky/ru/) - для запуска скриптов при коммитах и пушах
- [Supabase](https://supabase.com/) - для управления базой данных и аутентификации
- [Docker](https://docs.docker.com/get-started/) - для контейнеризации приложений
- [pnpm](https://pnpm.io/installation)

### **Продакшн**

- [Grafana Loki](https://grafana.com/docs/loki/latest/get-started/) - для логирования и мониторинга
- [Prometheus](https://prometheus.io/docs/introduction/overview/) - для мониторинга и алертинга
- [Promtail](https://grafana.com/docs/loki/latest/send-data/promtail/) **_deprecated_** | [Alloy](https://grafana.com/docs/loki/latest/setup/migrate/migrate-to-alloy/) - для отправки логов в Grafana Loki
- [Grafana](https://grafana.com/docs/) - для визуализации метрик и логов
- [node_exporter](https://prometheus.io/docs/guides/node-exporter/) - для экспорта метрик системы
- [cAdvisor](https://github.com/google/cadvisor) - для мониторинга контейнеров
- Запуск в проде в нескольких инстансах для обеспечения отказоустойчивости

### **Качество кода**

- Обязательный линтинг
- Обязательное код ревью каждой задачи
- Соблюдение модульной архитектуры + слоистой структуры проекта.
- Обязателен CI пайплайн

## **Общее**

- **[CI_CD](https://itbooster.ru/roadmap/2/?nodeId=4318d274-56ee-4161-ab9f-4ed89f574870)** - для автоматизации сборки, тестирования и деплоя приложения
- Обязательно на каждый пул реквест прогоняем линтеры, тесты, билд проекта, typecheck через ts.
- Релизы через отведение ветки + нажатие кнопки release в github.
- Пуш в dev/trunk/master - запрещен напрямую, только через ПР с код ревью
- Работа с гит через trunk based подход
- При деплое - обязательная контейнеризация

- **Продакшн**
- Сбор логов и метрик в проде - обязателен.
- Хранение переменных окружения .env + github
- Ведение документации (запуск проекта, переменные, особенности и тд)
- Релиз в прод должен быть легким и удобным, 1 нажатием кнопки в гитхабе.

- [Git(ITBooster)](https://itbooster.ru/database/category/317/)
- [Docker(ITBooster)](https://itbooster.ru/database/category/164/)
- [Соглашение о коммитах](https://www.conventionalcommits.org/ru/v1.0.0/#%d0%b3%d0%bb%d0%b0%d0%b2%d0%bd%d0%be%d0%b5)

## **Git config**

Проверьте настройки гита, чтобы коммиты имели правильного автора.:

```bash
git config --global user.name "Ваше имя"
git config --global user.email "ваш.email@example.com"
```
