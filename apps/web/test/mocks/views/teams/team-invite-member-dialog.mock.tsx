import { vi } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	DialogDrawer: ({
		children,
		open,
	}: React.PropsWithChildren<{
		open: boolean
		onOpenChange: (open: boolean) => void
	}>) => (open ? <div data-testid='dialog-root'>{children}</div> : null),
	DialogDrawerContent: ({
		children,
	}: React.PropsWithChildren<{ className?: string }>) => <div>{children}</div>,
	DialogDrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DialogDrawerFooter: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	DialogDrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerTitle: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<h2>{children}</h2>
	),
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: ({
		children,
		...props
	}: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
		<label {...props}>{children}</label>
	),
	Select: ({
		children,
		onValueChange,
	}: React.PropsWithChildren<{
		value: string
		onValueChange: (value: string) => void
	}>) => (
		<div>
			{children}
			<button
				type='button'
				data-testid='change-role'
				onClick={() => onValueChange(TEAM_ROLES.ADMIN)}
			>
				change-role
			</button>
		</div>
	),
	SelectContent: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
		<div data-testid={`role-option-${value}`}>{children}</div>
	),
	SelectTrigger: ({
		children,
		...props
	}: React.PropsWithChildren<{ id?: string; className?: string }>) => (
		<button type='button' {...props}>
			{children}
		</button>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
	VStack: ({
		children,
	}: React.PropsWithChildren<{ spacing?: string; className?: string }>) => (
		<div>{children}</div>
	),
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	Crown: () => <span data-testid='crown-icon' />,
	Mail: () => <span data-testid='mail-icon' />,
	Settings2: () => <span data-testid='settings-icon' />,
	Shield: () => <span data-testid='shield-icon' />,
	Trash2: () => <span data-testid='trash-icon' />,
	Users: () => <span data-testid='users-icon' />,
}))
