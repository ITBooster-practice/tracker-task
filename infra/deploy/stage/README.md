# Stage manual deploy (step 2)

Этот набор файлов нужен для первого ручного деплоя stage на VPS без GitHub Actions.

## Что внутри

- `docker-compose.stage.yml` — stage стек с `postgres`, `redis`, `mailpit`, `api`, `web`.
- `.env.stage.example` — шаблон переменных.
- `deploy-stage.sh` — скрипт ручного деплоя по image tag.

## Подготовка на VPS

1. Скопировать на сервер только нужные файлы в `/opt/tracker/stage`:

- `docker-compose.stage.yml`
- `.env.stage.example`
- `deploy-stage.sh`

- Windows PowerShell:

```powershell
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\docker-compose.stage.yml" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\.env.stage.example" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i $HOME\.ssh\<ИМЯ_SSH_КЛЮЧА> "E:\vscod\tracker-task\infra\deploy\stage\deploy-stage.sh" deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
```

- Linux/macOS:

```bash
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/docker-compose.stage.yml deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/.env.stage.example deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
scp -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> ./infra/deploy/stage/deploy-stage.sh deploy@<IP_СЕРВЕРА>:/opt/tracker/stage/
```

Проверка на сервере:

```bash
ls -la /opt/tracker/stage
```

2. Создать env:

```bash
cp .env.stage.example .env.stage
```

3. Заполнить `.env.stage` реальными значениями.

Важно: значения с пробелами в `.env.stage` указывать в кавычках.
Пример: `MAIL_FROM_NAME="Tracker Stage"`.

### Что в `.env.stage` менять обязательно, а что по безопасности

Чтобы стенд просто запустился, часть значений может остаться как в примере.
Но для нормальной безопасности stage (особенно если он доступен извне) параметры ниже лучше разделять так:

Обязательно для корректного запуска:

- `API_IMAGE`, `WEB_IMAGE` — корректные репозитории образов (тег подставит `deploy-stage.sh`).
- `DATABASE_URL`, `DIRECT_URL` — должны совпадать с реальными `POSTGRES_*`.
- `JWT_SECRET` — не пустой, достаточно длинный.
- `COOKIE_DOMAIN`, `WEB_APP_URL`, `NEXT_PUBLIC_API_URL` — под ваш реальный stage-домен.

Можно оставить как в примере для временного стенда, но это небезопасно:

- `POSTGRES_USER=tracker`
- `POSTGRES_PASSWORD=change_me`

Почему это «работает», но плохо:

- Технически Postgres стартует с любыми валидными значениями, поэтому с дефолтами всё поднимется.
- Но это предсказуемые креды. Если кто-то получит доступ к сети/хосту, базу проще компрометировать.

Практичный компромисс:

- Для одноразовой локальной проверки можно оставить дефолты.
- Для постоянного stage на VPS — заменить на свои и держать их согласованными в `POSTGRES_*` + `DATABASE_URL`/`DIRECT_URL`.

4. Выдать права на запуск скрипта:

```bash
chmod +x deploy-stage.sh
```

## Переменные окружения для входа в GHCR

Обязательный шаг перед запуском `deploy-stage.sh`.
Если переменные не заданы, скрипт завершится с ошибкой.

Сделай это на сервере (в терминале, где будешь запускать деплой):

```bash
export GHCR_REGISTRY=ghcr.io
export GHCR_USERNAME=<ВАШ_GITHUB_ЛОГИН>
export GHCR_TOKEN=<ВАШ_GHCR_ТОКЕН>
```

Проверка (без вывода токена):

```bash
echo "$GHCR_REGISTRY"
echo "$GHCR_USERNAME"
[[ -n "$GHCR_TOKEN" ]] && echo "GHCR_TOKEN задан"
```

`deploy-stage.sh` использует эти значения для `docker login` в GHCR.

Обязательные переменные окружения:

- `GHCR_REGISTRY` (обычно `ghcr.io`)
- `GHCR_USERNAME`
- `GHCR_TOKEN`

Опционально: чтобы не вводить каждый раз, можно сохранить переменные только на сервере в отдельный файл (не в git):

```bash
cat >/opt/tracker/stage/.ghcr.env <<'ENV'
export GHCR_REGISTRY=ghcr.io
export GHCR_USERNAME=<ВАШ_GITHUB_ЛОГИН>
export GHCR_TOKEN=<ВАШ_GHCR_ТОКЕН>
ENV
chmod 600 /opt/tracker/stage/.ghcr.env
```

Перед деплоем:

```bash
source /opt/tracker/stage/.ghcr.env
```

## Запуск деплоя

Перед запуском деплоя образы с нужным тегом должны уже существовать в GHCR.
Если образов нет, сначала собери и запушь их.

### Подготовка образов (обязательный шаг, если образов еще нет)

Сборка и push на машине, где есть доступ к GHCR.

