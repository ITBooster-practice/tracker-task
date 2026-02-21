# @repo/ui

UI-kit на основе Radix UI и Tailwind CSS

## Установка

Пакет доступен как часть монорепозитория. Добавьте зависимость в `package.json`:

```json
{
	"dependencies": {
		"@repo/ui": "workspace:*"
	}
}
```

## Использование

Все компоненты доступны через единый импорт:

```tsx
import { Button, Card, Input, Avatar } from '@repo/ui'
```

## Добавление новых компонентов

Для добавления компонентов из shadcn/ui выполните команду из директории `packages/ui`:

```bash
cd packages/ui
npx shadcn@latest add <component-name>
```

После добавления компонента не забудьте добавить экспорт в `src/components/index.ts`:

```ts
export * from './new-component'
```

## Известные проблемы

### Типы lucide-react

Временный костыль: типы для иконок из `lucide-react` объявлены вручную в файле `src/lucide-react.d.ts`.

Если после добавления нового компонента возникает ошибка типов для иконки, добавьте её в этот файл:

```ts
// src/lucide-react.d.ts
declare module 'lucide-react' {
	export const NewIcon: LucideIcon
}
```

## Компоненты

### Button

Кнопка с различными вариантами и размерами.

```tsx
import { Button } from '@repo/ui'

// Варианты
return (
	<>
		<Button variant='default'>Primary</Button>
		<Button variant='secondary'>Secondary</Button>
		<Button variant='destructive'>Destructive</Button>
		<Button variant='outline'>Outline</Button>
		<Button variant='ghost'>Ghost</Button>
		<Button variant='link'>Link</Button>
	</>
)

// Размеры
return (
	<>
		<Button size='xs'>Extra Small</Button>
		<Button size='sm'>Small</Button>
		<Button size='default'>Default</Button>
		<Button size='lg'>Large</Button>
		<Button size='icon'>🔍</Button>
	</>
)
```

### Input

Поле ввода текста.

```tsx
import { Input } from '@repo/ui'

return (
	<>
		<Input placeholder='Введите текст...' />
		<Input type='email' placeholder='email@example.com' />
		<Input type='password' placeholder='Пароль' />
		<Input disabled placeholder='Недоступно' />
	</>
)
```

### Card

Карточка для группировки контента.

```tsx
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	CardAction,
} from '@repo/ui'
return (
	<Card>
		<CardHeader>
			<CardTitle>Заголовок карточки</CardTitle>
			<CardDescription>Описание карточки</CardDescription>
			<CardAction>
				<Button variant='ghost' size='icon'>
					⋮
				</Button>
			</CardAction>
		</CardHeader>
		<CardContent>
			<p>Содержимое карточки</p>
		</CardContent>
		<CardFooter>
			<Button>Действие</Button>
		</CardFooter>
	</Card>
)
```

### Avatar

Аватар пользователя с поддержкой изображений и fallback.

```tsx
import {
	Avatar,
	AvatarImage,
	AvatarFallback,
	AvatarBadge,
	AvatarGroup,
	AvatarGroupCount,
} from '@repo/ui'

// Простой аватар
return (
	<Avatar>
		<AvatarImage src='/avatar.jpg' alt='Имя пользователя' />
		<AvatarFallback>ИП</AvatarFallback>
	</Avatar>
)

// С размером
return (
	<>
		<Avatar size='sm'>
			<AvatarFallback>SM</AvatarFallback>
		</Avatar>
		<Avatar size='lg'>
			<AvatarFallback>LG</AvatarFallback>
		</Avatar>
	</>
)

// С бейджем (например, статус онлайн)
return (
	<Avatar>
		<AvatarImage src='/avatar.jpg' />
		<AvatarFallback>ИП</AvatarFallback>
		<AvatarBadge />
	</Avatar>
)

// Группа аватаров
return (
	<AvatarGroup>
		<Avatar>
			<AvatarFallback>А</AvatarFallback>
		</Avatar>
		<Avatar>
			<AvatarFallback>Б</AvatarFallback>
		</Avatar>
		<AvatarGroupCount>+5</AvatarGroupCount>
	</AvatarGroup>
)
```

### Badge

Бейдж для отображения статусов и меток.

```tsx
import { Badge } from '@repo/ui'

return (
	<>
		<Badge>Default</Badge>
		<Badge variant='secondary'>Secondary</Badge>
		<Badge variant='destructive'>Destructive</Badge>
		<Badge variant='outline'>Outline</Badge>
	</>
)
```

### Form

Компоненты для работы с формами (интеграция с react-hook-form).

