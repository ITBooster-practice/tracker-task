# Git Hooks (Husky)

В этом проекте настроены автоматические проверки перед коммитом с помощью [Husky](https://typicode.github.io/husky/).

## 🛠 Что проверяется?

### 1. Pre-commit (перед созданием коммита)

Запускается `lint-staged`, который проверяет **только измененные файлы**:

- `*.{ts,tsx}`: запускается ESLint (`--fix`) и Prettier.
- `*.{json,md,yml}`: запускается Prettier.

Если линтер находит ошибки, которые не может исправить автоматически, коммит отменяется.

### 2. Commit-msg (проверка сообщения коммита)

Запускается `commitlint`, который проверяет формат сообщения по конвенции [Conventional Commits](https://www.conventionalcommits.org/).

**Формат:**
`type(scope): description`

**Разрешенные типы (type):**

- `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`

**Разрешенные области (scope) - Опционально:**
Если scope указан, он должен быть одним из списка:

- `api` - Backend (apps/api)
- `web` - Frontend (apps/web)
- `ui` - UI Kit (packages/ui)
- `libs` - Shared libraries
- `config` - Config files
- `repo` - Repo management (turbo, husky)
- `docs` - Documentation

**Примеры:**  
✅ `feat(web): add login page`  
✅ `fix(api): handle timeout error`  
✅ `chore(repo): setup husky`  
❌ `update login page` (нет типа)  
❌ `feat(unknown): ...` (неизвестный scope)

## ⚡️ Пропуск проверок (Emergency Hatch)

В экстренных случаях (WIP, эксперименты) проверки можно пропустить:

```bash
git commit -m "wip: ..." --no-verify
```

## ❓ FAQ

**Почему нет Type-Check (tsc)?**
Полная проверка типов (`tsc`) занимает много времени в монорепозитории. Мы вынесли её в CI pipeline (`pnpm type-check`). Локально полагаемся на IDE и ESLint.

**Husky не работает / Ошибка "command not found"**
Попробуйте переустановить хуки:

```bash
pnpm install
# или
npx husky install
```
