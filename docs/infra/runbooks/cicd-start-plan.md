# CI/CD старт-план: пошагово, как отдельный runbook

Этот документ описывает полный маршрут внедрения CI/CD для проекта:

1. Сначала стабилизируем stage-цикл.
2. Затем подключаем автоматизацию через GitHub Actions.
3. После этого добавляем безопасный запуск production.

Фокус этого runbook: практичные шаги, что именно создать, где настроить, чем проверить.

## 0. Что уже готово в репозитории

- Есть базовый CI workflow в [../../../.github/workflows/ci.yml](../../../.github/workflows/ci.yml).
- Есть ручной stage-флоу и runbooks:
  - [step-1-vps-bootstrap.md](./step-1-vps-bootstrap.md)
  - [step-2-manual-stage-deploy.md](./step-2-manual-stage-deploy.md)
  - [step-3-build-and-push-images.md](./step-3-build-and-push-images.md)
- Есть stage-артефакты деплоя:
  - [../../../infra/deploy/stage/docker-compose.stage.yml](../../../infra/deploy/stage/docker-compose.stage.yml)
  - [../../../infra/deploy/stage/.env.stage.example](../../../infra/deploy/stage/.env.stage.example)
  - [../../../infra/deploy/stage/deploy-stage.sh](../../../infra/deploy/stage/deploy-stage.sh)

## 1. Минимальная цель CI/CD v1

После merge в `main` автоматически происходит:

1. Зелёный CI (`lint`, `type-check`, `test`, `build`).
2. Сборка и push `api`/`web` образов в GHCR.
3. Теги образов:

- `sha-<short_sha>` (основной immutable тег)
- `main-latest` (удобный alias)

4. SSH-деплой на stage VPS с этим `sha-*` тегом.
5. Доступность stage-домена по HTTPS после обновления.

## 2. Архитектура пайплайна (простая и безопасная)

Рекомендуемый набор workflow-файлов:

1. [../../../.github/workflows/ci.yml](../../../.github/workflows/ci.yml) — уже есть, оставляем как quality gate.
2. `.github/workflows/cd-build-images.yml` — сборка и публикация образов.
3. `.github/workflows/cd-deploy-stage.yml` — деплой stage после успешной сборки образов.
4. `.github/workflows/cd-manual-dispatch.yml` — ручная кнопка запуска (`workflow_dispatch`).

Почему раздельно:

- проще отлаживать падения по слоям;
- можно перезапускать только нужный этап;
- меньше риск случайно задеплоить не то.

## 3. Подготовка секретов и environments в GitHub

Перед написанием CD workflow заполните секреты.

### 3.1 Repository secrets

Добавить в `Settings -> Secrets and variables -> Actions`:

1. `GHCR_USERNAME` — GitHub логин или org bot-user.
2. `GHCR_TOKEN` — PAT c `write:packages`, `read:packages`.
3. `STAGE_SSH_HOST` — IP/host stage VPS.
4. `STAGE_SSH_PORT` — обычно `22`.
5. `STAGE_SSH_USER` — обычно `deploy`.
6. `STAGE_SSH_PRIVATE_KEY` — приватный ключ для подключения к серверу.
7. `STAGE_DEPLOY_PATH` — обычно `/opt/tracker/stage`.

### 3.2 GitHub Environments

Создать environments:

1. `stage`:

- без обязательных ревьюеров на старте;
- можно добавить environment-specific secrets позже.

2. `production`:

- включить `Required reviewers`;
- запуск только вручную.

### 3.3 Права workflow

Для workflow, который пушит образы в GHCR, нужны права:

```yaml
permissions:
  contents: read
  packages: write
```

## 4. Пошаговое внедрение (как делать по дням)

### Этап 1. Серверный каркас для stage

Сделать по [step-1-vps-bootstrap.md](./step-1-vps-bootstrap.md).

Результат этапа:

- DNS резолвится на VPS.
- Caddy поднят.
- `https://stage.<domain>` отвечает с валидным TLS.

### Этап 2. Ручной deploy stage без GitHub Actions

Сделать по [step-2-manual-stage-deploy.md](./step-2-manual-stage-deploy.md).

Результат этапа:

- `deploy-stage.sh <tag>` работает руками.
- Health API проходит.
- Web + API + Mailpit доступны за Basic Auth.

### Этап 3. Ручная сборка и push в GHCR

Сделать по [step-3-build-and-push-images.md](./step-3-build-and-push-images.md).

Результат этапа:

- Образы `tracker-api` и `tracker-web` есть в GHCR.
- Тег `sha-<short_sha>` можно деплоить на stage.

