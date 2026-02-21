# Web App (Tracker Task)

Веб-приложение построено на **Next.js 16** с использованием App Router.

## Запуск

```bash
pnpm dev
```

Приложение будет доступно по адресу [localhost:3001](http://localhost:3001)

## Стек технологий

- **Next.js 16** — React фреймворк с серверным рендерингом
- **React 19** — UI библиотека
- **TypeScript** — типизация
- **Tailwind CSS 4** — стили
- **@repo/ui** — [UI-kit на основе shadcn/ui](../../docs/frontend/shadcn.md)
- **react-hook-form + zod** — формы и валидация

## Структура

```
app/
├── layout.tsx      # Корневой layout с шрифтами
├── page.tsx        # Главная страница
├── globals.css     # Глобальные стили
└── fonts/          # Шрифты Geist Sans и Geist Mono
```

## Разработка

Страницы автоматически обновляются при изменении кода.

Для создания новых страниц добавьте файлы в папку `app/`.
