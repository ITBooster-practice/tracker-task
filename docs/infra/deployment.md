# План инфраструктуры и автоматизации деплоя

Документ описывает целевую инфраструктуру проекта Tracker Task: stage- и prod-окружения на одном VPS, автоматический деплой через GitHub Actions, SSL, реестр образов, обновление БД stage из prod с обезличиванием, hotfix-процесс. Только бесплатные инструменты (кроме VPS).

Документ написан в обучающем стиле: где есть выбор между двумя инструментами (Nginx/Caddy, Docker Hub/GHCR), показываются оба варианта, чтобы можно было сравнить и выбрать осознанно.

---

## 1. Цели

1. Один VPS обслуживает оба окружения:
   - `example.ru` — production;
   - `stage.example.ru` — поддомен для предварительной сборки.
2. Релизный поток: PR → CI → авто-деплой на stage → ручное подтверждение → промоут на prod.
3. Откат prod выполняется одной кнопкой на предыдущий рабочий образ.
4. SSL-сертификаты выпускаются автоматически и бесплатно (Let's Encrypt).
5. На сервере хранится не более 3 предыдущих образов на окружение, в реестре — не более 5. Старые удаляются автоматически.
6. БД prod — Supabase. БД stage — Postgres в Docker.
7. Раз в месяц БД stage обновляется срезом из prod с обезличиванием чувствительных полей; пустые сущности добиваются seed-данными; в stage всегда есть root-пользователь с полными правами.
8. Должен существовать быстрый путь для тривиальных правок (опечатки, мелкие фиксы) сразу в prod без отдельной release-ветки.
9. Кнопку промоута на prod нажимает тимлид команды (через GitHub Environments с required reviewers).

---

## 2. Архитектура окружений

```
                +-----------------------------+
                |          VPS (Ubuntu)       |
                |                             |
   Пользователь |  +--------------------+     |
   ----HTTPS--->|  | Caddy или Nginx    |     |
                |  | TLS + Let’s Encrypt|     |
                |  +---------+----------+     |
                |            |                |
                |   +--------+---------+      |
                |   |                  |      |
                |  prod-stack       stage-stack
                |   |                  |      |
                |  api(:prod)       api(:stage)
                |  web(:prod)       web(:stage)
                |   |                  |      |
                |  Supabase(remote)  Postgres |
                |                    (docker) |
                +-----------------------------+

    example.ru        → prod-stack
    stage.example.ru  → stage-stack (Basic Auth)
```

Окружения изолированы: разные docker-сети, разные `.env`, разные тома, разные образы.

---

## 3. Стек инструментов (бесплатные)

1. VPS: Ubuntu 22.04 LTS или 24.04 LTS.
2. Контейнеры: Docker Engine + Docker Compose v2.
3. Reverse proxy и SSL: на выбор — Caddy 2 (рекомендация: проще) или Nginx + Certbot (если команда уже знает Nginx). Оба бесплатны. В разделе 6 показаны оба варианта.
4. Реестр образов: на выбор — GHCR (GitHub Container Registry, рекомендация) или Docker Hub. Оба бесплатны для наших объёмов. В разделе 10 показаны оба варианта.
5. CI/CD: GitHub Actions.
6. Секреты: GitHub Actions Secrets + защищённые `.env` на сервере (`chmod 600`, см. раздел 8).
7. БД prod: Supabase (используется только Postgres, Auth не подключаем).
8. БД stage: `postgres:16` в Docker.
9. Резервные копии stage: ежемесячный анонимизированный срез из prod (раздел 12).
10. Email для тестов: бесплатный inbox-провайдер (Mailtrap sandbox / Ethereal / self-hosted MailHog) — см. раздел 16.
11. Мониторинг и логи: поэтапно (раздел 15), стек из `README.md` корня проекта — Prometheus, Loki, Grafana, Alloy, node_exporter, cAdvisor, Uptime Kuma, GlitchTip.
12. Защита stage: Basic Auth в Caddy/Nginx; на будущее — IP allow-list, Cloudflare Tunnel/Access, mTLS (раздел 14).

---

## 4. Подготовка VPS — подробно

### 4.1. Зачем все эти шаги

VPS из коробки — это голая Ubuntu с root-пользователем, открытым SSH на стандартном порту и без firewall. Это удобно для атак brute-force и для случайных команд от имени root. Цель раздела — превратить VPS в безопасную рабочую площадку.

### 4.2. Шаги

#### 4.2.1. Первый вход и обновление системы

```bash
ssh root@<IP>
apt update && apt upgrade -y
```

`apt update` обновляет список доступных пакетов из репозиториев Ubuntu, `apt upgrade -y` устанавливает обновления (включая security-патчи). Делается всегда первым шагом, иначе остальные пакеты могут установить устаревшие зависимости.

#### 4.2.2. Создать non-root пользователя `deploy` с sudo

**Зачем.** Работать под root опасно: любая ошибка или скомпрометированная сессия даёт полный доступ к серверу. Хорошая практика — создать обычного пользователя и выдать ему `sudo` (правo временно повышать привилегии для отдельных команд по запросу пароля или без, в зависимости от настройки).

**Как.**

```bash
adduser deploy                      # создаёт пользователя, спрашивает пароль
usermod -aG sudo deploy             # добавляет в группу sudo
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Теперь можно зайти `ssh deploy@<IP>` и выполнять команды через `sudo`.

#### 4.2.3. Отключить вход root по SSH и парольную аутентификацию

**Зачем.** 99% автоматизированных атак ломятся в `root` по паролю. Если root запрещён, а пароли отключены и работают только ключи — этот класс атак исчезает.

**Как.** Открыть `/etc/ssh/sshd_config` и выставить:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Перезапустить SSH: `sudo systemctl restart ssh`.

Перед закрытием сессии **обязательно** проверить вход под `deploy` из второго терминала. Иначе можно заблокировать себя.

#### 4.2.4. UFW (Uncomplicated Firewall)

**Что это.** Простой фронтенд к iptables. Управляет тем, какие порты доступны снаружи.

**Зачем.** Закрыть всё, кроме нужного: SSH (22), HTTP (80), HTTPS (443). Любые служебные порты Docker (например, Postgres 5432) не должны быть видны из интернета.

**Как.**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

#### 4.2.5. fail2ban

**Что это.** Демон, который читает логи (по умолчанию `/var/log/auth.log` для SSH) и автоматически банит IP-адреса, с которых идёт перебор паролей или подозрительные попытки входа. Бан реализуется через iptables на N минут.

**Зачем.** Дополнительный слой защиты SSH и (по желанию) HTTP-аутентификации Nginx/Caddy.

**Как.**

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

Дефолтных настроек хватает: 5 неудачных попыток за 10 минут → бан на 10 минут.

#### 4.2.6. Установка Docker и Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
```

После добавления в группу `docker` нужно перезайти, чтобы группа применилась. Compose v2 идёт встроенно как `docker compose`.

#### 4.2.7. Настройка логгинг-драйвера Docker

`/etc/docker/daemon.json`:

```json
{
	"log-driver": "json-file",
	"log-opts": {
		"max-size": "20m",
		"max-file": "5"
	}
}
```

`sudo systemctl restart docker`. Без этой настройки логи контейнеров будут расти бесконечно и забьют диск.

#### 4.2.8. Подготовка каталогов

```bash
sudo mkdir -p /opt/tracker/{prod,stage,caddy,scripts}
sudo chown -R deploy:deploy /opt/tracker
```

Структура:

```
/opt/tracker/
  prod/
    docker-compose.yml
    .env
    data/
  stage/
    docker-compose.yml
    .env
    data/
  caddy/                # либо nginx/
    Caddyfile
    data/
    config/
  scripts/
    deploy.sh
    cleanup-images.sh
    refresh-stage-db.sh
```

#### 4.2.9. DNS

A-записи у регистратора домена:

```
example.ru        A    <IP VPS>
stage.example.ru  A    <IP VPS>
```

TTL 300 на старте — быстро меняется, потом можно поднять.

---

## 5. Почему `/opt` и что такое FHS

Linux использует стандарт **Filesystem Hierarchy Standard (FHS)** — соглашение, где лежат какие данные. Это важно знать, чтобы сервер выглядел знакомо любому администратору.

Ключевые каталоги:

| Каталог      | Что туда кладут                                                                              |
| ------------ | -------------------------------------------------------------------------------------------- |
| `/etc`       | Системные конфиги (sshd_config, fail2ban/, ufw/)                                             |
| `/var/log`   | Логи системы и сервисов                                                                      |
| `/var/lib`   | Изменяемые данные сервисов, ставящихся из пакетов (Postgres, MySQL)                          |
| `/usr/local` | Программы, установленные администратором вручную (не из пакетов)                             |
| `/opt`       | **Сторонние/кастомные приложения, поставляемые «целиком»**, обычно одним каталогом на проект |
| `/srv`       | Данные, обслуживающие сайты/сервисы (по соглашению — для контента)                           |
| `/home`      | Домашние каталоги пользователей                                                              |
| `/tmp`       | Временные файлы, очищается при ребуте                                                        |

`/opt/tracker/` — потому что это наше отдельное приложение «целиком», со своей структурой, не часть системного пакета. Альтернативно используют `/srv/tracker/` (тоже допустимо), но `/opt` чаще встречается для self-hosted проектов и явнее отделяет «наше» от «системного».

Логи и БД stage Docker всё равно физически живут внутри `/var/lib/docker/...`, но смонтированные тома `./data/...` лежат в `/opt/tracker/<env>/data/` — удобно для бекапов одной командой.

---

## 6. Reverse proxy и SSL: Nginx vs Caddy

Reverse proxy — это вход в систему. Браузер клиента стучится в `:443`, proxy завершает TLS, смотрит на `Host:` (имя домена) и роутит запрос на нужный контейнер (`api` или `web` в нужном окружении).

### 6.1. Что общего

Оба:

- завершают TLS (HTTPS) на себе;
- умеют получать бесплатные сертификаты Let's Encrypt;
- проксируют в нужный контейнер по hostname.

Различие: Caddy делает TLS «само», Nginx требует отдельной утилиты (Certbot).

### 6.2. Caddy (рекомендация)

**Плюсы.** Минимум конфигурации. TLS, HTTP/2, gzip, редирект с HTTP на HTTPS — всё включено по умолчанию. Сертификаты получает и продлевает сам.

**Минусы.** Сообщество меньше, чем у Nginx. Если нужна экзотика — придётся читать docs.

**`docker-compose.yml` Caddy** (`/opt/tracker/caddy/docker-compose.yml`):

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./data:/data
      - ./config:/config
    networks:
      - edge

networks:
  edge:
    external: true
```

**`Caddyfile`:**

```caddyfile
example.ru {
    encode zstd gzip
    reverse_proxy web-prod:3000
    reverse_proxy /api/* api-prod:3000
}

stage.example.ru {
    encode zstd gzip
    basic_auth /* {
        # хеш генерируется командой:
        #   docker run --rm caddy:2 caddy hash-password
        team JDJhJDE0JE...
    }
    reverse_proxy web-stage:3000
    reverse_proxy /api/* api-stage:3000
}
```

И всё. HTTPS, редирект с HTTP, сертификаты — автоматом.

### 6.3. Nginx + Certbot (если привычнее)

**Плюсы.** Огромное сообщество, любые сценарии гуглятся.

**Минусы.** Конфиг длиннее, сертификаты — отдельный инструмент.

**Получение сертификата (Certbot).**

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d example.ru -d stage.example.ru
```

Certbot положит сертификаты в `/etc/letsencrypt/live/example.ru/`. Продление — крон `certbot renew --quiet` раз в день.

Если Nginx работает в Docker, удобнее использовать образ `jonasal/nginx-certbot`, который сам поднимает Certbot внутри.

**`nginx.conf` (фрагмент):**

```nginx
server {
    listen 80;
    server_name example.ru stage.example.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.ru;

    ssl_certificate     /etc/letsencrypt/live/example.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.ru/privkey.pem;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    location /api/ {
        proxy_pass http://api-prod:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }

    location / {
        proxy_pass http://web-prod:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name stage.example.ru;

    ssl_certificate     /etc/letsencrypt/live/example.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.ru/privkey.pem;

    auth_basic            "stage";
    auth_basic_user_file  /etc/nginx/.htpasswd;   # создать: htpasswd -c .htpasswd team

    location /api/ {
        proxy_pass http://api-stage:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }

    location / {
        proxy_pass http://web-stage:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

### 6.4. Сравнение в одной таблице

|                           | Caddy                   | Nginx + Certbot                      |
| ------------------------- | ----------------------- | ------------------------------------ |
| Получение TLS             | Автоматически           | Отдельная утилита Certbot            |
| Продление TLS             | Автоматически           | Cron на `certbot renew`              |
| Конфиг для нашего проекта | ~15 строк               | ~50 строк                            |
| Basic Auth                | Встроено (`basic_auth`) | Встроено (`auth_basic` + htpasswd)   |
| HTTP/3                    | Из коробки              | Нужно собирать самим                 |
| Сообщество                | Среднее                 | Огромное                             |
| Кривая обучения           | Низкая                  | Средняя                              |
| Рекомендация              | Для нас — да            | Если уже знаком и хочется привычного |

### 6.5. Проксирование API: через Next.js или напрямую?

В проекте есть `apps/web/proxy.ts`. Есть две схемы:

**Вариант A. Reverse proxy → Web → API** (всё через Next.js).

- Браузер → Caddy/Nginx → web (Next.js) → API.
- Next.js перенаправляет `/api/*` на api-контейнер во внутренней сети.

Плюсы: один origin на фронте, нет проблем с CORS, куки JWT просто работают на одном домене.
Минусы: лишний хоп через Node, на нагрузке заметная просадка; web-контейнер становится единой точкой отказа для API.

**Вариант B. Reverse proxy → отдельно Web, отдельно API** (наш выбор).

- Браузер → Caddy/Nginx; `/api/*` идёт сразу в `api-prod:3000`, остальное — в `web-prod:3000`.
- API и Web — независимые контейнеры на одном домене.

Плюсы: один хоп меньше; API можно масштабировать/перезапускать отдельно; CORS не возникает, так как домен общий (`example.ru/api/*`).
Минусы: нужно следить, чтобы маршруты `web` не конфликтовали с `/api/*` (но Next.js так и так не выдаёт API из `/api/`, если этого не запрограммировать).

**Рекомендация.** Вариант B. Конфиги Caddy/Nginx выше уже под него. `apps/web/proxy.ts` тогда нужен только для локальной разработки (когда хочется запустить `pnpm dev` и проксировать `/api/*` на локальный api на другом порту); в проде он не задействован.

---

## 7. Docker-образы приложений

В проекте сейчас нет Dockerfile для `apps/api` и `apps/web` — их нужно добавить.

1. `apps/api/Dockerfile`:
   1. multi-stage: builder (`node:22-alpine` + pnpm) → runner (`node:22-alpine`);
   2. устанавливает зависимости через pnpm, выполняет `pnpm build`, `prisma generate`;
   3. в runner копируется `dist/`, `node_modules` (prod-only), `package.json`, `prisma/`;
   4. ENTRYPOINT: `node dist/main.js`.
2. `apps/web/Dockerfile`:
   1. multi-stage: builder с pnpm + `next build`;
   2. использует Next.js standalone output (`output: 'standalone'` в `next.config.js`);
   3. в runner копируется `.next/standalone`, `.next/static`, `public/`;
   4. ENTRYPOINT: `node server.js`.
3. Теги образов (важно для ручного отката):
   - `:v<version>-<git_sha>` — основной иммутабельный тег, например `v1.2.3-a1b2c3d`. Читаем глазами, понятно на какую версию откатывать;
   - `:stage-latest` — алиас текущего stage-образа;
   - `:prod-latest` — алиас текущего prod-образа;
   - `:v<version>` — алиас стабильной версии (опционально, для пометки релизов).
4. Сборка и публикация — в GitHub Actions (см. раздел 9).

Формирование тега в Action:

```yaml
- name: Compute image tag
  id: tag
  run: |
    VERSION=$(node -p "require('./package.json').version")
    SHA=$(git rev-parse --short HEAD)
    echo "tag=v${VERSION}-${SHA}" >> $GITHUB_OUTPUT
```

В журнале деплоев на VPS (`.last-deploys`) сохраняется именно `v<version>-<sha>` — оператор сразу видит, к какой версии откатывается.

---

## 8. Окружения, `.env` и что такое `chmod 600`

1. Файлы на сервере: `/opt/tracker/prod/.env`, `/opt/tracker/stage/.env`.
2. Шаблон `.env.example` в репозитории, реальные значения — только на сервере и в GitHub Secrets.
3. Разделение секретов:
   - prod: `DATABASE_URL` Supabase, prod-ключи (JWT, mail prod-key);
   - stage: `DATABASE_URL` локального Postgres, sandbox-ключи внешних интеграций.
4. Никогда не использовать prod-ключи в stage.

### 8.1. Что такое `chmod 600`

`chmod` — команда смены прав доступа к файлу. Права в Unix задаются тремя цифрами для трёх категорий: владелец / группа / остальные. Каждая цифра — сумма:

| Значение | Право   |
| -------- | ------- |
| 4        | read    |
| 2        | write   |
| 1        | execute |

`600` = `rw- --- ---` = владелец читает/пишет, группа и все остальные — ничего. Никто, кроме владельца, не может даже прочитать содержимое.

`.env` хранит секреты (DATABASE_URL, JWT_SECRET, ключи к Resend и Supabase). Если оставить дефолтные `644`, любой пользователь системы прочитает их. Поэтому:

```bash
chmod 600 /opt/tracker/prod/.env
chmod 600 /opt/tracker/stage/.env
chown deploy:deploy /opt/tracker/prod/.env /opt/tracker/stage/.env
```

Аналогично — `700` для приватных SSH-ключей и `600` для `~/.ssh/authorized_keys`.

### 8.2. Минимальный список переменных

```
DATABASE_URL
JWT_SECRET
JWT_ACCESS_TOKEN_TTL
JWT_REFRESH_TOKEN_TTL
COOKIE_DOMAIN
REDIS_URL
MAIL_API_KEY
APP_ORIGIN
```

Полный актуальный список — в `.env.example`.

---

## 9. Базы данных

### 9.1. Prod — Supabase

1. Один проект Supabase, используется только Postgres.
2. `DATABASE_URL` из Supabase → prod `.env`.
3. Миграции применяются из CI/CD: `prisma migrate deploy`.
4. Резервные копии — встроенные средства Supabase.

### 9.2. Stage — Postgres в Docker

```yaml
postgres:
  image: postgres:16
  env_file: .env
  volumes:
    - ./data/postgres:/var/lib/postgresql/data
```

1. Миграции применяются после деплоя на stage.
2. Том `./data/postgres` сохраняется на VPS, не удаляется при пересборке образов.

---

## 10. Реестр образов: Docker Hub vs GHCR

### 10.1. Сравнение

|                                    | Docker Hub                  | GHCR                                                           |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------- |
| Бесплатный приватный репо          | 1 шт                        | Не ограничено (в рамках GH-аккаунта)                           |
| Лимит pull для анонимов            | 100/6h                      | Нет жёсткого                                                   |
| Лимит pull для аутентифицированных | 200/6h (бесплатно)          | Очень высокий                                                  |
| Интеграция с GH Actions            | Через `docker/login-action` | Через `GITHUB_TOKEN` (без отдельного PAT)                      |
| Удаление старых тегов              | Через API + PAT             | Через REST API GH или Action `actions/delete-package-versions` |
| Где смотреть UI                    | hub.docker.com              | github.com/<org>/<repo>/pkgs                                   |
| Имя образа                         | `username/tracker-api:tag`  | `ghcr.io/<org>/tracker-api:tag`                                |

**Рекомендация: GHCR.** Меньше токенов, нет лимитов pull, удобнее администрировать через те же права репозитория.

### 10.2. Публикация в GHCR

`release-build.yml` (фрагмент):

```yaml
permissions:
  contents: read
  packages: write # требуется для GHCR

steps:
  - uses: actions/checkout@v4

  - name: Log in to GHCR
    uses: docker/login-action@v3
    with:
      registry: ghcr.io
      username: ${{ github.actor }}
      password: ${{ secrets.GITHUB_TOKEN }} # встроенный токен, отдельный PAT не нужен

  - name: Build and push API
    uses: docker/build-push-action@v6
    with:
      context: .
      file: apps/api/Dockerfile
      push: true
      tags: |
        ghcr.io/${{ github.repository_owner }}/tracker-api:${{ steps.tag.outputs.tag }}
        ghcr.io/${{ github.repository_owner }}/tracker-api:stage-latest
```

На VPS перед `docker pull` нужен `docker login ghcr.io -u <user> -p <PAT с read:packages>` — это PAT для сервера, **не** тот, что в Actions.

### 10.3. Публикация в Docker Hub

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Log in to Docker Hub
    uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }} # access token из Docker Hub

  - name: Build and push API
    uses: docker/build-push-action@v6
    with:
      context: .
      file: apps/api/Dockerfile
      push: true
      tags: |
        ${{ secrets.DOCKERHUB_USERNAME }}/tracker-api:${{ steps.tag.outputs.tag }}
        ${{ secrets.DOCKERHUB_USERNAME }}/tracker-api:stage-latest
```

На VPS — `docker login -u <user> -p <token>`.

### 10.4. Автоочистка реестра (хранить не более 5)

**GHCR:** Action `actions/delete-package-versions@v5`:

```yaml
- uses: actions/delete-package-versions@v5
  with:
    package-name: tracker-api
    package-type: container
    min-versions-to-keep: 5
    delete-only-untagged-versions: false
    ignore-versions: '^(stage-latest|prod-latest|v\d+\.\d+\.\d+)$'
```

**Docker Hub:** через REST API:

```bash
TOKEN=$(curl -s -H "Content-Type: application/json" \
  -X POST -d "{\"username\":\"$USER\",\"password\":\"$PAT\"}" \
  https://hub.docker.com/v2/users/login/ | jq -r .token)

curl -s -H "Authorization: JWT $TOKEN" \
  "https://hub.docker.com/v2/repositories/$USER/tracker-api/tags?page_size=100" \
  | jq -r '.results | sort_by(.last_updated) | reverse | .[5:] | .[].name' \
  | grep -vE '^(stage-latest|prod-latest|v[0-9])' \
  | xargs -I {} curl -s -X DELETE -H "Authorization: JWT $TOKEN" \
      "https://hub.docker.com/v2/repositories/$USER/tracker-api/tags/{}/"
```

Запускается из workflow `cleanup-registry.yml` по cron.

---

## 11. CI/CD: GitHub Actions

### 11.1. CI на PR

Текущий `ci.yml` уже выполняет lint/type-check/test/build. Сохраняется без изменений.

### 11.2. Сборка и публикация образов (`release-build.yml`)

Триггер: push в `release/*`, merge в `main`, либо новый тег `v*` или `v*-rc.*`.

Шаги:

1. `actions/checkout`.
2. Вычислить тег `v<version>-<short_sha>` (см. раздел 7).
3. Логин в реестр (GHCR или Docker Hub).
4. Сборка `api` и `web` с тегами:
   - `:v<version>-<sha>` — иммутабельный;
   - `:stage-latest` — если триггер релизный.
5. Push в реестр.

### 11.3. Деплой на stage (`deploy-stage.yml`)

Триггер: `workflow_run` после успешного `release-build.yml` или `workflow_dispatch`.

Шаги:

1. SSH-логин на VPS (`appleboy/ssh-action`).
2. На сервере:
   ```bash
   cd /opt/tracker/stage
   docker compose pull
   docker compose up -d
   docker compose exec -T api node dist/main.js migrate    # или pnpm prisma migrate deploy
   ```
3. Smoke-проверки (см. раздел 13).
4. Уведомление в чат.

### 11.4. Промоут на prod (`deploy-prod.yml`) — кнопка

GitHub Environment `production` с required reviewers = тимлид. Без одобрения тимлида workflow не стартует.

Триггер: `workflow_dispatch`, входы:

- `image_tag`: какой тег промоутить (по умолчанию текущий `stage-latest` sha);
- `confirm`: ввод строки `PROMOTE` для защиты от случайного клика.

Шаги:

1. Перетегировать в реестре: `:v<x>-<sha>` → `:prod-latest`.
2. SSH на VPS:
   ```bash
   cd /opt/tracker/prod
   docker compose pull
   docker compose up -d
   docker compose exec -T api node dist/main.js migrate
   ```
3. Дописать в `/opt/tracker/prod/.last-deploys` строку `2026-05-24T12:00 v1.2.3-a1b2c3d` (для rollback и аудита).
4. Smoke prod (раздел 13).
5. Уведомление.

### 11.5. Откат prod (`rollback-prod.yml`) — кнопка

Триггер: `workflow_dispatch`, вход `target_tag` (например `v1.2.2-9f8e7d6`, по умолчанию — предпоследняя строка из `.last-deploys`).

Шаги:

1. SSH на VPS.
2. Подменить теги: `prod-latest` ← указанный.
3. `docker compose pull && docker compose up -d`.
4. Smoke prod.
5. Запись в журнал откатов.

Журнал `.last-deploys` хранит читаемые версии — тимлид видит, что откатывается с `v1.2.3-a1b2c3d` на `v1.2.2-9f8e7d6`, а не на анонимный hash.

### 11.6. Hotfix

Сценарий: правка типа «опечатка в кнопке».

1. Ветка `hotfix/<кратко>` от `main`.
2. PR в `main`, ускоренное ревью.
3. Merge → срабатывает `release-build.yml`, собирается `:v<version>-<sha>`.
4. `deploy-stage.yml` поднимает stage автоматически.
5. После короткой ручной проверки на stage — тимлид жмёт `deploy-prod.yml` с тем же `image_tag`.
6. RC-тегов не делается.

Принцип: hotfix всё равно проходит stage (минимум 2–5 минут), но не блокируется release-окнами.

---

## 12. Хранение и автоочистка образов на VPS

Скрипт `scripts/cleanup-images.sh`, запускается cron-ом (`@daily`):

```bash
#!/usr/bin/env bash
set -euo pipefail
KEEP=3
for repo in "ghcr.io/yourorg/tracker-api" "ghcr.io/yourorg/tracker-web"; do
  docker images "$repo" --format '{{.ID}} {{.CreatedAt}}' \
    | sort -k2 -r \
    | awk 'NR>'"$KEEP"' {print $1}' \
    | xargs -r docker rmi -f
done
docker image prune -f
```

Crontab от `deploy`:

```
0 3 * * * /opt/tracker/scripts/cleanup-images.sh >> /var/log/tracker-cleanup.log 2>&1
```

---

## 13. Smoke-тесты: что это, где руками, где автоматизировать

### 13.1. Что считать smoke

Smoke-тест — короткая проверка «всё ли вообще запустилось и отвечает». Не функциональное и не нагрузочное тестирование. Цель: за 30–60 секунд понять, что деплой не сломал базовый сценарий, и решить — продолжать релиз или откатывать.

Чек-лист «что входит в smoke для Tracker Task»:

1. `GET https://<domain>/api/health` → 200, в теле `{ "status": "ok" }`.
2. `GET https://<domain>/` (главная Next.js) → 200, HTML с ожидаемым `<title>`.
3. `POST https://<domain>/api/auth/login` с заранее заведённым smoke-юзером → 200, в Set-Cookie есть access/refresh.
4. `GET https://<domain>/api/auth/me` с куки из (3) → 200.
5. `GET https://<domain>/api/teams` с теми же куки → 200, массив.
6. Миграции Prisma применились: `docker compose exec api node -e "..." ` — отчёт `prisma migrate status` чистый.

Если хотя бы один шаг падает — деплой считается неуспешным.

### 13.2. Health endpoint

Сейчас его нет. Нужно добавить в API простой контроллер:

```ts
// apps/api/src/health/health.controller.ts
@Controller('health')
export class HealthController {
	constructor(private prisma: PrismaService) {}

	@Get()
	async check() {
		await this.prisma.$queryRaw`SELECT 1`
		return { status: 'ok', ts: new Date().toISOString() }
	}
}
```

Endpoint попадает в проверки smoke и Uptime Kuma.

### 13.3. Где руками, где автоматом

| Когда                   | Кто              | Как                                                                   |
| ----------------------- | ---------------- | --------------------------------------------------------------------- |
| Локальная разработка    | разработчик      | `curl localhost:3001/api/health`, ручной клик по UI                   |
| Stage после авто-деплоя | GitHub Action    | автоматизированный smoke-скрипт (см. ниже)                            |
| Stage перед промоутом   | тимлид (5 минут) | ручной чек-лист в Confluence/README: вход → создание команды → задача |
| Prod после промоута     | GitHub Action    | тот же smoke-скрипт против prod-домена                                |
| Prod пост-деплой (24ч)  | Uptime Kuma      | непрерывный мониторинг `/health`                                      |

### 13.4. Автоматизация smoke в Action

Простой вариант — bash + curl в самом workflow:

```yaml
- name: Smoke
  env:
    BASE: https://stage.example.ru
    SMOKE_EMAIL: ${{ secrets.SMOKE_EMAIL }}
    SMOKE_PASSWORD: ${{ secrets.SMOKE_PASSWORD }}
  run: |
    set -e
    curl -fsS "$BASE/api/health" | jq -e '.status=="ok"'
    curl -fsS "$BASE/" -o /dev/null
    JAR=$(mktemp)
    curl -fsS -c "$JAR" -X POST "$BASE/api/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}"
    curl -fsS -b "$JAR" "$BASE/api/auth/me" | jq -e '.id'
    curl -fsS -b "$JAR" "$BASE/api/teams" | jq -e 'type=="array"'
```

Более серьёзный вариант (когда вырастем) — отдельный smoke-сьют на vitest/playwright в `apps/api/test/smoke/` и `apps/web/test/smoke/`, запускаемый против переменной `SMOKE_BASE_URL`.

Smoke-юзер — отдельный аккаунт в каждой БД (stage и prod), с минимальными правами и фиксированными credentials в GH Secrets.

---

## 14. Защита stage: сейчас Basic Auth, в будущем — больше слоёв

### 14.1. Сейчас — Basic Auth в Caddy

Достаточно для текущего этапа. Уже показано в разделе 6: пара логин/пароль на команду, пароль хранится в виде bcrypt-хеша прямо в Caddyfile.

Учётка ротируется при смене состава команды.

### 14.2. На будущее — слои защиты

Перечислены от простого к продвинутому. Можно прикручивать по мере роста проекта.

#### 14.2.1. IP allow-list

Для stage пускаем только с офиса/VPN. В Caddy:

```caddyfile
stage.example.ru {
    @allowed remote_ip 203.0.113.10 203.0.113.0/24
    handle @allowed {
        reverse_proxy web-stage:3000
    }
    respond 403
}
```

В Nginx:

```nginx
allow 203.0.113.10;
allow 203.0.113.0/24;
deny all;
```

#### 14.2.2. Cloudflare Tunnel + Access (бесплатный план)

`stage.example.ru` не публикует никаких портов вообще. Cloudflare Tunnel (cloudflared) внутри VPS поднимает исходящее соединение к Cloudflare; Cloudflare Access выдаёт доступ только аутентифицированным через Google/GitHub OAuth членам команды. Никаких паролей, никакого Basic Auth.

#### 14.2.3. WireGuard / Tailscale

Stage слушает только в приватной сети Tailscale. У каждого члена команды установлен Tailscale-клиент. Снаружи stage не виден вообще.

Tailscale бесплатно до 100 устройств — для маленькой команды более чем достаточно.

#### 14.2.4. mTLS (взаимный TLS)

Caddy/Nginx требует клиентский сертификат при входе на stage. Сертификаты выдаются админом, ставятся в браузер. Параноидальный уровень, для нашего масштаба — overkill.

#### 14.2.5. CSP и заголовки безопасности

Не про доступ, но про защиту от XSS/clickjacking. На обоих окружениях нужно проставить через proxy:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

В Caddy это `header` директива, в Nginx — `add_header`.

---

## 15. Мониторинг и логи — поэтапно (стек из корневого README.md)

Внедряем поэтапно. На каждом этапе — рабочая система, дальше можно остановиться, если не нужно глубже.

### 15.1. Этап 0 — то, что должно быть с первого дня

1. `/api/health` endpoint в api (раздел 13.2).
2. Docker logging driver `json-file` с ротацией (раздел 4.2.7) — иначе диск забьётся.
3. `docker compose logs -f` для ручного просмотра.
4. Smoke-тесты в pipeline (раздел 13).

### 15.2. Этап 1 — Uptime Kuma

**Что.** Self-hosted сервис, проверяет HTTP-endpoint каждые N секунд, шлёт алерты в Telegram/Discord/Slack/email при падении.

**Как.** Отдельный контейнер на том же VPS:

```yaml
uptime-kuma:
  image: louislam/uptime-kuma:1
  restart: unless-stopped
  volumes:
    - ./data/uptime-kuma:/app/data
  networks:
    - edge
```

В Caddy добавить роут `status.example.ru` (или `monitor.stage.example.ru` под Basic Auth).

Заводим мониторы:

1. `https://example.ru/api/health` каждые 60 сек;
2. `https://example.ru/` каждые 60 сек;
3. `https://stage.example.ru/api/health` каждые 5 минут.

Алерты в Telegram-бот команды.

### 15.3. Этап 2 — централизованные логи (Loki + Alloy + Grafana)

**Зачем.** `docker logs` неудобно искать по нескольким контейнерам; при падении первое, что нужно — лог за последние 5 минут со всех сервисов разом.

**Стек:**

- **Loki** — хранилище логов, ищется в LogQL.
- **Grafana Alloy** — агент, читает Docker stdout/stderr (замена deprecated Promtail), шлёт в Loki.
- **Grafana** — UI для запросов и дашбордов.

Всё бесплатно, всё self-hosted, всё в Docker. Дополнительный compose-стек `monitoring/`:

```yaml
services:
  loki:
    image: grafana/loki:3
    volumes: ['./data/loki:/loki']
  alloy:
    image: grafana/alloy:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./alloy-config.river:/etc/alloy/config.river
  grafana:
    image: grafana/grafana:11
    volumes: ['./data/grafana:/var/lib/grafana']
```

Grafana доступ — за Basic Auth/Cloudflare Access.

### 15.4. Этап 3 — метрики (Prometheus + node_exporter + cAdvisor)

**Зачем.** Логи отвечают на «что случилось», метрики — на «как часто и насколько плохо». CPU/RAM/диск VPS, метрики контейнеров, RPS API, время ответа.

**Стек:**

- **Prometheus** — pull-метрики, скрейпит targets;
- **node_exporter** — метрики хоста (CPU, RAM, диск, сеть);
- **cAdvisor** — метрики контейнеров;
- **API** — отдаёт `/metrics` (NestJS prom-client).

В Grafana импортируем готовые дашборды по ID (Node Exporter Full, cAdvisor) и собираем свой для API.

Алерты — через Grafana Alerting → Telegram.

### 15.5. Этап 4 — ошибки в коде (GlitchTip)

**Зачем.** Stack traces из браузера и сервера в одном месте, с группировкой одинаковых ошибок, частотой, релизами.

**GlitchTip** — open-source альтернатива Sentry с тем же API. SDK Sentry работают без изменений. Hostится в Docker. Для нас — бесплатно.

Подключение:

1. Поднять GlitchTip контейнер.
2. В `apps/api`: `@sentry/nestjs` с `dsn` из GlitchTip.
3. В `apps/web`: `@sentry/nextjs` с тем же DSN (отдельный проект для frontend).
4. Релизы помечать через переменную `RELEASE=v<version>-<sha>` — GlitchTip покажет, в каком релизе появилась ошибка.

### 15.6. Порядок внедрения

1. **Этап 0** — сделать сразу, до прод-деплоя.
2. **Этап 1 (Uptime Kuma)** — в первую неделю prod.
3. **Этап 2 (логи)** — в первый месяц prod, как только появится потребность искать в логах больше одного контейнера.
4. **Этап 3 (метрики)** — когда появится первый инцидент производительности.
5. **Этап 4 (GlitchTip)** — параллельно с этапом 2 или 3, чем раньше — тем меньше слепых багов в проде.

---

## 16. Email-провайдер: prod и тестовый

В коде используется Resend. Для prod — продакшен-ключ Resend на домене `example.ru`. Для stage не должно происходить отправки на реальные адреса пользователей (они в обезличенном дампе тоже фейковые, но всё равно опасно).

Варианты бесплатных тестовых inbox-провайдеров:

|                          | Тип                              | Как работает                                                                                                                                         |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mailtrap (sandbox)**   | Внешний SMTP-перехватчик         | Письма не уходят наружу, складываются в виртуальный inbox в UI Mailtrap. Бесплатный план — 100 писем/мес. Идеально для stage.                        |
| **Ethereal Email**       | Внешний SMTP-перехватчик         | Аналогично Mailtrap. Бесплатно, но письма живут недолго. Хорош для CI-тестов.                                                                        |
| **MailHog / Mailpit**    | Self-hosted SMTP-сервер в Docker | Контейнер на VPS, имеет UI на отдельном порту, любое письмо туда уходит и не покидает сервер. Полностью бесплатно.                                   |
| **Resend sandbox-домен** | Внешний                          | Resend разрешает отправку только на whitelisted-адреса в неподтверждённом домене. Можно использовать поддомен `test.example.ru` с whitelist команды. |

**Рекомендация для нашего проекта:**

- **stage:** MailHog/Mailpit в Docker (полная изоляция, ничего не утекает наружу) **или** Mailtrap (если хочется UI без хостинга);
- **prod:** Resend на домене `example.ru`;
- **локальная разработка:** MailHog в docker-compose.dev.

Адреса вида `test.example.ru` для писем — это домен отправителя, не отдельный inbox-сервис. Если хочется, чтобы письма со stage уходили с `noreply@test.example.ru`, а с prod — с `noreply@example.ru` — это две разные настройки `MAIL_FROM` в `.env`, ничего больше.

Конфиг api:

```
# stage .env
MAIL_TRANSPORT=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_FROM="Tracker Stage <noreply@test.example.ru>"

# prod .env
MAIL_TRANSPORT=resend
MAIL_API_KEY=<resend prod key>
MAIL_FROM="Tracker <noreply@example.ru>"
```

В коде api делаем абстрактный `MailService` с двумя транспортами, выбор — по `MAIL_TRANSPORT`.

---

## 17. Ежемесячный анонимизированный срез prod → stage

Workflow `refresh-stage-db.yml`, триггер: `schedule: cron '0 4 1 * *'` (1-е число месяца) + `workflow_dispatch`.

### 17.1. Шаги

1. `pg_dump` из Supabase с фильтром по таблицам и лимитом по объёму.
2. Локально в Action:
   1. восстановить дамп во временный Postgres;
   2. прогнать анонимизацию SQL-скриптом (раздел 17.2);
   3. вставить root-пользователя со known credentials (раздел 18);
   4. `pg_dump` обезличенной БД в файл.
3. SCP файла на VPS.
4. На VPS:
   ```bash
   docker compose -f /opt/tracker/stage/docker-compose.yml stop api web
   docker compose exec -T postgres psql -U ... -c 'DROP DATABASE app; CREATE DATABASE app;'
   docker compose exec -T postgres psql ... < dump.sql
   docker compose -f /opt/tracker/stage/docker-compose.yml start api web
   ```
5. Применить миграции: `prisma migrate deploy`.
6. Прогнать `prisma db seed` (только идемпотентные seed: справочники, root-пользователь, демо-команды/проекты, если в дампе их нет).

### 17.2. Поля для обезличивания (текущий этап)

Чувствительные поля, которые нужно затирать перед загрузкой в stage:

| Сущность      | Поле                                 | Чем заменить                             |
| ------------- | ------------------------------------ | ---------------------------------------- |
| `User`        | `email`                              | `user_<id>@example.invalid`              |
| `User`        | `name`                               | `User <short_id>`                        |
| `User`        | `password`                           | известный bcrypt-хеш пароля `stage-only` |
| `User`        | `phone`                              | `+7-900-000-00<NN>`                      |
| `User`        | `avatarUrl`                          | `null` или `/avatars/placeholder.png`    |
| `Team`        | `name`                               | `Team <short_id>`                        |
| `Project`     | `name`                               | `Project <short_id>`                     |
| `Task`        | `title`                              | `Task <short_id>`                        |
| `Task`        | `description`                        | `*** redacted ***`                       |
| `TaskHistory` | `payload`/`diff`/`comment`           | `*** redacted ***`                       |
| любые токены  | `refreshToken`, `inviteToken` и т.п. | `NULL` или новый случайный               |

Пример SQL:

```sql
UPDATE "User" SET
  email    = 'user_' || id || '@example.invalid',
  name     = 'User ' || substr(id::text, 1, 6),
  password = '$2a$10$STAGE_ONLY_KNOWN_HASH..............',
  phone    = '+7-900-000-' || lpad((random()*99)::int::text, 4, '0'),
  "avatarUrl" = NULL;

UPDATE "Team"    SET name = 'Team '    || substr(id::text, 1, 6);
UPDATE "Project" SET name = 'Project ' || substr(id::text, 1, 6);
UPDATE "Task"    SET title = 'Task '   || substr(id::text, 1, 6),
                     description = '*** redacted ***';
UPDATE "TaskHistory" SET payload = '"redacted"'::jsonb, comment = NULL;

DELETE FROM "Session";
DELETE FROM "PasswordResetToken";
DELETE FROM "TeamInvitation";   -- содержат email-приглашаемых
```

Конкретные имена таблиц/полей сверить с актуальной Prisma schema перед запуском.

### 17.3. Принципы

1. В обезличенный дамп никогда не попадают prod-токены, prod-email, prod-телефоны, оригинальные названия команд/проектов/задач, тексты задач, история.
2. Seed дополняет, но не перезаписывает то, что есть в дампе.
3. Seed гарантирует наличие root-пользователя в stage.
4. По мере появления новых сущностей с чувствительными полями (комментарии, файлы, вложения) — таблица в 17.2 расширяется.

---

## 18. Root-пользователь в stage

1. Создаётся всегда seed-ом: email `root@stage.local`, пароль из секрета `STAGE_ROOT_PASSWORD`.
2. Имеет максимальную роль (`OWNER` глобально + участник всех демо-команд).
3. Используется командой для входа в stage с полными правами.
4. Никогда не существует в prod.

---

## 19. Безопасность — сводка

1. SSH только по ключам, root отключён, fail2ban активен.
2. `.env` файлы — `chmod 600`, владелец `deploy`.
3. GitHub Secrets: `GHCR_PAT_FOR_VPS` (либо `DOCKERHUB_*`), `VPS_SSH_KEY`, `VPS_HOST`, `STAGE_ROOT_PASSWORD`, `SUPABASE_DB_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, ключи Resend/Mailtrap.
4. Stage закрыт Basic Auth на уровне Caddy/Nginx.
5. Внешние интеграции на stage — только sandbox-ключи.
6. Все домены — HTTPS, HTTP редиректится автоматически.
7. Кнопку `deploy-prod.yml` нажимает тимлид (GitHub Environment `production` с required reviewers).
8. Security-заголовки (HSTS, X-Frame-Options, X-Content-Type-Options) проставляются proxy.

---

## 20. План внедрения по этапам

**Этап 1 — фундамент:**

1. Купить VPS и домен.
2. Настроить DNS A-записи.
3. Подготовить VPS (раздел 4).

**Этап 2 — образы:**

1. Написать Dockerfile для `apps/api` и `apps/web`.
2. Включить `output: 'standalone'` в `apps/web/next.config.js`.
3. Локально проверить `docker build` и запуск.

**Этап 3 — proxy и окружения:**

1. Развернуть Caddy (или Nginx + Certbot) на VPS.
2. Создать `prod/` и `stage/` стеки в `/opt/tracker/`.
3. Поднять Postgres в stage.
4. Подключить Supabase в prod.

**Этап 4 — CI/CD:**

1. `release-build.yml` — сборка образов в GHCR.
2. `deploy-stage.yml` — авто-деплой на stage.
3. `deploy-prod.yml` — кнопка промоута (environment `production`, required reviewer = тимлид).
4. `rollback-prod.yml` — кнопка отката.

**Этап 5 — очистка и обновление БД:**

1. `cleanup-images.sh` на сервере (cron).
2. `cleanup-registry.yml` в Actions.
3. `refresh-stage-db.yml` в Actions.

**Этап 6 — мониторинг (поэтапно, раздел 15):**

1. `/api/health` + Uptime Kuma.
2. Loki + Alloy + Grafana.
3. Prometheus + node_exporter + cAdvisor.
4. GlitchTip.

**Этап 7 — hotfix-процесс:**

1. Документ для команды.
2. Шаблон ветки `hotfix/*` в PR template.

---

## 21. Итог

После полного внедрения:

1. PR → CI → автоматическая выкладка на stage.
2. Промоут на prod — одна кнопка в Actions, нажимает тимлид.
3. Откат prod — одна кнопка в Actions, тег вида `v1.2.2-9f8e7d6` понятен с первого взгляда.
4. Hotfix — короткий путь через `main` с обязательным заходом на stage перед prod.
5. Stage всегда имеет свежий обезличенный срез prod-данных и работающего root-пользователя.
6. Чувствительные поля (email, name, password, phone, avatar, команды, проекты, задачи и история) не покидают prod.
7. Старые образы автоматически чистятся и на VPS, и в реестре.
8. Мониторинг и логи разворачиваются поэтапно, без overhead на старте.
9. Вся инфраструктура — на бесплатных инструментах поверх одного VPS.
