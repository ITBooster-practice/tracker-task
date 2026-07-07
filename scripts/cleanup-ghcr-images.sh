#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Использование: $0 <org_or_user> [keep_count]"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ Не найден gh CLI"
  exit 1
fi

OWNER_RAW="$1"
KEEP_COUNT="${2:-3}"
OWNER="$(echo "$OWNER_RAW" | tr '[:upper:]' '[:lower:]')"
PACKAGES=("tracker-api" "tracker-web")

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "❌ Не задан GH_TOKEN"
  exit 1
fi

cleanup_package() {
  local package_name="$1"

  echo "🧹 Очистка пакета: $package_name (оставить: $KEEP_COUNT)"

  mapfile -t version_ids < <(
    gh api --paginate "orgs/$OWNER/packages/container/$package_name/versions?per_page=100" \
      --jq '.[] | "\(.id)\t\(.created_at)"' \
      | sort -t $'\t' -k2,2r \
      | cut -f1
  )

  local total="${#version_ids[@]}"
  if (( total == 0 )); then
    echo "ℹ️ Версии не найдены"
    return
  fi

  if (( total <= KEEP_COUNT )); then
    echo "✅ Нечего удалять (всего: $total)"
    return
  fi

  for (( i=KEEP_COUNT; i<total; i++ )); do
    local id="${version_ids[$i]}"
    gh api -X DELETE "orgs/$OWNER/packages/container/$package_name/versions/$id" >/dev/null
    echo "🗑️ Удалена версия id=$id"
  done

  echo "✅ Очистка завершена (было: $total, осталось: $KEEP_COUNT)"
}

for package in "${PACKAGES[@]}"; do
  cleanup_package "$package"
done
