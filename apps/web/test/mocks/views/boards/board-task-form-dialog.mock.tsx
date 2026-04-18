import { vi } from 'vitest'

vi.mock('@repo/ui', () => {
	const selectNextValues: Record<string, string> = {
		TODO: 'IN_REVIEW',
		HIGH: 'LOW',
		MEDIUM: 'HIGH',
		alexey: 'anna',
	}

	return {
		Button: ({
			children,
			...props
		}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
			<button {...props}>{children}</button>
		),
		DialogDrawer: ({
			children,
			onOpenChange,
			open,
		}: React.PropsWithChildren<{
			onOpenChange: (open: boolean) => void
			open: boolean
		}>) =>
			open ? (
				<div data-testid='task-form-dialog'>
					<button
						type='button'
						data-testid='close-form'
						onClick={() => onOpenChange(false)}
					>
						close
					</button>
					{children}
				</div>
			) : null,
		DialogDrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
		DialogDrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
		DialogDrawerFooter: ({ children }: React.PropsWithChildren) => (
			<footer>{children}</footer>
		),
		DialogDrawerHeader: ({ children }: React.PropsWithChildren) => (
			<header>{children}</header>
		),
		DialogDrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
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
		SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
		SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
			<div data-testid={`select-item-${value}`}>{children}</div>
		),
		SelectTrigger: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
			<button type='button'>{children}</button>
		),
		SelectValue: ({ placeholder }: { placeholder?: string }) => (
			<span>{placeholder}</span>
		),
		Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
			<textarea {...props} />
		),
		cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
	}
})
