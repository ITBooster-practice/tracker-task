# Frontend Layout, Route Groups и Навигация

Рабочий интерфейс `apps/web` объединяет страницы в общий layout с header и sidebar. Каркас и навигация находятся в `apps/web/widgets/main-layout`; ниже описаны точки подключения, выбор команды и проекта и добавление пунктов меню.

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
│   ├── boards/page.tsx
│   └── sprints/page.tsx       # legacy redirect на /boards
└── (auth)/
    ├── layout.tsx             # Центрирует auth-страницы
    ├── auth-form-layout.tsx   # Общая обёртка для форм авторизации
    ├── login/page.tsx
    └── register/page.tsx
```

Важно:

- Имя группы в скобках не попадает в URL.
- `/projects`, `/tasks`, `/boards` отрисовываются внутри `MainLayout`.
- `/sprints` оставлен как legacy redirect на `/boards`.
- `/login`, `/register` используют отдельный auth-layout и не показывают sidebar/header.

## 2) Где лежат Sidebar/Header

Основные компоненты layout находятся в `apps/web/widgets/main-layout`:

- `ui/main-layout.tsx` — собирает каркас:
  - `sidebar={<Sidebar />}`
  - `header={<Header />}`
- `ui/layout.tsx` — базовая двухколоночная разметка:
  - слева `aside` (desktop),
  - справа `header` + `main`.
- `ui/sidebar/sidebar.tsx` — меню разделов, блок пользователя.
- `ui/header/header.tsx` — toggle/sidebar-trigger, поиск, уведомления (заглушка), переключатель темы, профиль. Применение темы описано в [дизайн-системе](../design-system/README.md#цвета-и-темы).

### Контекст команды и проекта

[Store рабочей области](../../apps/web/shared/lib/workspace-context/store.ts) сохраняет `ownerId`, `teamId` и `projectId` в `localStorage` под ключом `workspace-context`. `ownerId` — идентификатор текущего пользователя: выбор принадлежит аккаунту. [useWorkspaceContext](../../apps/web/widgets/main-layout/model/use-workspace-context.ts) связывает сохранённый выбор с маршрутом и загружает списки и детали команды и проекта с ключами запросов, включающими аккаунт.

При переходе на `/teams/[id]/…` команда из URL имеет приоритет; маршрут проекта также задаёт `projectId`. Это действует для прямой ссылки, перезагрузки и переходов назад/вперёд. Глобальные страницы, например профиль или список команд, сохраняют выбор. Переход к другой команде сбрасывает прежний проект; переход внутри той же команды сохраняет его, если URL не задаёт другой проект. Селекторы sidebar выбирают команду или проект и открывают соответствующую страницу.

Выход и смена аккаунта очищают прежний контекст. Ответ `403` или `404` запроса деталей команды сбрасывает команду вместе с проектом, а такой ответ для проекта — только проект. Успешное удаление выбранной сущности очищает тот же уровень; проект другой команды не используется. Загрузка, пустой или неполный список и ошибка `5xx` не считаются подтверждением потери доступа и не сбрасывают выбор.

### Пользователь и роль в Sidebar

[SidebarUser](../../apps/web/widgets/main-layout/ui/sidebar/sidebar-user.tsx) получает профиль через `useMe`, команду через `useTeamDetail(teamId)` и проект через `useProjectDetail(teamId, projectId)`. Идентификаторы передаёт `Sidebar` из `useWorkspaceContext`; запросы деталей привязаны к аккаунту. Имя и инициалы готовят `getUserDisplayName` и `getNameInitials` из `shared/lib/user`.

Роль определяется по участнику `team.members` с идентификатором текущего пользователя: «Владелец», «Администратор» или «Участник». Контейнер проверяет совпадение `team.id`, `project.id` и `project.teamId` с выбранным контекстом. Это роль в команде, которая даёт доступ к проекту; отдельную роль проекта блок не назначает.

Без выбранной команды, при загрузке или повторном запросе контекста, ошибке, несовпадении идентификаторов или отсутствии пользователя в составе команды блок показывает нейтральное «Роль не определена». На глобальных страницах роль определяется по сохранённой команде и проекту.

Desktop, мобильный `<Sidebar forceOpen />` и свёрнутый sidebar используют один `SidebarUser` и презентационный [UserSummary из UI-kit](../../packages/ui/README.md#usersummary). Меняйте получение данных и правила контекста в `SidebarUser`, общую композицию — в `UserSummary`. Размеры и состояния заданы в [дизайн-системе](../design-system/README.md#usersummary).

## 3) Как работает сворачивание Sidebar

### Desktop (>= `md`)

- Состояние хранится в Zustand store: `widgets/main-layout/model/sidebar/store.ts`.
- Store имеет `isOpen`, `open`, `close`, `toggle`.
- В `Header` кнопка `SidebarToggle` вызывает `toggle`.
- В `Sidebar` ширина переключается по `isOpen`:
  - открыто: `w-56`,
  - свернуто: `w-12`.
- Контент не скрывается полностью: остаются иконки, текст пунктов меню скрывается.
- В свёрнутом состоянии доступные ссылки получают HTML-атрибут `title` с названием раздела. Недоступные пункты показывают причину через общий `SidebarMenuItem`, как описано ниже.

### Mobile (`< md`)

- Desktop aside скрыт (`md:block`), вместо него используется `MobileSidebarTrigger`.
- `MobileSidebarTrigger` открывает `Sheet` слева.
- Внутрь `Sheet` рендерится `<Sidebar forceOpen />`:
  - мобильный сайдбар всегда в раскрытом виде,
  - при переходе по доступной ссылке вызывается `onNavigate`, `Sheet` закрывается.

## 4) Как собирается меню

[getSidebarSections](../../apps/web/widgets/main-layout/model/sidebar/navigation.ts) строит секции меню по выбранной команде, проекту и правам. Адреса задаёт [shared/config/routes.ts](../../apps/web/shared/config/routes.ts); `getSidebarRouteId(pathname)` определяет активный раздел. Breadcrumbs в `Header` не отображаются.

Для перехода пункт получает `href`, для недоступного действия — `disabledReason`, например «Сначала выберите проект». Не используйте `#` вместо адреса. Разделы без доступа скрываются; ссылка на настройки выбранной команды доступна владельцу и администратору. Пока права проверяются, пункт объясняет ожидание, а без команды предлагает сначала выбрать её.

