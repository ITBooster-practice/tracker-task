# Модуль Tasks

## Обзор

Модуль управляет задачами внутри проекта. Каждая задача принадлежит проекту (`Project`), проект — команде (`Team`). Доступ к любому эндпоинту задач проверяется через членство в команде (`TeamMember`).

### Используемые Prisma-модели

| Модель    | Назначение                                                            |
| --------- | --------------------------------------------------------------------- |
| `Task`    | Сама задача: заголовок, статус, приоритет, позиция, исполнитель       |
| `Project` | Проект, которому принадлежат задачи; связан с командой через `teamId` |
| `Team`    | Верхний уровень иерархии; через `TeamMember` определяются права       |

**Ключевые ограничения схемы:**

- `Task.projectId` → `Project.id` (`onDelete: Cascade`)
- `Task.position` — целое число, индексируется вместе с `projectId` и `status`: `@@index([projectId, status, position])`
- `Task.status` по умолчанию `TODO`; `Task.priority` по умолчанию `MEDIUM`
- `Task.assigneeId` и `Task.dueDate` — необязательные поля

---

## Маршруты Tasks

Базовый путь: `GET|POST|PATCH|DELETE /teams/:teamId/projects/:projectId/tasks`

Все маршруты защищены Bearer-токеном (`@Authorization()`).

| Метод    | Путь            | Параметры                             | Коды ответа        |
| -------- | --------------- | ------------------------------------- | ------------------ |
| `POST`   | `/`             | body: `CreateTaskDto`                 | 201, 400, 403      |
| `GET`    | `/`             | query: фильтры + пагинация            | 200, 403           |
| `GET`    | `/board`        | —                                     | 200, 403           |
| `GET`    | `/:taskId`      | path: `taskId`                        | 200, 403, 404      |
| `PATCH`  | `/:taskId`      | path: `taskId`, body: `UpdateTaskDto` | 200, 400, 403, 404 |
| `PATCH`  | `/:taskId/move` | path: `taskId`, body: `MoveTaskDto`   | 200, 400, 403, 404 |
| `DELETE` | `/:taskId`      | path: `taskId`                        | 204, 403, 404      |

---

## Маршруты Board

### `GET /teams/:teamId/projects/:projectId/tasks/board`

Возвращает полную структуру канбан-доски: все 4 колонки всегда присутствуют в ответе, даже если в них нет задач.

#### Схема ответа `BoardColumn[]`

```typescript
// BoardColumnDto
{
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  tasks: TaskResponseDto[]
}
```

```typescript
// TaskResponseDto
{
	id: string // UUID
	title: string
	description: string | null
	status: string // TaskStatus
	priority: string // Priority
	position: number
	assigneeId: string | null
	projectId: string
	createdById: string
	dueDate: Date | null
	createdAt: Date
	updatedAt: Date
}
```

**Гарантии:**

- Ответ содержит ровно 4 колонки в фиксированном порядке: `TODO → IN_PROGRESS → IN_REVIEW → DONE`
- Задачи внутри каждой колонки отсортированы по `position ASC`
- Доска формируется одним запросом к БД с `orderBy: { position: 'asc' }`, а затем группируется в памяти

---

## Права доступа

| Действие   | Минимальная роль    | Дополнительное условие                          |
| ---------- | ------------------- | ----------------------------------------------- |
| `create`   | `MEMBER`            | —                                               |
| `findAll`  | `MEMBER`            | —                                               |
| `getBoard` | `MEMBER`            | —                                               |
| `findOne`  | `MEMBER`            | —                                               |
| `update`   | `MEMBER`            | только `ADMIN`/`OWNER` **или** создатель задачи |
| `moveTask` | `MEMBER`            | —                                               |
| `remove`   | `ADMIN` или `OWNER` | —                                               |

Проверка членства выполняется через `assertTeamMember` — ищет запись `TeamMember` по `{ teamId, userId }`. Если запись не найдена → `403 ForbiddenException`.

---

## Фильтры и сортировка (`findAll`)

Эндпоинт `GET /` принимает следующие query-параметры:

| Параметр     | Тип          | Описание                                                      |
| ------------ | ------------ | ------------------------------------------------------------- |
| `page`       | `number`     | Номер страницы (по умолчанию 1)                               |
| `limit`      | `number`     | Размер страницы (по умолчанию 10)                             |
| `status`     | `TaskStatus` | Фильтр по статусу: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `priority`   | `Priority`   | Фильтр по приоритету: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`     |
| `assigneeId` | `string`     | UUID пользователя-исполнителя                                 |

**Порядок сортировки по умолчанию:** `status ASC`, затем `position ASC`.

Параметры валидируются через `taskFilterQuerySchema` (Zod). Непереданные фильтры игнорируются.

---

## Логика поля `position`

### Создание задачи (`create`)

`position` вычисляется автоматически — явно передавать его не нужно.

```
position = MAX(position WHERE projectId = ? AND status = ?) + 1
```

Если в колонке ещё нет задач (`MAX = null`) → `position = 1`.

Реализация: один `prisma.task.aggregate` с `_max: { position: true }`, затем `prisma.task.create`.

### Перемещение задачи (`moveTask`)

При вызове `PATCH /:taskId/move` клиент передаёт целевые `status` и `position` явно:

```typescript
// MoveTaskDto
{
	status: TaskStatus // целевая колонка
	position: number // целевая позиция внутри колонки
}
```

Обновление атомарно — один `prisma.task.update`:

```
UPDATE tasks SET status = ?, position = ? WHERE id = ?
```

> **Важно:** сервис не сдвигает позиции соседних задач автоматически. Корректный пересчёт позиций остальных задач в колонке — ответственность клиента. Рекомендуемый подход на фронтенде: при drag-and-drop пересчитывать позиции всех затронутых задач и отправлять последовательные `moveTask`-запросы.
