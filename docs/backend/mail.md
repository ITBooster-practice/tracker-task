# MailModule

Инфраструктурный модуль для отправки email. Используется бизнес-модулями (например, `AuthModule`) для отправки писем пользователям.

## Архитектура

```
AuthService
    └── MailService          # бизнес-методы отправки (sendWelcomeEmail и т.п.)
            └── MailProvider # абстракция провайдера (интерфейс)
                    └── ResendMailProvider  # конкретная реализация через Resend API
```

Такая структура позволяет заменить провайдера отправки (например, с Resend на SendGrid) без изменений в `MailService` и бизнес-модулях.

### Файлы модуля

```
src/mail/
  mail.module.ts                   # сборка DI: регистрация провайдеров и Resend-клиента
  mail.service.ts                  # бизнес-методы отправки писем
  mail.provider.ts                 # интерфейс MailProvider
  mail.types.ts                    # тип MailPayload
  mail.constants.ts                # DI-токены: MAIL_PROVIDER, RESEND_CLIENT
  config/
    mail.config.ts                 # чтение переменных окружения
  providers/
    resend-mail.provider.ts        # реализация через Resend HTTP API
  templates/
    welcome.email.tsx              # React Email шаблон приветственного письма
```

## Переменные окружения

| Переменная       | Описание                | Пример                |
| ---------------- | ----------------------- | --------------------- |
| `RESEND_API_KEY` | API-ключ сервиса Resend | `re_xxxxxxxxxxxxxxxx` |
| `MAIL_FROM`      | Email адрес отправителя | `noreply@example.com` |
| `MAIL_FROM_NAME` | Имя отправителя         | `Tracker Task`        |

## Как добавить новое письмо

**1. Создать шаблон** в `templates/`:

```tsx
// templates/invite.email.tsx
export const INVITE_EMAIL_SUBJECT = 'Вас пригласили в команду'

export const InviteEmail = ({ name, teamName }: Props) => <Html>...</Html>
```

**2. Добавить метод в `MailService`:**

```typescript
async sendInviteEmail(email: string, name: string, teamName: string) {
  const html = await render(InviteEmail({ name, teamName }))

  await this.mailProvider.send({
    from: `${this.mailName} <${this.mailAddress}>`,
    to: email,
    subject: INVITE_EMAIL_SUBJECT,
    html,
  })
}
```

**3. Вызвать из нужного бизнес-сервиса:**

```typescript
await this.mailService.sendInviteEmail(user.email, user.name, team.name)
```

## Шаблоны писем

Письма верстаются на **React Email** (`@react-email/components`).

Это React-компоненты, которые рендерятся в HTML-строку на сервере через `render()` из `@react-email/render`. Никакого браузера, никакого DOM — просто шаблонизатор.

Плюсы подхода:

- компоненты и переиспользование
- TypeScript нативно
- превью письма в браузере через `react-email` dev-сервер
- email-совместимый HTML из коробки

## Почему Resend API, а не SMTP

Есть два способа отправки email:

**SMTP** — прямое TCP-соединение с почтовым сервером на портах 465/587. Исторический стандарт. Проблемы:

- соединение может блокироваться файрволами или ISP
- сложнее отлаживать
- нет встроенной аналитики

**HTTP API (Resend)** — обычный HTTPS-запрос на порт 443. Resend принимает письмо и доставляет его через свою SMTP-инфраструктуру.

Почему выбрали API:

- порт 443 открыт везде, проблем с сетью нет
- Resend возвращает явный `{ data, error }` — легче обрабатывать ошибки
- есть дашборд с историей отправок
- официальный Node.js SDK

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
