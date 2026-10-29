import type {
	ButtonHTMLAttributes,
	InputHTMLAttributes,
	LabelHTMLAttributes,
	PropsWithChildren,
} from 'react'
import { vi } from 'vitest'

vi.mock('@repo/ui', () => ({
	Button: ({
		children,
		...props
	}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	Badge: ({ children }: PropsWithChildren) => <span>{children}</span>,
	Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
	Label: (props: LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
	Skeleton: () => <span />,
	DialogDrawer: ({
		open,
		onOpenChange,
		children,
	}: PropsWithChildren<{ open: boolean; onOpenChange: (open: boolean) => void }>) =>
		open ? (
			<section role='dialog'>
				<button aria-label='Закрыть диалог' onClick={() => onOpenChange(false)}>
					Закрыть
				</button>
				{children}
			</section>
		) : null,
	DialogDrawerContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
	DialogDrawerHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	DialogDrawerTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
	DialogDrawerDescription: ({ children }: PropsWithChildren) => <p>{children}</p>,
	DialogDrawerFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ConfirmDialog: ({
		open,
		title,
		description,
		confirmLabel,
		pendingLabel,
		isPending,
		confirmDisabled,
		children,
		onConfirm,
		onOpenChange,
	}: PropsWithChildren<{
		open: boolean
		title: string
		description: string
		confirmLabel: string
		pendingLabel: string
		isPending: boolean
		confirmDisabled: boolean
		onConfirm: () => void
		onOpenChange: (open: boolean) => void
	}>) =>
		open ? (
			<section role='dialog' aria-label={title}>
				<h2>{title}</h2>
				<p>{description}</p>
				{children}
				<button disabled={isPending || confirmDisabled} onClick={onConfirm}>
					{isPending ? pendingLabel : confirmLabel}
				</button>
				<button disabled={isPending} onClick={() => onOpenChange(false)}>
					Отмена
				</button>
			</section>
		) : null,
}))
