import { vi } from 'vitest'

const boardTaskDetailsDialogMockState = vi.hoisted(() => ({
	buildClassName: (args: unknown[]) =>
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
	errorToast: vi.fn(),
	successToast: vi.fn(),
}))

interface BoardTaskDetailsDialogToastMocks {
	errorToast: (message: string) => void
	successToast: (message: string) => void
}

export function resetBoardTaskDetailsDialogUnitMocks() {
	boardTaskDetailsDialogMockState.errorToast.mockClear()
	boardTaskDetailsDialogMockState.successToast.mockClear()
}

export function getBoardTaskDetailsDialogToastMocks(): BoardTaskDetailsDialogToastMocks {
	return {
		errorToast: boardTaskDetailsDialogMockState.errorToast,
		successToast: boardTaskDetailsDialogMockState.successToast,
	}
}

vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<div>{children}</div>
	),
	AvatarFallback: ({ children }: React.PropsWithChildren<{ className?: string }>) => (
		<span>{children}</span>
	),
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
			<div data-testid='dialog-root'>
				<button
					type='button'
					data-testid='mock-close-dialog'
					onClick={() => onOpenChange(false)}
				>
					close
				</button>
				{children}
			</div>
		) : null,
	DialogDrawerContent: ({
		children,
	}: React.PropsWithChildren<{
		className?: string | ((isDesktop: boolean) => string)
	}>) => <div data-testid='dialog-content'>{children}</div>,
	DialogDrawerDescription: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<p className={className}>{children}</p>
	),
	DialogDrawerFooter: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<footer className={className}>{children}</footer>
	),
	DialogDrawerHeader: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<header className={className}>{children}</header>
	),
	DialogDrawerTitle: ({
		children,
		className,
	}: React.PropsWithChildren<{ className?: string }>) => (
		<h2 className={className}>{children}</h2>
	),
	Separator: ({ className }: { className?: string }) => (
		<hr className={className} data-testid='separator' />
	),
	Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
		<textarea {...props} />
	),
	cn: (...args: unknown[]) => boardTaskDetailsDialogMockState.buildClassName(args),
	toast: {
		error: boardTaskDetailsDialogMockState.errorToast,
		success: boardTaskDetailsDialogMockState.successToast,
	},
}))

vi.mock('@repo/ui/icons', () => ({
	Copy: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-copy' />
	),
	History: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-history' />
	),
	MessageSquare: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-message' />
	),
	Pencil: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-pencil' />
	),
	Send: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-send' />
	),
	Tag: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-tag' />
	),
	Trash2: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-trash' />
	),
	UserRound: ({ className }: { className?: string }) => (
		<span className={className} data-testid='icon-user' />
	),
}))

vi.mock('@/entities/task', () => ({
	TaskPriorityBadge: ({ priority }: { priority: string }) => (
		<span data-testid='priority-badge'>{priority}</span>
	),
	TaskTypeBadge: ({ type }: { type: string }) => (
		<span data-testid='type-badge'>{type}</span>
	),
}))
