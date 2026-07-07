# Шаг 3: Сборка образов и публикация в GHCR

Этот runbook описывает, как собрать Docker-образы `api` и `web` и опубликовать их в GitHub Container Registry (GHCR) — вручную, до подключения GitHub Actions.

Что делаем на этом шаге:

1. Проверяем доступ к GHCR.
2. Собираем образы `api` и `web` из корня монорепо.
3. Тегируем двумя тегами: `sha-<короткий_sha>` и `main-latest`.
4. Пушим в GHCR.
5. Проверяем, что образы доступны.

## 0. Какие файлы используются

- [apps/api/Dockerfile](../../../apps/api/Dockerfile)
- [apps/web/Dockerfile](../../../apps/web/Dockerfile)

## 1. Подготовить переменные окружения

Все команды ниже используют эти переменные. Выставьте их один раз в текущем терминале.

```bash
export GHCR_REGISTRY=ghcr.io
export GHCR_USERNAME=<ВАШ_GITHUB_ЛОГИН>
export GHCR_TOKEN=<ВАШ_GHCR_ТОКЕН>
export GITHUB_ORG=<ВАШ_GITHUB_ЛОГИН_ИЛИ_ОРГ>
```

Токен должен иметь scope `write:packages` (и `read:packages`).
Создать можно здесь: <https://github.com/settings/tokens>

Проверка:

```bash
echo "$GHCR_REGISTRY"
echo "$GHCR_USERNAME"
echo "$GITHUB_ORG"
[[ -n "$GHCR_TOKEN" ]] && echo "GHCR_TOKEN задан"
```

## 2. Получить короткий SHA коммита

```bash
IMAGE_TAG="sha-$(git rev-parse --short HEAD)"
echo "IMAGE_TAG=$IMAGE_TAG"
```

Пример результата: `sha-a1b2c3d`.

## 3. Логин в GHCR

```bash
echo "$GHCR_TOKEN" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin
```

Ожидаемо: `Login Succeeded`.

## 4. Собрать образ `api`

Сборка ведётся из корня монорепо — Dockerfile копирует файлы воркспейса (`pnpm-workspace.yaml`, `turbo.json`, пакеты монорепо).

```bash
docker build \
  -f apps/api/Dockerfile \
  -t "$GHCR_REGISTRY/$GITHUB_ORG/tracker-api:$IMAGE_TAG" \
  .
```

Первая сборка занимает несколько минут. Повторные — быстрее за счёт кэша слоёв.

Проверка:

```bash
docker images | grep tracker-api
```

## 5. Собрать образ `web`

`web` принимает `NEXT_PUBLIC_API_URL` как build argument — он вшивается в JS-бандл на этапе сборки Next.js.

Если у вас уже есть stage-домен:

```bash
docker build \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://stage.<ВАШ_ДОМЕН>/api \
  -t "$GHCR_REGISTRY/$GITHUB_ORG/tracker-web:$IMAGE_TAG" \
  .
```

Если домена пока нет (sslip.io):

```bash
docker build \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://stage.<IP_СЕРВЕРА>.sslip.io/api \
  -t "$GHCR_REGISTRY/$GITHUB_ORG/tracker-web:$IMAGE_TAG" \
  .
```

Проверка:

```bash
docker images | grep tracker-web
```

## 6. Запушить образы в GHCR

```bash
docker push "$GHCR_REGISTRY/$GITHUB_ORG/tracker-api:$IMAGE_TAG"
docker push "$GHCR_REGISTRY/$GITHUB_ORG/tracker-web:$IMAGE_TAG"
```

## 7. Проверить образы в GHCR

Через GitHub UI:

```text
https://github.com/<ВАШ_GITHUB_ЛОГИН_ИЛИ_ОРГ>/packages
```

Через API:

```bash
docker pull ghcr.io/$GITHUB_ORG/tracker-api:$IMAGE_TAG
docker pull ghcr.io/$GITHUB_ORG/tracker-web:$IMAGE_TAG
```

Ожидаемо: в выводе команды отображается сообщение:

Status: Image is up to date for ghcr.io/.../tracker-api:v1.0.0
Status: Image is up to date for ghcr.io/.../tracker-web:v1.0.0

Это подтверждает, что указанные теги (v1.0.0) существуют в registry и доступны для скачивания.

## 8. Задеплоить образ на stage

```bash
# На сервере:
cd /opt/tracker/stage
./deploy-stage.sh "$IMAGE_TAG"
```

Где `$IMAGE_TAG` — тег из шага 2, например `sha-a1b2c3d`.

## 9. Что делать после Шага 3

Ручной цикл готов: собрать образ → запушить → задеплоить на stage.

Следующий шаг — автоматизировать сборку и деплой через GitHub Actions:

- Этап 3 плана: [cicd-start-plan.md → Этап 3](./cicd-start-plan.md)
