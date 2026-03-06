# Unit-тесты

Тесты изолированы от БД и внешних сервисов — все зависимости мокируются.

## Структура файлов

```
test/
├── mocks/
│   └── argon2.ts              # vi.fn() заглушки для hash / verify
├── helpers/
│   └── auth.helpers.ts        # createPrismaMock, createJwtMock,
│                              # createConfigMock, makeTokens
└── unit/
    └── auth/
        └── auth.service.spec.ts
```

`mocks/` и `helpers/` доступны как unit, так и e2e тестам.

## Соглашения

- **Фикстуры** (`REGISTER_DTO`, `STORED_USER` и т.д.) — константы в верхней части файла
- **Сброс моков** — `vi.clearAllMocks()` в `beforeEach`
- **Мок argon2** — `vi.mock('argon2', async () => await import('../../mocks/argon2'))`

## Покрытые сценарии: AuthService

| Метод      | Сценарий           | Ожидание             |
| ---------- | ------------------ | -------------------- |
| `register` | Новый пользователь | Токены + запись в БД |
| `register` | Email уже занят    | `ConflictException`  |
| `login`    | Верные данные      | Токены               |
| `login`    | Email не найден    | `NotFoundException`  |
| `login`    | Неверный пароль    | `NotFoundException`  |

## Пример теста

```typescript
import { ConflictException } from '@nestjs/common'
import { hash } from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from '../../../src/auth/auth.service'
import {
	createConfigMock,
	createJwtMock,
	createPrismaMock,
	makeTokens,
} from '../../helpers/auth.helpers'

vi.mock('argon2', async () => await import('../../mocks/argon2'))

describe('AuthService', () => {
	let service: AuthService
	let prisma: ReturnType<typeof createPrismaMock>

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(hash).mockResolvedValue('hashed_password' as never)

		prisma = createPrismaMock()
		service = new AuthService(prisma, createConfigMock(), createJwtMock())
	})

	it('register — ConflictException если email занят', async () => {
		prisma.user.findUnique.mockResolvedValue({ id: 'x', email: 'alice@example.com' })
		await expect(service.register(REGISTER_DTO)).rejects.toThrow(ConflictException)
	})
})
```