### Этап 4. Написать workflow сборки образов (`cd-build-images.yml`)

Что добавить:

1. Триггеры:

- `push` в `main`;
- `workflow_dispatch` (на будущее для ручного запуска).

2. `needs` на CI:

- либо через `workflow_run` от CI,
- либо отдельным процессом, где build запускается только после зелёного CI.

3. Логин в GHCR.
4. Сборка `apps/api/Dockerfile` и `apps/web/Dockerfile` из корня repo.
5. Публикация тегов `sha-<short_sha>` и `main-latest`.
6. Вывод `image_tag` как output для следующего workflow.

Что проверить после внедрения:

1. После merge в `main` появился новый `sha-*` тег в GHCR.
2. `main-latest` обновился.
3. Build web использует корректный `NEXT_PUBLIC_API_URL` для stage.

### Этап 5. Написать workflow автодеплоя stage (`cd-deploy-stage.yml`)

Что добавить:

1. Триггер после успешной сборки образов.
2. `environment: stage`.
3. SSH-подключение к VPS.
4. Запуск на сервере:

```bash
cd /opt/tracker/stage
./deploy-stage.sh sha-<short_sha>
```

5. Пост-проверка:

- `curl` на stage endpoint;
- логирование версии/тега в job summary.

Что проверить после внедрения:

1. Merge в `main` инициирует автообновление stage.
2. В логах виден именно тот `sha-*`, который собран в build job.
3. Stage открывается по HTTPS после завершения workflow.

### Этап 6. Добавить ручную кнопку (`cd-manual-dispatch.yml`)

Рекомендуемые input-параметры:

1. `target` (`stage` | `prod`).
2. `ref` (ветка/тег/commit SHA).
3. `image_tag` (опционально, если нужен точечный rollback).
4. `skip_build` (`true`/`false`, опционально).

Правила:

1. Для `target=prod` — только environment `production`.
2. Для `target=prod` — обязательное ручное подтверждение reviewers.
3. Если `image_tag` задан, деплой делается строго по нему.

### Этап 7. Подключить production безопасно

Минимальные guardrails:

1. Отдельный compose-проект и `.env` для prod.
2. Отдельный домен и Caddy site block.
3. Только ручной запуск прод-деплоя.
4. Зафиксированная стратегия rollback на `sha-*`.

## 5. Откат (rollback) как обязательная часть CI/CD

Минимальная рабочая схема:

1. Берем последний стабильный `sha-*` из GHCR или из истории workflow.
2. Запускаем manual workflow с параметром `image_tag=<stable_sha_tag>`.
3. Выполняем тот же `deploy-stage.sh`/`deploy-prod.sh` с этим тегом.
4. Проверяем health и доступность домена.

Важно: откат не должен пересобирать образы, только переключать тег.

## 6. Проверки после каждого этапа

Проверка 1 (build):

1. Образы существуют в GHCR.
2. Теги совпадают с commit SHA.

Проверка 2 (deploy):

1. API health отвечает `200`.
2. Web отвечает по HTTPS.

Проверка 3 (операционка):

1. В workflow summary есть `commit`, `image_tag`, `target`.
2. Логи деплоя понятны и позволяют быстро диагностировать падение.

## 7. Честные ограничения

1. Без коммита workflow нельзя запустить на «локальном состоянии файлов».
2. `workflow_dispatch` позволяет запускать на любом существующем `ref`.
3. Для frontend важно не перепутать `NEXT_PUBLIC_API_URL`, так как это build-time переменная.

## 8. План внедрения на 7 дней

1. VPS hardening + Docker + Caddy + HTTPS для stage.
2. Ручной `deploy-stage.sh` с деплоем по `sha-*`.
3. `cd-build-images.yml` с push в GHCR.
4. `cd-deploy-stage.yml` после успешного build.
5. `cd-manual-dispatch.yml` для ручных запусков.
6. `production` environment с required reviewers.
7. Rollback-процедура и короткая операционная инструкция в docs.

## 9. Definition of Done для первого цикла

Считаем CI/CD v1 внедренным, когда одновременно выполняется все ниже:

1. Merge в `main` запускает CI и CI стабильно зеленый.
2. После CI публикуются `api`/`web` образы в GHCR с `sha-*` и `main-latest`.
3. Stage деплоится автоматически по SSH без ручных действий.
4. Stage-домен доступен по HTTPS, API health отвечает `200`.
5. Есть рабочий ручной запуск workflow и проверенный rollback на предыдущий `sha-*`.
