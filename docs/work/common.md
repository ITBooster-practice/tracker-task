# Общие правила разработки

Best practices и принципы, которых придерживаемся в проекте.

## Константы вместо магических чисел

❌ **Плохо:**

```typescript
if (user.age >= 18) {
	// ...
}

setTimeout(() => {}, 5000)
```

✅ **Хорошо:**

```typescript
const MINIMUM_AGE = 18

if (user.age >= MINIMUM_AGE) {
	// ...
}

const DEBOUNCE_DELAY_MS = 5000
setTimeout(() => {}, DEBOUNCE_DELAY_MS)
```

## Текст выносим в константы

❌ **Плохо:**

```typescript
throw new Error('Пользователь не найден')
buttonText = 'Сохранить'
```

✅ **Хорошо:**

```typescript
const ERROR_MESSAGES = {
	USER_NOT_FOUND: 'Пользователь не найден',
	INVALID_CREDENTIALS: 'Неверные учётные данные',
}

const BUTTON_LABELS = {
	SAVE: 'Сохранить',
	CANCEL: 'Отменить',
}

throw new Error(ERROR_MESSAGES.USER_NOT_FOUND)
buttonText = BUTTON_LABELS.SAVE
```

## DRY (Don't Repeat Yourself)

Если код повторяется больше двух раз - вынеси в функцию/компонент.

❌ **Плохо:**

```typescript
const user1Valid = user1.email && user1.email.includes('@')
const user2Valid = user2.email && user2.email.includes('@')
const user3Valid = user3.email && user3.email.includes('@')
```

✅ **Хорошо:**

```typescript
const isEmailValid = (email: string): boolean => {
	return email && email.includes('@')
}

const user1Valid = isEmailValid(user1.email)
const user2Valid = isEmailValid(user2.email)
const user3Valid = isEmailValid(user3.email)
```

## KISS (Keep It Simple, Stupid)

Простое решение лучше сложного. Не усложняй без необходимости.

## YAGNI (You Aren't Gonna Need It)

Не пиши код "на будущее". Реализуй только то, что нужно сейчас.

## Именование

### Переменные и функции

- **Говорящие имена**: `getUserById`, а не `get`
- **camelCase** для переменных и функций
- **PascalCase** для классов и компонентов
- **UPPER_SNAKE_CASE** для констант

```typescript
// Переменные
const userName = 'John'
const isActive = true

// Функции
function calculateTotal() {}
async function fetchUserData() {}

// Классы
class UserService {}

// Константы
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'
```

### Булевы значения

Начинай с `is`, `has`, `should`:

```typescript
const isLoading = true
const hasAccess = false
const shouldUpdate = true
```

## Типизация

Всегда указывай типы, избегай `any`.

❌ **Плохо:**

```typescript
function processData(data: any) {
	// ...
}
```

✅ **Хорошо:**

```typescript
interface UserData {
	id: number
	name: string
	email: string
}

function processData(data: UserData) {
	// ...
}
```

## Комментарии

- Код должен быть самодокументируемым
- Комментируй **почему**, а не **что**
- Избегай очевидных комментариев

❌ **Плохо:**

```typescript
// Увеличиваем i на 1
i++
```

✅ **Хорошо:**

```typescript
// Используем debounce для предотвращения частых запросов к API
const SEARCH_DEBOUNCE_MS = 300
const debouncedSearch = debounce(searchHandler, SEARCH_DEBOUNCE_MS)
```

## Обработка ошибок

Всегда обрабатывай ошибки, не игнорируй их.

❌ **Плохо:**

```typescript
try {
	await fetchData()
} catch (e) {
	// Пустой catch
}
```

✅ **Хорошо:**

```typescript
const ERROR_MESSAGES = {
	FETCH_DATA_ERROR: 'Ошибка при загрузке данных',
	FETCH_DATA_FAILED: 'Не удалось загрузить данные',
}

try {
	await fetchData()
} catch (error) {
	logger.error(ERROR_MESSAGES.FETCH_DATA_ERROR, error)
	throw new AppError(ERROR_MESSAGES.FETCH_DATA_FAILED)
}
```

## Структура файлов

- Один компонент/класс = один файл
- Группируй связанные файлы в папки
- Держи файлы компактными (до 200-300 строк)

## Форматирование и сортировка импортов

Для автоматической сортировки импортов используется `@ianvs/prettier-plugin-sort-imports`.

Порядок импортов (настроено в `.prettierrc.mjs`):

1. Встроенные модули Node.js
2. Внешние пакеты (node_modules)
3. Пакеты монорепозитория (`@repo/*`)
4. Относительные импорты (`../`, `./`)

Форматирование применяется:

- При сохранении файла (в IDE)
- Через pre-commit hook

<!-- ## Тестирование

- Пиши тесты для критичной бизнес-логики
- Название теста описывает поведение: `should return user when id exists`
- Следуй паттерну Arrange-Act-Assert

```typescript
describe('UserService', () => {
  it('should return user when valid id provided', () => {
    // Arrange
    const userId = 1;

    // Act
    const user = userService.getById(userId);

    // Assert
    expect(user).toBeDefined();
    expect(user.id).toBe(userId);
  });
});
``` -->

## Code Review

- Будь конструктивным и вежливым
- Объясняй почему предлагаешь изменение
- Хвали хороший код
- Задавай вопросы вместо требований

---

💡 **Помни**: Код пишется один раз, а читается десятки раз. Пиши для людей, а не для компьютера.
