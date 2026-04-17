# Teams Module

Документация по модулю команд: команды, участники, роли и приглашения.

## Реализовано

## Пагинация списков

Все list endpoint-ы модуля команд теперь поддерживают query-параметры пагинации:

- `page` — номер страницы, по умолчанию `1`
- `limit` — размер страницы, по умолчанию `10`

Формат ответа для списков единый:

```json
{
	"data": [],
	"meta": {
		"page": 1,
		"limit": 10,
		"total": 0,
		"totalPages": 0
	}
}
```

### Команды

- `POST /teams/new` — создать команду
- `GET /teams` — пагинированный список команд текущего пользователя
- `GET /teams/:id` — получить команду по id
- `PATCH /teams/:id` — обновить команду
- `DELETE /teams/:id` — удалить команду

### Участники

- `GET /teams/:id/members` — пагинированный список участников команды
- `PATCH /teams/:id/members/:userId/role` — сменить роль участника
- `DELETE /teams/:id/members/:userId` — исключить участника или выйти из команды

### Приглашения

- `POST /teams/:id/invitations` — отправить приглашение по email
- `GET /teams/:id/invitations` — пагинированный список приглашений команды
- `DELETE /teams/:id/invitations/:invId` — отозвать приглашение
- `GET /invitations/me` — пагинированные входящие приглашения
- `POST /invitations/:token/accept` — принять приглашение
- `POST /invitations/:token/decline` — отклонить приглашение

## Роли и защита

- Все team-scoped routes работают под `@Authorization()`
- Routes управления invitations дополнительно защищены `@Roles('OWNER', 'ADMIN')` и `RolesGuard`
- `RolesGuard` поддерживает маршруты с `params.teamId` и `params.id`

## Бизнес-правила invitations

- Приглашение можно отправить только с ролью `ADMIN` или `MEMBER`
- Повторное активное приглашение (`PENDING`) на тот же `email + teamId` запрещено
- Нельзя пригласить пользователя, который уже состоит в команде
- Invitation создаётся с уникальным `token` (`UUID v4`)
- `expiresAt` вычисляется как `now + 48 часов`
- При принятии invitation создаётся `TeamMember`, а invitation получает статус `ACCEPTED`
- При отклонении и отзыве invitation получает статус `DECLINED`
- Истёкшие `PENDING` invitations переводятся в `EXPIRED`

## Планировщик

Для фоновой обработки просроченных invitations используется `@nestjs/schedule`.

- `ScheduleModule.forRoot()` подключён в `src/app.module.ts`
- В `TeamInvitationsService` метод `expirePendingInvitations()` помечен `@Cron('0 */6 * * *')`
- Задача каждые 6 часов делает `updateMany` для всех `PENDING`, у которых `expiresAt < now()`

## Связанные файлы

- `src/teams/teams.controller.ts`
- `src/teams/teams.service.ts`
- `src/teams/members/team-members.controller.ts`
- `src/teams/members/team-members.service.ts`
- `src/teams/invitations/team-invitations.controller.ts`
- `src/teams/invitations/invitations.controller.ts`
- `src/teams/invitations/team-invitations.service.ts`
- `src/common/constants/invitations.constants.ts`
