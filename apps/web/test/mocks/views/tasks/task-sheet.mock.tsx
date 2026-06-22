import { vi, type Mock } from 'vitest'

export const toastMock: { success: Mock; error: Mock } = {
	success: vi.fn(),
	error: vi.fn(),
}

vi.mock('@repo/ui', () => ({
	Sheet: ({
		children,
		open,
		onOpenChange,
	}: React.PropsWithChildren<{
		open: boolean
		onOpenChange: (open: boolean) => void
	}>) =>
		open ? (
			<div data-testid='sheet'>
				<button
					type='button'
					data-testid='sheet-close'
					onClick={() => onOpenChange(false)}
				>
					close
				</button>
				{children}
			</div>
		) : null,
	SheetContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SheetHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SheetTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	toast: toastMock,
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))
