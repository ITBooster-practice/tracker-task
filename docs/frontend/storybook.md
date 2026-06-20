# Storybook

## Зачем

Storybook позволяет разрабатывать и тестировать UI-компоненты изолированно, не запуская всё приложение. Каждая _story_ — это отдельное состояние компонента с фиксированными пропсами.

## Запуск

Из корня монорепозитория:

```bash
pnpm storybook
```

Из директории `apps/web`:

```bash
pnpm storybook
```

Обе команды запускают Storybook на `http://localhost:6006`.

## Сборка статической версии

```bash
pnpm storybook:build
```

Собранные файлы окажутся в `packages/ui/storybook-static/`.

## Архитектура

Конфиг и все `.stories` файлы живут в `packages/ui` — там же, где хранятся сами компоненты. Это сделано намеренно: `@repo/ui` — общий UI-пакет для всех приложений монорепозитория, и логично держать компоненты рядом с их документацией.

```
packages/ui/
├── .storybook/          # конфиг Storybook (main.ts, preview.ts)
└── src/
    └── components/
        ├── button.tsx
        └── button.stories.tsx   # story лежит рядом с компонентом
```

## Добавление новой story

Создай файл `<ComponentName>.stories.tsx` рядом с компонентом. Пример для `Button`:

```tsx
// packages/ui/src/components/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './button'

const meta = {
	title: 'UI/Button',
	component: Button,
	tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
	args: {
		children: 'Нажми меня',
		variant: 'default',
	},
}

export const Destructive: Story = {
	args: {
		children: 'Удалить',
		variant: 'destructive',
	},
}
```

Storybook подхватит файл автоматически при следующем запуске.
