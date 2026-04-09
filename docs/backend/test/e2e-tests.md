# E2E-тесты

Тесты поднимают полноценное NestJS-приложение и обращаются к нему через HTTP (supertest). Требуют запущенного Docker (PostgreSQL + Redis).

## Содержание

- [Инфраструктура](#инфраструктура)
- [Auth](#auth)
  - [GET /auth/me](#get-authme)
- [Teams](#teams)
  - [POST /teams/new](#post-teamsnew)
  - [GET /teams](#get-teams)
  - [GET /teams/:id](#get-teamsid)
  - [PATCH /teams/:id](#patch-teamsid)
  - [DELETE /teams/:id](#delete-teamsid)
- [TeamMembers](#teammembers)
- [Invitations](#invitations)
- [Prisma Connection](#prisma-connection)

## Инфраструктура

**`test/helpers/e2e.helpers.ts`**

| Хелпер                                           | Что делает                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `createTestApp()`                                | Поднимает `AppModule`, подключает пайпы/интерцепторы, мокирует `MailService` |
| `registerAndLogin(app, email, password?, name?)` | Регистрирует пользователя, возвращает `{ cookies }`                          |

`MailService` в e2e мокируется с методами `sendWelcomeEmail()` и `sendTeamInvitationEmail()`, чтобы тесты не ходили во внешний email-провайдер.

**Паттерн setup/teardown:**

```typescript
beforeAll(async () => {
	const testApp = await createTestApp()
	app = testApp.app
	server = app.getHttpServer()
	prisma = testApp.prisma
	redisClient = testApp.redisClient
})

afterAll(async () => {
	await redisClient.flushall()
	await prisma.$disconnect()
	await app.close()
})

beforeEach(async () => {
	// Очищаем таблицы и Redis перед каждым тестом
	await prisma.teamMember.deleteMany()
	await prisma.team.deleteMany()
	await prisma.user.deleteMany()
	await redisClient.flushall()
})
```

## Auth

Файл: `test/e2e/auth.e2e-spec.ts`

### POST /auth/register

| Сценарий                                  | Код |
| ----------------------------------------- | --- |
| Успешная регистрация, cookies установлены | 201 |
| Email уже занят                           | 409 |
| Невалидный email                          | 400 |
| Пароль короче 6 символов                  | 400 |
| Email не передан                          | 400 |

### POST /auth/login

| Сценарий                           | Код |
| ---------------------------------- | --- |
| Успешный вход, cookies установлены | 200 |
| Email не найден                    | 404 |
| Неверный пароль                    | 404 |
| Невалидный email                   | 400 |
| Пароль не передан                  | 400 |

### POST /auth/refresh

| Сценарий                             | Код |
| ------------------------------------ | --- |
| Валидный refreshToken, новые cookies | 200 |
| Без cookie                           | 401 |
| Невалидный refreshToken              | 401 |

### POST /auth/logout

| Сценарий                        | Код |
| ------------------------------- | --- |
| Успешный выход, cookies очищены | 200 |
| Без токена (идемпотентность)    | 200 |

### GET /auth/me

Защищён `JwtGuard` через декоратор `@Authorization()`. Токен читается из cookie `accessToken`.

| Сценарий                          | Код |
| --------------------------------- | --- |
| Возвращает `id`, `email`, `name`  | 200 |
| Без токена                        | 401 |
| Невалидный `accessToken` в cookie | 401 |

## Teams

Файл: `test/e2e/teams.e2e-spec.ts`
Setup: создаются два пользователя — `owner` и `member`.

### POST /teams/new

| Сценарий                                     | Код |
| -------------------------------------------- | --- |
| Успешное создание, ответ содержит роль OWNER | 201 |
| Без токена                                   | 401 |
| name короче 2 символов                       | 400 |

### GET /teams

| Сценарий                                           | Код |
| -------------------------------------------------- | --- |
| Список команд с `membersCount` и `currentUserRole` | 200 |
| Нет команд — пустой массив                         | 200 |

### GET /teams/:id

| Сценарий                                      | Код |
| --------------------------------------------- | --- |
| Участник получает команду с полем `members[]` | 200 |
| Пользователь не является участником команды   | 403 |
| Команда с указанным id не существует          | 404 |
| Без токена                                    | 401 |

### PATCH /teams/:id

Setup: дополнительно создаются `admin@patch.com` (роль ADMIN) и `member@patch.com` (роль MEMBER) через Prisma.

| Сценарий                         | Код |
| -------------------------------- | --- |
| OWNER обновляет название команды | 200 |
| ADMIN обновляет название команды | 200 |
| MEMBER пытается обновить команду | 403 |
| name короче 2 символов           | 400 |
| Без токена                       | 401 |

### DELETE /teams/:id

| Сценарий                  | Код |
| ------------------------- | --- |
| OWNER удаляет команду     | 200 |
| Пользователь не в команде | 403 |
| Без токена                | 401 |

## TeamMembers

Файл: `test/e2e/team-members.e2e-spec.ts`
Setup: 4 пользователя — `owner`, `admin`, `member`, `stranger`. Команда создаётся owner-ом; `admin` и `member` добавляются напрямую через Prisma.

### GET /teams/:id/members

| Сценарий                              | Код |
| ------------------------------------- | --- |
| Участник получает список (3 человека) | 200 |
| Без токена                            | 401 |
| Stranger (не в команде)               | 403 |
| Команда не найдена                    | 404 |

### PATCH /teams/:id/members/:userId/role

| Сценарий                         | Код |
| -------------------------------- | --- |
| OWNER меняет роль MEMBER → ADMIN | 200 |
| MEMBER пытается изменить роль    | 403 |
| Изменение собственной роли       | 403 |
| Попытка изменить роль OWNER      | 403 |
| Target не в команде              | 404 |
| Без токена                       | 401 |

### DELETE /teams/:id/members/:userId

| Сценарий                          | Код |
| --------------------------------- | --- |
| OWNER удаляет MEMBER              | 200 |
| Self-leave (участник сам выходит) | 200 |
| MEMBER пытается удалить другого   | 403 |
| Попытка удалить OWNER             | 403 |
| Без токена                        | 401 |

## Invitations

Файл: `test/e2e/invitations.e2e-spec.ts`
Setup: 5 пользователей — `owner`, `admin`, `member`, `stranger`, `invitee`. Команда создаётся owner-ом; `admin` и `member` добавляются через Prisma.

### POST /teams/:id/invitations

| Сценарий                             | Код |
| ------------------------------------ | --- |
| OWNER создаёт приглашение            | 201 |
| MEMBER пытается отправить invitation | 403 |

### GET /teams/:id/invitations

| Сценарий                          | Код |
| --------------------------------- | --- |
| ADMIN получает список приглашений | 200 |

### GET /invitations/me

| Сценарий                                         | Код |
| ------------------------------------------------ | --- |
| Пользователь получает свои `PENDING` invitations | 200 |

### POST /invitations/:token/accept

| Сценарий                                              | Код |
| ----------------------------------------------------- | --- |
| Пользователь принимает invitation и становится MEMBER | 200 |

### POST /invitations/:token/decline

| Сценарий                          | Код |
| --------------------------------- | --- |
| Пользователь отклоняет invitation | 200 |

### DELETE /teams/:id/invitations/:invId

| Сценарий                                | Код |
| --------------------------------------- | --- |
| OWNER отзывает приглашение              | 200 |
| Посторонний пользователь получает отказ | 403 |

## Prisma Connection

Файл: `test/e2e/prisma-connection.e2e-spec.ts`

Проверяет, что Prisma подключается к БД и схема работает. Read-only — данные не изменяет.

| Тест              | Что проверяет           |
| ----------------- | ----------------------- |
| `SELECT 1`        | Соединение с PostgreSQL |
| `user.findMany()` | Модель User доступна    |
| `team.findMany()` | Модель Team доступна    |
