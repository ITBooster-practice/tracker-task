import { vi } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Badge: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<span>{children}</span>
	),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	EmptyState: ({
		title,
		description,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{description ? <p>{description}</p> : null}
			{action}
		</div>
	),
	Select: ({
		children,
		onValueChange,
	}: React.PropsWithChildren<{
		onValueChange?: (value: string) => void
		value?: string
	}>) => (
		<div>
			{children}
			{onValueChange ? (
				<button
					type='button'
					data-testid='change-role'
					onClick={() => onValueChange(TEAM_ROLES.ADMIN)}
				>
					change-role
				</button>
			) : null}
		</div>
	),
	SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SelectItem: ({
		children,
		value,
	}: React.PropsWithChildren<{ value: string; disabled?: boolean }>) => (
		<div data-testid={`select-item-${value}`}>{children}</div>
	),
	SelectTrigger: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<button type='button'>{children}</button>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
	cn: (...args: unknown[]) =>
		args
			.flatMap((arg) => {
				if (typeof arg === 'string') {
					return [arg]
				}

				if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
					return Object.entries(arg)
						.filter(([, value]) => Boolean(value))
						.map(([key]) => key)
				}

				return []
			})
			.join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	Crown: () => <span data-testid='icon-crown' />,
	Mail: () => <span data-testid='icon-mail' />,
	Settings2: () => <span data-testid='icon-settings' />,
	Shield: () => <span data-testid='icon-shield' />,
	Trash2: () => <span data-testid='icon-trash' />,
	Users: () => <span data-testid='icon-users' />,
}))
