import { vi } from 'vitest'

vi.mock('@repo/ui', () => {
	const buildClassName = (args: unknown[]) =>
		args
			.flatMap((arg) => {
				if (typeof arg === 'string') {
					return [arg]
				}

				if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
					return Object.entries(arg)
						.filter(([, optionValue]) => Boolean(optionValue))
						.map(([key]) => key)
				}

				return []
			})
			.join(' ')

	const selectNextValues: Record<string, string> = {
		Баг: 'Задача',
		anna: 'alexey',
	}

	return {
		Button: ({
			children,
			...props
		}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
			<button {...props}>{children}</button>
		),
		Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
		Select: ({
			children,
			onValueChange,
			value,
		}: React.PropsWithChildren<{
			onValueChange: (value: string) => void
			value: string
		}>) => (
			<div data-testid={`select-${value}`}>
				{children}
				<button
					type='button'
					data-testid={`select-${value}-change`}
					onClick={() => onValueChange(selectNextValues[value] ?? value)}
				>
					change {value}
				</button>
			</div>
		),
		SelectContent: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
			<div>{children}</div>
		),
		SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
			<div data-testid={`select-item-${value}`}>{children}</div>
		),
		SelectTrigger: ({
			children,
			...props
		}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
			<button type='button' {...props}>
				{children}
			</button>
		),
		SelectValue: ({ placeholder }: { placeholder?: string }) => (
			<span>{placeholder}</span>
		),
		cn: (...args: unknown[]) => buildClassName(args),
	}
})

vi.mock('@repo/ui/icons', () => ({
	Search: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-search' />
	),
	X: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-reset' />
	),
}))
