#!/usr/bin/env bash
set -euo pipefail

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
  exit 1
fi

if [[ -z "${GHCR_REGISTRY:-}" || -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "Нет GHCR переменных окружения"
  exit 1
fi

source "$ENV_FILE"

if [[ -z "${API_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "В $ENV_FILE должны быть API_IMAGE и WEB_IMAGE"
  exit 1
fi

API_REPO="${API_IMAGE%%:*}"
WEB_REPO="${WEB_IMAGE%%:*}"

API_IMAGE="${API_REPO}:${IMAGE_TAG}"
WEB_IMAGE="${WEB_REPO}:${IMAGE_TAG}"

export API_IMAGE
export WEB_IMAGE

echo "$GHCR_TOKEN" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin

echo "→ Pull images"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull api web

echo "→ Deploy full stack"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "→ Wait API health..."

for i in {1..30}; do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api wget -q -O - http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo "API is ready"
    break
  fi

  sleep 2
done

echo "→ Run Prisma migrations"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api \
  sh -c "node_modules/.bin/prisma migrate deploy --config prisma.config.mjs"

echo "→ Final status"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Stage deploy completed: $IMAGE_TAG"
