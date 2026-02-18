# Запуск dev-окружения

Пошаговая инструкция для развертывания проекта локально.

## 1. Получить последние изменения

```bash
git pull origin main
```

Если работаешь в ветке:

```bash
git fetch origin
git pull origin <название-ветки>
```

## 2. Установить зависимости

```bash
pnpm install
```

## 3. Запустить Redis через Docker

```bash
pnpm docker:redis-up
```

Проверить статус:

```bash
pnpm docker:redis-status
```

## 4. Настроить базу данных

### Первый раз: Настройка pgAdmin

1. **Открыть [pgAdmin](https://www.pgadmin.org/)**

2. **Создать подключение к серверу PostgreSQL:**
   - Правый клик на "Servers" → Register → Server
   - Вкладка General:
     - Name: `Local PostgreSQL` (или любое имя)
   - Вкладка Connection:
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: (твой пароль от PostgreSQL)
   - Save

3. **Создать базу данных:**
   - Раскрыть сервер → правый клик на Databases → Create → Database
   - Database: `tracker-task`
   - Owner: `postgres`
   - Save

4. **Проверить подключение:**
   - Выбрать БД `tracker-task`
   - правый клик на `tracker-task` → Query Tool
   - Выполнить: `SELECT 1;` (F5)
   - Если вернулось `1` - всё работает ✅

<!-- 5. Выполнить миграции:

```bash
pnpm --filter @tracker-task/api migration:run
``` -->

## 5. Запустить проект в dev-режиме

### Backend (API)

```bash
pnpm --filter api dev
```

### Frontend (Web)

```bash
pnpm --filter web dev
```

### Всё сразу

```bash
pnpm dev
```

## Полезные команды

- `pnpm test` - запустить тесты
- `pnpm lint` - проверить код линтером
- `pnpm build` - собрать проект
- `pnpm format` - отформатировать код
- `pnpm type-check` - проверить типы

---

💡 **Совет**: Держи Redis и PostgreSQL запущенными в фоне, чтобы не перезапускать каждый раз.
