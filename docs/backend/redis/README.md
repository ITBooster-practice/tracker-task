# Redis

## Запуск контейнера

```bash
pnpm docker:redis-up      # запустить
pnpm docker:redis-status  # проверить статус
pnpm docker:redis-down    # остановить
```

## Подключение к контейнеру

### Интерактивный режим (redis-cli)

```bash
docker exec -it tracker_redis redis-cli
```

Команды внутри:

```
KEYS *                  # все ключи
GET refresh:<userId>    # значение по ключу
TTL refresh:<userId>    # сколько секунд до удаления
DEL refresh:<userId>    # удалить ключ вручную
EXIT                    # выйти
```

### Одна команда без входа в контейнер

```bash
docker exec tracker_redis redis-cli KEYS "*"
docker exec tracker_redis redis-cli GET refresh:<userId>
```

### Проверить что Redis живой

```bash
docker exec tracker_redis redis-cli PING
# ответ: PONG
```

## Очистить все данные

```bash
docker exec tracker_redis redis-cli FLUSHALL
```

## Структура ключей

| Ключ               | Значение          | TTL                            |
| ------------------ | ----------------- | ------------------------------ |
| `refresh:<userId>` | JWT refresh-токен | `JWT_REFRESH_TOKEN_TTL` из env |

## Переменные окружения

```
REDIS_URL=redis://localhost:6379
```

В продакшене с паролем:

```
REDIS_URL=redis://:password@host:6379
```