```bash
TAG=v1.0.0

# Если у вас уже есть домен для stage:
STAGE_HOST=stage.<ВАШ_ДОМЕН>

# Если домена пока нет, используйте временный вариант через sslip.io:
# STAGE_HOST=stage.<IP_СЕРВЕРА>.sslip.io

docker build -f apps/api/Dockerfile -t ghcr.io/suvstreet/tracker-api:$TAG .
docker build -f apps/web/Dockerfile \
	--build-arg NEXT_PUBLIC_API_URL=https://$STAGE_HOST/api \
	-t ghcr.io/suvstreet/tracker-web:$TAG .

echo "$GHCR_TOKEN" | docker login ghcr.io -u suvstreet --password-stdin
docker push ghcr.io/suvstreet/tracker-api:$TAG
docker push ghcr.io/suvstreet/tracker-web:$TAG
```

Проверка существования тегов:

```bash
docker pull ghcr.io/suvstreet/tracker-api:$TAG
docker pull ghcr.io/suvstreet/tracker-web:$TAG
```

Только после успешного `docker pull` запускать деплой.

```bash
./deploy-stage.sh <ТЕГ_ОБРАЗА>
```

Примеры тегов:

- `v1.0.0`
- `sha-<КРАТКИЙ_SHA_КОММИТА>`

Скрипт:

1. Логинится в GHCR.
2. Подставляет указанный тег для `api` и `web`.
3. Тянет свежие образы.
4. Поднимает/обновляет контейнеры.
5. Прогоняет Prisma migration.
6. Делает health-check API.

## Mock email на stage (Mailpit)

В stage используется тот же подход, что и в local-stage:

- API отправляет письма в SMTP `mailpit:1025`.
- UI Mailpit доступен только локально на VPS: `127.0.0.1:8025`.

Проверка после деплоя:

```bash
cd /opt/tracker/stage
docker compose --env-file .env.stage -f docker-compose.stage.yml ps
docker compose --env-file .env.stage -f docker-compose.stage.yml logs --tail=80 mailpit
```

Если уже всё запущено, но `mailpit` ещё не был в compose, обнови файлы и подними сервис:

```bash
cd /opt/tracker/stage
docker compose --env-file .env.stage -f docker-compose.stage.yml up -d mailpit api
```

Как открыть Mailpit UI с ноутбука безопасно (без публикации в интернет):

```bash
ssh -N -L 8026:127.0.0.1:8025 -i ~/.ssh/<ИМЯ_SSH_КЛЮЧА> deploy@<IP_СЕРВЕРА>
```

После этого UI доступен локально: `http://localhost:8026`.

## Переключить Caddy с заглушки на приложение

После успешного деплоя контейнеров нужно заменить заглушку в `/opt/tracker/caddy/Caddyfile` на reverse proxy,
иначе по домену будет открываться только текст `stage gateway is up`.

### 1) Подключить контейнер Caddy к stage-сети

На сервере:

```bash
docker network connect tracker-stage_stage tracker-gateway-caddy-1 || true
```

Если имена отличаются, проверь:

```bash
docker network ls
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

### 2) Включить пароль на stage (Basic Auth)

Сгенерируй bcrypt-хеш пароля (пример):

```bash
docker run --rm caddy:2 caddy hash-password --plaintext '<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>'
```

Сохрани результат в переменную (пример):

```bash
STAGE_BCRYPT_HASH='<ВСТАВЬТЕ_BCRYPT_ХЕШ_ИЗ_КОМАНДЫ_ВЫШЕ>'
```

### 3) Обновить `/opt/tracker/caddy/Caddyfile`

Вариант 1: если у вас уже есть домен (рекомендуется):

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
CADDY
```

Вариант 2: если домена пока нет, временно используйте `sslip.io`:

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
CADDY
```

### 4) Перезапустить Caddy

```bash
cd /opt/tracker/caddy
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose restart caddy
docker compose logs --tail=80 caddy
```

Если `docker compose exec` недоступен (контейнер ещё не поднят), сначала выполни:

```bash
docker compose up -d
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose restart caddy
```

### 5) Проверить

```bash
# Если у вас уже есть домен:
STAGE_HOST=stage.<ВАШ_ДОМЕН>

# Если домена пока нет:
# STAGE_HOST=stage.<IP_СЕРВЕРА>.sslip.io

curl -I https://$STAGE_HOST
curl -I https://$STAGE_HOST/api
curl -u 'stage:<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>' -I https://$STAGE_HOST
curl -u 'stage:<ВАШ_СЛОЖНЫЙ_ПАРОЛЬ>' -I https://$STAGE_HOST/api
```

Ожидаемо:

- без логина: `401 Unauthorized`
- с логином: домен открывает web-приложение
- с логином: `/api` отвечает от API

## Важно

- Этот шаг не включает reverse proxy и SSL сам по себе.
- Для HTTPS на домене нужен отдельный Caddy/Nginx слой из инфраструктурного плана.
