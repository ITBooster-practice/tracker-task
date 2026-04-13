import { createTeamFixture, createTeamMemberFixture } from '@/test/mocks/teams.fixtures'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TEAM_ROLES } from '@repo/types'

import { TeamSettingsPageView } from '@/views/teams/ui/team-settings-page-view'

// ─── Мок: useParams ──────────────────────────────────────────────
vi.mock('next/navigation', () => ({
	useParams: () => ({ id: 'team-1' }),
}))

// ─── Мок: useTeamDetail ──────────────────────────────────────────
const mockUseTeamDetail = vi.fn()

vi.mock('@/shared/api/use-teams', () => ({
	useTeamDetail: () => mockUseTeamDetail(),
}))

// ─── Мок: UI-компоненты ──────────────────────────────────────────
vi.mock('@repo/ui', () => ({
	Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
	Badge: ({
		children,
	}: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
		<span>{children}</span>
	),
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
		<button {...props}>{children}</button>
	),
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
	ConfirmDialog: ({
		open,
		title,
		onConfirm,
		onOpenChange,
	}: {
		open: boolean
		title?: string
		onConfirm: () => void
		onOpenChange: (v: boolean) => void
		description?: string
		confirmLabel?: string
		pendingLabel?: string
	}) =>
		open ? (
			<div data-testid='confirm-dialog'>
				<p>{title}</p>
				<button onClick={onConfirm}>Подтвердить</button>
				<button onClick={() => onOpenChange(false)}>Закрыть</button>
			</div>
		) : null,
	DialogDrawer: ({
		children,
	}: React.PropsWithChildren<{ open: boolean; onOpenChange: (v: boolean) => void }>) => (
		<div>{children}</div>
	),
	DialogDrawerContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DialogDrawerFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDrawerTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
	EmptyState: ({
		title,
		action,
	}: {
		title: string
		description?: string
		action?: React.ReactNode
		icon?: React.ReactNode
		className?: string
	}) => (
		<div data-testid='empty-state'>
			<p>{title}</p>
			{action}
		</div>
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
	}: {
		children: React.ReactNode
		value?: string
		onValueChange?: (v: string) => void
	}) => <div>{children}</div>,
	SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
		<option value={value}>{children}</option>
	),
	SelectTrigger: ({
		children,
	}: React.PropsWithChildren<{ className?: string; id?: string }>) => (
		<div>{children}</div>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
	VStack: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('@repo/ui/icons', () => ({
	Crown: () => <span />,
	Mail: () => <span />,
	Settings2: () => <span />,
	Shield: () => <span />,
	Trash2: () => <span />,
	UserPlus: () => <span />,
	Users: () => <span />,
}))

describe('TeamSettingsPageView', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(cleanup)

	it('loading — показывает "Загрузка участников..."', () => {
		mockUseTeamDetail.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		expect(screen.getByText('Загрузка участников...')).toBeDefined()
	})

	it('error — показывает empty state "Не удалось загрузить команду"', () => {
		mockUseTeamDetail.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		expect(screen.getByTestId('empty-state')).toBeDefined()
		expect(screen.getByText('Не удалось загрузить команду')).toBeDefined()
	})

	it('список участников — OWNER не имеет кнопки удаления, MEMBER — имеет', () => {
		mockUseTeamDetail.mockReturnValue({
			data: createTeamFixture({
				members: [
					createTeamMemberFixture({
						id: 'user-owner',
						name: 'Alice Owner',
						email: 'alice@example.com',
						role: TEAM_ROLES.OWNER,
					}),
					createTeamMemberFixture({
						id: 'user-member',
						name: 'Bob Member',
						email: 'bob@example.com',
						role: TEAM_ROLES.MEMBER,
					}),
				],
			}),
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		expect(screen.getByText('Alice Owner')).toBeDefined()
		expect(screen.getByText('Bob Member')).toBeDefined()
		expect(screen.queryByRole('button', { name: 'Удалить Alice Owner' })).toBeNull()
		expect(screen.getByRole('button', { name: 'Удалить Bob Member' })).toBeDefined()
	})

	it('инвайт — кнопка "Добавить участника" disabled при пустом и невалидном email', () => {
		mockUseTeamDetail.mockReturnValue({
			data: createTeamFixture({ members: [] }),
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		const submitButton = screen.getByRole('button', { name: 'Добавить участника' })
		expect(submitButton).toHaveProperty('disabled', true)

		fireEvent.change(screen.getByPlaceholderText('user@company.com'), {
			target: { value: 'not-an-email' },
		})

		expect(submitButton).toHaveProperty('disabled', true)
	})

	it('инвайт — submit с валидным email добавляет участника в список', () => {
		mockUseTeamDetail.mockReturnValue({
			data: createTeamFixture({ members: [] }),
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		fireEvent.change(screen.getByPlaceholderText('user@company.com'), {
			target: { value: 'john@example.com' },
		})
		fireEvent.submit(screen.getByPlaceholderText('user@company.com').closest('form')!)

		expect(screen.getByText('John')).toBeDefined()
		expect(screen.getByText('john@example.com')).toBeDefined()
	})

	it('удаление — клик "Удалить" → ConfirmDialog → "Подтвердить" убирает участника', () => {
		mockUseTeamDetail.mockReturnValue({
			data: createTeamFixture({
				members: [
					createTeamMemberFixture({
						id: 'user-member',
						name: 'Bob Member',
						email: 'bob@example.com',
						role: TEAM_ROLES.MEMBER,
					}),
				],
			}),
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		})

		render(<TeamSettingsPageView />)

		fireEvent.click(screen.getByRole('button', { name: 'Удалить Bob Member' }))

		expect(screen.getByTestId('confirm-dialog')).toBeDefined()

		fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))

		expect(screen.queryByText('Bob Member')).toBeNull()
	})
})
