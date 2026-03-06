# Frontend Layout, Route Groups и Навигация

Документ фиксирует текущую структуру layout в `apps/web` и целевой подход к breadcrumbs/навигации.

## 1) Route groups и точки входа

В проекте используется App Router (`apps/web/app`) с route groups:

- `(dashboard)` — защищенная часть приложения с рабочим интерфейсом.
- `(auth)` — страницы авторизации.

Текущая раскладка:

```text
apps/web/app/
├── layout.tsx                 # RootLayout: html/body + Providers
├── page.tsx                   # Landing (без dashboard-layout)
├── (dashboard)/
│   ├── layout.tsx             # Подключает MainLayout (sidebar + header)
│   ├── projects/page.tsx
│   ├── tasks/page.tsx
│   └── sprints/page.tsx
└── (auth)/
    ├── layout.tsx             # Центрирует auth-страницы
    ├── auth-form-layout.tsx   # Общая обёртка для форм авторизации
    ├── login/page.tsx
    └── register/page.tsx
```

Важно:

- Имя группы в скобках не попадает в URL.
- `/projects`, `/tasks`, `/sprints` отрисовываются внутри `MainLayout`.
- `/login`, `/register` используют отдельный auth-layout и не показывают sidebar/header.

## 2) Где лежат Sidebar/Header

Основные компоненты layout находятся в `apps/web/widgets/main-layout`:

- `ui/main-layout.tsx` — собирает каркас:
  - `sidebar={<Sidebar />}`
  - `header={<Header />}`
- `ui/layout.tsx` — базовая двухколоночная разметка:
  - слева `aside` (desktop),
  - справа `header` + `main`.
- `ui/sidebar/sidebar.tsx` — меню разделов, тема, блок пользователя.
- `ui/header/header.tsx` — toggle/sidebar-trigger, breadcrumbs-заглушка, поиск, уведомления (заглушка), профиль.

## 3) Как работает сворачивание Sidebar

### Desktop (>= `md`)

- Состояние хранится в Zustand store: `widgets/main-layout/model/sidebar/store.ts`.
- Store имеет `isOpen`, `open`, `close`, `toggle`.
- В `Header` кнопка `SidebarToggle` вызывает `toggle`.
- В `Sidebar` ширина переключается по `isOpen`:
  - открыто: `w-56`,
  - свернуто: `w-12`.
- Контент не скрывается полностью: остаются иконки, текст пунктов меню скрывается.
- В свёрнутом состоянии каждый пункт меню получает HTML-атрибут `title` с названием раздела — это обеспечивает нативный tooltip при наведении.

### Mobile (`< md`)

- Desktop aside скрыт (`md:block`), вместо него используется `MobileSidebarTrigger`.
- `MobileSidebarTrigger` открывает `Sheet` слева.
- Внутрь `Sheet` рендерится `<Sidebar forceOpen />`:
  - мобильный сайдбар всегда в раскрытом виде,
  - при клике на пункт меню вызывается `onNavigate`, `Sheet` закрывается.

## 4) Подход к breadcrumbs и навигации

Сейчас breadcrumbs в `Header` статичны (`Главная / Раздел`) и служат плейсхолдером.

Рекомендуемый подход:

1. Единый конфиг навигации.
   Создать источник правды (например, `shared/config/navigation.ts`) с полями:

- `href`
- `label`
- `icon` (опционально)
- `parent` (опционально, для цепочки breadcrumbs)
- `featureFlag` (опционально)

2. Sidebar строить из этого конфига.
   `Sidebar` не хранит локальный список `sidebarItems`, а получает его из общего конфига.

3. Breadcrumbs строить по `pathname`.
   Алгоритм:

- взять текущий `pathname` (`usePathname()`),
- сопоставить с узлом навигации,
- пройти по `parent` вверх,
- отрисовать цепочку от корня к текущему разделу.

4. Фоллбэк для динамических страниц.
   Если путь не найден в конфиге (например, `/projects/[id]`), использовать:

- ближайший известный родительский сегмент,
- последний сегмент как текстовый fallback (или заголовок из данных страницы).

5. Синхронизация с feature flags.
   Если раздел выключен флагом, он:

- не показывается в sidebar,
- не участвует в breadcrumbs как доступный переход.

## 5) Практические правила

- Любой новый dashboard-раздел добавляется в одном месте: `navigation`-конфиг.
- Route в `app/(dashboard)` и пункт в sidebar всегда идут парой.
- Breadcrumbs не задаются руками в каждом `page.tsx`, а вычисляются из route/meta.
- Для auth-страниц breadcrumbs и sidebar не рендерятся.
