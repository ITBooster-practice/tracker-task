# @nestjs/schedule — шпаргалка

Короткая памятка по `@nestjs/schedule` для NestJS-проектов.

Подходит для задач вроде:

- очистка просроченных записей
- отправка отложенных уведомлений
- синхронизация с внешним API
- регулярные фоновые пересчёты

## Что это за пакет

`@nestjs/schedule` добавляет в NestJS встроенную поддержку фоновых задач по расписанию:

- `@Cron()` — запуск по cron-выражению
- `@Interval()` — запуск каждые N миллисекунд
- `@Timeout()` — однократный запуск через N миллисекунд после старта приложения

Под капотом используется `cron` и стандартный NestJS DI.

## Установка

```bash
pnpm add @nestjs/schedule
```

## Базовое подключение

В корневом модуле:

```typescript
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
	imports: [ScheduleModule.forRoot()],
})
export class AppModule {}
```

Без `ScheduleModule.forRoot()` декораторы расписания работать не будут.

## Cron-задача

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CleanupService {
	private readonly logger = new Logger(CleanupService.name)

	@Cron('0 */6 * * *')
	async cleanupExpiredRecords() {
		this.logger.log('Запуск cleanupExpiredRecords')
		// business logic
	}
}
```

Пример выше означает запуск каждые 6 часов.

## Интервал и таймаут

```typescript
import { Injectable } from '@nestjs/common'
import { Interval, Timeout } from '@nestjs/schedule'

@Injectable()
export class JobsService {
	@Interval(60_000)
	handleEachMinute() {
		// раз в минуту
	}

	@Timeout(5_000)
	handleAfterBootstrap() {
		// один раз через 5 секунд после старта
	}
}
```

## Где размещать задачи

Обычно есть 2 нормальных варианта:

1. В существующем сервисе, если задача тесно связана с его бизнес-логикой.
2. В отдельном scheduler service, если фоновых задач становится много.

Практическое правило:

- 1 простая задача внутри одного домена: можно держать рядом с доменным сервисом
- много задач или смешанные домены: лучше вынести в отдельный `jobs/` или `scheduler/` модуль

## Рекомендации по использованию

### 1. Выносите расписание в константы

```typescript
export const CLEANUP_CRON = '0 */6 * * *'
```

Это упрощает повторное использование и тестирование.

### 2. Не держите сложную логику прямо в cron-методе

Лучше так:

```typescript
@Cron(CLEANUP_CRON)
async handleCleanup() {
  await this.cleanupExpiredRecords()
}
```

А основную бизнес-логику держать в обычном методе сервиса.

### 3. Логируйте запуск и ошибки

```typescript
try {
	await this.cleanupExpiredRecords()
} catch (error) {
	this.logger.error('Cleanup job failed', error)
}
```

### 4. Делайте задачи идемпотентными

Задача должна безопасно переживать повторный запуск.

Хороший пример:

- `updateMany` для всех просроченных записей

Плохой пример:

- код, который создаёт дубли, если job стартанёт повторно

## Cron-выражения

Формат:

```text
* * * * * *
| | | | | |
| | | | | └── день недели
| | | | └──── месяц
| | | └────── день месяца
| | └──────── час
| └────────── минута
└──────────── секунда
```

Часто используемые варианты:

- `0 */6 * * *` — каждые 6 часов
- `0 0 * * *` — каждый день в полночь
- `0 0 * * 1` — каждый понедельник
- `*/30 * * * * *` — каждые 30 секунд

Если в проекте принято 5-позиционное выражение без секунд, используйте один стиль последовательно по всему проекту.

## Таймзона

Если важна таймзона, задавайте её явно:

```typescript
@Cron('0 0 9 * * *', {
  timeZone: 'Europe/Kyiv',
})
handleMorningJob() {}
```

Если таймзона не указана, используется окружение, в котором работает приложение.

## Частые ошибки

### Задача не запускается

Проверьте:

1. Подключён ли `ScheduleModule.forRoot()`
2. Является ли класс с `@Cron()` provider-ом модуля
3. Создаётся ли этот provider через NestJS DI

### Задача запускается, но ничего не делает

Проверьте:

1. Есть ли логирование старта
2. Не глотается ли ошибка внутри `try/catch`
3. Совпадает ли cron-выражение с ожидаемым временем

### Дублирующий запуск

Если приложение поднято в нескольких экземплярах, cron будет выполняться в каждом экземпляре.

Для multi-instance deployment используйте один из подходов:

1. distributed lock через Redis/Postgres
2. отдельный worker-процесс
3. внешний scheduler

## Как тестировать

Обычно тестируют не сам декоратор, а бизнес-метод, который он вызывает.

Пример:

```typescript
it('должен переводить просроченные записи в EXPIRED', async () => {
	prisma.record.updateMany.mockResolvedValue({ count: 2 })

	const result = await service.cleanupExpiredRecords()

	expect(prisma.record.updateMany).toHaveBeenCalledOnce()
	expect(result).toEqual({ count: 2 })
})
```

То есть:

- unit-тестируем метод сервиса
- не пытаемся ждать реального cron-времени

## Как используется в этом проекте

В текущем backend-проекте `@nestjs/schedule` используется для invitations:

- `ScheduleModule.forRoot()` подключён в `src/app.module.ts`
- `TeamInvitationsService.expirePendingInvitations()` запускается каждые 6 часов
- задача переводит просроченные `PENDING` invitations в `EXPIRED`
