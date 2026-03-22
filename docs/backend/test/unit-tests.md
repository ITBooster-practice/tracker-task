# Unit-тесты

Тесты изолированы от БД и внешних сервисов — все зависимости мокируются.

## Содержание

- [Соглашения](#соглашения)
- [AuthService](#authservice)
- [TeamsService](#teamsservice)
- [TeamMembersService](#teammembersservice)

## Соглашения

- Фикстуры (`REGISTER_DTO`, `TEAM`, `MEMBER_OWNER` и т.д.) — константы вверху файла или в `helpers/`
- `vi.clearAllMocks()` в `beforeEach`
- Сервис инстанциируется напрямую, без NestJS DI

**Мок argon2** (в auth-тестах):

```typescript
vi.mock('argon2', async () => await import('../../mocks/argon2'))
```

## AuthService

Файл: `test/unit/auth/auth.service.spec.ts`
Хелперы: `test/helpers/auth.helpers.ts` — `createPrismaMock`, `createJwtMock`, `createConfigMock`, `makeTokens`

| Метод      | Сценарий           | Ожидание             |
| ---------- | ------------------ | -------------------- |
| `register` | Новый пользователь | Токены + запись в БД |
| `register` | Email уже занят    | `ConflictException`  |
| `login`    | Верные данные      | Токены               |
| `login`    | Email не найден    | `NotFoundException`  |
| `login`    | Неверный пароль    | `NotFoundException`  |

## TeamsService

Файл: `test/unit/teams/teams.service.spec.ts`
Хелперы: `test/helpers/teams.helpers.ts` — `createPrismaMock`, `TEAM`, `TEAM_ID`, `USER_ID`, `MEMBER_OWNER/ADMIN/PLAIN`

| Метод          | Сценарий                       | Ожидание                                    |
| -------------- | ------------------------------ | ------------------------------------------- |
| `createTeam`   | Создание команды               | Команда с участником OWNER                  |
| `createTeam`   | С полями description/avatarUrl | Поля сохраняются                            |
| `getUserTeams` | Пользователь в командах        | Список с `membersCount` и `currentUserRole` |
| `getUserTeams` | Нет команд                     | Пустой массив                               |
| `getTeamById`  | Пользователь — участник        | Объект команды                              |
| `getTeamById`  | Команда не найдена             | `NotFoundException`                         |
| `getTeamById`  | Пользователь не участник       | `ForbiddenException`                        |
| `updateTeam`   | OWNER или ADMIN                | Обновлённая команда                         |
| `updateTeam`   | MEMBER                         | `ForbiddenException`                        |
| `updateTeam`   | Не в команде                   | `ForbiddenException`                        |
| `deleteTeam`   | OWNER                          | Подтверждение удаления                      |
| `deleteTeam`   | Не OWNER                       | `ForbiddenException`                        |

## TeamMembersService

Файл: `test/unit/teams/team-members.service.spec.ts`
Хелперы: те же из `test/helpers/teams.helpers.ts`

| Метод          | Сценарий                         | Ожидание                                   |
| -------------- | -------------------------------- | ------------------------------------------ |
| `getMembers`   | Участник команды                 | Список участников                          |
| `getMembers`   | Команда не найдена               | `NotFoundException`                        |
| `getMembers`   | Не участник                      | `ForbiddenException`                       |
| `changeRole`   | OWNER/ADMIN меняет роль MEMBER   | Обновлённый участник                       |
| `changeRole`   | Самостоятельная смена своей роли | `ForbiddenException`                       |
| `changeRole`   | Target — OWNER                   | `ForbiddenException`                       |
| `changeRole`   | Actor — MEMBER                   | `ForbiddenException`                       |
| `changeRole`   | Target не в команде              | `NotFoundException`                        |
| `removeMember` | OWNER/ADMIN удаляет MEMBER       | `{ message: 'Участник успешно исключён' }` |
| `removeMember` | Самовыход (self-leave)           | `{ message: 'Вы покинули команду' }`       |
| `removeMember` | Попытка удалить OWNER            | `ForbiddenException`                       |
| `removeMember` | MEMBER удаляет другого           | `ForbiddenException`                       |
| `removeMember` | ADMIN удаляет другого ADMIN      | `ForbiddenException`                       |
| `removeMember` | Target не в команде              | `NotFoundException`                        |
