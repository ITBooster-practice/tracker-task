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

<!-- ## 3. Запустить Redis через Docker

```bash
docker-compose up -d redis
```

Проверить статус:
```bash
docker ps
``` -->

## 4. Настроить базу данных

### Подключиться к PostgreSQL через pgAdmin

1. Открыть pgAdmin
2. Создать подключение к локальной БД
3. Выполнить миграции:

```bash
pnpm --filter @tracker-task/api migration:run
```

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
<!-- - `docker-compose down` - остановить Docker-сервисы -->

---

💡 **Совет**: Держи Redis и PostgreSQL запущенными в фоне, чтобы не перезапускать каждый раз.
