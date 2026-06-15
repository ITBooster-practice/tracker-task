## Mock email на stage (Mailpit)

В stage используется Mailpit для перехвата всех исходящих писем.

### Как это работает

- API отправляет письма в SMTP `mailpit:1025`.
- Письма не уходят во внешние SMTP-сервисы.
- Mailpit хранит письма в Docker Volume (`mailpit_data`).
- Письма сохраняются между перезапусками и пересозданием контейнеров.

Проверка:

```bash
cd /opt/tracker/stage

docker compose --env-file .env.stage -f docker-compose.stage.yml ps

docker compose --env-file .env.stage -f docker-compose.stage.yml logs --tail=80 mailpit
```

Проверить наличие volume:

```bash
docker volume ls | grep mailpit
```

### Доступ к Mailpit

Mailpit публикуется через отдельный поддомен:

```text
https://mail.stage.<ВАШ_ДОМЕН>
```

или (если используется временный домен):

```text
https://mail.stage.<IP_СЕРВЕРА>.sslip.io
```

Доступ защищён той же Basic Auth, что и stage-приложение.

После авторизации доступен веб-интерфейс просмотра писем.

### Проверка отправки

1. Зарегистрировать нового пользователя.
2. Открыть Mailpit.
3. Убедиться, что письмо появилось в списке входящих.
4. Открыть письмо и проверить ссылки подтверждения, восстановления пароля и другие шаблоны.

### Очистка писем

Через UI Mailpit:

- Delete message
- Delete all messages

или полностью удалить данные:

```bash
docker compose down
docker volume rm stage-tracker-task_mailpit_data
```
