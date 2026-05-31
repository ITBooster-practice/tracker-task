# MailModule

Инфраструктурный модуль для отправки email. Используется бизнес-модулями (например, `AuthModule`) для отправки писем пользователям.

## Архитектура

```
AuthService
    └── MailService          # бизнес-методы отправки (sendWelcomeEmail и т.п.)
            └── MailProvider # абстракция провайдера (интерфейс)
                    ├── ResendMailProvider  # реализация через Resend HTTP API
                    └── SmtpMailProvider    # реализация через Nodemailer/SMTP
```

Такая структура позволяет заменить провайдера отправки (например, с Resend на SendGrid) без изменений в `MailService` и бизнес-модулях. Конкретная реализация выбирается фабрикой в `mail.module.ts` по переменной `MAIL_TRANSPORT`.

### Файлы модуля

```
src/mail/
  mail.module.ts                   # сборка DI: фабрика провайдера по MAIL_TRANSPORT
  mail.service.ts                  # бизнес-методы отправки писем
  mail.provider.ts                 # интерфейс MailProvider
  mail.types.ts                    # тип MailPayload
  mail.constants.ts                # DI-токены: MAIL_PROVIDER, RESEND_CLIENT, SMTP_TRANSPORT
  config/
    mail.config.ts                 # чтение переменных окружения
  providers/
    resend-mail.provider.ts        # реализация через Resend HTTP API
    smtp-mail.provider.ts          # реализация через Nodemailer (SMTP)
  templates/
    welcome.email.tsx              # React Email шаблон приветственного письма
    team-invitation.email.tsx      # Письмо-приглашение в команду
```

## Переменные окружения

| Переменная       | Когда нужно                 | Описание                                       | Пример                  |
| ---------------- | --------------------------- | ---------------------------------------------- | ----------------------- |
| `MAIL_TRANSPORT` | всегда                      | `smtp` или `resend` (по умолчанию `resend`)    | `smtp`                  |
| `MAIL_HOST`      | при `MAIL_TRANSPORT=smtp`   | Хост SMTP-сервера                              | `127.0.0.1`, `mailpit`  |
| `MAIL_PORT`      | при `MAIL_TRANSPORT=smtp`   | Порт SMTP-сервера                              | `1025`                  |
| `RESEND_API_KEY` | при `MAIL_TRANSPORT=resend` | API-ключ сервиса Resend                        | `re_xxxxxxxxxxxxxxxx`   |
| `MAIL_FROM`      | всегда                      | Email адрес отправителя                        | `noreply@example.com`   |
| `MAIL_FROM_NAME` | всегда                      | Имя отправителя                                | `Tracker Task`          |
| `WEB_APP_URL`    | всегда                      | Базовый URL web-клиента (для ссылок в письмах) | `http://localhost:3001` |

## Выбор провайдера: MAIL_TRANSPORT

В `mail.module.ts` сборка провайдера сделана через фабрику:

```ts
{
    provide: MAIL_PROVIDER,
    useFactory: (configService: ConfigService) => {
        const transport = configService.get<string>('MAIL_TRANSPORT', 'resend')
        return transport === 'smtp'
            ? new SmtpMailProvider(nodemailer.createTransport({ ... }))
            : new ResendMailProvider(new Resend(configService.getOrThrow('RESEND_API_KEY')))
    },
    inject: [ConfigService],
}
```

Поведение по окружениям:

| Окружение        | `MAIL_TRANSPORT`              | Куда уходят письма                                        |
| ---------------- | ----------------------------- | --------------------------------------------------------- |
| dev (`pnpm dev`) | `smtp`                        | Mailpit на `127.0.0.1:1025`, просмотр на `localhost:8025` |
| local-stage      | `smtp`                        | Mailpit-контейнер из `docker-compose.local.yml`           |
| stage (VPS)      | `smtp` или `resend` (sandbox) | Mailtrap / Mailpit на VPS / Resend sandbox                |
| prod             | `resend`                      | Реальные адреса через Resend                              |

**Безопасность:** в dev и local-stage всегда выставляйте `MAIL_TRANSPORT=smtp`. Если оставить значение по умолчанию (`resend`) с боевым `RESEND_API_KEY`, тестовые письма уйдут реальным пользователям.

