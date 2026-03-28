# Цветной вывод в таблице Coverage (v8)

За раскраску таблицы `% Coverage report from v8` отвечает **`watermarks`**, а не `thresholds`.

- **`thresholds`** — роняет тест-ран, если покрытие ниже порога
- **`watermarks`** — задаёт диапазоны для раскраски текстовой таблицы в терминале

## Где настраивать

Глобально для всех пакетов: `packages/vitest-config/src/base.ts`
Для конкретного приложения: `apps/web/vitest.config.ts` или `apps/api/vitest.config.ts`

## Пример конфига

```ts
coverage: {
  enabled: true,
  provider: 'v8',
  reportsDirectory: 'coverage',
  // Падает тест-ран, если покрытие ниже порога
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
  // Отвечает за раскраску таблицы в терминале: [низкий, высокий]
  watermarks: {
    statements: [50, 80],
    branches: [50, 80],
    functions: [50, 80],
    lines: [50, 80],
  },
},
```

## Логика цветов (watermarks)

Формат `[низкий, высокий]`:

| Цвет    | Условие                      |
| ------- | ---------------------------- |
| Красный | значение < низкий            |
| Жёлтый  | низкий <= значение < высокий |
| Зелёный | значение >= высокий          |