```tsx
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
} from '@repo/ui'
import { useForm } from 'react-hook-form'

const form = useForm()

return (
	<Form {...form}>
		<FormField
			control={form.control}
			name='email'
			render={({ field }) => (
				<FormItem>
					<FormLabel>Email</FormLabel>
					<FormControl>
						<Input placeholder='email@example.com' {...field} />
					</FormControl>
					<FormDescription>Ваш рабочий email</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	</Form>
)
```

### Dialog

Модальное окно.

```tsx
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from '@repo/ui'

return (
	<Dialog>
		<DialogTrigger asChild>
			<Button>Открыть диалог</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Заголовок</DialogTitle>
				<DialogDescription>Описание диалога</DialogDescription>
			</DialogHeader>
			<p>Содержимое диалога</p>
			<DialogFooter>
				<DialogClose asChild>
					<Button variant='outline'>Отмена</Button>
				</DialogClose>
				<Button>Подтвердить</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)
```

### Select

Выпадающий список.

```tsx
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	SelectGroup,
	SelectLabel,
} from '@repo/ui'

return (
	<Select>
		<SelectTrigger>
			<SelectValue placeholder='Выберите опцию' />
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectLabel>Группа</SelectLabel>
				<SelectItem value='option1'>Опция 1</SelectItem>
				<SelectItem value='option2'>Опция 2</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
)
```

### Textarea

Многострочное поле ввода.

```tsx
import { Textarea } from '@repo/ui'

return (
	<>
		<Textarea placeholder='Введите текст...' />
		<Textarea rows={5} />
	</>
)
```

### Label

Метка для полей ввода.

```tsx
import { Label, Input } from '@repo/ui'

return (
	<>
		<Label htmlFor='email'>Email</Label>
		<Input id='email' type='email' />
	</>
)
```

### Tooltip

Всплывающая подсказка.

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui'

return (
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button>Наведи на меня</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Текст подсказки</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)
```

### DropdownMenu

Выпадающее меню.

```tsx
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@repo/ui'

return (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant='outline'>Меню</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent>
			<DropdownMenuItem>Профиль</DropdownMenuItem>
			<DropdownMenuItem>Настройки</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem>Выйти</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
)
```

### Sheet

Боковая панель (drawer).

```tsx
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
	SheetClose,
} from '@repo/ui'

return (
	<Sheet>
		<SheetTrigger asChild>
			<Button>Открыть панель</Button>
		</SheetTrigger>
		<SheetContent>
			<SheetHeader>
				<SheetTitle>Заголовок</SheetTitle>
				<SheetDescription>Описание панели</SheetDescription>
			</SheetHeader>
			<p>Содержимое</p>
			<SheetFooter>
				<SheetClose asChild>
					<Button>Закрыть</Button>
				</SheetClose>
			</SheetFooter>
		</SheetContent>
	</Sheet>
)
```

### Separator

Разделитель.

```tsx
import { Separator } from '@repo/ui'

return (
	<>
		<Separator />
		<Separator orientation='vertical' />
	</>
)
```

## Layout

### Stack / HStack / VStack

Компоненты для flexbox-раскладки.

```tsx
import { Stack, HStack, VStack } from '@repo/ui'

// Вертикальный стек (по умолчанию)
return (
	<Stack spacing='md'>
		<div>Элемент 1</div>
		<div>Элемент 2</div>
	</Stack>
)

// Горизонтальный стек
return (
	<HStack spacing='lg' align='center'>
		<div>Слева</div>
		<div>Справа</div>
	</HStack>
)

// С выравниванием
return (
	<VStack spacing='sm' align='center' justify='between'>
		<div>Верх</div>
		<div>Низ</div>
	</VStack>
)
```

**Пропсы:**

- `direction`: `horizontal` | `vertical` (по умолчанию `vertical`)
- `spacing`: `none` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl`
- `align`: `start` | `center` | `end` | `stretch` | `baseline`
- `justify`: `start` | `center` | `end` | `between` | `around` | `evenly`
- `wrap`: `true` | `false`

### Container

Контейнер с адаптивными отступами и максимальной шириной.

```tsx
import { Container } from '@repo/ui'

return (
	<Container size='lg'>
		<p>Контент с ограниченной шириной</p>
	</Container>
)

// Центрированный контент
return (
	<Container size='md' centered>
		<p>Центрированный контент</p>
	</Container>
)
```

**Пропсы:**

- `size`: `sm` | `md` | `lg` | `xl` | `2xl` | `full`
- `centered`: `true` | `false`

## Утилиты

### cn

Функция для объединения классов Tailwind CSS.

```tsx
import { cn } from '@repo/ui'

return (
	<div
		className={cn('base-class', {
			'conditional-class': condition,
		})}
	/>
)
```
