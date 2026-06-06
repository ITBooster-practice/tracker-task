#!/usr/bin/env bash
set -euo pipefail

# Использование:
#   ./deploy-stage.sh <image_tag>
# Пример:
#   ./deploy-stage.sh sha-a1b2c3d4

if [[ $# -ne 1 ]]; then
  echo "Использование: $0 <image_tag>"
  exit 1
fi

IMAGE_TAG="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.stage.yml"
ENV_FILE="$SCRIPT_DIR/.env.stage"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Не найден файл $ENV_FILE"
  echo "Сначала создайте его из .env.stage.example"
  exit 1
fi

if [[ -z "${GHCR_REGISTRY:-}" || -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "Не найдены учетные данные GHCR в переменных окружения."
  echo "Нужны переменные: GHCR_REGISTRY, GHCR_USERNAME, GHCR_TOKEN"
  exit 1
fi

source "$ENV_FILE"

# Храним базовые имена репозиториев в .env.stage, а конкретный тег подставляем здесь.
if [[ -z "${API_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "В $ENV_FILE должны быть определены API_IMAGE и WEB_IMAGE"
  exit 1
fi

API_REPO="${API_IMAGE%%:*}"
WEB_REPO="${WEB_IMAGE%%:*}"
API_IMAGE="${API_REPO}:${IMAGE_TAG}"
WEB_IMAGE="${WEB_REPO}:${IMAGE_TAG}"

export API_IMAGE
export WEB_IMAGE

echo "$GHCR_TOKEN" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull api web

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres redis

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d api web

# Запускаем Prisma-миграции внутри контейнера API.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api sh -c "node_modules/.bin/prisma migrate deploy --config prisma.config.mjs"

# Легкая проверка health-check через сам контейнер API.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api sh -c "wget -q -O - http://127.0.0.1:3000/health >/dev/null || wget -q -O - http://127.0.0.1:3000/api/health >/dev/null"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Stage-деплой завершен для тега: $IMAGE_TAG"
