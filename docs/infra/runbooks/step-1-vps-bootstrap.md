# Шаг 1: VPS каркас для stage (подробно)

Этот runbook нужен, чтобы поднять базовую инфраструктуру на пустом VPS:

1. Безопасный доступ по SSH.
2. Базовая защита сервера (UFW + fail2ban).
3. Docker и рабочая структура каталогов.
4. Reverse proxy Caddy.
5. HTTPS для `stage.<domain>` через Let's Encrypt.

Итог шага: по адресу `https://stage.<domain>` открывается страница-заглушка по защищенному сертификату.

## 0. Что подготовить заранее

1. Домен и доступ в DNS-панель.
2. Публичный IP VPS.
3. SSH-ключ на твоем ноутбуке (`~/.ssh/id_ed25519.pub` или аналог).
4. Чистая Ubuntu 22.04/24.04 на сервере.

## 1. Первый вход и обновление системы

Под root:

```bash
ssh root@<VPS_IP>
apt update && apt upgrade -y
```

Проверка:

```bash
uname -a
lsb_release -a
```

## 2. Создать пользователя deploy и включить вход по ключу

```bash
adduser --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Как безопасно добавить SSH-ключи (в том числе с нескольких ПК)

Рекомендуемый способ: `ssh-copy-id`.
Он добавляет ключ в `authorized_keys` и не перезаписывает существующие строки.

```bash
ssh-copy-id -i ~/.ssh/<ИМЯ_ПУБЛИЧНОГО_КЛЮЧА>.pub deploy@<VPS_IP>
```

Если нужен доступ с нескольких устройств, повтори команду на каждом ПК со своим `.pub` ключом.

Если `ssh-copy-id` недоступен, добавляй ключ вручную только через `>>`:

```bash
echo "<ВАШ_ПУБЛИЧНЫЙ_SSH_КЛЮЧ>" >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Если запускать обычный `adduser deploy`, Ubuntu задает дополнительные вопросы (`Full Name`, `Room Number` и т.д.).
Это нормально: поля не обязательны, можно просто нажимать `Enter`, а в конце подтвердить `Y`.

Чтобы пропустить анкету и не отвлекаться, в runbook используется `adduser --gecos "" deploy`.

Проверка (в новом локальном терминале):

```bash
ssh deploy@<VPS_IP>
whoami
```

Ожидаемо: `deploy`.

## 3. Закрыть опасные SSH-настройки

Под `deploy` через sudo:

```bash
sudo nano /etc/ssh/sshd_config
```

Убедиться, что выставлено:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Применить:

```bash
sudo systemctl restart ssh
sudo systemctl status ssh --no-pager
```

Важно: сначала проверь, что вход `ssh deploy@<VPS_IP>` работает в отдельном окне, и только потом закрывай root-сессию.

## 4. Настроить firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Ожидаемо: открыты только 22, 80, 443.

## 5. Включить fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

Ожидаемо: jail `sshd` активен.

## 6. Установить Docker и Compose

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
newgrp docker
docker version
docker compose version
```

Если `newgrp docker` не помог, выйди и зайди снова по SSH.

## 7. Ограничить рост логов Docker

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "5"
  }
}
JSON
sudo systemctl restart docker
```

Проверка:

```bash
docker info | grep -i "Logging Driver"
```

## 8. Подготовить структуру каталогов проекта

```bash
sudo mkdir -p /opt/tracker/{stage,prod,caddy,scripts}
sudo chown -R deploy:deploy /opt/tracker
mkdir -p /opt/tracker/caddy/{data,config}
```

## 9. Настроить DNS

В DNS-панели домена создать A-записи:

1. `stage.<domain>` -> `<VPS_IP>`
2. (опционально сразу) `<domain>` -> `<VPS_IP>`

Рекомендуемый TTL на старте: `300`.

Проверка с сервера:

```bash
dig +short stage.<domain>
```

Должен вернуться IP твоего VPS.

## 10. Поднять Caddy для HTTPS

На этом шаге intentionally используется временная заглушка, чтобы проверить домен и выпуск TLS.
Приложение на этом этапе еще не показывается.

Создать файл `/opt/tracker/caddy/Caddyfile`:

```bash
cat >/opt/tracker/caddy/Caddyfile <<'CADDY'
stage.<domain> {
  encode zstd gzip

  # Временная заглушка, пока app-сервисы еще не подключены.
  respond "stage gateway is up" 200
}
CADDY
```

Если домена пока нет, можно временно использовать `sslip.io`:

```bash
cat >/opt/tracker/caddy/Caddyfile <<'CADDY'
stage.<VPS_IP>.sslip.io {
  encode zstd gzip
  respond "stage gateway is up" 200
}
CADDY
```

Создать `/opt/tracker/caddy/docker-compose.yml`:

```bash
cat >/opt/tracker/caddy/docker-compose.yml <<'YAML'
name: tracker-gateway

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
YAML
```

Запуск:

```bash
cd /opt/tracker/caddy
docker compose up -d
docker compose logs -f --tail=100 caddy
```

Ожидаемо в логах: успешный выпуск сертификата для `stage.<domain>`.

Ожидаемо по адресу `https://stage.<domain>`: текст `stage gateway is up`.

## 11. Проверка HTTPS

Локально с PC:

```bash
curl -I https://stage.<domain>
```

Ожидаемо: `HTTP/2 200`.

Важно: `200` здесь подтверждает работу HTTPS/сертификата, а не доступность web-приложения.

Проверка сертификата:

```bash
echo | openssl s_client -servername stage.<domain> -connect stage.<domain>:443 2>/dev/null | openssl x509 -noout -issuer -subject -dates
```

Ожидаемо: сертификат от Let's Encrypt и валидные даты.

## 12. Что делать после Шага 1

Перейди к Шагу 2 (ручной stage-деплой):

- [step-2-manual-stage-deploy.md](./step-2-manual-stage-deploy.md)

Шаблоны для деплоя остаются в [infra/deploy/stage](../../../infra/deploy/stage).
