#!/usr/bin/env bash
# scp -i ~/.ssh/<ИМЯ SSH КЛЮЧА> infra/deploy/stage/deploy-stage.sh <ИМЯ USER>@<VDS_IP_OR_HOST>:/opt/tracker/scripts/
# либо
# скопировать все скрипты *.sh разом: scp -i ~/.ssh/<ИМЯ SSH КЛЮЧА> infra/deploy/stage/*.sh <ИМЯ USER>@<VDS_IP_OR_HOST>:/opt/tracker/scripts/
set -euo pipefail

# -----------------------------
# Проверка аргументов
# -----------------------------
if [[ $# -ne 1 ]]; then
  echo "Использование: $0 <image_tag>"
  exit 1
fi

IMAGE_TAG="$1"

# -----------------------------
# Пути к файлам
# -----------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Каталог shared можно переопределить переменной окружения STAGE_SHARED_PATH.
SHARED_DIR="${STAGE_SHARED_PATH:-$SCRIPT_DIR}"

COMPOSE_FILE="$SHARED_DIR/docker-compose.stage.yml"
ENV_FILE="$SHARED_DIR/.env.stage"
GHCR_ENV="$SHARED_DIR/.ghcr.env"
WEB_RUNTIME_ENV_FILE="$SHARED_DIR/.env.web"
WEB_FEATURE_FLAGS_FILE="$SHARED_DIR/.env.feature-flags"

# -----------------------------
# Проверка наличия файлов
# -----------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Не найден файл $ENV_FILE"
  exit 1
fi

if [[ ! -f "$GHCR_ENV" ]]; then
  echo "❌ Не найден файл $GHCR_ENV"
  exit 1
fi

if [[ ! -f "$WEB_FEATURE_FLAGS_FILE" ]]; then
  echo "❌ Не найден файл $WEB_FEATURE_FLAGS_FILE"
  exit 1
fi

# -----------------------------
# Загружаем GHCR переменные (доступ к registry)
# -----------------------------
set -a
source "$GHCR_ENV"
set +a

# Проверяем обязательные переменные GHCR
if [[ -z "${GHCR_REGISTRY:-}" || -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "❌ Нет GHCR переменных окружения"
  exit 1
fi

# -----------------------------
# Загружаем env приложения (docker compose конфиг)
# -----------------------------
set -a
source "$ENV_FILE"
set +a

# Проверяем наличие образов
if [[ -z "${API_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "❌ В .env.stage должны быть API_IMAGE и WEB_IMAGE"
  exit 1
fi

if [[ -z "${NEXT_PUBLIC_API_URL:-}" ]]; then
  echo "❌ В .env.stage должен быть NEXT_PUBLIC_API_URL"
  exit 1
fi

# -----------------------------
# Пересобираем теги образов под текущий deploy
# -----------------------------
API_IMAGE="${API_IMAGE%%:*}:${IMAGE_TAG}"
WEB_IMAGE="${WEB_IMAGE%%:*}:${IMAGE_TAG}"

export API_IMAGE WEB_IMAGE

# -----------------------------
# Генерируем runtime env для web
# -----------------------------
{
  echo "# Автогенерируется из .env.stage при каждом deploy"
  echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
  grep -E '^NEXT_PUBLIC_[A-Z0-9_]+=.*$' "$WEB_FEATURE_FLAGS_FILE" | grep -v '^NEXT_PUBLIC_API_URL=' || true
} > "$WEB_RUNTIME_ENV_FILE"

WEB_RUNTIME_ENV_HASH="$(sha256sum "$WEB_RUNTIME_ENV_FILE" | awk '{print $1}')"

export WEB_RUNTIME_ENV_HASH

echo "🚀 Deploy версии: $IMAGE_TAG"
echo "   API: $API_IMAGE"
echo "   WEB: $WEB_IMAGE"
echo "   WEB runtime env: $WEB_RUNTIME_ENV_FILE"

# -----------------------------
# Логин в GitHub Container Registry
# -----------------------------
echo "$GHCR_TOKEN" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin

# -----------------------------
# Скачиваем образы
# -----------------------------
echo "⬇️ Pull images"
docker compose -f "$COMPOSE_FILE" pull api web

# -----------------------------
# Поднимаем инфраструктуру
# -----------------------------
echo "📦 Deploy stack"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# -----------------------------
# Ожидание готовности API
# -----------------------------
echo "⏳ Ожидание готовности API..."

for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec -T api \
    sh -c "wget -q -O - http://127.0.0.1:3000/health" >/dev/null 2>&1; then
    echo "✅ API готов"
    break
  fi

  sleep 2
done

# -----------------------------
# Запуск миграций Prisma
# -----------------------------
echo "🧬 Запуск миграций Prisma"

docker compose -f "$COMPOSE_FILE" exec -T api \
  sh -c "npx prisma migrate deploy --config prisma.config.mjs"

# -----------------------------
# Итоговый статус
# -----------------------------
echo "📊 Статус контейнеров"
docker compose -f "$COMPOSE_FILE" ps

echo "🎉 Deploy завершён: $IMAGE_TAG"
