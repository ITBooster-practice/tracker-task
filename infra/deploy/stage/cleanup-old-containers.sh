#!/usr/bin/env bash
set -euo pipefail

# Имя compose-проекта stage-стека.
COMPOSE_PROJECT="tracker-stage"

echo "🧹 Очистка старых контейнеров проекта: $COMPOSE_PROJECT"

# Берём только остановленные контейнеры этого compose-проекта.
old_containers="$(docker ps -aq \
  --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" \
  --filter "status=exited" || true)"

if [[ -z "$old_containers" ]]; then
  echo "✅ Остановленных контейнеров для удаления нет"
  exit 0
fi

echo "$old_containers" | xargs -r docker rm -f

echo "✅ Очистка завершена"