Один [SidebarMenuItem](../../apps/web/widgets/main-layout/ui/sidebar/sidebar-menu-item.tsx) обслуживает раскрытый, свёрнутый и мобильный sidebar. Доступный пункт — ссылка с `aria-current` для активного раздела. Недоступный пункт — кнопка с `aria-disabled` и связанным через `aria-describedby` объяснением; она остаётся в порядке фокуса и показывает tooltip при наведении, фокусе и нажатии, включая touch. Такой пункт не выполняет переход и не закрывает мобильное меню.

## 5) Практические правила

- Для нового пункта добавьте адрес и сопоставление активного раздела в `shared/config/routes.ts`, затем пункт в `getSidebarSections`. Используйте контекст и правила доступа из `useWorkspaceContext`.
  Для пункта, зависящего от проекта, задавайте `href` только при наличии команды и проекта, иначе передавайте причину недоступности:

```typescript
const taskItem = {
	title: 'Задачи',
	href: teamId && projectId ? teamRoutes.projectTasks(teamId, projectId) : undefined,
	disabledReason: !teamId
		? 'Сначала выберите команду'
		: !projectId
			? 'Сначала выберите проект'
			: undefined,
	routeId: SIDEBAR_ROUTE_IDS.tasks,
	icon: ListTodo,
}
```

Для auth-страниц breadcrumbs и sidebar не рендерятся.
