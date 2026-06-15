# Шаг 2: Ручной stage-деплой (подробно)

Этот runbook продолжает Шаг 1 и описывает ручной деплой stage без GitHub Actions.

Что делаем на этом шаге:

1. Копируем шаблоны в `/opt/tracker/stage`.
2. Заполняем `.env.stage`.
3. Запускаем `deploy-stage.sh` с нужным тегом образов.
4. Включаем Mailpit для проверки писем.
5. Переключаем Caddy с заглушки на приложение.

Важно: шаблоны файлов хранятся в `infra/deploy/stage` и остаются там.

После Шага 2 переходите к Шагу 3 — сборка образов и публикация в GHCR:

- [step-3-build-and-push-images.md](./step-3-build-and-push-images.md)

## 0. Какие файлы используются

- [infra/deploy/stage/docker-compose.stage.yml](../../../infra/deploy/stage/docker-compose.stage.yml)
- [infra/deploy/stage/.env.stage.example](../../../infra/deploy/stage/.env.stage.example)
- [infra/deploy/stage/deploy-stage.sh](../../../infra/deploy/stage/deploy-stage.sh)

## 1. Скопировать шаблоны на сервер

Скопируйте файлы в `/opt/tracker/stage`.

Windows PowerShell:

```powershell
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\docker-compose.stage.yml" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\.env.stage.example" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\deploy-stage.sh" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
```

Linux/macOS:

```bash
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/docker-compose.stage.yml deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/.env.stage.example deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/deploy-stage.sh deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
```

Проверка на сервере:

```bash
ls -la /opt/tracker/stage
```

## 2. Подготовить `.env.stage`

```bash
cd /opt/tracker/stage
cp .env.stage.example .env.stage
```

Заполните `.env.stage`.

Минимум для запуска:

- корректные `API_IMAGE` и `WEB_IMAGE` (репозитории образов)
- согласованные `POSTGRES_*`, `DATABASE_URL`, `DIRECT_URL`
- `REDIS_URL` (по умолчанию: `redis://redis:6379`)
- `JWT_SECRET`, `JWT_ACCESS_TOKEN_TTL`, `JWT_REFRESH_TOKEN_TTL`
- `COOKIE_DOMAIN`, `COOKIES_TTL`, `WEB_APP_URL`, `NEXT_PUBLIC_API_URL`
- почтовые переменные: `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, `MAIL_FROM_NAME`
- feature flags: `NEXT_PUBLIC_FEATURE_PROJECTS`, `NEXT_PUBLIC_FEATURE_TASKS`, `NEXT_PUBLIC_FEATURE_TEAM_SETTINGS`, `NEXT_PUBLIC_FEATURE_BOARDS`

## 3. Подготовить доступ к GHCR

```bash
export GHCR_REGISTRY=ghcr.io
export GHCR_USERNAME=<ВАШ_GITHUB_ЛОГИН>
export GHCR_TOKEN=<ВАШ_GHCR_ТОКЕН>
```

Проверка:

```bash
echo "$GHCR_REGISTRY"
echo "$GHCR_USERNAME"
[[ -n "$GHCR_TOKEN" ]] && echo "GHCR_TOKEN задан"
```

## 4. Запустить ручной деплой

```bash
cd /opt/tracker/stage
chmod +x deploy-stage.sh
./deploy-stage.sh <ТЕГ_ОБРАЗА>
```

Примеры тега:

- `v1.0.0`
- `sha-<КРАТКИЙ_SHA_КОММИТА>`

Что делает скрипт:

1. Логин в GHCR.
2. Подстановка тега в `api`/`web`.
3. Pull образов.
4. Поднятие полного стека (`postgres`, `redis`, `mailpit`, `api`, `web`).
5. Health-check API (`/health`, до 30 попыток с интервалом 2 с).
6. `prisma migrate deploy --config prisma.config.mjs`.

## 5. Проверить Mailpit на stage

```bash
cd /opt/tracker/stage
docker compose --env-file .env.stage -f docker-compose.stage.yml ps
docker compose --env-file .env.stage -f docker-compose.stage.yml logs --tail=80 mailpit
```

Проверить наличие volume:

```bash
docker volume ls | grep mailpit
```

Mailpit доступен через отдельный поддомен (после того как Caddy настроен на шаге 6):

```text
https://mail.stage.<ВАШ_ДОМЕН>
```

Если используется временный домен:

```text
https://mail.stage.<IP_СЕРВЕРА>.sslip.io
```

Доступ защищён той же Basic Auth, что и stage-приложение.

## 6. Переключить Caddy с заглушки на приложение

1. Подключить Caddy к stage-сети:

```bash
docker network connect tracker-stage_stage tracker-gateway-caddy-1 || true
```

2. Подготовить хеш для Basic Auth:

```bash
docker run --rm caddy:2 caddy hash-password --plaintext '<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>'
STAGE_BCRYPT_HASH='<ВСТАВЬТЕ_BCRYPT_ХЕШ_ИЗ_КОМАНДЫ_ВЫШЕ>'
```

3. Обновить `Caddyfile`.

Если есть домен:

```bash
cat >/opt/tracker/caddy/Caddyfile <<CADDY
stage.<ВАШ_ДОМЕН> {
	encode zstd gzip

	basic_auth {
		stage ${STAGE_BCRYPT_HASH}
	}

	handle_path /api/* {
		reverse_proxy tracker-stage-api-1:3000
	}

	handle {
		reverse_proxy tracker-stage-web-1:3000
	}
}

mail.stage.<ВАШ_ДОМЕН> {
	encode zstd gzip

	basic_auth {
		stage ${STAGE_BCRYPT_HASH}
	}

	reverse_proxy tracker-stage-mailpit-1:8025
}
CADDY
```

Если домена пока нет:

```bash
cat >/opt/tracker/caddy/Caddyfile <<CADDY
stage.<IP_СЕРВЕРА>.sslip.io {
	encode zstd gzip

	basic_auth {
		stage ${STAGE_BCRYPT_HASH}
	}

	handle_path /api/* {
		reverse_proxy tracker-stage-api-1:3000
	}

	handle {
		reverse_proxy tracker-stage-web-1:3000
	}
}

mail.stage.<IP_СЕРВЕРА>.sslip.io {
	encode zstd gzip

	basic_auth {
		stage ${STAGE_BCRYPT_HASH}
	}

	reverse_proxy tracker-stage-mailpit-1:8025
}
CADDY
```

4. Применить конфиг Caddy:

```bash
cd /opt/tracker/caddy
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose restart caddy
docker compose logs --tail=80 caddy
```

## 7. Проверка после Шага 2

```bash
# Если есть домен:
STAGE_HOST=stage.<ВАШ_ДОМЕН>
MAIL_HOST=mail.stage.<ВАШ_ДОМЕН>

# Если домена пока нет:
# STAGE_HOST=stage.<IP_СЕРВЕРА>.sslip.io
# MAIL_HOST=mail.stage.<IP_СЕРВЕРА>.sslip.io

curl -I https://$STAGE_HOST
curl -I https://$STAGE_HOST/api
curl -u 'stage:<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>' -I https://$STAGE_HOST
curl -u 'stage:<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>' -I https://$STAGE_HOST/api
curl -u 'stage:<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>' -I https://$MAIL_HOST
```

Ожидаемо:

- без логина: `401 Unauthorized`
- с логином: web открывается
- с логином: `/api` отвечает от API
- с логином: `mail.stage.*` открывает веб-интерфейс Mailpit