Переключение между окружениями делается **одной переменной** — пересборка кода не требуется, потому что выбор происходит при старте процесса в DI-контейнере NestJS.

## Как добавить новое письмо

**1. Создать шаблон** в `templates/`:

```tsx
// templates/team-invitation.email.tsx
export const TeamInvitationEmail = ({ teamName, inviterName, invitationLink }: Props) => (
	<Html>...</Html>
)
```

**2. Добавить метод в `MailService`:**

```typescript
async sendTeamInvitationEmail(email: string, teamName: string, inviterName: string | null, token: string) {
  const invitationLink = new URL(`/invitations/${token}`, WEB_APP_URL).toString()
  const html = await render(
    TeamInvitationEmail({
      teamName,
      inviterName: inviterName ?? 'Участник команды',
      invitationLink,
      expiresIn: TEAM_INVITATION_EXPIRES_IN_LABEL,
    }),
  )

  await this.mailProvider.send({
    from: this.getMailFrom(),
    to: email,
    subject: TEAM_INVITATION_EMAIL_SUBJECT,
    html,
  })
}
```

**3. Вызвать из нужного бизнес-сервиса:**

```typescript
await this.mailService.sendTeamInvitationEmail(
	dto.email,
	team.name,
	inviter.user.name,
	invitation.token,
)
```

## Что отправляется сейчас

- `sendWelcomeEmail(email, name)` — приветственное письмо после регистрации
- `sendTeamInvitationEmail(email, teamName, inviterName, token)` — письмо со ссылкой на приглашение

Срок действия приглашения и subject письма вынесены в `src/common/constants/invitations.constants.ts`, чтобы не дублировать доменные значения между сервисом, cron и шаблонами.

## Шаблоны писем

Письма верстаются на **React Email** (`@react-email/components`).

Это React-компоненты, которые рендерятся в HTML-строку на сервере через `render()` из `@react-email/render`. Никакого браузера, никакого DOM — просто шаблонизатор.

Плюсы подхода:

- компоненты и переиспользование
- TypeScript нативно
- превью письма в браузере через `react-email` dev-сервер
- email-совместимый HTML из коробки

## Почему два провайдера: SMTP и HTTP API

Есть два способа отправки email:

**SMTP** — прямое TCP-соединение с почтовым сервером (классические порты 25/465/587, локальные ловушки вроде Mailpit — 1025). Исторический стандарт. Плюсы: работает с чем угодно, что говорит на SMTP — Mailpit/MailHog для отладки, Mailtrap для stage, любой self-hosted сервер. Минусы для prod: соединение могут блокировать ISP/файрволы, нет встроенной аналитики, нужен правильно настроенный MX-домен.

**HTTP API (Resend)** — обычный HTTPS-запрос на порт 443. Resend принимает письмо и доставляет его через свою SMTP-инфраструктуру. Плюсы: порт 443 открыт везде, явный `{ data, error }` в ответе, дашборд с историей. Минусы: vendor lock-in, нет «бесплатного» способа отладки локально без интернета.

**Наш выбор:** оба, разные окружения — разные провайдеры (см. таблицу выше). SMTP — для всего, что не prod (Mailpit ничего не отправляет наружу — это безопасно). Resend — для prod, где важна доставляемость и аналитика.

## Обработка ошибок

Resend SDK не бросает исключения — возвращает `{ data, error }`. `ResendMailProvider` явно проверяет `error` и бросает исключение:

```typescript
const { data, error } = await this.resend.emails.send({...})
if (error) throw error
```

В `AuthService` отправка письма обёрнута в `try/catch` — ошибка логируется, но не ломает регистрацию:

```typescript
try {
	await this.mailService.sendWelcomeEmail(user.email, user.name)
} catch (error) {
	this.logger.error('Не удалось отправить письмо приветствия', error)
}
```

## Настройка Resend

1. Зарегистрироваться на [resend.com](https://resend.com)
2. Добавить и верифицировать домен (DNS-записи)
3. Создать API-ключ в дашборде
4. Прописать ключ в `RESEND_API_KEY`
5. Указать в `MAIL_FROM` адрес на верифицированном домене
