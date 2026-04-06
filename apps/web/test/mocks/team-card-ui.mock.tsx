import { vi } from 'vitest'

vi.mock('@repo/ui', () => ({
	Avatar: ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div data-testid='team-member-avatar' {...props}>
			{children}
		</div>
	),
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@repo/ui/icons', () => ({
	ArrowRight: () => <span data-testid='arrow-icon' />,
	FolderKanban: () => <span data-testid='folder-icon' />,
	Users: () => <span data-testid='users-icon' />,
}))
